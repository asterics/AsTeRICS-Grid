var templates = {};
var lastId = 1;

templates.getGridBase = function (gridId) {
    return `<ul id="${gridId}" class="grid">
                <li class="position-highlight" style="display: none;">
                    <div class="grid-item-content-placeholder"></div>
                </li>
            </ul>`;
};


templates.getGridItem = function (label, width, height, posX, posY, id) {
    width = width || 1;
    height = height || 1;
    posX = posX || 0;
    posY = posY || 0;
    id = id || lastId++;
    var src = Math.random() < 0.5 ? "http://oxydy.com/wp-content/uploads/2018/02/test-img.png" : "http://www.wrench.at/img/CalendarMenu3/icon/appicon128x128@2x.png";

    var template = `
<li class="item" data-w="${width}" data-h="${height}" data-x="${posX}" data-y="${posY}" data-id="${id}" data-label="${label}">
    <div class="grid-item-content" id="${id}" data-id="${id}">
        <div class="img-container" style="background-color: #777620; background:url(${src}) center no-repeat; background-size: contain;"/>
        <div class="text-container"><span>${label}</span></div>
    </div>
</li>`;
    return template;
};

export {templates};