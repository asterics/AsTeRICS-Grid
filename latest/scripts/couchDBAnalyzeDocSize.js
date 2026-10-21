// script for analyzing sizes of documents from various databases

let authString = 'admin:admin';
let dbServerUrl = 'https://db.couchdb.asterics-foundation.org';
let dbAuthUrl = `https://${authString}@db.couchdb.asterics-foundation.org`;
const server = require('nano')({
    url: dbAuthUrl.trim(),
    requestDefaults: { timeout: 250000 } // 250 seconds
});
let dbNames = ["dbName"]

async function main() {
    console.log(`analyzing ${dbNames.length} databases...\n`);

    let maxDoc = { size: 0 };
    let counter = 0;
    let errorDbs = [];
    for (let dbName of dbNames) {
        let ids = await getDocIds(dbName);
        let results = await getDocSizes(dbName, ids);
        if (results.length === 0) {
            errorDbs.push(dbName);
        }
        for (let res of results) {
            //console.log(res.db, res.id, res.size);
            if (maxDoc.size < res.size) {
                maxDoc = res;
            }
        }
        console.log(counter++, dbName, "max:", JSON.stringify(maxDoc), 'errors:', errorDbs);
    }
}
main();

async function getDocIds(dbName, excludeDocId) {
    try {
        const db = server.db.use(dbName);
        const result = await db.list({ include_docs: false });
        return result.rows.map(row => row.id).filter(id => id !== excludeDocId);
    } catch (e) {
        console.warn('error opening database:', dbName);
        console.warn(e);
        return [];
    }
}

async function getDocSizes(dbName, ids) {
    let results = [];
    for (let id of ids) {
        let path = `${dbServerUrl}/${dbName}/${id}`;
        let response = await fetch(path, {
            method: 'HEAD',
            headers: new Headers({
                Authorization: 'Basic ' + btoa(authString)
            })
        }).catch(function (error) {
            console.log('Error sending head request: \n', error);
        });
        let sizeMB = response.headers.get('content-length') / 1024 / 1024;
        results.push({
            id: id,
            db: dbName,
            size: sizeMB
        });
    }
    return results;
}