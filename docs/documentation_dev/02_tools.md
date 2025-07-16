# Tools and libraries
This chapter is about tools, libraries and technologies that are used in AsTeRICS Grid project:

1. [Tools](02_tools.md#tools)
1. [Javascript libaries](02_tools.md#javascript-libraries)

[Back to Overview](README.md)

## Tools
This section is about tools that are used for development, dependency management and releasing.

### Node package manager (npm)
The [node package manager (npm)](https://www.npmjs.com/) is used for managing Javascript dependencies and running various tasks related to the project. The npm configuration file is [package.json](https://github.com/asterics/AsTeRICS-Grid/blob/master/package.json).

#### npm dependencies
The configuration file [package.json](https://github.com/asterics/AsTeRICS-Grid/blob/master/package.json) includes the key `dependencies` which include dependencies that are used in order to run AsTeRICS Grid:
* **[@klues/couch-auth](https://github.com/perfood/couch-auth)**: framework providing user management in connection to [CouchDB](http://couchdb.apache.org/), the database backend used by AsTeRICS Grid. Using fork of original [couch-auth](https://github.com/perfood/couch-auth) in order to fix [session creation conflicts](https://github.com/perfood/couch-auth/issues/65) - already merged, so we could again use original `couch-auth`
* **[cors](https://www.npmjs.com/package/cors)**: CORS handler for HTTP requests, used by couch-auth
* `dotenv-flow`: used by `superlogin/start.js`
* `express`: used by `superlogin/start.js`
* `file-saver`: used for `download backup to file` feature
* `hls.js`: used for playback of special audio streams for web-radio and podcast features
* `html2canvas`: used for creating thumbnail screenshots of grids
* `interactjs`: used by [vue-css-grid-layout](https://github.com/asterics/vue-css-grid-layout) library (this library is not used as npm dependency, but the code is duplicated in folder `src/vue-components/grid-layout`)
* `jspdf`: used by PDF export feature
* `jszip`: used for importing/exporting OBZ files from [Open Board Format](https://www.openboardformat.org/docs)
* `matrix-encrypt-attachment`: used for [Matrix](https://matrix.org/) messenger integration
* `matrix-js-sdk`: used for [Matrix](https://matrix.org/) messenger integration
* **[morgan](https://www.npmjs.com/package/morgan)**: logger for HTTP requests, used by couch-auth
* `n-ary-huffman`: used for Huffman input method
* `navigo`: used for in-app routing, see `router.js`
* `pouchdb`: library for connecting with external CouchDB - the npm dependency is used by `superlogin/start.js`, the app uses the direct import in `index.html`, see below.
* `predictionary`: library for self-learning dictionary used for keyboard inputs, also see dictionaries at `app/dictionaries`
* **[superlogin-client](https://www.npmjs.com/package/superlogin-client)**: Javascript client for a couch-auth instance running on a server
* **[vue](https://vuejs.org/)**: framework for building the user interface
* `vue-i18n`: internationalization library for Vue.js
* `vue-multiselect`: multiselect component, used for selecting tags in word forms feature

Also see other directly imported [Javascript libraries](02_tools.md#javascript-libraries).

#### npm dev-dependencies
The configuration file [package.json](https://github.com/asterics/AsTeRICS-Grid/blob/master/package.json) includes the key `dev-dependencies` which include dependencies that are used for development of AsTeRICS Grid. These are the most important ones:
* **[webpack](https://www.npmjs.com/package/webpack)**: framework using for bundling javascript, vue and css resources
* **[webpack-dev-server](https://www.npmjs.com/package/webpack-dev-server)**: local http server for development of the application
* **[babel-core](https://www.npmjs.com/package/babel-core)**: framework for transpiling Javascript sources with newer language features to Javascript that is compatible with older browsers.
* **[jest](https://www.npmjs.com/package/jest)**: Unit testing framework for javascript

#### npm scripts

A description of [available npm scripts is available in README.md](https://github.com/asterics/AsTeRICS-Grid/tree/master?tab=readme-ov-file#npm-scripts).

### Webpack

[Webpack](https://webpack.js.org/) is used in order to bundling the Javascript sources to a single and minified bundle file. The configuration file for webpack is [webpack.config.js](https://github.com/asterics/AsTeRICS-Grid/blob/master/webpack.config.js).

## Javascript libraries
This section is about Javascript libraries that are used within the AsTeRICS Grid project and are imported directly in `index.html` and not via `npm`. All directly imported libraries are located at [app/lib/](https://github.com/asterics/AsTeRICS-Grid/tree/master/app/lib).

These are the Javascript libraries that are directly imported:
* **[dom-i18n](https://github.com/ruyadorno/dom-i18n)**: easy to use DOM-internationalization library
* **[jQueryUI](https://jqueryui.com/)**: library for user interface interactions, needed for jQuery contextMenu and GridList
* **[jQuery contextMenu](https://swisnl.github.io/jQuery-contextMenu/)**: jQuery plugin for right-click context menus, used in AsTeRICS Grid e.g. for edit menu of a grid element
* **[jQuery](https://jquery.com/)**: library for document traversal and manipulation, needed for jQueryUI
* **[loglevel](https://github.com/pimterry/loglevel)**: javascript logging library
* **[modernizr](https://github.com/Modernizr/Modernizr)**: for testing availability of JS features and redirect to `unsupported.html` if needed, see [checks in index.html](https://github.com/asterics/AsTeRICS-Grid/blob/master/index.html#L111)
* **[ObjectModel](https://objectmodel.js.org/)**: library for dynamic type checking, see data models in [src/js/model/](https://github.com/asterics/AsTeRICS-Grid/tree/master/src/js/model) - should be replaced by ES6 classes or TypeScript at some point.
* **[PouchDB](https://pouchdb.com/)**: library for accessing [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) and synchronization with a remote [CouchDB](http://couchdb.apache.org/)
* **[responsive-voice](https://responsivevoice.org/)**: library for interacting with responsive voice service, generating TTS samples
* **[sjcl](https://github.com/bitwiseshiftleft/sjcl)**: crypto library published by Stanford University that is used for encryption of user configuration
* **[uart.min.js](https://github.com/asterics/EspruinoWebTools/blob/master/uart.js)**: library for interacting with WebSerial and WebBluetooth APIs, used for UART action.
* **[workbox-sw.js](https://github.com/GoogleChrome/workbox)**: library for creating Service Workers for offline support of the app

[&#x2190; Previous Chapter](01_structure.md) [Next Chapter &#x2192;](03_grid.md)

[Back to Overview](README.md)



