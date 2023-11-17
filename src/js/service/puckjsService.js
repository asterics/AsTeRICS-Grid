import { util } from '../util/util';

let puckjsService = {};

puckjsService.doAction = function (action) {

    import(/* webpackPrefetch: 0 */ '/app/lib/puck.js').then((
    ) => {
        let cmdString = `${action.puckjsCmd}\n`;
        log.debug(cmdString);

        Puck.write(cmdString);
    });
};


export { puckjsService };
