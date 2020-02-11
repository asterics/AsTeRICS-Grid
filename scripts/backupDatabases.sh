#!/bin/bash
set -e
BASEDIR=$(dirname "$0")


if [ $# != 1 ]; then
    echo "Usage: sh $0 backupDestination"
    echo "* backupDestination: destination folder for the backup.tgz file"
    echo "* example command: sh backupDatabases.sh /c/data/src/AsTeRICS-Grid/backup/"
    exit 1
fi

if [ ! -d $1 ]; then
    echo "Directory $1 DOES NOT exist."
    exit 1
fi

mkdir $BASEDIR/tempbackup
scp -rp -i $BASEDIR/.ssh/backup-reader backup-reader@1ce28d.online-server.cloud:/opt/couchdb/data/. $BASEDIR/tempbackup/
filename=$(date +"%Y_%m_%d")_backup_couchdb_asterics_grid.tgz
echo "packing backup..."
tar -czf $1$filename $BASEDIR/tempbackup/.
rm -rf $BASEDIR/tempbackup
echo "Success: Backup created and saved to $1$filename"