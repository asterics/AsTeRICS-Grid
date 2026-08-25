import fs from 'node:fs/promises';
import path from 'node:path';

// --- CONFIGURATION ---
const COUCHDB_URL = 'https://db2.couchdb.asterics-foundation.org';
const ADMIN_USER = 'admin';
const AUTH_DB = 'auth-users';
const DESIGN_DOC = 'views';

// --- COMMAND LINE ARGS ---
const targetUsername = process.argv[2];
const password = process.argv[3]; // Admin password

if (!targetUsername || !password) {
  console.log(`
❌ Missing required arguments!

Usage:
  node uploadUndeleted.mjs <username> <admin_password>

Example:
  node uploadUndeleted.mjs john_doe secret123
`);
  process.exit(1);
}

const authHeader = 'Basic ' + Buffer.from(`${ADMIN_USER}:${password}`).toString('base64');
const headers = {
  'Authorization': authHeader,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

async function getDatabaseName() {
  console.log(`🔍 Looking up database for user "${targetUsername}"...`);
  // CouchDB requires keys to be JSON encoded (hence the added quotes)
  const key = encodeURIComponent(`"${targetUsername}"`);
  const viewUrl = `${COUCHDB_URL}/${AUTH_DB}/_design/${DESIGN_DOC}/_view/view-usernames?key=${key}`;

  const res = await fetch(viewUrl, { headers });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Authentication failed. Check admin password.');
    if (res.status === 404) throw new Error(`View not found. Check if DESIGN_DOC '${DESIGN_DOC}' is correct.`);
    throw new Error(`Failed to fetch view: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (!data.rows || data.rows.length === 0) {
    throw new Error(`No database entry found for user "${targetUsername}" in view.`);
  }

  // The prompt specifies the value is a single-item array containing the db name
  const dbName = data.rows[0].value[0];
  console.log(`✅ Found database: "${dbName}"`);
  return dbName;
}

async function uploadUndeletedDocs() {
  try {
    const dbName = await getDatabaseName();

    const undeletedDir = path.join(process.cwd(), 'undeleted');
    const files = await fs.readdir(undeletedDir).catch(() => null);
    if (!files || files.length === 0) {
      console.log('⚠️ No documents found in ./undeleted to upload.');
      return;
    }

    const jsonFiles = files.filter(file => file.endsWith('.json'));
    console.log(`🔍 Found ${jsonFiles.length} files. Force-uploading to "${dbName}"...`);

    let restoredCount = 0;
    let failedCount = 0;

    for (const file of jsonFiles) {
      const filePath = path.join(undeletedDir, file);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      let doc;
      
      try {
        doc = JSON.parse(fileContent);
      } catch (e) {
        console.warn(`⚠️ Skipping ${file}: Invalid JSON.`);
        continue;
      }

      if (!doc._id) {
        console.warn(`⚠️ Skipping ${file}: Document missing "_id" property.`);
        continue;
      }

      // 1. Force a massively bumped revision number to win any database conflicts
      doc._rev = `9999-1234567890abcdef1234567890abcdef`;

      // 2. Use _bulk_docs with new_edits: false to bypass all conflict checking
      const bulkUrl = `${COUCHDB_URL}/${encodeURIComponent(dbName)}/_bulk_docs`;
      const postRes = await fetch(bulkUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          new_edits: false, // Tells CouchDB to inject the doc without checking history
          docs: [doc]
        })
      });

      if (postRes.ok) {
        restoredCount++;
        console.log(`✅ Force-recovered doc "${doc._id}"`);
      } else {
        const errData = await postRes.json().catch(() => ({}));
        console.error(`❌ Failed to recover doc "${doc._id}": ${postRes.status} ${errData.reason || postRes.statusText}`);
        failedCount++;
      }
    }

    console.log(`\n✅ Restore Complete!`);
    console.log(`- Successfully restored: ${restoredCount} docs`);
    if (failedCount > 0) {
      console.log(`- Failed to restore: ${failedCount} docs`);
    }

  } catch (err) {
    console.error('❌ Error during import process:', err.message);
  }
}

uploadUndeletedDocs();