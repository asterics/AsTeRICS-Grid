#!/bin/bash
/bin/sh /home/superlogin/AsTeRICS-Grid/scripts/start.sh &>/dev/null &
disown
cp -rfL /etc/letsencrypt/live/ /opt/couchdb/letsencrypt
chown -R couchdb:couchdb /opt/couchdb/letsencrypt/
service couchdb restart
/etc/init.d/apache2 restart
