set -e

# ------------------------------------------------------------------
# AsTeRICS Grid beta-release script
# ------------------------------------------------------------------
# just builds and pushes to a sftp server of our hosting provider

sshUserHost="u91187759@home708826695.1and1-data.host"

doStash=true
if git diff-index --quiet HEAD --; then
    doStash=false
fi
if $doStash; then
    # Changes
    echo "detected local changes, doing git stash..."
    git stash
fi

echo "building..."
tagname="release-beta-$(date +%Y-%m-%d-%H.%M/%z)"
tagnameSed="release-beta-$(date +%Y-%m-%d-%H.%M\\/%z)"
sed -i -e "s/#ASTERICS_GRID_VERSION#/$tagnameSed/g" src/js/util/constants.js
sed -i -e "s/#ASTERICS_GRID_ENV#/BETA/g" src/js/util/constants.js
sed -i -e "s/#ASTERICS_GRID_VERSION#/$tagnameSed/g" src/vue-components/views/aboutView.vue
sed -i -e "s/#ASTERICS_GRID_VERSION#/$tagnameSed/g" serviceWorker.js
npm run build

echo "copy data to host..."
ssh $sshUserHost "rm -rf ~/asterics-grid-beta/*"
scp index.html $sshUserHost:~/asterics-grid-beta/
scp unsupported.html $sshUserHost:~/asterics-grid-beta/
scp serviceWorker.js $sshUserHost:~/asterics-grid-beta/
scp -r app $sshUserHost:~/asterics-grid-beta/app

git checkout .

if $doStash; then
    echo "pop stashed changes..."
    git stash pop
fi

echo "release $tagname to grid.beta.asterics-foundation.org successful!"


