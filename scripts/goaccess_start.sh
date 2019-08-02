goaccess /home/superlogin/AsTeRICS-Grid/superlogin/access.log -o /var/www/html/report.html --log-format=COMBINED --ws-url=couchdb.asterics-foundation.org --port=7890 --real-time-html --ssl-cert=/opt/couchdb/ssl/asterics-foundation.org_ssl_certificate_combined.cer --ssl-key=/opt/couchdb/ssl/asterics-foundation.org_private_key.key --geoip-database=/home/superlogin/geolite/GeoLite2-City.mmdb &

