(function () {
    'use strict';

    angular.module('flexvolt.myometer', [])

    .controller('MyometerCtrl', ['$scope', '$state', '$stateParams', '$ionicPopup','$ionicPopover', '$interval', 'myometerPlot', 'myometerLogic', 'dataHandler', 'hardwareLogic', 'customPopover',
    function($scope, $state, $stateParams, $ionicPopup, $ionicPopover, $interval, myometerPlot, myometerLogic, dataHandler, hardwareLogic, customPopover) {
      var currentUrl = $state.current.url;
      console.log('currentUrl = '+currentUrl);

      customPopover.add($ionicPopover, $scope, 'popover', 'pages/myometer/myometer-settings.html', myometerLogic.updateSettings);
      customPopover.add($ionicPopover, $scope, 'filterpopover', 'templates/filter-popover.html', myometerLogic.updateSettings);
      customPopover.add($ionicPopover, $scope, 'helpover','pages/myometer/myometer-help.html');

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

      $scope.demo = $stateParams.demo;

      $scope.pageLogic = myometerLogic;
      $scope.hardwareLogic = hardwareLogic;
      $scope.updating = false;
      $scope.baselining = false;

      function updateTargets(chan,val){
        //console.log('DEBUG: updating target '+chan+' to '+val);
        $scope.pageLogic.settings.targets[$scope.pageLogic.settings.baselineMode][chan-1] = val;
        myometerLogic.updateSettings();
      };

      $scope.updateLabels = function(){
        //console.log('DEBUG: updated labels: '+angular.toJson(myometerLogic.settings.labels));
      }

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
      };

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
          input: $scope.pageLogic.settings.labels[ind]
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
            $scope.pageLogic.settings.labels[ind] = res;
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

        var dataIn = dataHandler.getData();
        if (dataIn === null || dataIn === angular.undefined ||
            dataIn[0] === angular.undefined || dataIn[0].length === 0){return;}

        // store data if we are taking a baseline
        if ($scope.baseline.state.name === 'measuring'){
          baselineData = baselineData.concat(dataIn[$scope.baseline.channel]);
        }

        // convert data to downsampled and scale-factored form
        var dataOut = [];
        for (var k = 0; k < myometerLogic.settings.nChannels; k++){
          var sum = 0;
          if (dataIn[k].length > 0){
            for (var i = 0; i < dataIn[k].length; i++){
              sum += Math.abs(dataIn[k][i]);
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

        //console.log(dataOut);

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
        } else if ($state.current.url === '/connection'){
          afID = window.requestAnimationFrame(paintStep);
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
                myometerPlot.init('#myometerWindow', myometerLogic.settings, hardwareLogic.settings.vMax, updateTargets);
                paintStep();
            });
        }
      }

      window.onresize = function(){
          if (afID){
            window.cancelAnimationFrame(afID);
          }
          afID = undefined;
          $scope.updating  = true;
          //console.log('INFO: Resize w:'+window.innerWidth+', h:'+window.innerHeight);
          myometerPlot.resize();
          $scope.updating  = false;
          paintStep();
      };

      init();
    }])

}())
