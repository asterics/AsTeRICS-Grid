import {fontUtil} from "./util/fontUtil";
import {GridElement} from "./model/GridElement";

var templates = {};

templates.getGridBase = function (gridId) {
    return `<ul id="${gridId}" class="grid">
                <li class="position-highlight" style="display: none;">
                    <div class="grid-item-content-placeholder"></div>
                </li>
            </ul>`;
};


templates.getGridItem = function (gridElem) {
    switch(gridElem.type) {
        case GridElement.ELEMENT_TYPE_COLLECT: {
            return getGridElementCollect(gridElem);
        }
        default: {
            return getGridElementNormal(gridElem);
        }
    }
};

function getGridElementNormal(gridElem) {
    var width = gridElem.width || 1;
    var height = gridElem.height || 1;
    var posX = gridElem.x || 0;
    var posY = gridElem.y || 0;
    var id = gridElem.id;
    var label = gridElem.label || "";
    var imgData = '';
    var imgId = '';
    var txtContainerStyle = 'font-size:' + fontUtil.getLastFontSize() + ';';
    var imgContainerMargin = '1%';
    var imgContainerMaxHeight = label ? '80%' : '100%';
    if(gridElem.image) {
        imgData = gridElem.image.data;
        imgId = gridElem.image.id;
    } else {
        txtContainerStyle += 'flex: 1 1 auto;';
        imgContainerMargin = '0'
    }

    var template = `
<li class="item" data-w="${width}" data-h="${height}" data-x="${posX}" data-y="${posY}" data-id="${id}" data-label="${label}" data-img-id="${imgId}" data-type"="${gridElem.type}">
    <div class="grid-item-content" id="${id}" data-id="${id}">
        <div class="img-container" style="background: center no-repeat; background-size: contain; background-image: url('${imgData}'); margin: ${imgContainerMargin}; max-height: ${imgContainerMaxHeight};"/>
        <div class="text-container" style="${txtContainerStyle}"><span>${label}</span></div>
    </div>
</li>`;
    return template;
}

function getGridElementCollect(gridElem) {
    var width = gridElem.width || 1;
    var height = gridElem.height || 1;
    var posX = gridElem.x || 0;
    var posY = gridElem.y || 0;
    var id = gridElem.id;
    var label = gridElem.label || "";
    var style = 'height: 100%;resize: none;margin: 20px; font-size:' + fontUtil.getLastFontSize() + ';';

    var template = `
<li class="item" data-w="${width}" data-h="${height}" data-x="${posX}" data-y="${posY}" data-id="${id}" data-label="${label}" data-type"="${gridElem.type}">
    <div class="grid-item-content" id="${id}" data-id="${id}">
        <textarea disabled style="${style}"></textarea>
    </div>
</li>`;
    return template;
}

export {templates};