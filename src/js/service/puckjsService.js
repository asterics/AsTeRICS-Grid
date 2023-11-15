import { util } from '../util/util';
import { puckjs } from '/app/lib/puck.js';

let puckjsService = {};

puckjsService.doAction = function (action) {

    let cmdString=`${action.puckjsCmd}\n`;
    log.debug(cmdString);

    Puck.write(cmdString);
/*
      Puck.connect(function(c) {
        if (!c) {
          alert("Couldn't connect!");
          return;
        }
        let cmdString=`${action.puckjsCmd}\n`;
        log.debug(cmdString);
        c.write(cmdString, function() {
        });
      });
      */
};


export { puckjsService };
