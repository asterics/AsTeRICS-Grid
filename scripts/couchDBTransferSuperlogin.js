if (!process.argv[2] || !process.argv[2].trim()) {
    console.log('Migrates users from superlogin to couch-auth. Superlogin database is "sl-users" and couch-auth database is "auth-users".')
    console.log("----");
    console.log('USAGE:');
    console.log(`node couchDBTransferSuperlogin.js <COUCHDB_URL> [prod]`);
    console.log("----");
    console.log("Example:");
    console.log(`node couchDBTransferSuperlogin.js http://admin:admin@localhost:5984`);
    console.log(`node couchDBTransferSuperlogin.js https://admin:admin@db.couchdb.asterics-foundation.org`);
    console.log(`actual database changes are only done with second parameter "prod".`);
    return;
}

let dbUrl = process.argv[2] || 'https://admin:admin@db.couchdb.asterics-foundation.org';
let isProd = process.argv[3] === 'prod';
if (isProd) {
    console.log('[!] prod run [!]');
}
const nano = require('nano')({
    url: dbUrl.trim(),
    requestDefaults: { timeout: 250000 } // 250 seconds
});

const DESIGN_DOC_ID = '_design/auth';
const DB_NAME_SL_USERS = 'sl-users';
const DB_NAME_AUTH_USERS = 'auth-users';
const authDB = nano.db.use(DB_NAME_AUTH_USERS);

async function getDocs(dbName, excludeDocId) {
    let docIds = await getDocIds(dbName, excludeDocId);
    console.log(dbName, `got ${docIds.length} IDs...`);
    return await getDocsByIds(dbName, docIds);
}

async function getDocsByIds(dbName, ids) {
    const db = nano.db.use(dbName);
    let idChunks = arrayToChunks(ids, 250);
    let resultDocs = [];
    let counter = 1;
    for (let idChunk of idChunks) {
        console.log(dbName, `${counter++}: retrieve chunk of ${idChunk.length} docs...`);
        let result = null;
        await db
            .fetch({ keys: idChunk })
            .then((r) => {
                result = r;
            })
            .catch((e) => {
                console.warn(e);
            });
        if (result) {
            let docs = result.rows.map((row) => row.doc);
            resultDocs = resultDocs.concat(docs);
        }
        await sleep(1000);
    }
    return resultDocs;
}

async function getDocIds(dbName, excludeDocId) {
    const db = nano.db.use(dbName);
    const result = await db.list({ include_docs: false });
    return result.rows.map(row => row.id).filter(id => id !== excludeDocId);
}

function convertSlToAuthDoc(slDoc) {
    let authDoc = JSON.parse(JSON.stringify(slDoc));
    authDoc.key = slDoc._id;
    delete authDoc._rev;
    delete authDoc._id;
    authDoc.migratedFromSl = true;
    return authDoc;
}

function arrayToChunks(array, chunksize) {
    chunksize = chunksize || 1;
    array = array || [];
    let chunks = [];
    for (let i = 0; i < array.length; i += chunksize) {
        const chunk = array.slice(i, i + chunksize);
        chunks.push(chunk);
    }
    return chunks;
}

async function saveDocsBulk(docs, prodRun) {
    if (!docs || !docs.length) {
        console.log('noting to save!');
        return;
    }
    let chunks = arrayToChunks(docs, 100);
    let counter = 1;
    for (let chunk of chunks) {
        let response = [];
        if (prodRun) {
            response = await authDB.bulk({
                docs: chunk
            });
            await sleep(1000);
        }
        let errors = response.map((elem) => elem.error).filter((e) => !!e);
        console.log(`${counter++}: ${!prodRun ? '[dry run]' : ''} saved ${chunk.length} docs.`, `errors: ${JSON.stringify(errors)}`);
    }
}

async function sleep(ms) {
    await new Promise(resolve => setTimeout(() => resolve(), ms));
}

async function main() {
    console.log("starting...");
    let slUsers = await getDocIds(DB_NAME_SL_USERS, DESIGN_DOC_ID);
    let authDocs = await getDocs(DB_NAME_AUTH_USERS, DESIGN_DOC_ID);
    let authUsers = authDocs.map((doc) => doc.key);

    console.log(DB_NAME_SL_USERS, JSON.stringify(slUsers));
    console.log(DB_NAME_AUTH_USERS, JSON.stringify(authUsers));

    let missingUsers = slUsers.filter((username) => !authUsers.includes(username));
    let missingUserDocs = await getDocsByIds(DB_NAME_SL_USERS, missingUsers);
    console.log('missing users in new DB', JSON.stringify(missingUsers));
    console.log('missing users docs length', missingUserDocs.length);
    //console.log("missing user docs", JSON.stringify(missingUserDocs));

    let convertedDocs = missingUserDocs.map((missingDoc) => convertSlToAuthDoc(missingDoc));
    //console.log('converted docs', JSON.stringify(convertedDocs));
    await saveDocsBulk(convertedDocs, isProd);

    // test array to chunks
    /*let longArray = [...Array(99).keys()];
    console.log(arrayToChunks(longArray, 5));
    console.log(arrayToChunks(longArray, 21));
    console.log(arrayToChunks([1,2,3], 21));
    console.log(arrayToChunks([], 3));
    console.log(arrayToChunks(longArray, 1));*/
}
main();
