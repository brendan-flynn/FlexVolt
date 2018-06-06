(function () {
    'use strict';

    angular.module('flexvolt.rms', [])

    .controller('RMSCtrl', ['$stateParams', '$scope', '$state', 'flexvolt', '$ionicPopup', '$ionicPopover', '$ionicModal', 'rmsTimePlot', 'rmsTimeLogic', 'dataHandler', 'hardwareLogic', 'customPopover', 'appLogic', 'soundPlugin', 'generalData',
    function($stateParams, $scope, $state, flexvolt, $ionicPopup, $ionicPopover, $ionicModal, rmsTimePlot, rmsTimeLogic, dataHandler, hardwareLogic, customPopover, appLogic, soundPlugin, generalData) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);

        customPopover.add($ionicPopover, $scope, 'popover', 'pages/rms/rms-settings.html',rmsTimeLogic.updateSettings);
        customPopover.add($ionicPopover, $scope, 'filterpopover', 'templates/filter-popover.html',rmsTimeLogic.updateSettings);
        // customPopover.add($ionicPopover, $scope, 'helpover','pages/rms/rms-help.html');
        customPopover.addHelp($ionicModal, $scope, 'helpModal','pages/rms/rms-help.html');

        $scope.$on('$ionicView.beforeLeave', function(){
          console.log('leaving - stop audio');
          soundPlugin.stop();
        });

        var afID;
        var metricCounts = 0;
        var metricUpdatePeriod = 1; // update metrics every n seconds

        $scope.demo = $stateParams.demo;
        $scope.dataHandler = dataHandler; // for controls.live
        $scope.hardwareLogic = hardwareLogic;

        $scope.updating = false;

        $scope.onChange = function(){
            if (afID){
              window.cancelAnimationFrame(afID);
            }
            afID = undefined;
            $scope.updating  = true;
            if (dataHandler.controls.live) {
                init();
            } else if (!dataHandler.controls.live) {
                initPlayBack();
            }

            $scope.updating  = false;
            if (dataHandler.controls.live) {
                paintStep();
            }
        };

        $scope.showLabelPopup = function(ind) {
          console.log('here');
          $scope.data = {
            input: $scope.pageLogic.settings.labels[ind].name
          };

          // An elaborate, custom popup
          var myPopup = $ionicPopup.show({
            template: '<input ng-model="data.input" autofocus>',
            title: 'Enter New Label',
            scope: $scope,
            buttons: [
              { text: 'Cancel' },
              {
                text: '<b>Save</b>',
                type: 'button-positive',
                onTap: function(e) {
                  if (!$scope.data.input) {
                    //don't allow the user to close unless something has been entered
                    e.preventDefault();
                  } else {
                    return $scope.data.input;
                  }
                }
              }
            ]
          });
          myPopup.then(function(res) {
            // if cancel, will be undefined
            if (angular.isDefined(res)){
              console.log('label popup changed to: '+res);
              $scope.pageLogic.settings.labels[ind].name = res;
            }
          });
         };

        function updateAnimate(){
            if ($scope.updating) return;

            metricCounts++;
            if (metricCounts > metricUpdatePeriod*60){
                metricCounts = 0;
                updateMetrics();
            }

            var dataBundle = dataHandler.getData(); // [timestamps, dataIn]
            if (dataBundle === null || dataBundle === angular.undefined ||
                dataBundle[0] === angular.undefined || dataBundle[0].length ===0){return;}

            var dataIn = dataBundle[1];
            if (dataIn === null || dataIn === angular.undefined ||
                dataIn[0] === angular.undefined || dataIn[0].length === 0){return;}

            if (generalData.settings.tone.isEnabled) {
              if (generalData.settings.tone.mode === 'Proportional') {
                var sum = 0;
                for (var i = 0; i < dataIn[0].length; i++){
                  sum += dataIn[0][i];
                }
                var avg = sum/dataIn[0].length;
                var diff = generalData.settings.tone.proportionalMaxFreq - generalData.settings.tone.proportionalMinFreq;
                var f = generalData.settings.tone.proportionalMinFreq + diff*avg/rmsTimeLogic.settings.scale;
                soundPlugin.setFrequency(f);
              }
            }

            // animate
            rmsTimePlot.update(dataBundle);
        }

        function updateMetrics(){
            $scope.metrics = dataHandler.getMetrics();
        }

        $scope.resetMetrics = function(iChan) {
            dataHandler.resetMetrics(iChan);
            updateMetrics();
        };

        function paintStep(){
            //console.log('state = '+$state.current.url);
            if ($state.current.url === currentUrl){
                //console.log('updating');
                afID = window.requestAnimationFrame(paintStep);

                if (dataHandler.controls.live) {
                  updateAnimate();
                }

            } else if ($state.current.url === '/connection' || $state.current.url === '/settings' || $state.current.url === '/sound'){
                afID = window.requestAnimationFrame(paintStep);
            }
        }

        function resetDataHandler() {
            // in case general settings has a lower nChannels
            rmsTimeLogic.settings.nChannels = Math.min(rmsTimeLogic.settings.nChannels, hardwareLogic.settings.nChannels);
            //console.log('INFO: Settings: '+angular.toJson(rmsTimeLogic.settings));
            dataHandler.init(rmsTimeLogic.settings.nChannels);

            for (var i= 0; i < rmsTimeLogic.settings.filters.length; i++){
                dataHandler.addFilter(rmsTimeLogic.settings.filters[i]);
            }

            dataHandler.setMetrics(hardwareLogic.settings.frequency*metricUpdatePeriod);
        }

        function initPlayBack() {
            resetDataHandler();
            console.log('rms playback init');
            var dataBundle = dataHandler.getData(); // [timestamps, dataIn]
            updateMetrics();
            if (dataBundle === null || dataBundle === angular.undefined ||
                dataBundle[0] === angular.undefined || dataBundle[0].length ===0){return;}

            var dataIn = dataBundle[1];
            if (dataIn === null || dataIn === angular.undefined ||
                dataIn[0] === angular.undefined || dataIn[0].length === 0){return;}
            rmsTimePlot.initPlayback('rmsTimeWindow', rmsTimeLogic.settings, hardwareLogic.settings, dataBundle);
        }

        function init(){
            rmsTimeLogic.ready()
                .then(function(){
                    $scope.pageLogic = rmsTimeLogic;
                    resetDataHandler();

                    if (dataHandler.controls.live) {
                      console.log('rms standard init');
                        rmsTimePlot.init('rmsTimeWindow', rmsTimeLogic.settings, hardwareLogic.settings);
                        updateMetrics(); // so they start at 0 instead of blank
                        paintStep();
                    } else {
                        initPlayBack();
                    }
                });
        }

        $scope.selectedScaleStyle = function(index) {
          if (generalData.settings.scaleList[index] === $scope.selectedScale) {
            return "active";
          }
        };

        $scope.cancelChangeScale = function() {
            // do nothing
            $scope.scaleModal.hide();
        };

        $scope.confirmChangeScale = function() {
            generalData.settings.scale = $scope.selectedScale;
            if (generalData.settings.scale < 10) { generalData.settings.scale = 10;}
            if (generalData.settings.scale > 1500) {generalData.settings.scale = 1500;}
            generalData.updateSettings();
            $scope.onChange();
            $scope.scaleModal.hide();
        };

        $scope.selectScale = function(index) {
            $scope.selectedScale = generalData.settings.scaleList[index];
        };

        $scope.changeScale = function() {
            $scope.selectedScale = generalData.settings.scale;
            $ionicModal.fromTemplateUrl('pages/rms/rms-scale.html', {
                scope: $scope
            }).then(function(modal){
                $scope.scaleModal = modal;
                $scope.scaleModal.show();
            });
        };

        window.onresize = function(){
            if (window.innerWidth === appLogic.appWidth && window.innerHeight === appLogic.appHeight) {
                // size didn't actually change - do nothing
            } else {
                appLogic.appWidth = window.innerWidth;
                appLogic.appHeight = window.innerHeight;
                if (afID){
                  window.cancelAnimationFrame(afID);
                }
                soundPlugin.stop();
                afID = undefined;
                $scope.updating  = true;
                console.log('INFO: Resize w:'+window.innerWidth+', h:'+window.innerHeight);
                rmsTimePlot.resize();
                $scope.updating  = false;
                if (dataHandler.controls.live) {
                  paintStep();
                } else {
                  init();
                }
            }
        };

        dataHandler.resetPage = init;
        init();
    }]);
}());
