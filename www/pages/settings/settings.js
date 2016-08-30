(function () {
    'use strict';

    angular.module('flexvolt.settings', [])

    .controller('SettingsCtrl',
    ['$scope','$state','flexvolt','hardwareLogic','file','appLogic',
    function($scope, $state, flexvolt, hardwareLogic, file, appLogic) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);

        $scope.channelList = hardwareLogic.channelList;
        $scope.frequencyList = hardwareLogic.frequencyList;
        $scope.settings = hardwareLogic.settings;
        console.log('hardware settings: '+angular.toJson(hardwareLogic.settings));

        $scope.file = file;

        $scope.onChange = function(){
            console.log('settings now: '+angular.toJson(hardwareLogic.settings));
            hardwareLogic.updateSettings();
            flexvolt.api.updateSettings();
        };

        $scope.app = {
          version: appLogic.dm.version
        };

    }])

}());
