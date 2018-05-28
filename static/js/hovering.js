function Hover(itemSelector, hoverActiveClass) {
    var thiz = this;
    var _itemSelector = itemSelector;
    var _hoverActiveClass = hoverActiveClass;
    var _hoverTimeoutMs = 1000;
    var _selectionListener = null;
    var _isHovering = false;
    var _hoverMap = {};

    thiz.startHovering = function() {
        L.selectAsList(_itemSelector).forEach(function (item) {
            item.addEventListener('mouseenter', function (event) {
                L.addClass(this, 'mouseentered');
                _hoverMap[item] = setTimeout(function () {
                    if(_selectionListener) {
                        _selectionListener(event.target);
                    }
                }, _hoverTimeoutMs);
            });
            item.addEventListener('mouseleave', function (event) {
                L.removeClass(this, 'mouseentered');
                clearTimeout(_hoverMap[event.target]);
            });
        });
    };

    thiz.stopHovering = function() {
        //TODO
    };

    thiz.setHoverTimeout = function(timeoutMs) {
        _hoverTimeoutMs = timeoutMs;
    };

    thiz.setSelectionListener = function (fn) {
        _selectionListener = fn;
    };
}


export {Hover};