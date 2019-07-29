# AsTeRICS Grid
App for creating a flexible grid system that can be used for Augmentative and Alternative Communication (AAC), Environmental control or interaction with custom ARE models. The AsTeRICS Grid will also be runnable standalone, without any AsTeRICS backend.

See https://grid.asterics.eu/ for a online demo of the Grid, see https://grid.asterics.eu/latest/ for testing the latest (but maybe unstable) version.

The AsTeRICS Grid evolved out of AsTeRICS Ergo, see [AsTeRICS Ergo Master Plan](https://github.com/asterics/AsTeRICS-Ergo/wiki/Master-Plan-AsTeRICS-Ergo) and [AsTeRICS Ergo Architecture](https://github.com/asterics/AsTeRICS-Ergo/wiki/Architecture) and will eventually replace AsTeRICS Ergo.

## Documentation
see [User documentation](docs/documentation_user/00_index.md)

## Run project
1. clone the project `git clone git@github.com:asterics/AsTeRICS-Grid.git`
2. install node.js https://nodejs.org/
3. go to the directory of the cloned project and run `npm install`

After `npm install` the following commands are possible:
1. `npm run start` --> starts a webserver serving the AsTeRICS grid, does hot reloading if js-sources change.
2. `npm run build` --> builds the js-files in folder `src` to `app/build` and `app/build_legacy` folders.
3. `npm run watch` --> watches the files in in folder `src` to and builds them to `app/build` and `app/build_legacy` folders, if something changes.
4. `npm run pages` --> updates the branch `gh-pages` to the branch `master` and pushes it. Therefore this command updates the online site of the AsTeRICS Grid at https://asterics.github.io/AsTeRICS-Grid/app/
5. `npm run pages-stash` --> same as (4) but does a `git stash` before and `git stash apply` after all actions and therefore can be used if there are non-commited changes in the working directory.
6. `npm run start-appcache` --> same as (1), includes appcache file for offline capabilities (maybe inconvenient for development).
7. `npm run watch-appcache` --> same as (3), includes appcache file for offline capabilities (maybe inconvenient for development). For auto-reloading of changes with enabled offline capabilities start `npm run start-appcache` in one tab and `npm run watch-appcache` in another tab.

## Acknowledgements
Thanks to https://crossbrowsertesting.com/ for providing a free open source license.
<a href="https://crossbrowsertesting.com/"><img src="https://raw.githubusercontent.com/asterics/AsTeRICS-Grid/master/app/img/CBT_OS-logo_2Color-H.png" width="400px"/></a>
