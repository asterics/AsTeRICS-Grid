set -e

# ------------------------------------------------------------------
# AsTeRICS Grid beta-release script
# ------------------------------------------------------------------
# releases the committed version on the current branch to gh-pages
# as beta-release by performing the following steps:
# 1) a new tag named after the current date/time is created an published
# 2) the version of the new tag is pushed to the gh-pages branch in the
#    folder/subpath "latest". The main release remains the same.
# 3) the original branch is checked out
# 4) if there are uncommitted changes on the current branch they are stashed
#    before and popped after the release

do_gh_pages_update () {
   echo "apply beta-release to gh-pages..."
   git checkout gh-pages
   rm -rf latest
   git clone --branch $tagname https://github.com/asterics/AsTeRICS-Grid.git latest
   git add latest
   git commit -m "added tag '$tagname' for beta version in folder beta."
   git push origin gh-pages -f
   git checkout $branch
}

branch=$(git symbolic-ref --short HEAD)
tagname="release-beta-$(date +%Y-%m-%d-%H.%M/%z)"
tagnameSed="release-beta-$(date +%Y-%m-%d-%H.%M\\/%z)"
echo $tagnameSed
sed -i -e "s/#ASTERICS_GRID_VERSION#/$tagnameSed/g" src/js/mainScript.js
sed -i -e "s/#ASTERICS_GRID_ENV#/PROD/g" src/js/util/constants.js

echo "building..."
npm run build
echo "commiting bundles and manifest..."
git add app/build
git add app/build_legacy
git add app/manifest.appcache
git commit -m "added bundles and appcache for beta-release $tagname"
git push origin HEAD
git checkout src/js/mainScript.js
git checkout src/js/util/constants.js
echo "creating tag '$tagname'..."
git tag -a $tagname -m $tagname
git push origin $tagname
if git diff-index --quiet HEAD --; then
    # No changes
    echo "no local changes, no stash..."
    do_gh_pages_update
else
    # Changes
    echo "detected local changes, doing git stash..."
    git stash
    do_gh_pages_update
    git stash pop
fi
echo "beta-release $tagname successfully released!"


