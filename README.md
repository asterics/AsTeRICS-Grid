# AsTeRICS-Ergo-Grid
App for AsTeRICS Ergo for creating a flexible grid system that can be used for Augmentative and Alternative Communication (AAC), Environmental control or interaction with custom ARE models.

# Run project
1. clone the project `git clone git@github.com:asterics/AsTeRICS-Ergo-Grid.git`
2. install node.js https://nodejs.org/
3. go to the directory of the cloned project and run `npm install`

After `npm install` the following commands are possible:
1. `npm start` --> starts a webserver serving the AsTeRICS Ergo grid, does hot reloading if js-sources change.
2. `npm run build` --> builds the js-files in folder `src` to `package/static/build` and `package/static/build_legacy` folders.
3. `npm run watch` --> watches the files in in folder `src` to and builds them to `package/static/build` and `package/static/build_legacy` folders, if something changes.
4. `npm run pages` --> updates the branch `gh-pages` to the branch `master` and pushes it. Therefore this command updates the online site of the AsTeRICS Ergo Grid at https://asterics.github.io/AsTeRICS-Ergo-Grid/package/static/
