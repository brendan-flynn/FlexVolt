(function () {
    'use strict';

    angular.module('flexvolt.sound', [])
    .directive('soundIcon', function(){
        return {
            restrict: 'E',
            controller: function($scope, generalData){
              $scope.tone = generalData.settings.tone;
            },
            templateUrl: 'pages/sound/sound-icon.html'
        };
    })
    .controller('SoundCtrl', ['$scope', '$state', '$stateParams', 'generalData', '$ionicModal', 'customPopover','soundPlugin',
        function($scope, $state, $stateParams, generalData, $ionicModal, customPopover, soundPlugin){

        console.log('SoundCtrl loaded');

        var task = $state.current.name;
        $scope.demo = $stateParams.demo;

        $scope.app = {
          isMobile: appLogic.dm.isMobile,
          platform: appLogic.dm.platform
        };

        customPopover.addHelp($ionicModal, $scope, 'helpModal','pages/settings/sound/sound-help.html');

        $scope.tone = generalData.settings.tone;

        console.log('$scope: ' + JSON.stringify($scope.tone));

        $scope.onChange = function(){
          generalData.updateSettings();
        };

        $scope.onChangeVolume = function(){
          soundPlugin.play(generalData.settings.tone.proportionalMinFreq, generalData.settings.tone.volume);
          setTimeout(soundPlugin.stop, 250);
          $scope.onChange();
        };

        $scope.selectSoundMode = function($index){
          console.log('selected: ' + $index);
          generalData.settings.tone.mode = generalData.settings.tone.modeList[$index];
          $scope.onChange();
        };
        $scope.selectedSoundModeStyle = function($index) {
          if (generalData.settings.tone.modeList[$index] === $scope.tone.mode) {
            return "active";
          }
        };
        $scope.selectThresholdType = function($index){
          generalData.settings.tone.thresholdType = generalData.settings.tone.thresholdTypeList[$index];
          $scope.onChange();
        };
        $scope.selectedThresholdTypeStyle = function($index) {
          if (generalData.settings.tone.thresholdTypeList[$index] === generalData.settings.tone.thresholdType) {
            return "active";
          }
        };

    }]);

}());
