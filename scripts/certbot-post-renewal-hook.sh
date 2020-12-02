#!/bin/bash
rm -rf /opt/couchdb/letsencrypt
cp -rfL /etc/letsencrypt/live/ /opt/couchdb/letsencrypt
chown -R couchdb:couchdb /opt/couchdb/letsencrypt/
/bin/sh /home/superlogin/AsTeRICS-Grid/scripts/start.sh &>/dev/null &
disown
service couchdb restart
/etc/init.d/apache2 restart