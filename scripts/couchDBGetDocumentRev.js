if (!process.argv[2] || !process.argv[3] || !process.argv[4] || !process.argv[5]) {
    console.log('USAGE:');
    console.log("node couchDBGetDocumentRev.js <COUCHDB_URL> <db-name> <doc-id> <rev-id>");
    console.log("----");
    console.log("Examples:");
    console.log("node couchDBGetDocumentRev.js http://admin:admin@localhost:5984 asterics-grid-data\$xyz grid-data-1687867272504-135 2-3dbce68bbc9dbb1617cd274641ca92de");
    return;
}

let dbUrl = process.argv[2] || 'http://admin:admin@localhost:5984';
let dbName = process.argv[3] || null;
let docId = process.argv[4] || null;
let revId = process.argv[5] || null;

console.log('using url: ' + dbUrl);
const nano = require('nano')({
    "url": dbUrl.trim(),
    "requestDefaults": {"timeout": 250000} // 250 seconds
});

const db = nano.db.use(dbName);

async function main() {
    const result = await db.get(docId, {rev: revId});
    console.log(JSON.stringify(result));
}

main();

