(function () {
    'use strict';

    angular.module('flexvolt.hardware', [])
    .directive('hardwareIcon', function(){
        return {
            restrict: 'E',
            templateUrl: 'pages/hardware/hardware-icon.html'
        };
    })
    .controller('HardwareCtrl',
    ['$scope','$state','flexvolt','hardwareLogic','file','appLogic',
    function($scope, $state, flexvolt, hardwareLogic, file, appLogic) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);

        $scope.version = flexvolt.api.connection.version;
        $scope.versionMinimumOnboardRMS = flexvolt.api.versionMinimums.onboardRMS;
        $scope.channelList = hardwareLogic.channelList;
        $scope.frequencyList = hardwareLogic.frequencyList;
        $scope.rmsWindowList = hardwareLogic.rmsWindowList;
        $scope.settings = hardwareLogic.settings;
        console.log('hardware settings: '+angular.toJson(hardwareLogic.settings));

        $scope.file = file;
        $scope.rmsWindowSize = Math.pow(2, hardwareLogic.settings.rmsWindowSizePower);

        $scope.onChange = function(){
            flexvolt.api.validateSettings();
            console.log('settings now: '+angular.toJson(hardwareLogic.settings));
            $scope.rmsWindowSize = Math.pow(2, hardwareLogic.settings.rmsWindowSizePower);
            hardwareLogic.updateSettings();
            flexvolt.api.updateSettings();
        };

        $scope.app = {
          version: appLogic.dm.version
        };

    }]);

}());
