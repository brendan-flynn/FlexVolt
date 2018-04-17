(function () {
    'use strict';

    angular.module('flexvolt.rms', [])

    .controller('RMSCtrl', ['$stateParams', '$scope', '$state', 'flexvolt', '$ionicPopup', '$ionicPopover', '$ionicModal', 'rmsTimePlot', 'rmsTimeLogic', 'dataHandler', 'hardwareLogic', 'customPopover',
    function($stateParams, $scope, $state, flexvolt, $ionicPopup, $ionicPopover, $ionicModal, rmsTimePlot, rmsTimeLogic, dataHandler, hardwareLogic, customPopover) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);

        customPopover.add($ionicPopover, $scope, 'popover', 'pages/rms/rms-settings.html',rmsTimeLogic.updateSettings);
        customPopover.add($ionicPopover, $scope, 'filterpopover', 'templates/filter-popover.html',rmsTimeLogic.updateSettings);
        // customPopover.add($ionicPopover, $scope, 'helpover','pages/rms/rms-help.html');
        customPopover.addHelp($ionicModal, $scope, 'helpModal','pages/rms/rms-help.html');

        var afID = undefined;
        var metricCounts = 0;
        var metricUpdatePeriod = 1; // update metrics every n seconds

        $scope.demo = $stateParams.demo;

        $scope.hardwareLogic = hardwareLogic;

        $scope.updating = false;

        $scope.onChange = function(){
            if (afID){
              window.cancelAnimationFrame(afID);
            }
            afID = undefined;
            $scope.updating  = true;
            init();

            $scope.updating  = false;
            paintStep();
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

            } else if ($state.current.url === '/connection'){
                afID = window.requestAnimationFrame(paintStep);
            }
        }

        function init(){
            rmsTimeLogic.ready()
                .then(function(){
                    $scope.pageLogic = rmsTimeLogic;
                    // in case general settings has a lower nChannels
                    rmsTimeLogic.settings.nChannels = Math.min(rmsTimeLogic.settings.nChannels, hardwareLogic.settings.nChannels);
                    //console.log('INFO: Settings: '+angular.toJson(rmsTimeLogic.settings));
                    dataHandler.init(rmsTimeLogic.settings.nChannels);

                    for (var i= 0; i < rmsTimeLogic.settings.filters.length; i++){
                        dataHandler.addFilter(rmsTimeLogic.settings.filters[i]);
                    }

                    dataHandler.setMetrics(hardwareLogic.settings.frequency*metricUpdatePeriod);

                    if (dataHandler.controls.live) {
                      console.log('rms standard init');
                        rmsTimePlot.init('rmsTimeWindow', rmsTimeLogic.settings, hardwareLogic.settings);
                        updateMetrics(); // so they start at 0 instead of blank
                        paintStep();
                    } else {
                      console.log('rms playback init');
                        var dataBundle = dataHandler.getData(); // [timestamps, dataIn]
                        if (dataBundle === null || dataBundle === angular.undefined ||
                            dataBundle[0] === angular.undefined || dataBundle[0].length ===0){return;}

                        var dataIn = dataBundle[1];
                        if (dataIn === null || dataIn === angular.undefined ||
                            dataIn[0] === angular.undefined || dataIn[0].length === 0){return;}
                        rmsTimePlot.initPlayback('rmsTimeWindow', rmsTimeLogic.settings, hardwareLogic.settings, dataBundle);
                    }
                });
        }

        window.onresize = function(){
            if (afID){
              window.cancelAnimationFrame(afID);
            }
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
        };

        init();

        dataHandler.resetPage = init;
    }])
}());
