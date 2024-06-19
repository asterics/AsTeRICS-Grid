#!/bin/bash
set -e

if [ $# != 3 ]; then
    echo "Usage: sh $0 source destination sshKey"
    echo "* source: source username, host and folder, e.g. <user>@<host>:/path/to/couchdb/data"
    echo "* destination: destination folder"
    echo "* sshKey: private ssh key file for authentication via ssh"
    echo "* example command: sh backupDatabasesNozip.sh user@1.2.3.4:/opt/couchdb/data ./backup/ privKeys/myPrivKey"
    echo "* CouchDB data will be written to destination folder and incrementally updated using rsync"
    exit 1
fi

if [ ! -d $2 ]; then
    echo "Directory $2 DOES NOT exist."
    exit 1
fi

foldername=backup
log_file=$2/last_rsync_log.txt
mkdir -p $2/$foldername
echo "Folder size before backup: "$(du -sh $2/$foldername)
echo "Copying data from CouchDB..."

# see https://stackoverflow.com/a/56484954
current_day=$(date +%d)
if (( current_day <= 7 ))
then
    # running rsync with --delete flag once a month on order to delete deleted/compacted CouchDB files
    echo "running rsync with --delete flag..."
    sudo rsync --delete --bwlimit=20000 -urv -e "ssh -i $3" $1 $2/$foldername &> $log_file
else
    echo "running rsync without --delete flag..."
    sudo rsync --bwlimit=20000 -urv -e "ssh -i $3" $1 $2/$foldername &> $log_file
fi

echo "Copied data. New folder size: "$(du -sh $2/$foldername)
echo "Backup successfully created!"