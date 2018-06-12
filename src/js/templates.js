var tempates = {};
var lastId = 1;
tempates.getGridItem = function (number, sizeX, sizeY) {
    sizeX = sizeX || 1;
    sizeY = sizeY || 1;

    var template = `
<li id="${'grid-item-' + lastId++}" class="item" data-w="${sizeX}" data-h="${sizeY}">
    <div class="grid-item-content">
        ${number}
    </div>
</li>`;
    return template;
};

export {tempates};