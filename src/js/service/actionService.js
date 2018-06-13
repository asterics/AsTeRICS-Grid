var actionService = {
    doAction: function (gridElement) {
        console.log('do action for: ' + JSON.stringify(gridElement));
        if(typeof SpeechSynthesisUtterance !== 'undefined') {
            var msg = new SpeechSynthesisUtterance(gridElement.toJSON().label);
            window.speechSynthesis.speak(msg);
        }
    }
};

export {actionService};