(function () {
    'use strict';

    angular.module('flexvolt.myometer', [])

    .controller('MyometerCtrl',['$scope','$state','$stateParams','$ionicPopup','$ionicPopover','$ionicModal','$interval','myometerPlot','myometerLogic','dataHandler','hardwareLogic','customPopover','generalData','soundPlugin',
    function($scope, $state, $stateParams, $ionicPopup, $ionicPopover, $ionicModal, $interval, myometerPlot, myometerLogic, dataHandler, hardwareLogic, customPopover, generalData, soundPlugin) {
      var currentUrl = $state.current.url;
      $scope.demo = $stateParams.demo;
      console.log('currentUrl = '+currentUrl);

      customPopover.add($ionicPopover, $scope, 'popover', 'pages/myometer/myometer-settings.html', myometerLogic.updateSettings);
      customPopover.add($ionicPopover, $scope, 'filterpopover', 'templates/filter-popover.html', myometerLogic.updateSettings);
      // customPopovers.add($ionicPopover, $scope, 'helpover','pages/myometer/myometer-help.html');
      customPopover.addHelp($ionicModal, $scope, 'helpModal','pages/myometer/myometer-help.html');

      $scope.$on('$ionicView.beforeLeave', function(){
        console.log('leaving - stop audio');
        soundPlugin.stop();
      });

      var afID;
      var frameCounts = 0;
      var stateInterval, myPopup, baselineData;

      var states = {
        getReady: {
          name: 'ready',
          msg: 'Baseline measurement starts in XT',
          count: 3,
          nextState: 'measuring'
        },
        measuring: {
          name: 'measuring',
          msg: 'Baseline measurement, XT s remaining',
          count: 3,
          nextState: 'results'
        },
        results: {
          name: 'results',
          msg: 'Baseline measurement complete',
          count: 0,
          nextState: 'idle'
        },
        idle: {
          name: 'idle',
          msg: '',
          nextState: 'idle'
        }
      };

      $scope.baseline = {
        state: states.idle,
        msg: '',
        counter: 0,
        channel: 0
      };

      $scope.pageLogic = myometerLogic;
      window.myometerLogic = myometerLogic;
      $scope.hardwareLogic = hardwareLogic;
      $scope.updating = false;
      $scope.baselining = false;

      function updateTargets(chan,val){
        //console.log('DEBUG: updating target '+chan+' to '+val);
        $scope.pageLogic.settings.targets[$scope.pageLogic.settings.baselineMode][chan] = val;
        myometerLogic.updateSettings();
      }

      $scope.updateLabels = function(){
        //console.log('DEBUG: updated labels: '+angular.toJson(myometerLogic.settings.labels));
      };

      $scope.$on('$destroy', function(e){
        console.log('DEBUG: $destroy: '+angular.toJson(e));
        $scope.cancelBaseline();
      });

      $scope.onChange = function(){
        if (afID){
          window.cancelAnimationFrame(afID);
        }
        afID = undefined;
        $scope.updating  = true;
        //console.log('INFO: Settings changed');
        init();

        $scope.updating  = false;
      };

      $scope.cancelBaseline = function(ch){
        console.log('DEBUG: cancelling baseline '+ch);
        $scope.baselining = false;
        if (stateInterval){
          $interval.cancel(stateInterval);
        }
        if (myPopup && myPopup.close){
          myPopup.close();
        }
        $scope.baseline = {
          state: states.idle,
          msg: '',
          counter: 0,
          channel: 0
        };
        myometerPlot.removeText();
      };

      // state machine processor - fired every second to simplify countdowns
      function baselineProcessor(){
        if ($scope.baseline.counter > 0){
          $scope.baseline.counter--;
        } else {
          $scope.baseline.state = states[$scope.baseline.state.nextState];
          if ($scope.baseline.state === states.idle){
            $scope.cancelBaseline();
            return;
          }
          $scope.baseline.counter = $scope.baseline.state.count;
          if ($scope.baseline.state.name === 'measuring'){
            baselineData = [];
          } else if ($scope.baseline.state.name === 'results'){
            var sum = 0;
            if (baselineData.length > 0){
              for (var i = 0; i < baselineData.length; i++){
                sum += Math.abs(baselineData[i]);
              }
              var avg = sum/baselineData.length;
              avg = Math.round(avg*100)/100;

              $scope.pageLogic.settings.baselines[$scope.baseline.channel] = avg;
            }

          }
        }
        $scope.baseline.msg = $scope.baseline.state.msg.replace('XT',''+$scope.baseline.counter);
        myometerPlot.addText($scope.baseline.msg);
//        setPopup();
      }

      // start state machine - fire processor function every second
      $scope.setBaseline = function(chan){
        $scope.baselining = true;
        $scope.baseline.channel = chan;
        //$scope.pageLogic.settings.baselines[$scope.pageLogic.settings.baselineMode][$scope.baseline.channel].value = 0;
        $scope.baseline.state = states.getReady;
        $scope.baseline.counter = $scope.baseline.state.count;
        $scope.baseline.msg = $scope.baseline.state.msg.replace('XT',''+$scope.baseline.counter);
        myometerPlot.addText($scope.baseline.msg);
        stateInterval = $interval(baselineProcessor,1000);
//        setPopup();
      };

      $scope.showLabelPopup = function(ind) {
        $scope.data = {
          input: generalData.settings.labels[ind]
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
            generalData.settings.labels[ind] = res;
            generalData.updateSettings();
          }
        });
       };

//      function setPopup(){
//        if (myPopup && myPopup.close){
//          myPopup.close();
//        }
//        myPopup = $ionicPopup.show({
//          title: $scope.baseline.msg,
//          scope: $scope,
//          buttons: [
//            { text: 'Cancel',
//              type: 'button-positive',
//              onTap: function() {
//                $scope.cancelBaseline();
//                myPopup.close();
//              }
//            }
//          ]
//        });
//      }

      $scope.clearBaseline = function(chan){
        $scope.pageLogic.settings.baselines[chan] = 0;
//        $scope.view.baselines = myometerLogic.settings.baselines.slice(0,myometerLogic.settings.nChannels);
      };

      function updateAnimate(){
        if ($scope.updating)return; // don't try to draw any graphics while the settings are being changed

        var dataBundle = dataHandler.getData(); // [timestamps, dataIn]
        if (dataBundle === null || dataBundle === angular.undefined ||
            dataBundle[0] === angular.undefined){return;}
        var dataIn = dataBundle[1];
        if (dataIn === null || dataIn === angular.undefined ||
            dataIn[0] === angular.undefined || dataIn[0].length === 0){return;}

        if (generalData.settings.tone.isEnabled) {
          if (generalData.settings.tone.mode === 'Proportional') {
            var soundSum = 0;
            for (var i = 0; i < dataIn[0].length; i++){
              soundSum += dataIn[0][i];
            }
            var avg = soundSum/dataIn[0].length;
            var diff = generalData.settings.tone.proportionalMaxFreq - generalData.settings.tone.proportionalMinFreq;
            var f = generalData.settings.tone.proportionalMinFreq + diff*avg/generalData.settings.scale;
            soundPlugin.setFrequency(f);
          }
        }

        // store data if we are taking a baseline
        if ($scope.baseline.state.name === 'measuring'){
          baselineData = baselineData.concat(dataIn[$scope.baseline.channel]);
        }

        // convert data to downsampled and scale-factored form
        var dataOut = [];
        for (var k = 0; k < myometerLogic.settings.nChannels; k++){
          var sum = 0;
          if (dataIn[k].length > 0){
            for (var iSum = 0; iSum < dataIn[k].length; iSum++){
              sum += Math.abs(dataIn[k][iSum]);
            }
            if ($scope.pageLogic.settings.baselineMode === 'absolute'){
              dataOut[k] = sum/dataIn[k].length - $scope.pageLogic.settings.baselines[k]; // adjusting to actual
            } else if ($scope.pageLogic.settings.baselineMode === 'relative'){
              if ($scope.pageLogic.settings.baselines[k]){
                dataOut[k] = 100 * (sum/dataIn[k].length) / $scope.pageLogic.settings.baselines[k]; // adjusting to actual
              } else {
                dataOut[k] = 100 * (sum/dataIn[k].length) / hardwareLogic.settings.vMax;
              }
            }
          } else {
            dataOut[k].value = 0; // just set to 0 if no values?
          }
        }

        myometerPlot.update(dataOut);
      }

      function paintStep(){
        if ($state.current.url === currentUrl){
          afID = window.requestAnimationFrame(paintStep);
          frameCounts++;
          if (frameCounts > 5){
            frameCounts = 0;
            updateAnimate();
          }
        }
      }

      function init() {
        if($state.current.url === currentUrl){
          myometerLogic.ready()
            .then(function(){
                myometerLogic.settings.nChannels = Math.min(myometerLogic.settings.nChannels,hardwareLogic.settings.nChannels);
                //console.log('INFO: Settings: '+angular.toJson(myometerLogic.settings));
//                $scope.view.labels = myometerLogic.settings.labels.slice(0,myometerLogic.settings.nChannels);
//                $scope.view.baselines = myometerLogic.settings.baselines.slice(0,myometerLogic.settings.nChannels);
                dataHandler.init(myometerLogic.settings.nChannels);
                for (var i= 0; i < myometerLogic.settings.filters.length; i++){
                    dataHandler.addFilter(myometerLogic.settings.filters[i]);
                }
    //            dataHandler.setMetrics(60);
                myometerPlot.init('#myometerWindow', myometerLogic.settings, generalData.settings.scale, generalData.settings.targets, updateTargets);
                paintStep();
            });
        }
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
          myometerPlot.changeScale(generalData.settings.scale);
          $scope.scaleModal.hide();
      };

      $scope.selectScale = function(index) {
          console.log('selected scale: ' + generalData.settings.scaleList[index] + ', via index: ' + index);
          $scope.selectedScale = generalData.settings.scaleList[index];
      };

      $scope.changeScale = function() {
          $scope.selectedScale = generalData.settings.scale;
          $ionicModal.fromTemplateUrl('pages/myometer/myometer-scale.html', {
              scope: $scope
          }).then(function(modal){
              $scope.scaleModal = modal;
              $scope.scaleModal.show();
          });
      };

      window.onresize = function(){
          if (afID){
            window.cancelAnimationFrame(afID);
          }
          afID = undefined;
          soundPlugin.stop();
          $scope.updating  = true;
          //console.log('INFO: Resize w:'+window.innerWidth+', h:'+window.innerHeight);
          myometerPlot.resize();
          $scope.updating  = false;
          paintStep();
      };

      init();

      // need to reset page and turn data back on when navigating back to the
      // page from other pages like settings, connection, etc.  But don't
      // want to init twice on first load!
      // var initialLoad = false;
      // $scope.$on('$ionicView.enter', function(){
      //   if (!initialLoad){
      //     initialLoad = true;
      //   } else {
      //     console.log('entered rms');
      //     $scope.onChange();
      //   }
      // });
    }]);

}());
