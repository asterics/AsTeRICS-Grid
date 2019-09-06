import Huffman from 'n-ary-huffman'
import $ from 'jquery';

/**
 * implements an input method for buttons/switches where the selected element can be changed in each direction
 * (left, right, up, down) and selected using buttons (keyboard input)
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
    let keyCodeLeft = 37; //Arrow left
    let keyCodeRight = 39; //Arrow right
    let keyCodeUp = 38; //Arrow up
    let keyCodeDown = 40; //Arrow down
    let keyCodeSelect = 32; //Space
    let wrapAround = true;

    //internal
    let _selectionListener = null;
    let _elements = null;
    let _currentElement = null;
    let _treeItems = null;
    let _currentInput = '';

    thiz.start = function () {
        _elements = $(itemSelector);
        if (_elements.length === 0) {
            return;
        }
        let ids = _elements.toArray().map(e => e.id);
        let alphabet = "1234";
        _treeItems = ids.map(function (name, index) {
            return {
                name: name,
                weight: 10000 - index,
                codeWord: null
            }
        });

        let tree = Huffman.createTree(_treeItems, alphabet.length);
        tree.assignCodeWords(alphabet, function(item, codeWord) {
            item.codeWord = codeWord;
            item.element = document.getElementById(item.name);
            $(item.element).find('.text-container').append(`<div style="font-size:10px; display:block;">${item.codeWord}</div>`);
        });

        console.log(_treeItems);
        document.addEventListener('keydown', keyHandler);
    };

    thiz.stop = function () {
        document.removeEventListener('keydown', keyHandler);
    };

    thiz.input = function (id) {
        id = id + '';
        if (id.length !== 1) {
            return;
        }
        _currentInput += id;
        log.warn('currentInput: ' + _currentInput);
        let selectedElement = _treeItems.filter(el => el.codeWord === _currentInput);
        let possibleElements = _treeItems.filter(el => el.codeWord.indexOf(_currentInput) === 0);
        if (selectedElement[0]) {
            log.warn('selected: ' + selectedElement[0]);
            setActiveElement(selectedElement[0].element);
            if (_selectionListener) {
                _selectionListener(selectedElement[0].element);
            }
        }
        if(selectedElement[0] || possibleElements.length === 0) {
            log.warn('reset!');
            _currentInput = '';
        }
    };

    thiz.getCurrentInput = function () {
        return _currentInput;
    };

    function init() {
        parseOptions(options);
    }

    function parseOptions(options) {
        if (options) {
            if ($.isFunction(options.selectionListener)) {
                _selectionListener = options.selectionListener;
            }
            wrapAround = options.wrapAround !== undefined ? options.wrapAround : false;
        }
    }

    function setActiveElement(element) {
        _currentElement = element || _currentElement;
        _elements.removeClass(scanActiveClass);
        $(_currentElement).addClass(scanActiveClass);
    }

    function keyHandler(event) {
        let keycode = event.which || event.keyCode;
        switch (keycode) {
            case keyCodeLeft:
                event.preventDefault();
                thiz.input('1');
                break;
            case keyCodeRight:
                event.preventDefault();
                thiz.input('3');
                break;
            case keyCodeUp:
                thiz.input('4');
                event.preventDefault();
                break;
            case keyCodeDown:
                event.preventDefault();
                thiz.input('2');
                break;
        }
    }
    init();
}

export {HuffmanInput};