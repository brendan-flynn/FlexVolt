(function () {
    'use strict';

    angular.module('flexvolt.godot', [])

    .controller('GodotCtrl', ['$stateParams', '$scope', '$state', '$timeout', '$ionicPopover', 'flexvolt', 'xyDot', 'xyLogic', 'customPopover',
    function($stateParams, $scope, $state, $timeout, $ionicPopover, flexvolt, xyDot, xyLogic, customPopover) {

        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);

        $scope.demo = $stateParams.demo;

        customPopover.add($ionicPopover, $scope, 'popover', 'pages/godot/settings.html',xyLogic.updateSettings);
        customPopover.add($ionicPopover, $scope, 'helpover','pages/godot/help.html');

        var afID;
        var frameCounts = 0;

        $scope.bounds = xyLogic.settings.bounds;

    //        $scope.disp = {
    //            mode : xyLogic.settings.threshMode
    //        };


        // $timeout hack because the slider doesn't initialize properly
        $timeout(function(){
            $scope.thresh = xyLogic.settings.thresh;
            $scope.fakeData = xyLogic.settings.fakeData;
            $scope.plot = xyLogic.settings.plot;
            //console.log(xyLogic.settings);
            //console.log('threshMode:'+$scope.plot.thresh+', xy version:'+xyLogic.settings.plot.thresh);
        },20);

        $scope.onChange = function(){
            //console.log('threshMode:'+$scope.plot.thresh+', xy version:'+xyLogic.settings.plot.thresh);
            //console.log('VH:'+$scope.thresh.yH+'HH:'+$scope.thresh.xH);
            //xyLogic.updateSettings();
            console.log('INFO: Settings changed: '+angular.toJson($scope.settings));
        };

        function paintStep(timestamp){
            if ($state.current.url === currentUrl){
                afID = window.requestAnimationFrame(paintStep);
                frameCounts++;
                if (frameCounts > 5){
                    frameCounts = 0;
                    xyLogic.updateAnimate($stateParams.demo);
                }
            } else if ($state.current.url === '/connection'){
                afID = window.requestAnimationFrame(paintStep);
            }
        }

        window.onresize = function(){
            if (afID){
              window.cancelAnimationFrame(afID);
            }
            afID = undefined;
            $scope.updating  = true;
            console.log('INFO: Resize w:'+window.innerWidth+', h:'+window.innerHeight);
            xyDot.resize();
            $scope.updating  = false;
            paintStep();
        };

        xyDot.init('#xyWindow');
        paintStep();

    }])

}());
