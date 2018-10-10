//very lightweight replacement for jquery,
//see https://blog.garstasio.com/you-dont-need-jquery/selectors/#multiple-selectors
var L = function (selector) {
    if(selector instanceof Node || selector instanceof NodeList || selector instanceof Array) {
        return selector;
    }
    var selectorType = 'querySelectorAll';

    if (selector.indexOf('#') === 0) {
        selectorType = 'getElementById';
        selector = selector.substr(1, selector.length);
    }

    return document[selectorType](selector);
};

L.toggle = function () {
    var args = Array.prototype.slice.call(arguments);
    args.unshift("block");
    toggleInternal(args);
};

L.toggleInline = function () {
    var args = Array.prototype.slice.call(arguments);
    args.unshift("inline");
    toggleInternal(args);
};

function toggleInternal(args) {
    var displayModeShown = args[0];
    if (!args || args.length < 2) {
        return;
    }
    for (var i = 1; i < args.length; i++) {
        var selector = args[i];
        var elems = L.selectAsList(selector);
        elems.forEach(function (x) {
            if (x.style && x.style.display === "none") {
                x.style.display = displayModeShown;
            } else {
                x.style.display = "none";
            }
        });
    }
}

L.isVisible = function (selector) {
    var x = L(selector);
    return !(x.style && x.style.display === "none");
};

L.setVisible = function (selector, visible, visibleClass) {
    var elems = L.selectAsList(selector);
    elems.forEach(function (x) {
        if(visible == false) {
            x.style.display = "none";
        } else {
            x.style.display = visibleClass ? visibleClass : "block";
        }
    });
};

L.selectAsList = function (selector) {
    var result = L(selector);
    if(result instanceof Array) {
        return L.flattenArrayDeep(result);
    } else if(result instanceof NodeList) {
        return Array.prototype.slice.call(result); //convert NodeList to Array
    }
    return [result];
};

L.addClass = function (selector, className) {
    var list = L.selectAsList(selector);
    list.forEach(function (elem) {
        if(!elem.classList.contains(className)) {
            elem.classList.add(className);
        }
    });
};

L.removeClass = function (selector, className) {
    var list = L.selectAsList(selector);
    list.forEach(function (elem) {
        elem.classList.remove(className);
    });
};

L.removeAddClass = function (selector, className) {
    var list = L.selectAsList(selector);
    L.removeClass(selector, className);
    list.forEach(function (elem) {
        void elem.offsetWidth; //needed to re-trigger css animations
    });
    L.addClass(selector, className);
};

L.toggleClass = function (selector, className) {
    var list = L.selectAsList(selector);
    list.forEach(function (elem) {
        if(elem.classList.contains(className)) {
            elem.classList.remove(className);
        } else {
            elem.classList.add(className);
        }
    });
};

L.setSelected = function (selector, selected) {
    if(selected == undefined) selected = true;
    var list = L.selectAsList(selector);
    list.forEach(function (elem) {
        if(selected) {
            L.addClass(elem, 'selected');
        } else {
            L.removeClass(elem, 'selected');
        }
        elem.setAttribute('aria-selected', selected);
    });
};

L.setValue = function (selector, value) {
    var list = L.selectAsList(selector);
    list.forEach(function (elem) {
        if(elem.value) {
            elem.value = value;
        }
    });
};

L.hasFocus = function(selector) {
    return L(selector) == document.activeElement;
};

L.val2key = function (val, array) {
    for (var key in array) {
        if (array[key] == val) {
            return key;
        }
    }
    return false;
};

L.isFunction = function (functionToCheck) {
    var getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
};

L.getIDSelector = function (id) {
    return '#' + id;
};

L.getPercentage = function (value, minRange, maxRange) {
    return (Math.round(((value - minRange) / (maxRange - minRange) * 100) * 1000) / 1000)
};

L.getMs = function () {
    return new Date().getTime();
};

L.deepCopy = function (object) {
    return JSON.parse(JSON.stringify(object));
};

L.removeAllChildren = function (selector) {
    var elm = L(selector);
    elm = elm instanceof NodeList ? elm : [elm];
    elm.forEach(function (elem) {
        while (elem.firstChild) {
            elem.removeChild(elem.firstChild);
        }
    });
};

L.createElement = function (tagName, className, inner) {
    var e = document.createElement(tagName);
    e.className = className;
    if (inner) {
        inner = inner instanceof Array ? inner : [inner];
        inner.forEach(function (innerElem) {
            if (typeof innerElem === 'string') {
                e.innerHTML += innerElem;
            } else {
                e.appendChild(innerElem);
            }
        });
    }

    return e;
};

/**
 * creates a list of <option> elements as innerHTML for an <select> element.
 *
 * @param listValues the list of values for the <option> elements
 * @param listHtml a list of values for the innerHTML of the <option> elements, if a function it is used to translate a
 * value from the listValues, if not specified L.translate() is used to generate the innerHTML of the option elements.
 * @param defaultOption if specified a default option with the given innerHTML (or its translation) and value "-1" is added
 * @return {string}
 */
L.createSelectItems = function (listValues, listHtml, defaultOption) {
    var result = '';
    var hasHtml = listHtml && listHtml.length == listValues.length;
    var hasHtmlFn = L.isFunction(listHtml);

    for (var i = 0; i < listValues.length; i++) {
        var html = hasHtmlFn ? listHtml(listValues[i]) : (hasHtml ? listHtml[i] : L.translate(listValues[i]));
        var elem = L.createElement('option', '', html);
        elem.value = listValues[i];
        result += elem.outerHTML + '\n';
    }

    if (defaultOption) {
        result = '<option value="-1" disabled selected hidden>' + L.translate('SELECT_SPECIAL_KEY') + '</option>\n' + result;
    }
    return result;
};

/**
 * returns true if the current browser language contains the given localeString
 */
L.isLang = function (localeString) {
    var lang = navigator.userLanguage || navigator.language;
    return lang.indexOf(localeString) > -1;
};

L.getLang = function () {
    var lang = navigator.userLanguage || navigator.language;
    return lang.substring(0,2);
};

/**
 * translates an translation key. More arguments can be passed in order to replace placeholders ("{?}") in the translated texts.
 * e.g.
 * var key = 'SAY_HELLO_KEY'
 * translation: 'SAY_HELLO_KEY' -> 'Hello {?} {?}'
 * L.translate(key, 'Tom', 'Mayer') == 'Hello Tom Mayer'
 *
 * @param translationKey the key to translate
 * @return {*}
 */
L.translate = function(translationKey) {
    var translated = i18n[translationKey] ? i18n[translationKey] : translationKey;
    for(var i=1; i<arguments.length; i++) {
        translated = translated.replace('{?}', arguments[i]);
    }
    return translated;
};

L.getLastElement = function(array) {
    return array.slice(-1)[0];
};

L.replaceAll = function(string, search, replace) {
    return string.replace(new RegExp(search, 'g'), replace);
};

L.equalIgnoreCase = function (str1, str2) {
    return str1.toUpperCase() === str2.toUpperCase();
};

L.loadScript = function (source, fallbackSource) {
    console.log("loading script: " + source);
    var script = document.createElement('script');
    return new Promise(function (resolve) {
        script.onload = function () {
            console.log("loaded: " + source);
            resolve(true);
        };
        script.onerror = function () {
            console.log("error loading: " + source);
            if(fallbackSource) {
                L.loadScript(fallbackSource).then(resolve);
            } else {
                resolve(false);
            }
        };
        script.src = source;
        document.head.appendChild(script);
    });
};

L.flattenArray = function (array) {
    return [].concat.apply([], array);
};

L.flattenArrayDeep = function (arr) {
    return arr.reduce((acc, e) => Array.isArray(e) ? acc.concat(L.flattenArrayDeep(e)) : acc.concat(e), []);
};

L.convertToKeyCode = function(character) {
    if(/^[a-zA-Z0-9]$/.test(character)) {
        return character.toUpperCase().charCodeAt(0);
    }
    return null;
};

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
L.getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

window.L = L; //make also global for usage in browser console
export {L};