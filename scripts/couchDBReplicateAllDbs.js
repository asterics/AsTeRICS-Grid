if (!process.argv[2] || !process.argv[3]) {
    console.log('Replicates all databases between two CouchDB servers.')
    console.log("----");
    console.log('USAGE:');
    console.log(`node couchDBReplicateAllDbs.js <SOURCE_COUCHDB_URL> <TARGET_COUCHDB_URL> [onlynew]`);
    console.log("----");
    console.log("Example:");
    console.log(`node couchDBReplicateAllDbs.js https://admin:admin@my.couchdb.org:6984 http://admin:admin@localhost:5984`);
    console.log(`All data is transferred from source to target, no changes in source.`);
    return;
}

let sourceDBUrl = process.argv[2] || 'http://admin:admin@localhost:5984';
let targetDBUrl = process.argv[3] || 'http://admin:admin@localhost:5984';
let onlynew = process.argv[4] === 'onlynew';

sourceDBUrl = sourceDBUrl.trim();
targetDBUrl = targetDBUrl.trim();

const sourceServer = require('nano')(sourceDBUrl);
const targetServer = require('nano')(targetDBUrl);
const PouchDB = require('pouchdb');

let successNames = [];
let errorNames = [];

async function main() {
    console.log("retrieve db names of source...");
    let sourceDBNames = await sourceServer.db.list();
    console.log("retrieve db names of target...");
    let targetDBNames = await targetServer.db.list();
    console.log(`source server has ${sourceDBNames.length} databases.`);
    console.log(`target server has ${targetDBNames.length} databases.`);

    let missingNames = sourceDBNames.filter(name => !targetDBNames.includes(name));
    let existingNames = sourceDBNames.filter(name => targetDBNames.includes(name));
    console.log(`replicating ${missingNames.length} missing databases to target...`);
    await replicateDBs(missingNames);


    if (onlynew) {
        console.log(`updating auth-users database to target...`);
        await replicateDBs(['accessibility-info-tree', 'accessibility-for-appliances', 'auth-users'], true);
        return;
    }
    console.log(`updating ${existingNames.length} existing databases on target...`);
    await replicateDBs(existingNames, true);
}
main();

async function replicateDBs(dbNames, isUpdate) {
    for (let sourceDBName of dbNames) {
        console.log(`[s: ${successNames.length} / e: ${errorNames.length}] ${isUpdate ? 'updating' : 'replicating'} ${sourceDBName}...`);
        let success = await replicateDB(sourceDBName);
        if (success) {
            successNames.push(sourceDBName);
        } else {
            errorNames.push(sourceDBName);
        }
    }

    console.log(`successfully replicated ${successNames.length} databases!`);
    if (errorNames.length === 0) {
        console.log("no errors.");
    } else {
        console.log(`replication failed for ${errorNames.length} databases:`);
        console.log(JSON.stringify(errorNames));
    }
}

async function replicateDB(sourceDBName) {
    return new Promise(async (resolve) => {
        let sourceUrl = `${sourceDBUrl}/${sourceDBName}`;
        let targetUrl = `${targetDBUrl}/${sourceDBName}`;
        let source = new PouchDB(sourceUrl);
        let target = new PouchDB(targetUrl);
        source.replicate
            .to(target, {
                checkpoint: false,
                style: 'main_only',
                filter: function (doc) {
                    return !doc._deleted;
                }
            })
            .on('complete', function (info) {
                console.log(`completed! written: ${info.docs_written}, errors: ${JSON.stringify(info.errors)}\n`);
                resolve(true);
            })
            .on('error', function (err) {
                console.log('error!', err);
                resolve(false);
            });
    });
}