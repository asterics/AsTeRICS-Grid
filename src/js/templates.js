import {fontUtil} from "./util/fontUtil";
import {GridElement} from "./model/GridElement";
import {GridActionNavigate} from "./model/GridActionNavigate";
import {i18nService} from "./service/i18nService";

var templates = {};

templates.getGridBase = function (gridId) {
    return `<ul id="${gridId}" class="grid">
                <li class="position-highlight" style="display: none;">
                    <div class="grid-item-content-placeholder"></div>
                </li>
            </ul>`;
};


templates.getGridItem = function (gridElem, locale) {
    switch (gridElem.type) {
        case GridElement.ELEMENT_TYPE_COLLECT: {
            return getGridElementCollect(gridElem);
        }
        case GridElement.ELEMENT_TYPE_PREDICTION: {
            return getGridElementPredict(gridElem);
        }
        case GridElement.ELEMENT_TYPE_YT_PLAYER: {
            return getGridElementYTPlayer(gridElem);
        }
        default: {
            return getGridElementNormal(gridElem, locale);
        }
    }
};

function getGridElementNormal(gridElem, fallbackLocale) {
    gridElem = fillDefaultValues(gridElem);
    var imgData = '';
    var imgId = '';
    var txtContainerStyle = 'font-size:' + fontUtil.getLastFontSize() + ';';
    var imgContainerMargin = '1%';
    let label = i18nService.getTranslation(gridElem.label, fallbackLocale);
    var imgContainerMaxHeight = label ? '80%' : '100%';
    let gridItemContentStyle = gridElem.backgroundColor ? `background: ${gridElem.backgroundColor};` : '';
    if (gridElem.image) {
        imgData = gridElem.image.data;
        imgId = gridElem.image.id;
    } else {
        txtContainerStyle += 'flex: 1 1 auto;';
        imgContainerMargin = '0'
    }

    var template = `
<li class="item" data-w="${gridElem.width}" data-h="${gridElem.height}" data-x="${gridElem.posX}" data-y="${gridElem.posY}" data-id="${gridElem.id}" data-label="${label}" data-img-id="${imgId}" data-type="${gridElem.type}">
    <div class="grid-item-content" tabindex="40" id="${gridElem.id}" data-id="${gridElem.id}" data-empty="${!label && !imgData}" style="${gridItemContentStyle}">
        <div class="img-container" style="background: center no-repeat; background-size: contain; background-image: url('${imgData}'); margin: ${imgContainerMargin}; max-height: ${imgContainerMaxHeight};"/>
        <div class="text-container" style="${txtContainerStyle}"><span>${label}</span></div>
        ${getHintsElement(gridElem)}
    </div>
</li>`;
    return template;
}

function getGridElementCollect(gridElem) {
    gridElem = fillDefaultValues(gridElem);
    let label = i18nService.getTranslation(gridElem.label);

    var template = `
<li class="item" data-w="${gridElem.width}" data-h="${gridElem.height}" data-x="${gridElem.posX}" data-y="${gridElem.posY}" data-id="${gridElem.id}" data-label="${label}" data-type="${gridElem.type}">
    <div class="grid-item-content" tabindex="40" id="${gridElem.id}" data-id="${gridElem.id}">
        <div class="text-container" style="position: absolute; top: 0; bottom: 0; left: 0; right: 0; padding: 1% 1% 1% 1%; text-align: left;">
            <div style="vertical-align: middle; background-color: white; padding-left: 0.3em; width: 99%; height: 100%">
                <span class="collect-text"></span>
            </div>
        </div>
    </div>
</li>`;
    return template;
}

function getGridElementPredict(gridElem) {
    gridElem = fillDefaultValues(gridElem);
    let txtContainerStyle = 'display: table; height: 100%; text-align: center; width: 100%';
    let label = i18nService.getTranslation(gridElem.label);

    let template = `
<li class="item" data-w="${gridElem.width}" data-h="${gridElem.height}" data-x="${gridElem.posX}" data-y="${gridElem.posY}" data-id="${gridElem.id}" data-label="${label}" data-type="${gridElem.type}">
    <div class="grid-item-content" tabindex="40" id="${gridElem.id}" data-id="${gridElem.id}" style="background-color: rgb(255,228,178)">
        <div class="text-container" style="${txtContainerStyle}"><span style="display: table-cell; vertical-align: middle;">${label}</span></div>
    </div>
</li>`;
    return template;
}

function getGridElementYTPlayer(gridElem) {
    gridElem = fillDefaultValues(gridElem);
    let label = i18nService.getTranslation(gridElem.label);

    var template = `
<li class="item" data-w="${gridElem.width}" data-h="${gridElem.height}" data-x="${gridElem.posX}" data-y="${gridElem.posY}" data-id="${gridElem.id}" data-label="${label}" data-type="${gridElem.type}">
    <div class="grid-item-content" tabindex="40" id="${gridElem.id}" data-id="${gridElem.id}">
        <div class="yt-container" style="position: absolute; top: 0; bottom: 0; left: 0; right: 0;">
            <div id="player" style="outline: 1px solid; outline-offset: -5px; height: 100%; background-color: black; display: flex; align-items: center; justify-content: center;">
                <i class="fab fa-youtube fa-5x" style="color: whitesmoke"></i>
            </div>
        </div>
    </div>
</li>`;
    return template;
}

function fillDefaultValues(gridElem) {
    gridElem = JSON.parse(JSON.stringify(gridElem));
    gridElem.width = gridElem.width || 1;
    gridElem.height = gridElem.height || 1;
    gridElem.posX = gridElem.x || 0;
    gridElem.posY = gridElem.y || 0;
    gridElem.label = gridElem.label || "";

    return gridElem;
}

function getHintsElement(gridElem) {
    let hiddenHint = gridElem.hidden ? '<i class="fas fa-eye-slash element-hint"></i>' : '';
    let navHint = gridElem.actions.filter(a => a.modelName === GridActionNavigate.getModelName()).length > 0 ? '<i class="fas fa-sticky-note fa-rotate-180 fa-flip-vertical element-hint"></i>' : '';
    return `<span style="position: absolute; right: 0; color: #5a717a">${hiddenHint + ' ' + navHint}</span>`;
}

export {templates};