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
* **[@sensu/superlogin](https://github.com/sen-su/superlogin)**: framework providing user management in connection to [CouchDB](http://couchdb.apache.org/), the database backend used by AsTeRICS Grid
* **[cors](https://www.npmjs.com/package/cors)**: CORS handler for HTTP requests, used by superlogin
* **[morgan](https://www.npmjs.com/package/morgan)**: logger for HTTP requests, used by superlogin
* **[superlogin-client](https://www.npmjs.com/package/superlogin-client)**: Javascript client for a superlogin instance running on a server

The other listed dependencies are [Javascript libraries](02_tools.md#javascript-libraries).

#### npm dev-dependencies
The configuration file [package.json](https://github.com/asterics/AsTeRICS-Grid/blob/master/package.json) includes the key `dev-dependencies` which include dependencies that are used for development of AsTeRICS Grid. These are the most important ones:
* **[webpack](https://www.npmjs.com/package/webpack)**: framework using for bundling javascript, vue and css resources
* **[webpack-dev-server](https://www.npmjs.com/package/webpack-dev-server)**: local http server for development of the application
* **[babel-core](https://www.npmjs.com/package/babel-core)**: framework for transpiling Javascript sources with newer language features to Javascript that is compatible with older browsers.
* **[jest](https://www.npmjs.com/package/jest)**: Unit testing framework for javascript

<!-- TODO: link to explaining scripts, maybe in development section? -->

### Webpack

[Webpack](https://webpack.js.org/) is used in order to bundling the Javascript sources to a single and minified bundle file. The configuration file for webpack is [webpack.config.js](https://github.com/asterics/AsTeRICS-Grid/blob/master/webpack.config.js). It may seem complicated at first sight, but basically it's configuring 3 things:

1. **Bundling of all sources** from the `src/` folder to one minified file in `app/build/` and `app/build_lecagy`. This bundling is configured by the two objects `configNormal` and `configLegacy` that are returned at the end of the script.
1. **Generating the appcache.manifest file** for offline support. This is done by using the [appcache-webpack-plugin](https://www.npmjs.com/package/appcache-webpack-plugin) and listing all needed resources in it's configuration.
1. **Configuring the development webserver**: this is done by the property object returned in the function `getDevServer()`

## Javascript libraries
This section is about Javascript libraries that are used within the AsTeRICS Grid project. They can be found in two locations:

1. As dependency listed within `dependencies` in the [package.json](https://github.com/asterics/AsTeRICS-Grid/blob/master/package.json) configuration file
1. As external library included in the [app/lib/ folder](https://github.com/asterics/AsTeRICS-Grid/tree/master/app/lib)

These are the Javascript libraries that are used:
* **[file-saver](https://www.npmjs.com/package/file-saver)**: library for downloading files within a web-application
* **[lz-string](https://www.npmjs.com/package/lz-string)**: library for string compression, used for imported default dictionaries* 
* **[navigo](https://www.npmjs.com/package/navigo)**: javascript routing library based on URL hash
* **[predictionary](https://www.npmjs.com/package/predictionary)**: javascript word prediction library
* **[vue](https://www.npmjs.com/package/vue)**: javascript single-page application framework
* **[dom-i18n](https://github.com/ruyadorno/dom-i18n)**: easy to use DOM-internationalization library
* **[jQuery](https://jquery.com/)**: library for document traversal and manipulation, needed for jQueryUI
* **[jQueryUI](https://jqueryui.com/)**: library for user interface interactions, needed for jQuery contextMenu and GridList
* **[jQuery contextMenu](https://swisnl.github.io/jQuery-contextMenu/)**: jQuery plugin for right-click context menus, used in AsTeRICS Grid e.g. for edit menu of a grid element
* **[GridList](https://github.com/klues/grid)**: jQueryUI based library for creation of a dynamic, draggable grid
* **[loglevel](https://github.com/pimterry/loglevel)**: javascript logging library
* **[ObjectModel](https://objectmodel.js.org/)**: library for dynamic type checking, see data models in [src/js/model/](https://github.com/asterics/AsTeRICS-Grid/tree/master/src/js/model)
* **[PouchDB](https://pouchdb.com/)**: library for accessing [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) and synchronization with a remote [CouchDB](http://couchdb.apache.org/)
* **[sjcl](https://github.com/bitwiseshiftleft/sjcl)**: crypto library published by Stanford University that is used for encryption of user configuration

<!-- TODO: Tools and libraries related to data storage are covered in detail in:  -->

[&#x2190; Previous Chapter](01_structure.md) [Next Chapter &#x2192;](03_grid.md)

[Back to Overview](README.md)



