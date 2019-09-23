class Test {
    constructor(props) {
        Object.assign(this, props);
    }

    static defaults() {
    }
}

function Model() {
    return Test;
}

Model.Array = function () {
};

export {Model};