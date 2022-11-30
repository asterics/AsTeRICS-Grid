if (!process.argv[2] || !process.argv[2].trim()) {
    console.log('USAGE:');
    console.log("node testDuplicatedMetadata.js <COUCHDB_URL> ['compact']");
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
    for (const dbName of dblist) {
        if (dbName === "sl-users") {
            continue;
        }
        if (dbName === "asterics-grid-data$klues") {
            let db = nano.db.use(dbName);
            let doclist = await db.list();
            let metadataDocs = doclist.rows.filter(doc => doc.modelName === 'MetaData');
            console.warn(`${dbName} has ${metadataDocs.length} metadata docs!`);
        }
    }
}

main();

