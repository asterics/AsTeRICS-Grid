import Huffman from 'n-ary-huffman'
import $ from 'jquery';
import {inputEventHandler} from "./inputEventHandler";

/**
 * implements an input method where elements are matched to an unique code sequence. typing this code using an input
 * method directly selects the element. The codes are generated using an n-ary huffman encoding algorithm.
 *
 * @param paramItemSelector selector for retrieving the selectable elements
 * @param paramScanActiveClass class to add to currently selected element (focus)
 * @param options
 * @constructor
 */
function HuffmanInput(paramItemSelector, paramScanActiveClass, options) {
    let thiz = this;

    //options
    let itemSelector = paramItemSelector;
    let scanActiveClass = paramScanActiveClass;
    let wrapAround = true;
    let printCodes = false;
    let printColors = true;
    let colors = [];

    //internal
    let _selectionListener = null;
    let _elements = null;
    let _currentElement = null;
    let _treeItems = null;
    let _currentInput = '';
    let _inputEventHandler = null;
    let _alphabet = '';
    let _defaultColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00',
        '#00ffff', '#ff00ff', '#ff8000', '#aa00ff', '#016619'];
    let _started = false;

    thiz.start = function () {
        _started = true;
        _inputEventHandler.startListening();
    };

    thiz.stop = function () {
        _started = false;
        $(_elements).find('.huffman-code-visualization').remove();
        _inputEventHandler.stopListening();
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
        if (id.length !== 1) {
            return;
        }
        _currentInput += id;
        let selectedElement = _treeItems.filter(el => el.codeWord === _currentInput);
        let possibleElements = _treeItems.filter(el => el.codeWord.indexOf(_currentInput) === 0);
        if (selectedElement[0]) {
            setActiveElement(selectedElement[0].element);
            if (_selectionListener) {
                _selectionListener(selectedElement[0].element);
            }
        }
        if (selectedElement[0] || possibleElements.length === 0) {
            _currentInput = '';
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
            item.codeWord = codeWord;
            item.element = document.getElementById(item.name);
            if (printColors || printCodes) {
                let spans = '';
                item.codeWord.split('').forEach(c => {
                    let index = parseInt(c) - 1;
                    let color = printColors ? colors[index] || _defaultColors[index] : '';
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
    }

    function parseOptions(options) {
        if (!options || !options.inputEvents || !options.inputEvents.length || options.inputEvents.length < 2) {
            log.warn('huffman input: invalid options');
            return;
        }
        if ($.isFunction(options.selectionListener)) {
            _selectionListener = options.selectionListener;
        }
        wrapAround = options.wrapAround !== undefined ? options.wrapAround : false;
        printCodes = options.printCodes !== undefined ? options.printCodes : false;
        printColors = options.printColors !== undefined ? options.printColors : true;
        colors = options.colors || colors;
        options.inputEvents.forEach((el, index) => {
            _alphabet += (index + 1);
            _inputEventHandler.onInputEvent(el, () => {
                thiz.input(index + 1);
            });
        });
    }

    function setActiveElement(element) {
        _currentElement = element || _currentElement;
        _elements.removeClass(scanActiveClass);
        $(_currentElement).addClass(scanActiveClass);
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