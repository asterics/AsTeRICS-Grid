set -e

# ------------------------------------------------------------------
# AsTeRICS Grid latest-release script
# ------------------------------------------------------------------
# releases the committed version on the current branch to gh-pages
# as latest-release by performing the following steps:
# 1) a new tag named after the current date/time is created an published
# 2) the version of the new tag is pushed to the gh-pages branch in the
#    folder/subpath "latest". The main release remains the same.
# 3) the original branch is checked out
# 4) if there are uncommitted changes on the current branch they are stashed
#    before and popped after the release

do_gh_pages_update () {
   echo "apply latest-release to gh-pages..."
   git checkout gh-pages
   echo "git update gh-pages..."
   git fetch origin gh-pages
   git reset --hard origin/gh-pages
   rm -rf latest
   git clone --depth=1 --branch $tagname https://github.com/asterics/AsTeRICS-Grid.git latest
   rm -rf latest/.git/
   git add latest
   git commit -m "added tag '$tagname' for latest version in folder latest."
   git push origin gh-pages -f
   git checkout $branch
}

branch=$(git symbolic-ref --short HEAD)
if [ $branch != "master" ]; then
   echo "latest release should be done from branch 'master', currently on '$branch', aborting."
   exit 1
fi

doStash=true
if git diff-index --quiet HEAD --; then
    doStash=false
fi
if $doStash; then
    # Changes
    echo "detected local changes, doing git stash..."
    git stash
fi

echo "testing..."
npm run test

echo "git pull..."
git pull
tagname="release-latest-$(date +%Y-%m-%d-%H.%M/%z)"
tagnameSed="release-latest-$(date +%Y-%m-%d-%H.%M\\/%z)"
echo $tagnameSed
sed -i -e "s/#ASTERICS_GRID_VERSION#/$tagnameSed/g" src/js/util/constants.js
sed -i -e "s/#ASTERICS_GRID_ENV#/PROD/g" src/js/util/constants.js
sed -i -e "s/#ASTERICS_GRID_VERSION#/$tagnameSed/g" src/vue-components/views/aboutView.vue
sed -i -e "s/#ASTERICS_GRID_VERSION#/$tagnameSed/g" serviceWorker.js

echo "building..."
npm run build
echo "commiting bundles..."
git add app/build
git add serviceWorker.js
git commit -m "added bundles and appcache for latest-release $tagname"
git push origin HEAD
git checkout src/vue-components/views/aboutView.vue
git checkout src/js/util/constants.js
echo "creating tag '$tagname'..."
git tag -a $tagname -m $tagname
git push origin $tagname
sed -i -e "s/$tagnameSed/#ASTERICS_GRID_VERSION#/g" serviceWorker.js
git add serviceWorker.js
git commit -m "reverted release version to placeholder"
git push origin HEAD
do_gh_pages_update
if $doStash; then
    echo "pop stashed changes..."
    git stash pop
fi
echo "latest-release $tagname successfully released!"


