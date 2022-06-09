import {modelUtil} from "../util/modelUtil";
import {Model} from "../externals/objectmodel";
import {imageUtil} from "../util/imageUtil";

class GridImage extends Model({
    data: [String],
    url: [String],
    author: [String],
    authorURL: [String],
    searchProviderName: [String],
    searchProviderOptions: [Array]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridImage);
        super(properties);
    }

    getImageType() {
        if (!this.data) {
            return null;
        }
        let type = this.data.substring('data:image/'.length, this.data.indexOf(';base64'));
        switch (type) {
            case 'png':
                return GridImage.IMAGE_TYPES.PNG;
            case 'jpeg':
                return GridImage.IMAGE_TYPES.JPEG;
            case 'svg':
            case 'svg+xml':
                return GridImage.IMAGE_TYPES.SVG;
            default:
                log.warn('not recognized image type: ' + type);
                return null;
        }
    }

    getDimensions() {
        return imageUtil.getImageDimensionsFromDataUrl(this.data);
    }

    static getModelName() {
        return "GridImage";
    }

    static getIdPrefix() {
        return 'grid-image';
    }
}

GridImage.IMAGE_TYPES = {
    PNG: "PNG",
    JPEG: "JPEG",
    SVG: "SVG"
}

GridImage.defaults({
    data: null,
    author: null,
    authorURL: null
});

export {GridImage};