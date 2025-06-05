set -e

# ------------------------------------------------------------------
# AsTeRICS Grid beta-release script
# ------------------------------------------------------------------
# just builds and pushes to a sftp server of our hosting provider

folderName="asterics-grid-beta"
if [ $# -ge 1 ]; then
  folderName="$1"
fi

echo "releasing to $folderName..."

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
ssh $sshUserHost "rm -rf ~/$folderName/*"
scp index.html $sshUserHost:~/$folderName/
scp unsupported.html $sshUserHost:~/$folderName/
scp serviceWorker.js $sshUserHost:~/$folderName/
scp -r app $sshUserHost:~/$folderName/app

git checkout .

if $doStash; then
    echo "pop stashed changes..."
    git stash pop
fi

echo "release $tagname to grid.beta.asterics-foundation.org successful!"


