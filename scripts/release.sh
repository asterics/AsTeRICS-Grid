set -e

# ------------------------------------------------------------------
# AsTeRICS Grid release script
# ------------------------------------------------------------------
# releases the committed version on the current branch to gh-pages
# by performing the following steps:
# 1) a new tag named after the current date/time is created an published
# 2) the version of the new tag is pushed to the gh-pages branch both
#    as the normal version and the beta version.
# 3) the original branch is checked out
# 4) if there are uncommitted changes on the current branch they are stashed
#    before and popped after the release
#
# Note: if you are using this script to release a bugfix it's necessary to manually
# restore the original beta-version afterwards since the beta-version will be the same
# as the bug-fixed version after releasing.

do_gh_pages_update () {
    echo "apply release to gh-pages..."
    git checkout gh-pages
    git reset --hard $tagname
    rm -rf latest
    git clone --depth=1 --branch $tagname https://github.com/asterics/AsTeRICS-Grid.git latest
    rm -rf latest/.git/
    git add latest
    git commit -m "added tag '$tagname' for beta version in folder latest."
    git push origin gh-pages -f
    git checkout $branch
}

git reset HEAD app/manifest.appcache
git checkout app/manifest.appcache
doStash=true
if git diff-index --quiet HEAD --; then
    doStash=false
fi
if $doStash; then
    # Changes
    echo "detected local changes, doing git stash..."
    git stash
fi

branch=$(git symbolic-ref --short HEAD)
tagname="release-$(date +%Y-%m-%d-%H.%M/%z)"
tagnameSed="release-$(date +%Y-%m-%d-%H.%M\\/%z)"
echo $tagnameSed
sed -i -e "s/#ASTERICS_GRID_VERSION#/$tagnameSed/g" src/js/util/constants.js
sed -i -e "s/#ASTERICS_GRID_ENV#/PROD/g" src/js/util/constants.js
sed -i -e "s/#ASTERICS_GRID_VERSION#/$tagnameSed/g" src/vue-components/views/aboutView.vue
sed -i -e "s/#ASTERICS_GRID_VERSION#/$tagnameSed/g" serviceWorker.js

echo "building..."
npm run build
echo "commiting bundles and manifest..."
git add app/build
git add app/build_legacy
git add app/manifest.appcache
git add serviceWorker.js
git commit -m "added bundles and appcache for release $tagname"
git push origin HEAD
git checkout src/vue-components/views/aboutView.vue
git checkout src/js/util/constants.js
echo "creating tag '$tagname'..."
git tag -a $tagname -m $tagname
git push origin $tagname
sed -i -e "s/$tagnameSed/#ASTERICS_GRID_VERSION#/g" serviceWorker.js
git add serviceWorker.js
git commit -m "reverted release version to placeholder"
do_gh_pages_update
if $doStash; then
    echo "pop stashed changes..."
    git stash pop
fi
echo "$tagname successfully released!"


