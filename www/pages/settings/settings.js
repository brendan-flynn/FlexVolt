(function () {
    'use strict';

    angular.module('flexvolt.settings', [])
    .directive('settingsIcon', function(){
        return {
            restrict: 'E',
            templateUrl: 'pages/settings/settings-icon.html'
        };
    })
    .controller('SettingsCtrl',
    ['$scope','$state',
    function($scope, $state) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);

    }]);

}());
