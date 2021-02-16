#!/bin/bash
set -e

if [ $# != 1 ]; then
    echo "Usage: sh $0 backupDestination"
    echo "* backupDestination: destination folder"
    echo "* example command: sh backupDatabasesNozip.sh /c/data/src/AsTeRICS-Grid/backup/"
    exit 1
fi

if [ ! -d $1 ]; then
    echo "Directory $1 DOES NOT exist."
    exit 1
fi

foldername=$(date +"%Y_%m_%d")_backup_couchdb_asterics_grid
mkdir -p $1/$foldername
echo "Copying data from CouchDB..."
rsync -rv backup-reader@1ce28d.online-server.cloud:/opt/couchdb/data $1/$foldername
rsync -rv backup-reader@1ce28d.online-server.cloud:/opt/couchdb/etc $1/$foldername

echo "Success: Backup created and saved to $1/$foldername"