/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

(function () {
'use strict';

angular.module('flexvolt.appLogic',[])

.factory('appLogic', [function(){
    var dm = {
        logs: '',
        appWidth: undefined,
        appHeight: undefined,
        demo: undefined,
        storedData: undefined,
        version: undefined,
        isMobile: undefined,
        platform: undefined
    };

    var oldLog = console.log;

    console.log = function(msg){

        // convert objects to a more useful notation
        var m = '';
        if ( (typeof msg === 'object') && msg.length === undefined){
            for (var key in msg){
                m += key+':'+msg[key]+', ';
            }
        } else {
            m = msg;
        }
        oldLog.apply(console, [msg]);

        dm.logs += '\n'+m;
        if (dm.logs.length > 100000){
            dm.logs = dm.logs.slice(20000);
            console.log('Sliced Logs');
        }
    };

    return {
        dm: dm
    };
}])

;

}());
