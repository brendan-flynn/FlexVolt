(function () {
    'use strict';

    angular.module('flexvolt.about', [])
    .controller('AboutCtrl',
    ['$scope','$state','appLogic',
    function($scope, $state, appLogic) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);

        $scope.app = {
          version: appLogic.dm.version,
          isMobile: appLogic.dm.isMobile,
          platform: appLogic.dm.platform
        };

    }]);

}());
