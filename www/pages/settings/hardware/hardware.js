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
    ['$scope','$state','$ionicModal','flexvolt','hardwareLogic','file','appLogic',
    function($scope, $state, $ionicModal, flexvolt, hardwareLogic, file, appLogic) {
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
            hardwareLogic.updateSettings();
            flexvolt.api.updateSettings();
        };

        $scope.app = {
          version: appLogic.dm.version
        };

        $ionicModal.fromTemplateUrl('pages/settings/hardware/rmswindowsize.html', {
            scope: $scope
        }).then(function(modal){
            $scope.rmsWindowSizeModal = modal;
        });

        $scope.showRmsWindowSizeModal = function(){
            $scope.rmsWindowSizeModal.show();
        };

        $scope.selectedRMSWindowSizeStyle = function(index) {
          if (hardwareLogic.rmsWindowList[index].value === hardwareLogic.settings.rmsWindowSizePower) {
            return "active";
          }
        };

        $scope.selectRMSWindowSize = function(index) {
            console.log('selected scale: ' + hardwareLogic.rmsWindowList[index] + ', via index: ' + index);
            hardwareLogic.settings.rmsWindowSizePower = hardwareLogic.rmsWindowList[index].value;
            hardwareLogic.settings.smoothFilterVal = hardwareLogic.settings.rmsWindowSizePower;
            $scope.rmsWindowSize = Math.pow(2, hardwareLogic.settings.rmsWindowSizePower);
            $scope.onChange();
        };


        $ionicModal.fromTemplateUrl('pages/settings/hardware/channels.html', {
            scope: $scope
        }).then(function(modal){
            $scope.channelModal = modal;
        });

        $scope.showChannelModal = function(){
            $scope.channelModal.show();
        };

        $scope.selectedChannelStyle = function(index) {
          if (hardwareLogic.channelList[index].value === hardwareLogic.settings.nChannels) {
            return "active";
          }
        };

        $scope.selectChannel = function(index) {
            console.log('selected scale: ' + hardwareLogic.channelList[index] + ', via index: ' + index);
            hardwareLogic.settings.nChannels = hardwareLogic.channelList[index].value;
            $scope.onChange();
        };

        $scope.toggleBitDepth10 = function(bitDepth10){
          hardwareLogic.settings.bitDepth10=bitDepth10;
          $scope.onChange();
        };

    }]);

}());
