import fs from 'node:fs/promises';
import path from 'node:path';

// --- CONFIGURATION ---
const COUCHDB_URL = 'https://db2.couchdb.asterics-foundation.org';
const USERNAME = 'admin';

// --- COMMAND LINE ARGS ---
const dbName = process.argv[2];
const password = process.argv[3];

if (!dbName || !password) {
  console.log(`
❌ Missing required arguments!

Usage:
  node uploadUndeleted.mjs <database_name> <password>

Example:
  node uploadUndeleted.mjs 'asterics-grid-data$d04' secret123
`);
  process.exit(1);
}

const authHeader = 'Basic ' + Buffer.from(`${USERNAME}:${password}`).toString('base64');
const headers = {
  'Authorization': authHeader,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

async function uploadUndeletedDocs() {
  const undeletedDir = path.join(process.cwd(), 'undeleted');

  try {
    const files = await fs.readdir(undeletedDir).catch(() => null);
    if (!files || files.length === 0) {
      console.log('⚠️ No documents found in ./undeleted to upload.');
      return;
    }

    const jsonFiles = files.filter(file => file.endsWith('.json'));
    console.log(`🔍 Found ${jsonFiles.length} files. Force-uploading to "${dbName}"...`);

    let restoredCount = 0;
    let failedCount = 0;

    for (const file of jsonFiles) {
      const filePath = path.join(undeletedDir, file);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      let doc;
      
      try {
        doc = JSON.parse(fileContent);
      } catch (e) {
        console.warn(`⚠️ Skipping ${file}: Invalid JSON.`);
        continue;
      }

      if (!doc._id) {
        console.warn(`⚠️ Skipping ${file}: Document missing "_id" property.`);
        continue;
      }

      // 1. Force a massively bumped revision number to win any database conflicts
      doc._rev = `9999-1234567890abcdef1234567890abcdef`;

      // 2. Use _bulk_docs with new_edits: false to bypass all conflict checking
      const bulkUrl = `${COUCHDB_URL}/${encodeURIComponent(dbName)}/_bulk_docs`;
      const postRes = await fetch(bulkUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          new_edits: false, // Tells CouchDB to inject the doc without checking history
          docs: [doc]
        })
      });

      if (postRes.ok) {
        restoredCount++;
        console.log(`✅ Force-recovered doc "${doc._id}"`);
      } else {
        const errData = await postRes.json().catch(() => ({}));
        console.error(`❌ Failed to recover doc "${doc._id}": ${postRes.status} ${errData.reason || postRes.statusText}`);
        failedCount++;
      }
    }

    console.log(`\n✅ Restore Complete!`);
    console.log(`- Successfully restored: ${restoredCount} docs`);
    if (failedCount > 0) {
      console.log(`- Failed to restore: ${failedCount} docs`);
    }

  } catch (err) {
    console.error('❌ Error during import process:', err.message);
  }
}

uploadUndeletedDocs();