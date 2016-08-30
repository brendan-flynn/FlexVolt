(function () {
'use strict';

angular.module('flexvolt.customPopover', [])

.factory('customPopover', [function(){
  var api = {
    add: undefined
  };

  ionic.Platform.ready(function(){

    api.add = function(ionicPopover, scope_, popName, html, updateFunction){
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
