if (!process.argv[2]) {
    console.log('USAGE:');
    console.log('node couchDBCleanupDeleted.js <COUCHDB_URL> [db-name]');
    console.log('----');
    console.log('Examples:');
    console.log('node couchDBCleanupDeleted.js http://admin:admin@localhost:5984 asterics-grid-data$xyz');
    return;
}

let couchUrl = process.argv[2] || 'http://admin:admin@localhost:5984';
let customDbName = process.argv[3] || null;

couchUrl = couchUrl.trim();

const server = require('nano')(couchUrl);
const PouchDB = require('pouchdb');
const fs = require('fs');
let SUCCESS_FILENAME = 'couchDBCleanupDeleted.success.txt';
let UNDELETED_FILENAME = 'couchDBCleanupDeleted.undeleted.txt';
let CHUNK_SIZE = 100;
let BULK_STATES = {
    INIT: 'INIT',
    SET_UNDELETED: 'SET_UNDELETED',
    DONE: 'DONE'
};

let successDbs = readFromFile(SUCCESS_FILENAME) || [];
let undeletedState = readFromFile(UNDELETED_FILENAME) || null;

async function main() {
    if (undeletedState) {
        console.log(`found unfinished db in undeleted state (${undeletedState.dbName}), fixing...`);
        let resultState = BULK_STATES.INIT;
        while (resultState !== BULK_STATES.DONE) {
            resultState = await fixUndeletedState(null, undeletedState.dbName, undeletedState.deleteItems);
        }
        saveSuccess(undeletedState.dbName);
    }

    //console.log('retrieve db names of source...');
    //let sourceDBNames = await sourceServer.db.list();
    //console.log('retrieve db names of target...');
    //console.log(`server has ${sourceDBNames.length} databases.`);
    let allDbNames = [];

    let dbNames = customDbName ? [customDbName] : allDbNames;
    console.log(`found ${dbNames.length} databases. removing all finished ones...`);
    dbNames = dbNames.filter((name) => !successDbs.includes(name));
    console.log(`${dbNames.length} databases remaining.`);

    for (let dbName of dbNames) {
        let pouch = new PouchDB(`${couchUrl}/${dbName}`, {
            skip_setup: true
        });
        console.log('------------------------');
        console.log(`[${dbName}] starting...`);

        let deleteItems = await getDeletedItems(pouch);
        if (deleteItems.length > 0) {
            let resultState = BULK_STATES.INIT;
            while (resultState !== BULK_STATES.DONE) {
                console.log(`[${resultState}] re-deleting ${deleteItems.length} elements...`);
                if (resultState === BULK_STATES.INIT) {
                    resultState = await emptyDeletedBulk(pouch, deleteItems);
                } else if (resultState === BULK_STATES.SET_UNDELETED) {
                    resultState = await fixUndeletedState(pouch, dbName, deleteItems);
                }
            }

            // no purge because it results in syncing all deleted docs back from client -> server
            //await purgeDocs(dbName, deleteItems);

            console.log('success! compacting db...');
            await pouch.compact();
        } else {
            console.log(`[${dbName}] no deleted elements found.`);
        }

        saveSuccess(dbName);
        pouch.close();
    }
}

main();

async function fixUndeletedState(pouchParam, dbName, deleteItems) {
    let returnState = BULK_STATES.SET_UNDELETED;
    let pouch = pouchParam || new PouchDB(`${couchUrl}/${dbName}`);
    let ids = deleteItems.map((e) => e.id);
    saveUndeletedState(dbName, deleteItems);
    let getDocs = ids.map((e) => ({ id: e }));
    console.warn(`trying to re-delete these docs: ${JSON.stringify(ids)}`);
    try {
        let result = await pouch.bulkGet({
            docs: getDocs
        });
        let okDocs = [];
        for (let res of result.results) {
            let docs = res.docs.filter((e) => !!e.ok);
            docs.sort((a, b) => b.ok._rev.localeCompare(a.ok._rev));
            okDocs.push({
                id: docs[0].ok._id,
                rev: docs[0].ok._rev
            });
        }
        if (result.results.length !== okDocs.length) {
            console.warn(`some docs seem to have failed for bulkGet (${result.results.length} results vs. ${okDocs.length} extracted docs):`);
            console.warn(JSON.stringify(result));
            console.warn(JSON.stringify(okDocs));
        } else {
            await setDeleteBulk(pouch, okDocs, true);
            clearUndeletedState();
            returnState = BULK_STATES.DONE;
        }
    } catch (e) {
        console.warn(e);
    }
    if (!pouchParam) {
        pouch.close();
    }
    if (returnState !== BULK_STATES.DONE) {
        console.log('pausing for 15 seconds...');
        await new Promise((resolve) => setTimeout(() => resolve(), 15000));
    }
    return returnState;
}

async function emptyDeletedBulk(pouch, deleteItems) {
    let state = BULK_STATES.INIT;
    console.log('setting _deleted to false...');
    let result;
    try {
        result = await setDeleteBulk(pouch, deleteItems, false);
    } catch (e) {
        console.warn(e);
        return state;
    }

    state = BULK_STATES.SET_UNDELETED;
    console.log('setting _deleted to true...');
    try {
        await setDeleteBulk(pouch, result, true);
    } catch (e) {
        console.warn(e);
        return state;
    }
    return BULK_STATES.DONE;
}

function setDeleteBulk(pouch, docs, deleted) {
    return new Promise((resolve, reject) => {
        let saveDocs = docs.map((e) => ({
            _id: e.id || e._id,
            _rev: deleted ? e.rev || e._rev : undefined,
            _deleted: deleted
        }));
        pouch
            .bulkDocs(saveDocs)
            .then((result) => {
                resolve(result);
            })
            .catch((e) => {
                console.log('error', JSON.stringify(e));
                reject();
            });
    });
}

async function getDeletedItems(pouch) {
    let toDelete = [];
    let ids = [];
    return new Promise((resolve) => {
        let options = {
            style: 'main_only'
        };
        pouch
            .changes(options)
            .on('complete', function (info) {
                for (let change of info.results) {
                    if (change.deleted) {
                        //console.log('change', JSON.stringify(change));
                        ids.push(change.id);
                        let existing = toDelete.filter((e) => e.id === change.id)[0];
                        if (existing) {
                            existing.rev = change.changes[0].rev;
                        } else {
                            toDelete.push({
                                id: change.id,
                                rev: change.changes[0].rev
                            });
                        }
                    }
                }
                resolve(toDelete);
            })
            .on('error', function (err) {
                console.log('error', JSON.stringify(err));
                resolve([]);
            });
    });
}

function readFromFile(filename) {
    try {
        const data = fs.readFileSync(filename, {
            flag: 'a+'
        });
        let string = data.toString();
        return string ? JSON.parse(string) : null;
    } catch (err) {
        console.error(err);
    }
}

function writeToFile(filename, data) {
    try {
        fs.writeFileSync(filename, JSON.stringify(data));
    } catch (error) {
        console.error(err);
    }
}

function saveSuccess(dbName) {
    successDbs.push(dbName);
    writeToFile(SUCCESS_FILENAME, successDbs);
}

function saveUndeletedState(dbName, deleteItems) {
    writeToFile(UNDELETED_FILENAME, {
        dbName: dbName,
        deleteItems: deleteItems
    });
}

function clearUndeletedState() {
    writeToFile(UNDELETED_FILENAME, null);
}

async function purgeDocs(dbName, deleteItems) {
    let deleteChunks = arrayToChunks(deleteItems, CHUNK_SIZE);
    console.log(`purging ${deleteItems.length} elements in ${deleteChunks.length} chunks (size: ${CHUNK_SIZE})...`);
    for (let chunk of deleteChunks) {
        let body = {};
        for (let item of chunk) {
            body[item.id] = [item.rev];
        }
        await server
            .request({
                db: dbName,
                path: '_purge',
                method: 'post',
                body: body
            })
            .then((result) => {
                //console.log('result', JSON.stringify(result));
            })
            .catch((e) => {
                console.log('error', JSON.stringify(e));
            });
    }
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
