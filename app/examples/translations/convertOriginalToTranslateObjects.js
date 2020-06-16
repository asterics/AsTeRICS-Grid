/**
 * converts all files from folder "original" containing copy&paste from Google Translate to JSON maps "German -> destination language".
 */

var fs = require('fs');
var path = require('path');

/**
 * Promise all
 * @author Loreto Parisi (loretoparisi at gmail dot com)
 */
function promiseAllP(items, block) {
    var promises = [];
    items.forEach(function(item,index) {
        promises.push( function(item,i) {
            return new Promise(function(resolve, reject) {
                return block.apply(this,[item,index,resolve,reject]);
            });
        }(item,index))
    });
    return Promise.all(promises);
} //promiseAll

/**
 * read files
 * @param dirname string
 * @return Promise
 * @author Loreto Parisi (loretoparisi at gmail dot com)
 * @see http://stackoverflow.com/questions/10049557/reading-all-files-in-a-directory-store-them-in-objects-and-send-the-object
 */
function readFiles(dirname) {
    return new Promise((resolve, reject) => {
        fs.readdir(dirname, function(err, filenames) {
            if (err) return reject(err);
            promiseAllP(filenames,
            (filename,index,resolve,reject) =>  {
                fs.readFile(path.resolve(dirname, filename), 'utf-8', function(err, content) {
                    if (err) return reject(err);
                    return resolve({filename: filename, contents: content});
                });
            })
            .then(results => {
                return resolve(results);
            })
            .catch(error => {
                return reject(error);
            });
        });
  });
}

///////////////

readFiles('./original/').then(files => {
    console.log( "loaded ", files.length );
	let original = files.filter(f => f.filename === 'de.txt')[0];
	let originalWords = original.contents.split('\r\n');
	files.forEach(file => {
	    let words = file.contents.split('\r\n');
	    let map = {};
	    originalWords.forEach((word, index) => {
	        map[word] = words[index];
        });
        fs.writeFileSync(file.filename, JSON.stringify(map).replace(/",/g, '",\n'));
    });
}).catch( error => {
    console.log( error );
});