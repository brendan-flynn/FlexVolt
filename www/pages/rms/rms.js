(function () {
    'use strict';

    angular.module('flexvolt.rms', [])

    .controller('RMSCtrl', ['$stateParams', '$scope', '$state', 'flexvolt', '$ionicPopover', 'rmsTimePlot', 'rmsTimeLogic', 'dataHandler', 'hardwareLogic', 'customPopover',
    function($stateParams, $scope, $state, flexvolt, $ionicPopover, rmsTimePlot, rmsTimeLogic, dataHandler, hardwareLogic, customPopover) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);

        customPopover.add($ionicPopover, $scope, 'popover', 'pages/rms/rms-settings.html',rmsTimeLogic.updateSettings);
        customPopover.add($ionicPopover, $scope, 'filterpopover', 'templates/filter-popover.html',rmsTimeLogic.updateSettings);
        customPopover.add($ionicPopover, $scope, 'helpover','pages/rms/rms-help.html');

        var afID = undefined;
        var metricCounts = 0;

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

        function updateAnimate(){
            if ($scope.updating) return;

            metricCounts++;
            if (metricCounts > 60){
                metricCounts = 0;
                updateMetrics();
            }

            var dataIn = dataHandler.getData();
            //console.log(dataIn);
            // animate
            if (dataIn === null || dataIn === angular.undefined ||
                dataIn[0] === angular.undefined || dataIn[0].length === 0){return;}
            rmsTimePlot.update(dataIn);
        }

        function updateMetrics(){
            $scope.metrics = dataHandler.getMetrics();
        }

        function paintStep(){
            //console.log('state = '+$state.current.url);
            if ($state.current.url === currentUrl){
                //console.log('updating');
                afID = window.requestAnimationFrame(paintStep);

                updateAnimate();

            } else if ($state.current.url === '/connection'){
                afID = window.requestAnimationFrame(paintStep);
            }
        }

        function init(){
            rmsTimeLogic.ready()
                .then(function(){
                    $scope.pageLogic = rmsTimeLogic;
                    //console.log('INFO: Settings: '+angular.toJson(rmsTimeLogic.settings));
                    dataHandler.init(rmsTimeLogic.settings.nChannels);

                    for (var i= 0; i < rmsTimeLogic.settings.filters.length; i++){
                        dataHandler.addFilter(rmsTimeLogic.settings.filters[i]);
                    }
                    dataHandler.setMetrics(60);
                    rmsTimePlot.init('rmsTimeWindow', rmsTimeLogic.settings.nChannels, rmsTimeLogic.settings.zoomOption, rmsTimeLogic.settings.xMax, hardwareLogic.settings.frequency, hardwareLogic.settings.vMax);
                    paintStep();
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
            paintStep();
        };

        init();
    }])
}());
