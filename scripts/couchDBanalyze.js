let dbUrl = process.argv[2] || 'http://admin:admin@localhost:5984';
console.log('using url: ' + dbUrl);
const nano = require('nano')(dbUrl.trim());
const slUsers = nano.db.use('sl-users');

async function main() {
    const dblist = await nano.db.list().catch(err => console.log(err));
    console.log(JSON.stringify(dblist));
    let infos = [];
    //await nano.db.compact('asterics-grid-data$test');
    //console.log('compacted test!');
    let sumBefore = 0;
    for(const db of dblist) {
	let info = await nano.db.get(db);
	info.fragmentation = info.disk_size / info.data_size;
        sumBefore += info.disk_size;
        infos.push(info);
    }
    infos.sort((a, b) => a.disk_size - b.disk_size);
    infos.forEach(info => {
        console.log(info.db_name);
	console.log(info.disk_size / (1024 * 1024));
	console.log(info.data_size / (1024 * 1024));
	console.log(info.fragmentation);
	console.log("----");
    });
    console.log('SUM BEFORE COMPACT: ' + (sumBefore / (1024*1024)) + 'MB');
    console.log('SUM AFTER COMPACT: ' + (sumÁfter / (1024*1024)) + 'MB'); 
    return;
    dblist.forEach(async db => {
        console.log(db);
	info = await nano.db.get(db);
	console.log(info);
    });

    const result = await slUsers.list({include_docs: true});
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
    doclist.sort((a,b) =>  {
        if(a.neverUsed && b.neverUsed) {
            return 0;
        }
        if(a.neverUsed) {
            return -1;
        }
        if(b.neverUsed) {
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
    });
}

main();

