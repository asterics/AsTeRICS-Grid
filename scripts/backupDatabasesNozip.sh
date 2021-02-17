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
log_file=$1/last_rsync_log.txt
mkdir -p $1/$foldername
echo "Copying data from CouchDB..."
rsync -LKIrv --update backup-reader@1ce28d.online-server.cloud:/opt/couchdb/data $1/$foldername &> $log_file
rsync -LKIrv --update backup-reader@1ce28d.online-server.cloud:/opt/couchdb/etc $1/$foldername &> $log_file

echo "Copied data. Size: "$(du -sh $1/$foldername)
echo "Total size of backups: "$(du -sh $1)
echo "Backup successfully created!"