(function () {
    'use strict';

    angular.module('flexvolt.balloon', [])

    .controller('BalloonCtrl', ['$stateParams', '$scope', '$state', '$timeout', '$interval','$ionicPopover', '$ionicModal', 'flexvolt', 'balloonLogic', 'hardwareLogic', 'customPopover','dataHandler',
    function($stateParams, $scope, $state, $timeout, $interval, $ionicPopover, $ionicModal, flexvolt, balloonLogic, hardwareLogic, customPopover, dataHandler) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);
        $scope.demo = $stateParams.demo;
        console.log('demo: ' + $scope.demo);

        $scope.settings = balloonLogic.settings;

        var afID;
        var frameCounts = 0;
        var driftXInterval, driftYInterval;

        customPopover.add($ionicPopover, $scope, 'popover', 'pages/balloon/settings.html',balloonLogic.updateSettings);
        customPopover.addHelp($ionicModal, $scope, 'helpModal','pages/balloon/balloon-help.html');

        var marginTop = 100;

        var transitionLength = 0.5; // seconds
        var balloonSize, knotSize;
        var width, height, centerX, centerY, balloonX, balloonY, knotX, knotY;

        var bulgeStep = 6;
        var inflateStep = 10;
        var deflateStep = 10;

        var driftX = 0, driftY = 0;
        var driftArrayX = [-0.05, 0.05], driftArrayY = [-0.05, 0.05];
        var driftIndexX = 0, driftIndexY = 0;
        var driftDelayX = 2, driftDelayY = 3; // seconds

        var balloonContainerEl, balloonDriftXContainerEl, balloonDriftYContainerEl, balloonBodyEl, balloonKnotEl, balloonStringEl, balloonStringSVGEl;

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
            if (demo) {
                var dataIn = dataHandler.getData();
            } else {
                //if (!flexvolt.api.isConnected){return;}  BROKEN?!
                var dataIn = flexvolt.api.getDataParsed();
                if (dataIn === null || dataIn === angular.undefined || dataIn[0] === angular.undefined){return;}

                var n = dataIn[0].length;
                if (n <= 0){return;}
            }
            // console.log(dataIn);

            var tmp = rms(dataIn[0]);
            // console.log(tmp);
            if (tmp > balloonLogic.settings.intensity.threshold/100){
                console.log('inflate');
                $scope.inflate();
            } else if (tmp > balloonLogic.settings.intensity.threshold/2/100) {
                console.log('bulge');
                $scope.bulge();
            }
        }

        function paintStep(timestamp){
            if ($state.current.url === currentUrl){
                afID = window.requestAnimationFrame(paintStep);
                frameCounts++;
                if (frameCounts > 30){
                    frameCounts = 0;
                    updateAnimate($stateParams.demo);
                }
            } else if ($state.current.url === '/connection'){
                afID = window.requestAnimationFrame(paintStep);
            }
        }

        $scope.onChange = function(){
            console.log('INFO: Settings changed: '+angular.toJson($scope.settings));
        };

        $scope.$on("$ionicView.leave", function() {
            if (driftXInterval) {
                $interval.cancel(driftXInterval);
            }
            if (driftYInterval) {
                $interval.cancel(driftYInterval);
            }
        });

        window.onresize = function(){
            if (afID){
              window.cancelAnimationFrame(afID);
            }
            afID = undefined;

            $scope.updating  = true;
            console.log('INFO: Resize w:'+window.innerWidth+', h:'+window.innerHeight);
            resize();
            $scope.updating  = false;
            paintStep();
        };

        function init() {
          balloonContainerEl = document.getElementById("balloonContainer");
          balloonDriftXContainerEl = document.getElementById("balloonDriftXContainer");
          balloonDriftYContainerEl = document.getElementById("balloonDriftYContainer");
          balloonBodyEl = document.getElementById("balloonBody");
          balloonKnotEl = document.getElementById("balloonKnot");
          balloonStringEl = document.getElementById("balloonString");
          balloonStringSVGEl = document.getElementById("balloonStringSVG");
          console.log(balloonContainer);
          console.log(balloonDriftXContainer);
          console.log(balloonDriftYContainer);
          console.log(balloonBody);
          console.log(balloonKnot);
          console.log(balloonString);
          console.log(balloonStringSVG);

          width = window.innerWidth;
          height = window.innerHeight - marginTop;
          // set the size once, so it doesn't reset every device rotation
          var tmp = Math.min(width,height);
          balloonSize = tmp/4;
          console.log('size: ' + balloonSize);

          resize(); // gets size and initializes all size-dependent items

          // Establish transitions for the balloon container using two drift divs
          // make these smaller than the parent element so they don't change the size as they drift
          balloonDriftXContainerEl.style.transition = "transform "+ driftDelayX +"s";
          balloonDriftXContainerEl.style.transitionTimingFunction = "ease-in-out";
          balloonDriftYContainerEl.style.transition = "transform "+ driftDelayY +"s";
          balloonDriftYContainerEl.style.transitionTimingFunction = "ease-in-out";
          driftXInterval = $interval(updateDriftX, driftDelayX*1000);
          driftYInterval = $interval(updateDriftY, driftDelayY*1000);

          // Establish the transition times for each style for balloon size, start interval
          var transition = "width "+transitionLength+"s, height "+transitionLength+"s, transform "+transitionLength+"s"
          balloonBodyEl.style.transition = transition;
          balloonKnotEl.style.transition = transition;
          balloonStringEl.style.transition = transition;

          // Initial intro is smooth without overshoot.
          // Change to elastic with overshoot for balloon inflation.
          setTimeout(function(){
            var transitionTiming = "cubic-bezier(0, 1.04, 0.46, 3)";
            balloonBodyEl.style.transitionTimingFunction = transitionTiming;
            balloonKnotEl.style.transitionTimingFunction = transitionTiming;
            balloonStringEl.style.transitionTimingFunction = transitionTiming;
          }, transitionLength*1000);

        }

        function resize() {
          //width = balloonContainerEl.clientWidth;
          //height = balloonContainerEl.clientHeight;
          width = window.innerWidth;
          height = window.innerHeight - marginTop;
          //width = balloonContainerEl.offsetWidth;
          //height = balloonContainerEl.offsetHeight;
          console.log('resized.  w: ' + width + '. h: ' + height);
          balloonContainerEl.style.width = width;
          balloonContainerEl.style.height = height;
          centerX = width/2;
          // Don't reset the size every resize - could include screen rotation, which would be annoying
          // var tmp = Math.min(width,height);
          // balloonSize = tmp/4;
          var r = balloonSize/2;
          knotSize = balloonSize*0.1;
          knotX = centerX - knotSize/2;
          knotY = 2*height/3;

          balloonKnotEl.style.width = knotSize + 'px';
          balloonKnotEl.style.height = knotSize + 'px';
          balloonKnotEl.style.transform = "translate(" + knotX + "px," + knotY + "px)";
          balloonStringEl.style.transform = "translate("+(knotX+knotSize/2)+"px," + knotY + "px)";

          drawString();
          update();
        }

        function drawString(){
          balloonStringSVGEl.style.width = width;
          balloonStringSVGEl.style.height = height;
          var xc = 0;
          var xs = Math.floor(0.05*width);
          var yc = 0;
          var ys = Math.floor(0.05*height);
          var stringCoords = "M"+xc+" "+(yc+6*ys)+
            			     " Q "+(xc+xs)+" "+(yc+5*ys)+", "+xc+" "+(yc+4*ys)+
                       		 " Q "+(xc-xs)+" "+(yc+3*ys)+", "+xc+" "+(yc+2*ys)+
          					 " Q "+(xc+xs)+" "+(yc+1*ys)+", "+xc+" "+(yc+0*ys);
          //console.log(stringCoords);
          balloonStringEl.setAttribute("d",stringCoords);
        }

        // Balloon size has changed.  Calculate new dimensions and redraw.
        function update() {
          var r = balloonSize/2;
          balloonX = centerX - r;
          balloonY = 2*height/3 - r - r*Math.sqrt(2) + 0.1*(Math.sqrt(2)*r - r) +1;

          balloonBodyEl.style.width = balloonSize + 'px';
          balloonBodyEl.style.height = balloonSize + 'px';
          balloonBodyEl.style.transform = "translate(" + balloonX + "px," + balloonY + "px) rotate(45deg)";
        }

        $scope.flex = function(intensity) {
          console.log('flexing: ' + intensity);
          if (intensity > balloonLogic.settings.intensity.threshold) {
            $scope.inflate();
          } else if (intensity > balloonLogic.settings.intensity.threshold/2) {
            $scope.bulge();
          }
        }

        // make it bigger, then redraw (use percentage growth?)
        $scope.inflate = function() {
          balloonSize += inflateStep;
          update();
        };

        $scope.bulge = function() {
          balloonSize += bulgeStep;
          update();
          $timeout(function(){
            balloonSize -= bulgeStep;
            update();
          }, transitionLength*1000);
        };

        // make it smaller, then redraw
        $scope.deflate = function() {
          balloonSize -= deflateStep;
          update();
        };

        // make it smaller, then redraw
        $scope.resetBalloon = function() {
          var tmp = Math.min(width,height);
          balloonSize = tmp/4;
          update();
        };

        function updateDriftX() {
          driftIndexX ++;
          driftIndexX = driftIndexX % driftArrayX.length;
          driftX = Math.floor(balloonSize*driftArrayX[driftIndexX]);
          balloonDriftXContainerEl.style.transform = "translate(" + driftX + "px,0)";
        }

        function updateDriftY() {
          driftIndexY ++;
          driftIndexY = driftIndexY % driftArrayY.length;
          driftY = Math.floor(balloonSize*driftArrayY[driftIndexY]);
          balloonDriftYContainerEl.style.transform = "translate(0," + driftY + "px)";
        }

        $timeout(function() {
          init();
          paintStep();
        },100);
    }])

}());
