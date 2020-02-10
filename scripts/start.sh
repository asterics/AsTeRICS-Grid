/bin/sh /home/superlogin/AsTeRICS-Grid/scripts/stop.sh
/bin/sh -c "npm --prefix /home/superlogin/AsTeRICS-Grid/ run start-superlogin-prod" &
/bin/sh -c "/bin/sh /home/superlogin/AsTeRICS-Grid/scripts/goaccess_start.sh" &