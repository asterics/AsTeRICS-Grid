const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configuration
const FILE_PATH = process.argv[2];
const SHOULD_COMPRESS = process.argv.includes('--compress');
const SHOULD_DELETE_DICTS = process.argv.includes('--delete-dicts');
const MAX_SIZE_BYTES = 200 * 1024; // 200KB Target
const COUNT_SIZE_BYTES = 50 * 1024;
const TARGET_WIDTH = 1200; // Reasonable max width for quality

let countBigImages = 0;
let countImages = 0;

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
}

// Logic to compress until the binary buffer is under the limit
async function compressToLimit(buffer, mimeType) {
    let quality = 85;
    let currentBuffer = buffer;

    // Initial resize and conversion to JPEG (most efficient for size)
    currentBuffer = await sharp(buffer)
        .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: quality })
        .toBuffer();

    // Iterative quality reduction if still over 300KB
    while (currentBuffer.length > MAX_SIZE_BYTES && quality > 20) {
        quality -= 10;
        currentBuffer = await sharp(currentBuffer).jpeg({ quality: quality }).toBuffer();
    }

    return currentBuffer;
}

async function run() {
    if (!FILE_PATH) {
        console.error("Usage: node analyzeBackupSize.js <path.json> [--compress] [--delete-dicts]");
        process.exit(1);
    }

    try {
        console.log(`\nReading: ${path.basename(FILE_PATH)}...`);
        let rawData = fs.readFileSync(FILE_PATH, 'utf8');

        // Handle Byte Order Mark (BOM)
        if (rawData.charCodeAt(0) === 0xFEFF) rawData = rawData.slice(1);

        const totalJsonLength = Buffer.byteLength(rawData, 'utf8');
        const json = JSON.parse(rawData);

        let stats = {
            imageSize: 0,
            dictSize: 0,
            compressedCount: 0,
            imageTracker: []
        };

        // 1. Process Dictionaries
        if (Array.isArray(json.dictionaries)) {
            json.dictionaries.forEach(dict => {
                if (dict.data) {
                    const dStr = typeof dict.data === 'string' ? dict.data : JSON.stringify(dict.data);
                    stats.dictSize += Buffer.byteLength(dStr, 'utf8');
                }
            });
        }

        // 2. Process Grids (Stats + Potential Compression)
        if (Array.isArray(json.grids)) {
            for (let gIdx = 0; gIdx < json.grids.length; gIdx++) {
                const elements = json.grids[gIdx].gridElements || [];
                for (let eIdx = 0; eIdx < elements.length; eIdx++) {
                    const element = elements[eIdx];

                    if (element.image?.data && typeof element.image.data === 'string') {
                        const parts = element.image.data.split(';base64,');
                        if (parts.length !== 2) continue;

                        const imgBuffer = Buffer.from(parts[1], 'base64');
                        const originalSize = imgBuffer.length;
                        stats.imageSize += parts[1].length;

                        // Track for "Biggest Images" list
                        stats.imageTracker.push({
                            path: `grids[${gIdx}].gridElements[${eIdx}]`,
                            size: originalSize
                        });

                        countImages++;
                        if (originalSize > COUNT_SIZE_BYTES) {
                            countBigImages++;
                        }

                        // 3. Compression Logic (Only if flag present and image > 300KB)
                        if (SHOULD_COMPRESS && originalSize > MAX_SIZE_BYTES) {
                            const mimeType = parts[0].split(':')[1] || 'image/jpeg';
                            const compressedBuffer = await compressToLimit(imgBuffer, mimeType);

                            // Update the JSON object in memory
                            element.image.data = `data:image/jpeg;base64,` + compressedBuffer.toString('base64');
                            stats.compressedCount++;
                        }
                    }
                }
            }
        }

        // --- Final Output ---
        console.log(`--- Analysis Results ---`);
        console.table({
            "Total JSON File Size": formatSize(totalJsonLength),
            "Total Image Data": formatSize(stats.imageSize),
            "Total Dictionary Data": formatSize(stats.dictSize),
            "Structural/Meta Overhead": formatSize(totalJsonLength - (stats.imageSize + stats.dictSize)),
            "Images bigger than 50KB": countBigImages,
            "Total images": countImages,
            "Average kB/image": Math.round(stats.imageSize / (countImages * 1024))
        });

        const top5 = stats.imageTracker.sort((a, b) => b.size - a.size).slice(0, 5);
        console.log(`\n--- Top 5 Biggest Images (Binary Size) ---`);
        top5.forEach((img, i) => console.log(`${i + 1}. ${img.path} -> ${formatSize(img.size)}`));

        if (SHOULD_DELETE_DICTS) {
            json.dictionaries = []
        }
        if (SHOULD_COMPRESS) {
            if (stats.compressedCount > 0 || SHOULD_DELETE_DICTS) {
                let suffix = SHOULD_DELETE_DICTS ? '_compressed-images_no-dicts.grd.json' : '_compressed-images.grd.json';
                const outPath = FILE_PATH + suffix;
                fs.writeFileSync(outPath, JSON.stringify(json));
                const newSize = fs.statSync(outPath).size;
                console.log(`\n✅ COMPRESSION COMPLETE`);
                console.log(`Images modified: ${stats.compressedCount}`);
                console.log(`New file saved as: ${outPath}`);
                console.log(`New total size: ${formatSize(newSize)} (Saved ${formatSize(totalJsonLength - newSize)})`);
            } else {
                console.log(`\nℹ️ No images found exceeding the 300KB limit.`);
            }
        } else {
            console.log(`\n💡 Tip: Run with --compress to shrink images over 300KB.`);
        }

    } catch (err) {
        console.error("❌ Error:", err.message);
    }
}

run();