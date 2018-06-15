(function () {
    'use strict';

    angular.module('flexvolt.godot', [])

    .controller('GodotCtrl', ['$stateParams', '$scope', '$state', '$timeout', '$ionicPopover', '$ionicModal', 'flexvolt', 'xyDot', 'xyLogic', 'hardwareLogic', 'customPopover',
    function($stateParams, $scope, $state, $timeout, $ionicPopover, $ionicModal, flexvolt, xyDot, xyLogic, hardwareLogic, customPopover) {

        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);

        $scope.demo = $stateParams.demo;

        customPopover.add($ionicPopover, $scope, 'popover', 'pages/godot/settings.html',xyLogic.updateSettings);
        // customPopover.add($ionicPopover, $scope, 'helpover','pages/godot/help.html');
        customPopover.addHelp($ionicModal, $scope, 'helpModal','pages/godot/godot-help.html');

        var afID;
        var frameCounts = 0;

        $scope.bounds = {
            min: 0,
            max: hardwareLogic.settings.vMax
        };

        var x = 128, y = 128;

        function rms(arr){
            var ret = 0;
            for (var i = 0; i < arr.length; i++){
                ret += Math.pow((arr[i]),2);
            }
            ret = Math.sqrt(ret/arr.length);
            return ret;
        }

        function updateAnimate(demo){
            //console.log('updating, demo:'+$stateParams.demo);
            //console.log('updating, threshmode:'+settings.plot.mode);
            var speed = 4;
            var dataIn;
            if (demo) {
                if (xyLogic.settings.fakeData.useRandom) {
                    x = Math.min(Math.max(x+speed*(Math.random()-0.5),0),255);
                    y = Math.min(Math.max(y+speed*(Math.random()-0.5),0),255);
                    xyDot.update(x,y);
                    return;
                } else {
                    dataIn = [];
                    // have to trick the rms calculator into returning the numbers selected!
                    dataIn[0] = [xyLogic.settings.fakeData.x];
                    dataIn[1] = [xyLogic.settings.fakeData.y];
                }
            } else {
                //if (!flexvolt.api.isConnected){return;}  BROKEN?!
                var dataBundle = flexvolt.api.getDataParsed(); // [timestamps, dataIn]
                if (dataBundle === null || dataBundle === angular.undefined || dataBundle[0] === angular.undefined){return;}
                dataIn = dataBundle[1];
                if (dataIn === null || dataIn === angular.undefined || dataIn[0] === angular.undefined){return;}

                var n = dataIn[0].length;
                if (n <= 0){return;}
            }

            if (xyLogic.settings.plot.thresh){
                //calculate RMS, then apply thresholds for motion
                if (dataIn[0] !== angular.undefined && dataIn[0].length > 0) {
                    var xtmp = rms(dataIn[0]);
                    if (xtmp > xyLogic.settings.thresh.xH){
                        x += speed;
                    } else if (xtmp < xyLogic.settings.thresh.xL){
                        x -= speed;
                    }
                }

                if (dataIn[1] !== angular.undefined && dataIn[1].length > 0) {
                    var ytmp = rms(dataIn[1]);
                    if (ytmp > xyLogic.settings.thresh.yH){
                        y += speed;
                    } else if (ytmp < xyLogic.settings.thresh.yL){
                        y -= speed;
                    }
                }

                if (x > 255){x=255;}
                if (x < 0){ x=0;}
                if (y > 255){y=255;}
                if (y < 0){ y=0;}
            } else {
                // just track RMS
                x = 255*rms(dataIn[0])/hardwareLogic.settings.vMax;
                y = 255*rms(dataIn[1])/hardwareLogic.settings.vMax;
            }
            xyDot.update(x,y);
        }

        // $timeout hack because the slider doesn't initialize properly
        $timeout(function(){
            $scope.thresh = xyLogic.settings.thresh;
            $scope.fakeData = xyLogic.settings.fakeData;
            $scope.plot = xyLogic.settings.plot;
        },20);

        $scope.onChange = function(){
            console.log('INFO: Settings changed: '+angular.toJson($scope.settings));
        };

        function paintStep(timestamp){
            if ($state.current.url === currentUrl){
                afID = window.requestAnimationFrame(paintStep);
                frameCounts++;
                if (frameCounts > 5){
                    frameCounts = 0;
                    updateAnimate($stateParams.demo);
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

        function initializeHardware(){
          var s = hardwareLogic.settings;
          var defaults = {
            frequency: 1000,
            bitDepth10: true,
            smoothFilterFlag: true,
            smoothFilterMode: 1,
            smoothFilterVal: 7,
            downSampleCount: 10,
            rmsWindowSizePower: 7
          };
          var updateFlag = false;

          for (var field in defaults) {
            if (hardwareLogic.settings[field] !== defaults[field]) {
              updateFlag = true;
              hardwareLogic.settings[field] = defaults[field];
            }
          }
          if (updateFlag){hardwareLogic.updateSettings();}
          return updateFlag;
        }

        function initPage(){
          var updateFlag = initializeHardware();
          if (updateFlag){
            flexvolt.api.updateSettings()
              .then(paintStep);
          } else {
            paintStep();
          }

        }

        initPage();

    }]);

}());
