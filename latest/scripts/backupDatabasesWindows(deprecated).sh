if [ $# != 3 ]; then
    echo "Usage: sh $0 couchdbDataFolder backupDestination remoteCouchdbAdminPassword"
    echo "* couchdbDataFolder: local data folder of couchdb, e.g. /opt/couchdb/data/ on Linux or /c/CouchDB/data/ on Windows"
    echo "* backupDestination: destination folder for the backup.tgz file"
    echo "* remoteCouchdbAdminPassword: admin password of the remote couchdb that should be mirrored"
    echo "* example command: sh backupDatabases.sh /c/CouchDB/data/ /c/data/src/AsTeRICS-Grid/backup/ <password>"
    echo ""
    echo "!!! WARNING !!! this script deletes all data from the local couchdb instance and replaces it with the data of the remote couchdb!"
    echo "!!! IMPORTANT !!! stop and restart apache couchdb before running this script! Otherwise maybe not all data is cloned from remote db."
    exit 1
fi

shopt -s nocasematch
if [[ $1 != *"/data/" ]]; then
  echo "Error: couchdbDataFolder seems to be invalid, be sure to pass it in a format like /opt/couchdb/data/"
  exit 1
fi

if [[ $2 != *"/" ]]; then
  echo "Error: backupDestination seems to be invalid, be sure to pass it in a format like /backup/"
  exit 1
fi

rm -rf $1*
rm -rf $1.*
replicate-couchdb-cluster -s https://admin:$3@couchdb.asterics-foundation.org:6984 -t http://admin:admin@localhost:5984 -a -v
filename=$(date +"%Y_%m_%d")_backup_couchdb_asterics_grid.tgz
tar cvzf $2$filename $1
echo "Success: Backup created and saved to $2$filename"