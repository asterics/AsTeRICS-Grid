var tempates = {};
tempates.getGridItem = function (number, sizeX, sizeY) {
    sizeX = sizeX || 1;
    sizeY = sizeY || 1;

    var template = `
<div id="${'grid-item-' + new Date().getTime()}" class="item size-x-${sizeX} size-y-${sizeY}">
    <div class="item-content">
        <!-- Safe zone, enter your custom markup -->
        <div class="my-custom-content">
            ${number}
        </div>
        <!-- Safe zone ends -->
    </div>
</div>`;
    return template;
};

export {tempates};