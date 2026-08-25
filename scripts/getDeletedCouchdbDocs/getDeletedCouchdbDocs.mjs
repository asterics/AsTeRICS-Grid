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
  node exportAndUndelete.mjs <username> <admin_password>

Example:
  node exportAndUndelete.mjs john_doe secret123
`);
  process.exit(1);
}

const authHeader = 'Basic ' + Buffer.from(`${ADMIN_USER}:${password}`).toString('base64');
const headers = {
  'Authorization': authHeader,
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

async function exportAndUndelete() {
  try {
    const dbName = await getDatabaseName();

    const liveDir = path.join(process.cwd(), 'live');
    const undeletedDir = path.join(process.cwd(), 'undeleted');

    // Ensure output directories exist
    await fs.mkdir(liveDir, { recursive: true });
    await fs.mkdir(undeletedDir, { recursive: true });

    console.log(`🔍 Fetching document list from "${dbName}"...`);

    const changesUrl = `${COUCHDB_URL}/${encodeURIComponent(dbName)}/_changes?style=all_docs&include_docs=true`;
    const res = await fetch(changesUrl, { headers });

    if (!res.ok) {
      if (res.status === 404) throw new Error(`Database "${dbName}" was not found.`);
      throw new Error(`Failed to fetch changes: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log(`📦 Found ${data.results.length} total entries.`);

    let liveCount = 0;
    let undeletedCount = 0;

    for (const item of data.results) {
      if (item.id.startsWith('_design/')) continue;

      const safeFileName = `${item.id.replace(/[/\\?%*:|"< >]/g, '_')}.json`;

      if (item.deleted) {
        // 1. Get the tombstone revision string returned directly by _changes
        const tombstoneRev = item.changes?.[0]?.rev;

        if (!tombstoneRev) {
          console.warn(`⚠️ Could not find revision hash for deleted doc "${item.id}".`);
          continue;
        }

        // 2. Fetch revision tree passing the tombstone rev to bypass CouchDB's 404
        const revsUrl = `${COUCHDB_URL}/${encodeURIComponent(dbName)}/${encodeURIComponent(item.id)}?rev=${tombstoneRev}&revs=true`;
        const revsRes = await fetch(revsUrl, { headers });

        if (!revsRes.ok) {
          console.warn(`⚠️ Could not query revision metadata for deleted doc "${item.id}".`);
          continue;
        }

        const revsData = await revsRes.json();
        const revisions = revsData._revisions;

        // Ensure at least one revision existed prior to the tombstone
        if (revisions && revisions.ids && revisions.ids.length > 1) {
          const preDeleteStart = revisions.start - 1;
          const preDeleteHash = revisions.ids[1]; // Index 1 = state immediately prior to deletion
          const preDeleteRev = `${preDeleteStart}-${preDeleteHash}`;

          // 3. Fetch pre-deletion content
          const docUrl = `${COUCHDB_URL}/${encodeURIComponent(dbName)}/${encodeURIComponent(item.id)}?rev=${preDeleteRev}`;
          const docRes = await fetch(docUrl, { headers });

          if (docRes.ok) {
            const restoredDoc = await docRes.json();

            // Strip metadata flags for clean recovery
            delete restoredDoc._deleted;
            delete restoredDoc._rev;

            await fs.writeFile(
                path.join(undeletedDir, safeFileName),
                JSON.stringify(restoredDoc, null, 2)
            );
            undeletedCount++;
          } else {
            console.warn(`⚠️ Revision ${preDeleteRev} for "${item.id}" missing from disk (likely compacted).`);
          }
        } else {
          console.warn(`⚠️ No historical revision found prior to deletion for "${item.id}".`);
        }
      } else {
        // --- LIVE DOCUMENTS ---
        if (item.doc) {
          await fs.writeFile(
              path.join(liveDir, safeFileName),
              JSON.stringify(item.doc, null, 2)
          );
          liveCount++;
        }
      }
    }

    console.log(`\n✅ Operation Complete!`);
    console.log(`- Saved ${liveCount} live docs to ./live`);
    console.log(`- Recovered ${undeletedCount} deleted docs to ./undeleted`);

  } catch (err) {
    console.error('❌ Error during process:', err.message);
  }
}

exportAndUndelete();