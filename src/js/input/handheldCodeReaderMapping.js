import { i18nService } from '../service/i18nService';

/**
 * Match decoded barcode text to a visible grid element by id or translated label.
 * @param {object} gridData render grid (merged global + page)
 * @param {string} rawText decoded payload
 * @returns {string|null} grid element id or null
 */
function resolveHandheldCodePayloadToElementId(gridData, rawText) {
    if (!gridData || !gridData.gridElements || rawText == null) {
        return null;
    }
    let text = String(rawText).trim();
    if (!text) {
        return null;
    }
    for (let el of gridData.gridElements) {
        if (el.hidden) {
            continue;
        }
        if (el.id === text) {
            return el.id;
        }
        let labelTxt = (i18nService.getTranslation(el.label) || '').trim();
        if (labelTxt && labelTxt === text) {
            return el.id;
        }
    }
    return null;
}

export { resolveHandheldCodePayloadToElementId };
