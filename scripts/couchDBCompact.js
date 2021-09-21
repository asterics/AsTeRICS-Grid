if (!process.argv[2] || !process.argv[2].trim()) {
    console.log('USAGE:');
    console.log("node couchDbCompact.js <COUCHDB_URL> ['compact']");
    console.log("----");
    console.log("Examples:");
    console.log("node couchDbCompact.js http://admin:admin@localhost:5984 ... for just analyzing current disk usage");
    console.log("node couchDbCompact.js http://admin:admin@localhost:5984 compact ... for compacting all databases");
    return;
}

let dbUrl = process.argv[2] || 'http://admin:admin@localhost:5984';
let doCompact = process.argv[3] && process.argv[3].trim() === 'compact';
console.log('using url: ' + dbUrl);
const nano = require('nano')({
    "url": dbUrl.trim(),
    "requestDefaults": {"timeout": 250000} // 250 seconds
});
//const nano = require('nano')(dbUrl.trim());
const slUsers = nano.db.use('sl-users');

async function getInfos(dbNames, doLog) {
    let sumMB = 0;
    let infos = [];
    for (const dbName of dbNames) {
        let info = await nano.db.get(dbName);
        info.fragmentation = info.disk_size / info.data_size;
        sumMB += info.disk_size / (1024 * 1024);
        infos.push(info);
    }
    if (doLog) {
        infos.sort((a, b) => a.disk_size - b.disk_size);
        infos.forEach(info => {
            console.log(info.db_name);
            console.log(info.disk_size / (1024 * 1024));
            console.log(info.data_size / (1024 * 1024));
            console.log(info.fragmentation);
            console.log("----");
        });
    }
    return sumMB;
}

async function main() {
    const dblist = await nano.db.list().catch(err => console.log(err));
    console.log('calculating current disk size ...');
    let sumBefore = doCompact ? 0 : await getInfos(dblist, !doCompact); //only calculate before if no compact to avoid running out of system ressources/connections in compact ("no db shards could be opened")
    console.log(`DISK SIZE: ${sumBefore}MB`);
    if (doCompact) {
        console.log('starting compacting databases...');
        let failed = [];
        for (const dbName of dblist) {
            if (dbName !== 'sl-users') {
                console.log(`compacting "${dbName}" ...`);
                try {
                    await nano.db.compact(dbName).catch(err => {
                        console.log(err);
                        failed.push(dbName);
                    });
		    await new Promise(resolve => setTimeout(() => resolve(), 5000));
                } catch (e) {
                    console.log(e);
                    failed.push(dbName);
                }
            }
        }
        let sumAfter = await getInfos(dblist, true);
        console.log(`DISK SIZE BEFORE: ${sumBefore}MB`);
        console.log(`DISK SIZE AFTER COMPACT: ${sumAfter}MB`);
        console.log(`DISK SIZE REDUCED BY: ${sumBefore - sumAfter}MB`);
        console.log(`Databases failed to compact: ${JSON.stringify(failed)}`);
    }

    // unused code analyzing last usage by database slUsers
    // ----------------------------------------------------
    /*const result = await slUsers.list({include_docs: true});
    let doclist = result.rows.map(doc => {
        doc.expiresList = [];
        if (doc.doc && doc.doc.session) {
            doc.expiresList = Object.keys(doc.doc.session).map(key => doc.doc.session[key].expires);
        }
        return doc;
    });
    doclist.forEach((doc) => {
        doc.expiresList.sort().reverse();
        doc.wasntUsedSince = Date.now() - doc.expiresList[0];
        doc.wasntUsedSinceDays = doc.wasntUsedSince / (1000 * 60 * 60 * 24);
        doc.neverUsed = !doc.expiresList[0];
    });
    doclist.sort((a, b) => {
        if (a.neverUsed && b.neverUsed) {
            return 0;
        }
        if (a.neverUsed) {
            return -1;
        }
        if (b.neverUsed) {
            return 1;
        }
        return b.wasntUsedSince - a.wasntUsedSince;
    });
    doclist.forEach((doc) => {
        console.log(doc.id);
        console.log(doc.neverUsed);
        console.log(doc.wasntUsedSinceDays);
        console.log(doc.key);
        console.log(doc.value.length);
        console.log("-----");
    });*/
}

main();

