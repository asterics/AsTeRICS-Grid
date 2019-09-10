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

    //internal
    let _selectionListener = null;
    let _elements = null;
    let _currentElement = null;
    let _treeItems = null;
    let _currentInput = '';
    let _inputEventHandler = inputEventHandler.instance();
    let _alphabet = '';

    thiz.start = function () {
        _inputEventHandler.startListening();
    };

    thiz.stop = function () {
       inputEventHandler.stopListening();
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
        if(selectedElement[0] || possibleElements.length === 0) {
            _currentInput = '';
        }
    };

    thiz.getCurrentInput = function () {
        return _currentInput;
    };

    function init() {
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
        tree.assignCodeWords(_alphabet, function(item, codeWord) {
            item.codeWord = codeWord;
            item.element = document.getElementById(item.name);
            $(item.element).find('.text-container').append(`<div  style="font-size:10px; display:block;">${item.codeWord}</div>`);
        });
    }

    function parseOptions(options) {
        if (options) {
            if ($.isFunction(options.selectionListener)) {
                _selectionListener = options.selectionListener;
            }
            wrapAround = options.wrapAround !== undefined ? options.wrapAround : false;

            options.inputEvents = options.inputEvents || [];
            options.inputEvents.forEach((el, index) => {
                _alphabet += (index+1);
                _inputEventHandler.onInputEvent(el, () => {
                    thiz.input(index+1);
                });
            });
        }
    }

    function setActiveElement(element) {
        _currentElement = element || _currentElement;
        _elements.removeClass(scanActiveClass);
        $(_currentElement).addClass(scanActiveClass);
    }
    init();
}

export {HuffmanInput};