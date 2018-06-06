(function () {
    'use strict';

    angular.module('flexvolt.scale', [])
    .controller('ScaleCtrl',
    ['$scope','$state','generalData',
    function($scope, $state, generalData) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);

        $scope.generalData = generalData;

        $scope.selectedScaleStyle = function(index) {
          if (generalData.settings.scaleList[index] === generalData.settings.scale) {
            return "active";
          }
        };

        $scope.selectScale = function(index) {
            console.log('selected scale: ' + generalData.settings.scaleList[index] + ', via index: ' + index);
            generalData.settings.scale = generalData.settings.scaleList[index];
            generalData.updateSettings();
        };
    }]);

}());
