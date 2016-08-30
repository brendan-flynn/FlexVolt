(function () {
'use strict';

angular.module('flexvolt.customPopover', [])

.factory('customPopover', [function(){
  var api = {
    add: undefined
  };

  console.log('init');

  ionic.Platform.ready(function(){

    console.log('ready');
    api.add = function(ionicPopover, scope_, popName, html, updateFunction){
        console.log('adding');
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

  });

  return api;
}])

}());
