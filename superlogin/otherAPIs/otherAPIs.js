let express = require('express');
let router = express.Router();
let tagUtil = require('./util/tagUtil.js');
let entryUtil = require('./util/entryUtil.js');
const nano = require('nano');

let couchDBServer = null;
let db = null;

// copied from https://github.com/wbt-vienna/accessibility-info-tree/blob/master/rest/restApi.mjs
router.get('/tags', function (req, res) {
    getTags(res).then(tags => {
        res.send(tagsToRes(tags));
    })
});

router.get('/tag/:id', function (req, res) {
    getTags(res).then(tags => {
        res.send(tagsToRes(tagUtil.getTag(req.params.id, tags), true));
    })
});

router.get('/tag/:id/children/:maxdepth?', function (req, res) {
    getTags(res).then(tags => {
        res.send(tagsToRes(tagUtil.getAllChildren(req.params.id, tags, req.params.maxdepth)));
    })
});

router.get('/tag/:id/selfandchildren/:maxdepth?', function (req, res) {
    getTags(res).then(tags => {
        let tag = tagUtil.getTag(req.params.id, tags);
        let list = [tag].concat(tagUtil.getAllChildren(req.params.id, tags, req.params.maxdepth));
        res.send(tagsToRes(list));
    })
});

router.get('/tag/:id/parents/:maxdepth?', function (req, res) {
    getTags(res).then(tags => {
        res.send(tagsToRes(tagUtil.getAllParents(req.params.id, tags, req.params.maxdepth)));
    })
});

router.get('/entries', function (req, res) {
    getEntries(res).then(entries => {
        res.send(entries);
    })
});

router.get('/entries/search/:text', function (req, res) {
    getEntries(res).then(entries => {
        getTags(res).then(tags => {
            res.send(entryUtil.filterByText(entries, req.params.text, tags));
        });
    })
});

router.get('/entries/tags/:taglist/:joinmode?', function (req, res) {
    getEntries(res).then(entries => {
        getTags(res).then(tags => {
            let taglist = req.params.taglist.split(';') || [];
            taglist = taglist.filter(tagId => !!tagId);
            let joinmode = req.params.joinmode || 'AND';
            joinmode = ['AND', 'OR', 'NOT'].indexOf(joinmode.toUpperCase()) !== -1 ? joinmode : 'AND';
            res.send(entryUtil.filterByTags(entries, taglist, joinmode, tags));
        });
    })
});

function getTags(response) {
    return new Promise((resolve, reject) => {
        db.get("TAGS_DOCUMENT_ID").then((doc) => {
            resolve(doc.tags.map(tag => {
                delete tag.modelName;
                return tag;
            }));
        }, err => {
            response.status(500).send(err);
        });
    });
}

function getEntries(response) {
    return new Promise((resolve, reject) => {
        let queryOptions = {
            startkey: "Entry",
            endkey: "Entry" + '\uffff',
            include_docs: true
        };
        db.list(queryOptions)
            .then((data) => {
                let entries = data.rows.map((r) => r.doc);
                entries.forEach((entry) => {
                    delete entry.modelName;
                    delete entry._id;
                    delete entry._rev;
                });
                resolve(entries);
            })
            .catch((err) => {
                response.status(500).send(err);
            });
    });
}

function tagsToRes(tags, single) {
    if (!tags || tags.length === 0) {
        return "";
    }
    tags = tags instanceof Array ? tags : [tags];
    tags.forEach(tag => {
        tag.labelDE = tag.label.de;
        tag.labelEN = tag.label.en ? tag.label.en : "";
        delete tag.label;
    });
    if (single) {
        return tags.length > 1 ? tags : tags[0];
    } else {
        return tags;
    }
}

exports.getRouter = (host) => {
    couchDBServer = nano(`https://accessibility-info-tree-user-readonly:plaintext_password@${host}`);
    db = couchDBServer.use('accessibility-info-tree');
    return router;
}