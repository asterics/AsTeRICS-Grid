import {fontUtil} from "./util/fontUtil";
import {GridElement} from "./model/GridElement";
import {GridActionNavigate} from "./model/GridActionNavigate";
import {i18nService} from "./service/i18nService";
import {constants} from "./util/constants.js";
import {localStorageService} from "./service/data/localStorageService.js";
import {GridActionSpeak} from "./model/GridActionSpeak.js";
import {GridActionYoutube} from "./model/GridActionYoutube.js";
import {GridActionCollectElement} from "./model/GridActionCollectElement.js";
import {GridActionChangeLang} from "./model/GridActionChangeLang.js";
import {GridActionPredict} from "./model/GridActionPredict.js";
import {GridActionWebradio} from "./model/GridActionWebradio.js";
import {MetaData} from "./model/MetaData.js";
import {GridActionSpeakCustom} from "./model/GridActionSpeakCustom.js";
import {util} from "./util/util.js";

var templates = {};

templates.getGridBase = function (gridId) {
    return `<ul id="${gridId}" class="grid">
                <li class="position-highlight" style="display: none;">
                    <div class="grid-item-content-placeholder"></div>
                </li>
            </ul>`;
};


templates.getGridItem = function (gridElem, locale, metadata) {
    switch (gridElem.type) {
        case GridElement.ELEMENT_TYPE_COLLECT: {
            return getGridElementCollect(gridElem, metadata);
        }
        case GridElement.ELEMENT_TYPE_PREDICTION: {
            return getGridElementPredict(gridElem, metadata);
        }
        case GridElement.ELEMENT_TYPE_YT_PLAYER: {
            return getGridElementYTPlayer(gridElem, metadata);
        }
        default: {
            return getGridElementNormal(gridElem, locale, metadata);
        }
    }
};

function getGridElementNormal(gridElem, fallbackLocale, metadata) {
    gridElem = fillDefaultValues(gridElem);
    var imgData = '';
    var imgId = '';
    var txtContainerStyle = 'font-size:' + fontUtil.getLastFontSize() + ';';
    var imgContainerMargin = '1%';
    let label = i18nService.getTranslation(gridElem.label, fallbackLocale);
    label = util.convertLowerUppercase(label, metadata.textConfig.convertMode);
    var imgContainerMaxHeight = label ? '80%' : '100%';
    if (gridElem.image && (gridElem.image.data || gridElem.image.url)) {
        imgData = gridElem.image.data || gridElem.image.url;
        imgId = gridElem.image.id;
    } else {
        txtContainerStyle += 'flex: 1 1 auto;';
        imgContainerMargin = '0'
    }
    let backgroundColor = MetaData.getElementColor(gridElem, metadata);
    let fontColor = fontUtil.getHighContrastColor(backgroundColor);
    let ariaLabel = getAriaLabel(gridElem);

    var template = `
<li class="item" data-w="${gridElem.width}" data-h="${gridElem.height}" data-x="${gridElem.posX}" data-y="${gridElem.posY}" data-id="${gridElem.id}" data-label="${label}" data-img-id="${imgId}" data-type="${gridElem.type}">
    <div class="grid-item-content" tabindex="40" aria-label="${ariaLabel}" id="${gridElem.id}" data-id="${gridElem.id}" data-empty="${!label && !imgData}" style="${`background-color: ${backgroundColor}; border: 1px solid ${getBorderColor(metadata)}`}">
        <div class="img-container" style="width: 100%; max-height: ${imgContainerMaxHeight};">
            <img src="${imgData}" style="max-width: 98%; max-height: 98%; object-fit: contain; margin: 1%;" crossorigin="anonymous"/>
        </div>
        <div class="text-container" style="${txtContainerStyle + `color: ${fontColor}`}"><span>${label}</span></div>
        ${getHintsElement(gridElem)}
    </div>
</li>`;
    return template;
}

function getGridElementCollect(gridElem, metadata) {
    gridElem = fillDefaultValues(gridElem);
    let backgroundColor = MetaData.getElementColor(gridElem, metadata);

    var template = `
<li class="item" data-w="${gridElem.width}" data-h="${gridElem.height}" data-x="${gridElem.posX}" data-y="${gridElem.posY}" data-id="${gridElem.id}" data-type="${gridElem.type}">
    <div class="grid-item-content" tabindex="40" id="${gridElem.id}" data-id="${gridElem.id}" style="${`background-color: ${backgroundColor}; border: 1px solid ${getBorderColor(metadata)}`}">
        <div class="collect-outer-container text-container" style="${`position: absolute; display: flex; top: 5px; right: 5px; bottom: 5px; left: 5px;`}">
        </div>
    </div>
</li>`;
    return template;
}

function getGridElementPredict(gridElem, metadata) {
    gridElem = fillDefaultValues(gridElem);
    let txtContainerStyle = 'display: table; height: 100%; text-align: center; width: 100%';
    let label = i18nService.getTranslation(gridElem.label);

    let template = `
<li class="item" data-w="${gridElem.width}" data-h="${gridElem.height}" data-x="${gridElem.posX}" data-y="${gridElem.posY}" data-id="${gridElem.id}" data-label="${label}" data-type="${gridElem.type}">
    <div class="grid-item-content" tabindex="40" id="${gridElem.id}" data-id="${gridElem.id}" style="${`background-color: rgb(255,228,178); border: 1px solid ${getBorderColor(metadata)}`}">
        <div class="text-container" style="${txtContainerStyle}"><span style="display: table-cell; vertical-align: middle;">${label}</span></div>
    </div>
</li>`;
    return template;
}

function getGridElementYTPlayer(gridElem, metadata) {
    gridElem = fillDefaultValues(gridElem);
    let stopClicking = gridElem.additionalProps[GridElement.PROP_YT_PREVENT_CLICK];
    let label = i18nService.getTranslation(gridElem.label);

    var template = `
<li class="item" data-w="${gridElem.width}" data-h="${gridElem.height}" data-x="${gridElem.posX}" data-y="${gridElem.posY}" data-id="${gridElem.id}" data-label="${label}" data-type="${gridElem.type}">
    <div class="grid-item-content" tabindex="40" aria-label="${i18nService.t('ELEMENT_TYPE_YT_PLAYER')}" id="${gridElem.id}" data-id="${gridElem.id}" style="${`border: 1px solid ${getBorderColor(metadata)}`}">
        ${stopClicking ? '<div id="youtubeClickPreventer" onclick="event.stopPropagation()" style="z-index: 100; position: absolute; top: 0; bottom: 0; left: 0; right: 0; height: 100%; width: 100%"></div>' : ''}
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

function getBorderColor(metadata) {
    let backgroundColor = metadata && metadata.colorConfig ? metadata.colorConfig.gridBackgroundColor : '#ffffff';
    return fontUtil.getHighContrastColor(backgroundColor, 'whitesmoke', 'gray');
}

function getAriaLabel(gridElem) {
    let label = i18nService.getTranslation(gridElem.label);
    let ariaLabel = label ? label + ", " : "";
    let singleCharMapping = {
        ":": "colon",
        ".": "period",
        ",": "comma",
        "!": "exclamationMark",
        "?": "questionMark",
        "\"": "quotationMark",
        "-": "hyphen",
        " ": "space"
    };

    if (Object.keys(singleCharMapping).includes(label)) {
        ariaLabel = i18nService.t(singleCharMapping[label]) + ", ";
    }

    let speakCustomAction = gridElem.actions.filter(a => a.modelName === GridActionSpeakCustom.getModelName())[0];
    if (!ariaLabel && speakCustomAction) {
        ariaLabel = i18nService.getTranslation(speakCustomAction.speakText) + ", ";
    }

    let actions = gridElem.actions.filter(a => a.modelName !== GridActionSpeak.getModelName() && a.modelName !== GridActionSpeakCustom.getModelName() && a.modelName !== GridActionPredict.getModelName());
    ariaLabel += actions.reduce((total, action) => {
        switch (action.modelName) {
            case GridActionChangeLang.getModelName():
                total += i18nService.t(GridActionChangeLang.getModelName());
                total += " " + i18nService.t(`lang.${action.language}`);
                total += ", ";
                break;
            case GridActionCollectElement.getModelName():
                total += i18nService.t(action.action);
                total += ", ";
                break;
            case GridActionNavigate.getModelName():
                if (action.toLastGrid) {
                    total += i18nService.t('navigateToLastOpenedGrid');
                } else {
                    total += i18nService.t('navigation');
                }
                total += ", ";
                break;
            case GridActionWebradio.getModelName():
                total += i18nService.t(GridActionWebradio.getModelName());
                total += " " + i18nService.t(action.action);
                total += ", ";
                break;
            case GridActionYoutube.getModelName():
                total += i18nService.t(GridActionYoutube.getModelName());
                total += " " + i18nService.t(action.action);
                total += ", ";
                break;
            default:
                total += i18nService.t(action.modelName);
                total += ", ";
                break;
        }
        return total;
    }, '');
    if (ariaLabel.endsWith(", ")) {
        ariaLabel = ariaLabel.slice(0, -2);
    }
    return ariaLabel;
}

export {templates};