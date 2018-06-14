(function () {
    'use strict';

    angular.module('flexvolt.balloon', [])

    .controller('BalloonCtrl', ['$stateParams', '$scope', '$state', '$ionicPopover', '$ionicModal', 'flexvolt', 'balloonLogic', 'customPopover','dataHandler','generalData',
    function($stateParams, $scope, $state, $ionicPopover, $ionicModal, flexvolt, balloonLogic, customPopover, dataHandler, generalData) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);
        $scope.demo = $stateParams.demo;
        console.log('demo: ' + $scope.demo);

        $scope.settings = balloonLogic.settings;
        $scope.updating = false;
        $scope.balloonLogic = balloonLogic;

        var afID;
        var frameCounts = 0;
        var driftXInterval, driftYInterval;

        customPopover.add($ionicPopover, $scope, 'popover', 'pages/balloon/settings.html',balloonLogic.updateSettings);
        customPopover.addHelp($ionicModal, $scope, 'helpModal','pages/balloon/balloon-help.html');

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
            $scope.scaleModal.hide();
        };

        $scope.selectScale = function(index) {
            console.log('selected scale: ' + generalData.settings.scaleList[index] + ', via index: ' + index);
            $scope.selectedScale = generalData.settings.scaleList[index];
        };

        $scope.changeScale = function() {
            $scope.selectedScale = generalData.settings.scale;
            $ionicModal.fromTemplateUrl('pages/balloon/balloon-scale.html', {
                scope: $scope
            }).then(function(modal){
                $scope.scaleModal = modal;
                $scope.scaleModal.show();
            });
        };

        var marginTop = 100;

        var transitionLength = 0.5; // seconds
        var balloonSize, balloonPopSize, knotSize;
        var width, height, centerX, centerY, balloonX, balloonY, knotX, knotY;
        var balloonIsPopped = false;
        var bulgeStep = 6;
        var inflateStep = 10;
        var deflateStep = 10;

        var driftX = 0, driftY = 0;
        var driftArrayX = [-0.05, 0.05], driftArrayY = [-0.05, 0.05];
        var driftIndexX = 0, driftIndexY = 0;
        var driftDelayX = 2, driftDelayY = 3; // seconds
        var STATE_BELOW_THRESHOLD = 0;
        var STATE_ABOVE_FLEX_THRESHOLD = 1;
        var STATE_ABOVE_BULGE_THRESHOLD = 2;
        var STATE_FLEXED = 3;
        var STATE_BULGED = 4;
        var flexThresholdTimeout, bulgeThresholdTimeout, flexStart, bulgeStart;
        var flexState = STATE_BELOW_THRESHOLD;
        window.balloonLogic = balloonLogic;

        var balloonContainerEl, balloonDriftXContainerEl, balloonDriftYContainerEl, balloonBodyEl, balloonKnotEl, balloonStringEl, balloonStringSVGEl;

        function rms(arr){
            var ret = 0;
            for (var i = 0; i < arr.length; i++){
                ret += Math.pow((arr[i]),2);
            }
            ret = Math.sqrt(ret/arr.length);
            return ret;
        }

        $scope.CurrentVal = 0;

        function updateAnimate(demo){
            if ($scope.updating)return; // don't try to draw any graphics while the settings are being changed
            //console.log('updating, demo:'+$stateParams.demo);
            //console.log('updating, threshmode:'+settings.plot.mode);
            var speed = 4;

            var dataBundle = dataHandler.getData();
            if (dataBundle === null || dataBundle === angular.undefined || dataBundle[0] === angular.undefined){return;}
            var dataIn = dataBundle[1];
            if (dataIn === null || dataIn === angular.undefined || dataIn[0] === angular.undefined){return;}

            var n = dataIn[0].length;
            if (n <= 0){return;}
            console.log(dataIn);

            window.flexState = flexState;

            var tmp = rms(dataIn[0]);
            // console.log(tmp);
            $scope.currentVal = tmp;
            if (tmp > generalData.settings.scale*balloonLogic.settings.intensity.threshold/100){
                if (flexState === STATE_BELOW_THRESHOLD || flexState === STATE_ABOVE_BULGE_THRESHOLD) {
                  if (flexThresholdTimeout) {clearTimeout(flexThresholdTimeout);}
                  console.log('transition to flexed');
                  flexState = STATE_ABOVE_FLEX_THRESHOLD;
                  flexStart = Math.round(performance.now());
                  flexThresholdTimeout = setTimeout(function(){
                    if (flexState === STATE_ABOVE_FLEX_THRESHOLD) {
                      console.log('flex still flexed - inflate');
                      flexState = STATE_FLEXED;
                      $scope.inflate();
                    } else if (flexState === STATE_ABOVE_BULGE_THRESHOLD) {
                      console.log('flex dropped to bulge - bulge');
                      flexState = STATE_BULGED;
                      $scope.bulge();
                    }
                  }, balloonLogic.settings.time.threshold*1000);
                }
            } else if (tmp > generalData.settings.scale*balloonLogic.settings.intensity.threshold/2/100) {
                if (flexState === STATE_BELOW_THRESHOLD) {
                  if (bulgeThresholdTimeout) {clearTimeout(bulgeThresholdTimeout);}
                  console.log('transition to bulged');
                  flexState = STATE_ABOVE_BULGE_THRESHOLD;
                  bulgeStart = Math.round(performance.now());
                  bulgeThresholdTimeout = setTimeout(function(){
                    if (flexState === STATE_ABOVE_BULGE_THRESHOLD) {
                      console.log('bulge still bulged - bulge');
                      flexState = STATE_BULGED;
                      $scope.bulge();
                    }
                  }, balloonLogic.settings.time.threshold*1000);
                } else if (flexState === STATE_ABOVE_FLEX_THRESHOLD) {
                  if (flexThresholdTimeout) {clearTimeout(flexThresholdTimeout);}
                  var t1 = Math.round(performance.now());
                  if (angular.isDefined(bulgeStart) && (t1-bulgeStart > balloonLogic.settings.time.threshold*1000)) {
                    console.log('bulge went to flex and back - bulge');
                    flexState = STATE_BULGED;
                    $scope.bulge();
                  }
                }
            } else {
                if (flexThresholdTimeout) {clearTimeout(flexThresholdTimeout);}
                if (bulgeThresholdTimeout) {clearTimeout(bulgeThresholdTimeout);}
                if (flexState === STATE_ABOVE_BULGE_THRESHOLD || flexState === STATE_ABOVE_FLEX_THRESHOLD) {
                  var t2 = Math.round(performance.now());
                  if (angular.isDefined(flexStart) && t2-flexStart > balloonLogic.settings.time.threshold*1000/2) {
                    console.log('flex or bulge only made it halfway - bulge');
                    flexState = STATE_BULGED;
                    $scope.bulge();
                  }
                  flexStart = undefined; bulgeStart = undefined;
                  flexState = STATE_BELOW_THRESHOLD;
                } else if (flexState === STATE_FLEXED || flexState === STATE_BULGED) {
                  console.log('already flexed or bulged - reset');
                  flexStart = undefined; bulgeStart = undefined;
                  flexState = STATE_BELOW_THRESHOLD;
                }
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
                clearInterval(driftXInterval);
            }
            if (driftYInterval) {
                clearInterval(driftYInterval);
            }
        });

        function init() {
          balloonContainerEl = document.getElementById("balloonContainer");
          balloonDriftXContainerEl = document.getElementById("balloonDriftXContainer");
          balloonDriftYContainerEl = document.getElementById("balloonDriftYContainer");
          balloonBodyEl = document.getElementById("balloonBody");
          balloonKnotEl = document.getElementById("balloonKnot");
          balloonStringEl = document.getElementById("balloonString");
          balloonStringSVGEl = document.getElementById("balloonStringSVG");
          // console.log(balloonContainer);
          // console.log(balloonDriftXContainer);
          // console.log(balloonDriftYContainer);
          // console.log(balloonBody);
          // console.log(balloonKnot);
          // console.log(balloonString);
          // console.log(balloonStringSVG);

          width = window.innerWidth;
          height = window.innerHeight - marginTop;
          // set the size once, so it doesn't reset every device rotation
          var tmp = Math.min(width,height);
          balloonSize = tmp/4;
          balloonPopSize = tmp/2;
          console.log('size: ' + balloonSize);

          resize(); // gets size and initializes all size-dependent items

          window.onresize = function(){
              if (afID){
                window.cancelAnimationFrame(afID);
              }
              afID = undefined;

              console.log('INFO: Resize w:'+window.innerWidth+', h:'+window.innerHeight);
              resize();
              paintStep();
          };

          // Establish transitions for the balloon container using two drift divs
          // make these smaller than the parent element so they don't change the size as they drift
          balloonDriftXContainerEl.style.transition = "transform "+ driftDelayX +"s";
          balloonDriftXContainerEl.style.transitionTimingFunction = "ease-in-out";
          balloonDriftYContainerEl.style.transition = "transform "+ driftDelayY +"s";
          balloonDriftYContainerEl.style.transitionTimingFunction = "ease-in-out";
          driftXInterval = setInterval(updateDriftX, driftDelayX*1000);
          driftYInterval = setInterval(updateDriftY, driftDelayY*1000);

          // Establish the transition times for each style for balloon size, start interval
          var transition = "width "+transitionLength+"s, height "+transitionLength+"s, transform "+transitionLength+"s";
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
          $scope.updating  = true;
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
          $scope.updating  = false;
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

        function clearBalloon() {
          var transition = "width "+0+"s, height "+0+"s, transform "+0+"s";
          balloonBodyEl.style.transition = transition;
          balloonKnotEl.style.transition = transition;
          balloonStringEl.style.transition = transition;
          balloonSize = 0;
          knotSize = 0;
          balloonKnotEl.style.width = knotSize + 'px';
          balloonKnotEl.style.height = knotSize + 'px';
          balloonStringEl.setAttribute("d","");
          update();
        }

        $scope.flex = function(intensity) {
          if (balloonIsPopped) {
            // do nothing - no balloon to change
          } else if (!balloonIsPopped) {
            // console.log('flexing: ' + intensity);
            if (intensity > balloonLogic.settings.intensity.threshold) {
              $scope.inflate();
            } else if (intensity > balloonLogic.settings.intensity.threshold/2) {
              $scope.bulge();
            }
          }
        };

        // make it bigger, then redraw (use percentage growth?)
        $scope.inflate = function() {
          balloonSize += inflateStep;
          if (balloonSize > balloonPopSize) {
            $scope.popBalloon();
          } else{
            update();
          }

        };

        $scope.bulge = function() {
          balloonSize += bulgeStep;
          update();
          setTimeout(function(){
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
        // make it smaller, then redraw
        $scope.resetBalloon = function() {
          stopBalloonPopAndReset();
          var tmp = Math.min(width,height);
          balloonSize = tmp/4;
          update();

          var r = balloonSize/2;
          knotSize = balloonSize*0.1;
          knotX = centerX - knotSize/2;
          knotY = 2*height/3;

          balloonKnotEl.style.width = knotSize + 'px';
          balloonKnotEl.style.height = knotSize + 'px';
          balloonKnotEl.style.transform = "translate(" + knotX + "px," + knotY + "px)";
          balloonStringEl.style.transform = "translate("+(knotX+knotSize/2)+"px," + knotY + "px)";

          drawString();
          var transition = "width "+transitionLength+"s, height "+transitionLength+"s, transform "+transitionLength+"s";
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
        };

        var balloonPopPoints = [], balloonPopNumPoints = 2000, balloonPopNAddPoints = 400;
        var i, balloonPopCanvas, balloonPopContext;
        var balloonPopGravity = 0.2, balloonPopVelocity = 12;
        var balloonPopEmitter;
        var balloonPopRange = 75, balloonPopRangeFactor = balloonPopRange/balloonPopVelocity;
        var balloonPopDelayOff = 100, balloonPopNewPointFlag = true;
        var balloonPopExplodeInterval, balloonPopStopTimeout, balloonPopDelayTimeout;
        var balloonPopColors = ['red','blue','yellow','orange','green','black','white','purple','pink'];

        balloonPopCanvas = document.getElementById('balloonPopCanvas');
        balloonPopContext = balloonPopCanvas.getContext("2d");

        function initPoint(p) {
          var r = Math.random()*balloonPopRange - balloonPopRange/2;
          var theta = Math.random()*2*Math.PI;
          var rx = r*Math.cos(theta);
          var ry = r*Math.sin(theta);
          p.x = balloonPopEmitter.x + rx;
          p.y = balloonPopEmitter.y + ry;
          p.vx = rx/balloonPopRangeFactor;
          p.vy = ry/balloonPopRangeFactor-25*balloonPopGravity;
          p.radius = Math.random() * 4 + 1;
          p.fill = balloonPopColors[Math.floor(Math.random()*balloonPopColors.length)];
        }

        function updateBalloonPop() {
          var i, point, len = balloonPopPoints.length;
          for(i = 0; i < len; i += 1) {
            point = balloonPopPoints[i];
            point.vy += balloonPopGravity;
            point.x += point.vx;
            point.y += point.vy;
          }
        }

        function drawBalloonPop() {
          var i, point, len = balloonPopPoints.length;
          balloonPopContext.clearRect(0, 0, width, height);
          for(i = 0; i < len; i += 1) {
            point = balloonPopPoints[i];
            balloonPopContext.beginPath();
            balloonPopContext.arc(point.x, point.y, point.radius, 0, Math.PI * 2, false);
            balloonPopContext.fillStyle = point.fill;
            balloonPopContext.fill();
          }
        }

        function addBalloonPopPoint() {
          var point;
          for (var i = 0; i < balloonPopNAddPoints; i++){
            if(balloonPopPoints.length < balloonPopNumPoints) {
              point = {};
              initPoint(point);
              balloonPopPoints.push(point);
            }
          }
        }

        function stopBalloonPopAndReset(){
          clearTimeout(balloonPopStopTimeout);
          clearTimeout(balloonPopDelayTimeout);
          clearInterval(balloonPopExplodeInterval);
          balloonPopPoints = [];
          balloonPopContext.clearRect(0, 0, width, height);
          balloonPopNewPointFlag = true;
          balloonIsPopped = false;
        }

        $scope.popBalloon = function() {
          if (balloonIsPopped) {
            // if already popping, stop it
            $scope.resetBalloon();
          }
          var balloonCenterY = knotY - balloonSize/2;
          clearBalloon();
          balloonIsPopped = true;

          balloonPopPoints = [];
          balloonPopContext.clearRect(0, 0, width, height);
          balloonPopCanvas.width = width;
          balloonPopCanvas.height = height;
          balloonPopEmitter = {x:width / 2, y:balloonCenterY};
          balloonPopNewPointFlag = true;
          balloonPopExplodeInterval = setInterval(function() {
            if (balloonPopNewPointFlag){
              addBalloonPopPoint();
            }
            updateBalloonPop();
            drawBalloonPop();
          }, 1000/48);

          balloonPopDelayTimeout = setTimeout(function(){
            balloonPopNewPointFlag = false; // stops new points from being added
          },balloonPopDelayOff);

          balloonPopStopTimeout = setTimeout(function(){
            $scope.resetBalloon();
          },4000);
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

        setTimeout(function() {
          init();
          paintStep();
        },100);
    }]);

}());
