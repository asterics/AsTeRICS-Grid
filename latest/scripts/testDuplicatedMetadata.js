if (!process.argv[2] || !process.argv[2].trim()) {
    console.log('USAGE:');
    console.log("node testDuplicatedMetadata.js <COUCHDB_URL>");
    console.log("----");
    console.log("Examples:");
    console.log("node testDuplicatedMetadata.js http://admin:admin@localhost:5984 ... for analyzing duplicated metadata");
    return;
}

let dbUrl = process.argv[2] || 'http://admin:admin@localhost:5984';
console.log('using url: ' + dbUrl);
const nano = require('nano')({
    "url": dbUrl.trim(),
    "requestDefaults": {"timeout": 250000} // 250 seconds
});

async function main() {
    const dblist = await nano.db.list().catch(err => console.log(err));
    let countNone = 0;
    let countSingle = 0;
    let countDuplicated = 0;
    let duplicatedNames = [];
    for (const dbName of dblist) {
        if (dbName !== "sl-users") {
            let db = nano.db.use(dbName);
            let doclist = await db.list();
            let metadataDocs = doclist.rows.filter(doc => doc.id.startsWith('meta-data'));
            if (metadataDocs.length === 0) {
                console.warn(`${dbName} has NO metadata docs!!!!!!!!`);
                countNone++;
            } else if (metadataDocs.length === 1) {
                countSingle++;
            } else if (metadataDocs.length > 1) {
                console.warn(`${dbName} has ${metadataDocs.length} metadata docs!`);
                countDuplicated++;
                duplicatedNames.push(dbName);
            }
        }
    }
    console.log("---------- RESULT ---------");
    console.log(`No metadata: ${countNone}`);
    console.log(`Single metadata: ${countSingle}`);
    console.log(`Duplicated metadata: ${countDuplicated}`);
    console.log(`Duplicated db names: ${JSON.stringify(duplicatedNames)}`);
}

main();

