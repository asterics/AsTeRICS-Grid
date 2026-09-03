import { GridElement } from './GridElement.js';

class GridElementMatrixConversation extends GridElement.extend({
    autoSpeak: [Boolean]
}) {
    constructor(props) {
        props = props || {};
        props.type = GridElement.ELEMENT_TYPE_MATRIX_CONVERSATION;
        let defaults = JSON.parse(JSON.stringify(GridElementMatrixConversation.DEFAULTS));
        super(Object.assign(defaults, props));
    }
}

GridElementMatrixConversation.DEFAULTS = {
};

export { GridElementMatrixConversation };