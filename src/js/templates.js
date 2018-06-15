var templates = {};
var lastId = 1;

templates.getGridBase = function (gridId) {
    return `<ul id="${gridId}" class="grid">
                <li class="position-highlight" style="display: none;">
                    <div class="grid-item-content"></div>
                </li>
            </ul>`;
};


templates.getGridItem = function (label, width, height, posX, posY, id) {
    width = width || 1;
    height = height || 1;
    posX = posX || 0;
    posY = posY || 0;
    id = id || lastId++;

    var template = `
<li class="item" data-w="${width}" data-h="${height}" data-x="${posX}" data-y="${posY}" data-id="${id}" data-label="${label}">
    <div class="grid-item-content" id="${id}" data-id="${id}">
        ${label}
    </div>
</li>`;
    return template;
};

export {templates};