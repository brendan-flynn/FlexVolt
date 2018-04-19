(function () {
'use strict';

angular.module('flexvolt.customPopover', [])

.factory('customPopover', [function(){
  var api = {
    add: undefined,
    addHelp: undefined,
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
    };

    api.addHelp = function(ionicModal, scope_, modalName, html) {
        ionicModal.fromTemplateUrl(html, {scope: scope_})
          .then(function(modal){
            scope_[modalName] = modal;
            scope_.$on('$destroy', function() {scope_[modalName].remove();});
            if (scope_.demo) {scope_[modalName].show();}
          });
    };

  });

  return api;
}]);

}());
