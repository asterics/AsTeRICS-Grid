var templates = {};
var lastId = 1;

templates.getGridBase = function (gridId) {
    return `<ul id="${gridId}" class="grid">
                <li class="position-highlight" style="display: none;">
                    <div class="grid-item-content-placeholder"></div>
                </li>
            </ul>`;
};


templates.getGridItem = function (label, width, height, posX, posY, id, image) {
    width = width || 1;
    height = height || 1;
    posX = posX || 0;
    posY = posY || 0;
    id = id || lastId++;
    label = label || "";
    var imgData = '';
    var imgId = '';
    var txtContainerStyle = '';
    if(image) {
        imgData = image.data;
        imgId = image.id;
    } else {
        txtContainerStyle = 'flex: 1 1 auto;';
    }

    var template = `
<li class="item" data-w="${width}" data-h="${height}" data-x="${posX}" data-y="${posY}" data-id="${id}" data-label="${label}" data-img-id="${imgId}" data-img="${imgData}">
    <div class="grid-item-content" id="${id}" data-id="${id}">
        <div class="img-container" style="background-color: #777620; background: center no-repeat; background-size: contain; background-image: url('${imgData}')"/>
        <div class="text-container" style="${txtContainerStyle}"><span>${label}</span></div>
    </div>
</li>`;
    return template;
};

export {templates};