(function () {
    'use strict';

    angular.module('flexvolt.trace', [])

    .controller('TraceCtrl', ['$stateParams', '$scope', '$state', 'flexvolt', '$ionicPopover', 'tracePlot', 'traceLogic', 'dataHandler', 'hardwareLogic', 'logicOptions', 'customPopover',
    function($stateParams, $scope, $state, flexvolt, $ionicPopover, tracePlot, traceLogic, dataHandler, hardwareLogic, logicOptions, customPopover) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);
        $scope.demo = $stateParams.demo;
        var afID = undefined;

        customPopover.add($ionicPopover, $scope, 'popover', 'pages/trace/trace-settings.html',traceLogic.updateSettings);
        customPopover.add($ionicPopover, $scope, 'filterpopover', 'templates/filter-popover.html',traceLogic.updateSettings);
        customPopover.add($ionicPopover, $scope, 'helpover','pages/trace/trace-help.html');

        $scope.pageLogic = traceLogic;
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
            if ($scope.updating)return; // don't try to draw any graphics while the settings are being changed

            var dataIn = dataHandler.getData();
            //console.log(dataIn);
            if (dataIn === null || dataIn === angular.undefined ||
                dataIn[0] === angular.undefined || dataIn[0].length === 0){return;}
            tracePlot.update(dataIn);
        }

        function paintStep(){
            //console.log('state = '+$state.current.url);
            if ($state.current.url === currentUrl){
                afID = window.requestAnimationFrame(paintStep);
                updateAnimate();
            } else if ($state.current.url === '/connection'){
                afID = window.requestAnimationFrame(paintStep);
            }
        }

        function init() {
            traceLogic.ready()
                .then(function(){
                    traceLogic.settings.nChannels = Math.min(traceLogic.settings.nChannels,hardwareLogic.settings.nChannels);
                    //console.log('INFO: Settings: '+angular.toJson(traceLogic.settings));
                    dataHandler.init(traceLogic.settings.nChannels);
                    for (var i= 0; i < traceLogic.settings.filters.length; i++){
                        dataHandler.addFilter(traceLogic.settings.filters[i]);
                    }
        //            dataHandler.setMetrics(60);
                    tracePlot.init('#traceWindow',traceLogic.settings.nChannels, hardwareLogic.settings.vMax);
                    paintStep();
                });
        }

        window.onresize = function(){
            if (afID){
              window.cancelAnimationFrame(afID);
            }
            afID = undefined;
            $scope.updating  = true;
            //console.log('INFO: Resize w:'+window.innerWidth+', h:'+window.innerHeight);
            tracePlot.resize();
            $scope.updating  = false;
            paintStep();
        };

        init();
    }])
}());
