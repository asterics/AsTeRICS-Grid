set -e

# ------------------------------------------------------------------
# AsTeRICS Grid beta-release script
# ------------------------------------------------------------------
# just builds and pushes to a sftp server of our hosting provider

sshUserHost="user@host"

echo "building..."
npm run build

echo "copy data to host..."
ssh $sshUserHost "rm -rf ~/asterics-grid-beta/*"
scp index.html $sshUserHost:~/asterics-grid-beta/
scp unsupported.html $sshUserHost:~/asterics-grid-beta/
scp serviceWorker.js $sshUserHost:~/asterics-grid-beta/
scp -r app $sshUserHost:~/asterics-grid-beta/app

git checkout app/build

echo "release to grid.beta.asterics-foundation.org successful!"


