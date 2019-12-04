import Huffman from 'n-ary-huffman'
import $ from 'jquery';
import {inputEventHandler} from "./inputEventHandler";

let HuffmanInput = {};

HuffmanInput.getInstanceFromConfig = function (inputConfig, itemSelector, scanActiveClass, scanInactiveClass, selectionListener) {
    return new HuffmanInputConstructor(itemSelector, scanActiveClass, scanInactiveClass, {
        printCodes: inputConfig.huffShowNumbers,
        printColors: inputConfig.huffShowColors,
        colorWholeElement: inputConfig.huffColorWholeElement,
        colors: inputConfig.huffColors,
        inputEvents: inputConfig.huffInputs,
        elementCount: inputConfig.huffElementCount,
        timeout: inputConfig.huffTimeout,
        markInactive: inputConfig.huffMarkInactive,
        selectionListener: selectionListener
    });
};

/**
 * implements an input method where elements are matched to an unique code sequence. typing this code using an input
 * method directly selects the element. The codes are generated using an n-ary huffman encoding algorithm.
 *
 * @param paramItemSelector selector for retrieving the selectable elements
 * @param paramScanActiveClass class to add to currently selected element (focus)
 * @param options
 * @constructor
 */
function HuffmanInputConstructor(paramItemSelector, paramScanActiveClass, paramScanInactiveClass, options) {
    let thiz = this;

    //options
    let itemSelector = paramItemSelector;
    let scanActiveClass = paramScanActiveClass;
    let scanIncativeClass = paramScanInactiveClass;
    let printCodes = false;
    let printColors = true;
    let colorWholeElement = false;
    let elementCount = 0;
    let timeout = 1000;
    let markInactive = true;
    let colors = [];

    //internal
    let _selectionListener = null;
    let _elements = null;
    let _currentElement = null;
    let _treeItems = null;
    let _currentInput = '';
    let _inputEventHandler = null;
    let _alphabet = '';
    let _started = false;
    let _timeoutHandler = null;

    thiz.start = function () {
        _started = true;
        if (colorWholeElement) {
            $(_elements).addClass('noanimation');
        }
        _inputEventHandler.startListening();
    };

    thiz.stop = function () {
        _started = false;
        $(_elements).find('.huffman-code-visualization').remove();
        if (colorWholeElement) {
            $(_elements).removeClass('noanimation');
            $(_elements).css('background', '');
        }
        _inputEventHandler.stopListening();
    };

    thiz.destroy = function () {
        thiz.stop();
        _inputEventHandler.destroy();
    };

    thiz.reinit = function() {
        if (!_started) {
            return;
        }
        thiz.stop();
        init();
        thiz.start();
    };

    thiz.input = function (id) {
        id = id + '';
        clearTimeout(_timeoutHandler);
        if (id.length !== 1) {
            return;
        }
        _currentInput += id;
        colorElements();
        let selectedElement = _treeItems.filter(el => el.codeWord === _currentInput).map(el => el.element);
        let possibleElements = _treeItems.filter(el => el.codeWord.indexOf(_currentInput) === 0).map(el => el.element);
        _elements.removeClass(scanActiveClass);
        if (selectedElement[0]) {
            setActiveElement(selectedElement[0]);
            setPossibleElements(_elements.toArray());
            if (_selectionListener) {
                _selectionListener(selectedElement[0]);
            }
        } else if (markInactive) {
            setPossibleElements(possibleElements);
        }
        if (selectedElement[0] || possibleElements.length === 0) {
            setPossibleElements(_elements.toArray());
            _currentInput = '';
            colorElements();
        }
        if (timeout > 0) {
            _timeoutHandler = setTimeout(() => {
                setPossibleElements(_elements.toArray());
                _currentInput = '';
                colorElements();
            }, timeout);
        }
    };

    thiz.getCurrentInput = function () {
        return _currentInput;
    };

    function init() {
        _inputEventHandler = inputEventHandler.instance();
        _alphabet = '';
        parseOptions(options);
        _elements = $(itemSelector);
        if (_elements.length === 0) {
            return;
        }
        let ids = _elements.toArray().map(e => e.id);
        if (ids.length < elementCount) { // fill up to number defined by elementCount
            let missing = elementCount - ids.length;
            for (let i = 0; i < missing; i++) {
                ids.push(null);
            }
        }
        _treeItems = ids.map(function (name, index) {
            return {
                name: name,
                weight: 10000 - index,
                codeWord: null
            }
        });

        let tree = Huffman.createTree(_treeItems, _alphabet.length);
        let longestCodeLength = 0;
        tree.assignCodeWords(_alphabet, function(item, codeWord) {
            longestCodeLength = codeWord.length > longestCodeLength ? codeWord.length : longestCodeLength;
        });
        tree.assignCodeWords(_alphabet, function (item, codeWord) {
            if (!item.name) {
                return;
            }
            item.codeWord = codeWord;
            item.element = document.getElementById(item.name);
            if (printColors || printCodes) {
                let spans = '';
                item.codeWord.split('').forEach(c => {
                    let color = printColors ? getColor(c) : '';
                    let textColor = getHighContrastTextColor(color);
                    let width = ((100 - 5 * longestCodeLength) / longestCodeLength) + '%';
                    let char = printCodes ? c : '&nbsp;';
                    spans += `<span style="background-color: ${color}; color: ${textColor}; width: ${width}; display: inline-block; margin: 0 1%; border-radius: 5px; border: 1px solid whitesmoke;">${char}</span>`;
                });
                let fontSize = printCodes ? '10px' : '3px';
                let elementWidth = $(item.element).width() + 'px';
                $(item.element).append(`<div class="huffman-code-visualization" style="font-size:${fontSize}; display:block; position: absolute; bottom: 0; width: ${elementWidth}">${spans}</div>`);
            }
        });
        _treeItems = _treeItems.filter(item => item.name);
        colorElements();
    }

    function parseOptions(options) {
        if (!options || !options.inputEvents || !options.inputEvents.length || options.inputEvents.length < 2) {
            log.warn('huffman input: invalid options');
            return;
        }
        if ($.isFunction(options.selectionListener)) {
            _selectionListener = options.selectionListener;
        }
        printCodes = options.printCodes !== undefined ? options.printCodes : false;
        printColors = options.printColors !== undefined ? options.printColors : true;
        colorWholeElement = options.colorWholeElement !== undefined ? options.colorWholeElement : false;
        markInactive = options.markInactive !== undefined ? options.markInactive : true;
        colors = options.colors || colors;
        elementCount = options.elementCount || 0;
        timeout = options.timeout || 1000;
        options.inputEvents.forEach((el, index) => {
            _alphabet += (index + 1);
            _inputEventHandler.onInputEvent(el, () => {
                thiz.input(index + 1);
            });
        });
    }

    function colorElements() {
        if (colorWholeElement) {
            _treeItems.forEach(item => {
                if (item.codeWord.indexOf(_currentInput) === 0) {
                    let nextDigit = item.codeWord.substring(_currentInput.length)[0];
                    item.element.style.background = getColor(nextDigit);
                }
            })
        }
    }

    function setActiveElement(element) {
        _currentElement = element || _currentElement;
        _elements.removeClass(scanActiveClass);
        $(_currentElement).addClass(scanActiveClass);
    }

    function setPossibleElements(elements) {
        _elements.removeClass(scanIncativeClass);
        let possibleIds = elements.map(e => e.id);
        let impossibleElements = _elements.toArray().filter(e => possibleIds.indexOf(e.id) === -1);
        $(impossibleElements).addClass(scanIncativeClass);
    }

    function getColor(digitString) {
        let index = parseInt(digitString) - 1;
        return colors[index];
    }

    function getHighContrastTextColor(hexBackground) {
        if (!hexBackground) {
            return '';
        }
        let rgb = hexToRgb(hexBackground);
        let val = rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114;
        if (val > 149) {
            return '#000000';
        } else {
            return '#ffffff'
        }
    }

    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    init();
}

export {HuffmanInput};