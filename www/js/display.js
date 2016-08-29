/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* Original Author:  Brendan Flynn
 * 
 * app animation handler
 * 
 */
(function () {
    'use strict';


angular.module('flexvolt.display', [])
.factory('display', ['$state','$ionicPopver', function($state, $ionicPopover){
    var currentUrl;
    var afID = undefined;
    var animateFunction = undefined;
    
    var api = {
        reset: undefined,
        stop: undefined
    };
    
    // convenience function for adding a popover
    function addPopover(ionicPopover, scope_, popName, html, updateFunction){
        ionicPopover.fromTemplateUrl(html, {
            scope: scope_
        }).then(function(popover) {
            scope_[popName] = popover;
        });
        scope_.$on('$destroy', function() {  scope_[popName].remove();  });
        if (updateFunction){
            scope_.$on('popover.hidden', function() {    updateFunction();  });
        }
    }
    
    function paintStep(){
        //console.log('state = '+$state.current.url);
        if ($state.current.url === currentUrl){
            //console.log('updating');
            afID = window.requestAnimationFrame(paintStep);

            animateFunction();

        } else if ($state.current.url === '/settings'){
            afID = window.requestAnimationFrame(paintStep);
        }
    }

    // starts it all.  initializes, then calls paintStep to start animating
    api.reset = function(popOver, helpOver, scope_, animateFunction_){
        currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);
        
        addPopover($ionicPopover, scope_, 'popover', popOver.url, popOver.callback);
        addPopover($ionicPopover, scope_, 'helpover', helpOver.url, null);
        
        animateFunction = animateFunction_;
        paintStep();
    };
    
    api.pause = function(){
        if (afID){
            window.cancelAnimationFrame(afID);
          }
          afID = undefined;
    };
    
    api.resume = function(){
        paintStep();
    };
    
    return api;
}]);

}());