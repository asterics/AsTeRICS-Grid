if (!process.argv[2]) {
    console.log('USAGE:');
    console.log('node couchDBDeleteInactiveUsers.js <COUCHDB_URL> [prod]');
    console.log('----');
    console.log('Examples:');
    console.log('node couchDBDeleteInactiveUsers.js http://admin:admin@localhost:5984');
    return;
}

let couchUrl = process.argv[2] || 'http://admin:admin@localhost:5984';
let prod = process.argv[3] === "prod";

couchUrl = couchUrl.trim();
const fs = require('fs');
const nano = require('nano')(couchUrl);
const authUsers = nano.use('auth-users');

const https = require('https');
let MAX_TIMEDIFF_SECONDS = 100;
let MS_PER_DAY = 1000 * 60 * 60 * 24;
let MAX_USER_AGE_DAYS = 280; // about 9 months

let SUCCESS_FILENAME = 'couchDBDeleteInactiveUsers.success.txt';
let ERROR_FILENAME = 'couchDBDeleteInactiveUsers.error.txt';

let successUsers = readFromFile(SUCCESS_FILENAME) || [];
let errorUsers = readFromFile(ERROR_FILENAME) || [];

async function main() {
    let localTimestamp = Math.round(new Date().getTime() / 1000);
    let remoteTimestamp = await httpsGet('time.asterics-foundation.org');

    if (Math.abs(localTimestamp - remoteTimestamp) > MAX_TIMEDIFF_SECONDS) {
        console.warn('local time differs from time retrieved from time.asterics-foundation.org. aborting...');
        return;
    }

    console.log("[OK] no time diff to remote time.asterics-foundation.org")
    console.log("retrieving users from auth-users...")

    let result = await authUsers.view('views', 'view-last-action-date', {
        reduce: false
    });

    console.log(`found ${result.rows.length} users. checking activity...`);
    console.log(result.rows[0]);

    let deleteItems = [];
    for (let row of result.rows) {
        let diffMs = new Date().getTime() - row.value.lastActivityTimestamp;
        let diffDays = diffMs / MS_PER_DAY;
        if (diffDays > MAX_USER_AGE_DAYS) {
            deleteItems.push(row);
        }
    }

    console.log(`found ${deleteItems.length} users for deletion, which were inactive for at least ${MAX_USER_AGE_DAYS} days.`)
    if(!prod) {
        return;
    }

    let doneCount = 0;
    let successCount = 0;
    for (let item of deleteItems) {
        let deletedDb = await destroyDatabase(item.value.dbName);
        let deletedUser = false;
        if (deletedDb) {
            deletedUser = await deleteUserDoc(item);
        }
        doneCount++;
        if (deletedDb && deletedUser) {
            console.log(`${!prod ? '[DRY_RUN]' : ''}[SUCCESS] user "${item.value.user}" deleted. ${deleteItems.length - doneCount} remaining...`);
            successCount++;
            saveSuccess(item.value.user);
        } else {
            console.log(`[WARN] error deleting db of user "${item.value.user}".`);
            saveError(item.value.user);
        }
    }
    console.log(`[DONE] deleted ${successCount} / ${deleteItems.length} users.`);
}

main();

function httpsGet(url) {
    return new Promise((resolve) => {
        //see https://stackoverflow.com/a/9578403/9219743
        let req = https.get(
            {
                host: url
            },
            function (res) {
                res.setEncoding('utf8');
                let body = "";
                res.on('data', function (chunk) {
                    body += chunk;
                }).on('end', function () {
                    resolve(body);
                });
            }
        );

        req.on('error', function (e) {
            console.log('ERROR: ', e.message);
            resolve(null);
        });
    });
}

async function destroyDatabase(name) {
    let deleted = true;
    try {
        if (prod) {
            await nano.db.destroy(name);
        }
    } catch (e) {
        console.warn("[WARN] database not deleted!", e.reason);
        deleted = false;
    }
    return deleted;
}

async function deleteUserDoc(deleteItem) {
    let deleted = false
    try {
        if (prod) {
            const response = await authUsers.destroy(deleteItem.id, deleteItem.value.rev);
            deleted = response.ok;
        } else {
            return true;
        }
    } catch (e) {
        console.warn("[WARN] user document not deleted!", e.reason);
    }
    return deleted;
}

function writeToFile(filename, data) {
    try {
        fs.writeFileSync(filename, JSON.stringify(data));
    } catch (error) {
        console.error(err);
    }
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

function saveSuccess(user) {
    successUsers.push(user);
    writeToFile(SUCCESS_FILENAME, successUsers);
}

function saveError(user) {
    errorUsers.push(user);
    writeToFile(ERROR_FILENAME, errorUsers);
}
