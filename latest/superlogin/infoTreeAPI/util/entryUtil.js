// copied from https://github.com/wbt-vienna/accessibility-info-tree/tree/master/src/js/util

let tagUtil = require('./tagUtil.js');
let entryUtil = {};

/**
 * returns a list of similar entries
 * @param checkEntry the entry to find similar entries for
 * @param entries list of all entries
 * @param maxCount (optional) maximum number of similar entries to return (default: 5)
 * @param threshold (optional) similarity index [0..1] that determines how similar two entries have to be in order to be
 *                             considered as similar
 * @return {*[]}
 */
entryUtil.getSimilar = function (checkEntry, entries, maxCount, threshold) {
    maxCount = maxCount || 5;
    threshold = threshold === undefined ? 0.5 : threshold;
    threshold = threshold >= 0 && threshold <= 1 ? threshold : 0.5;
    entries = entries.filter(entry => entry.id !== checkEntry.id);
    let similarEntries = [];
    let ratios = [];
    let matcher = new difflib.SequenceMatcher();
    let currentHeader = checkEntry.header;
    entries.forEach(entry => {
        let selected = false;
        let validHeader = entry.header && currentHeader && currentHeader.length > 2;
        if (validHeader && entry.header.toLocaleLowerCase().indexOf(checkEntry.header.toLowerCase()) !== -1) {
            selected = true;
            ratios.push({
                entry: entry,
                ratio: 1.1
            });
        }
        if (!selected && entry.link && checkEntry.link) {
            try {
                let hostnameExisting = new URL(entry.link).hostname;
                let hostnameNew = new URL(checkEntry.link).hostname;
                if (hostnameExisting === hostnameNew) {
                    selected = true;
                    ratios.push({
                        entry: entry,
                        ratio: 1
                    });
                }
            } catch (e) {
            }
        }
        if (!selected && validHeader && threshold > 0 && threshold !== 1) {
            matcher.set_seqs(entry.header, checkEntry.header);
            let ratio = matcher.ratio();
            ratios.push({
                entry: entry,
                ratio: ratio
            });
        }
    });
    ratios = ratios.filter(ratio => ratio.ratio >= threshold);
    ratios.sort((a,b) => {
        return b.ratio - a.ratio;
    });
    let ratioEntries = ratios.map(ratioEntry => ratioEntry.entry);
    similarEntries = similarEntries.concat(ratioEntries).slice(0, maxCount);
    return similarEntries;
};

entryUtil.getPossibleDuplicates = function (entries, threshold) {
    threshold = threshold || 1;
    entries = JSON.parse(JSON.stringify(entries));
    let possibleDuplicates = [];
    let duplicateIds = [];
    let color = 'lightgray';
    entries.forEach(entry => {
        if (duplicateIds.indexOf(entry.id) === -1) {
            let duplicates = entryUtil.getSimilar(entry, entries, 5, threshold);
            if (duplicates.length > 0) {
                color = color === 'lightgray' ? 'lightblue' : 'lightgray';
                setColor(entry, color);
                setColor(duplicates, color);
                possibleDuplicates.push(entry);
                possibleDuplicates = possibleDuplicates.concat(duplicates);
                duplicateIds = possibleDuplicates.map(d => d.id);
                entries = entries.filter(e => duplicateIds.indexOf(e.id) === -1 && e.id !== entry.id);
            }
        }
    });
    return possibleDuplicates;
};

/**
 * sorts one or more entries according to the order of "mandatory" tags
 * @param entryOrEntries a single entry or a list of entries
 * @param allTags a list of all tags
 * @return {*[]} a single entry or list of entries where the tags of each entry are sorted
 */
entryUtil.sortTags = function(entryOrEntries, allTags) {
    let isSingle = !(entryOrEntries instanceof Array);
    entryOrEntries = isSingle ? [entryOrEntries] : entryOrEntries;
    let mandatoryTags = tagUtil.getTagsWithProperty('mandatory', allTags);
    let tagIndexMap = {};
    mandatoryTags.forEach((mandatoryTag, index) => {
        let allChildrenAndSelf = tagUtil.getAllChildIds(mandatoryTag, allTags).concat([mandatoryTag.id]);
        allChildrenAndSelf.forEach(tagId => {
            tagIndexMap[tagId] = index;
        })
    });
    entryOrEntries.forEach(entry => {
        entry.tags.sort((a, b) => {
            let indexA = tagIndexMap[a] || 100;
            let indexB = tagIndexMap[b] || 100;
            return indexB - indexA;
        });
    });
    return isSingle ? entryOrEntries[0] : entryOrEntries;
};

entryUtil.isValid = function (entry, tags) {
    let valid = entry && entry.header && entry.short && entry.updatedBy && (!entry.link || entry.link.indexOf('http') === 0);
    if (!valid) {
        return false;
    }
    let mandatoryTags = tagUtil.getTagsWithProperty('mandatory', tags);
    mandatoryTags.forEach((mandatoryTag, index) => {
        let childrenIds = tagUtil.getAllChildIds(mandatoryTag, tags);
        valid = valid && entry.tags.reduce((total, currentId) => {
            return childrenIds.indexOf(currentId) !== -1 || total;
        }, false);
    });
    return valid;
};

entryUtil.filterByText = function (entries, searchText, tags) {
    if (!entries || entries.length === 0) {
        return [];
    }
    if (!searchText) {
        return entries;
    }
    return entries.filter(entry => {
        let inHeader = entry.header.toLocaleLowerCase().indexOf(searchText.toLocaleLowerCase()) !== -1;
        let inLink = entry.link.toLocaleLowerCase().indexOf(searchText.toLocaleLowerCase()) !== -1;
        let inShort = entry.short ? entry.short.toLocaleLowerCase().indexOf(searchText.toLocaleLowerCase()) !== -1 : false;
        let inTags = entry.tags.reduce((total, currentTagId) => {
            let tagLabel = tagUtil.getLabel(currentTagId, tags);
            return total || tagLabel.toLocaleLowerCase().indexOf(searchText.toLocaleLowerCase()) !== -1;
        }, false);
        return inHeader || inTags || inLink || inShort;
    });
};

entryUtil.filterByTags = function (entries, searchTags, joinMode, tags) {
    if (!entries || entries.length === 0 || !joinMode) {
        return [];
    }
    if (!searchTags || searchTags.length === 0) {
        return entries;
    }
    let totalSearchTags = searchTags.reduce((total, currentId) => {
        return [...new Set(total.concat(tagUtil.getAllChildIds(currentId, tags)))];
    }, searchTags);
    return entries.filter(entry => {
        if (joinMode === 'OR') {
            return totalSearchTags.reduce((total, currentId) => {
                return total || entry.tags.indexOf(currentId) !== -1;
            }, false);
        } else if (joinMode === 'AND') {
            return searchTags.reduce((total, currentId) => {
                let possibleTags = tagUtil.getAllChildIds(currentId, tags).concat([currentId]);
                let hasAny = possibleTags.reduce((totalAny, possibleTag) => {
                    return totalAny || entry.tags.indexOf(possibleTag) !== -1;
                }, false);
                return total && hasAny;
            }, true);
        } else if (joinMode === 'NOT') {
            return totalSearchTags.reduce((total, currentId) => {
                return total && entry.tags.indexOf(currentId) === -1;
            }, true);
        }
    });
};

function setColor(entryOrEntries, color) {
    entryOrEntries = entryOrEntries instanceof Array ? entryOrEntries : [entryOrEntries];
    entryOrEntries.forEach(entry => {
        entry.color = color;
    });
}

module.exports = entryUtil;