/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* Original Author:  Brendan Flynn
 * 
 * app controllers
 * 
 */
(function () {
    'use strict';
    
    // convenience function for adding a popover
    function addPopover(ionicPopover, scope_, popName, html, updateFunction){
        ionicPopover.fromTemplateUrl(html, {
            scope: scope_
        }).then(function(popover) {
            scope_[popName] = popover;
        });
        scope_.$on('$destroy', function() {  scope_[popName].remove();  });
        if (updateFunction){
            scope_.$on('popover.hidden', function() {    updateFunction();  });
        }
    }

    angular.module('flexvolt.controllers', [])
    .controller('HomeCtrl', ['$scope', function($scope){
        $scope.apps = 
            {  row1:

                {
                    b1: {
                        icon:"icon ion-information-circled",
                        ref:"intro",
                        btnName:"Get Started"
                    },
                    b2: {
                        icon:"icon ion-ios-pulse-strong",
                        ref:"trace",
                        btnName:"Trace"
                    },
                    b3: {
                        icon:"icon ion-ios-navigate",
                        ref:"xy",
                        btnName:"Go Dot"
                    },
                    b4: {
                        icon:"icon ion-ios-game-controller-b",
                        ref:"snake",
                        btnName:"Snake Game"
                    }
                },
                row2:
                {    
                    b1:{
                        icon:"icon ion-speedometer",
                        ref:"myometer",
                        btnName:"Myometer"
                    },
                    b2:{
                        icon:"icon ion-ios-heart",
                        ref:"ekg",
                        btnName:"EKG"

                    },
                    b3:{
                        icon:"icon ion-android-stopwatch",
                        ref:"hrv",
                        btnName:"HRV"
                    },
                    b4:{
                        icon:"icon ion-ios-pulse",
                        ref:"rms",
                        btnName:"RMS Plot"
                    }
//                    b4:{
//                        icon:"icon ion-leaf",
//                        ref:"home",
//                        btnName:"Relax"                 
//                    }
                },
//                row3:{   
//                    b1:{
//                        icon:"icon ion-nuclear",
//                        ref:"home",
//                        btnName:"activity"
//                    },
//                    b2:{
//                        icon:"icon ion-ios-infinite",
//                        ref:"home",
//                        btnName:"mind"
//                    },
//                    b3:{
//                        icon:"icon ion-ios-body",
//                        ref:"home",
//                        btnName:"excercise"
//                    },
//                    b4:{
//                        icon:"icon ion-ios-game-controller-b",
//                        ref:"home",
//                        btnName:"controller"
//                    }
//                },
                row4:{   
//                    b1:{
//                        icon:"icon ion-navigate",
//                        ref:"circle",
//                        btnName:"test"
//                    },
                    b1:{
                        icon:"icon ion-briefcase",
                        ref:"demos",
                        btnName:"Demos"
                    },
                    b2:{
                        icon:"icon ion-help",
                        ref:"help",
                        btnName:"Help"
                    },
                    b3:{
                        icon:"icon ion-gear-b",
                        ref:"settings",
                        btnName:"Settings"
                    },
                    b4:{
                        icon:"icon ion-settings",
                        ref:"connection",
                        btnName:"Connection"
                    }
                }
            };
    }])
    .controller('DemoCtrl', ['$scope', function($scope){
        $scope.apps = 
            {  
                row1:{   
                    b1:{
                        icon:"icon ion-navigate",
                        ref:"xy({demo: true})",
                        btnName:"Go Dot Demo"
                    },
                    b2:{
                        icon:"icon ion-ios-pulse",
                        ref:"trace({demo: true})",
                        btnName:"Trace Demo"
                    },
                    b3:{
                        icon:"icon ion-ios-pulse",
                        ref:"rms({demo: true})",
                        btnName:"RMS Plot Demo"
                    },
                    b4:{
                        icon:"icon ion-speedometer",
                        ref:"myometer({demo: true})",
                        btnName:"Myometer"
                    }
//                    b4: {
//                        icon:"icon ion-ios-game-controller-b",
//                        ref:"snake",
//                        btnName:"Snake Demo"
//                    }
                }
            };
    }])
    .controller('SnakeCtrl', ['$scope', '$state', 'xyDot', '$ionicPopover', 
    function($scope, $state, xyDot, $ionicPopover) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);
        
        addPopover($ionicPopover, $scope, 'popover', 'snake-settings.html');
        addPopover($ionicPopover, $scope, 'helpover','snake-help.html');
        var afID;

        var frameCounts = 0;
        var speed = 4;
        var x = 128, y = 128;
//
//        xyDot.init('#snakeWindow');

//        function updateAnimate(){
//            if ($scope.updating) return;
//        }
//
//        function paintStep(timestamp){
//            if ($state.current.url === currentUrl){
//                afID = window.requestAnimationFrame(paintStep);
//                frameCounts++;
//                if (frameCounts > 5){
//                    frameCounts = 0;
//                    updateAnimate();
//                }
//            }
//        }
//
//        paintStep();
    }])
    .controller('GameCtrl', ['$scope', '$state', '$ionicPopover', 'flexvolt',
    function($scope, $state, $ionicPopover, flexvolt) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);
        
        addPopover($ionicPopover, $scope, 'popover', 'game-settings.html');
        addPopover($ionicPopover, $scope, 'helpover','game-help.html');
        var afID;

        function updateAnimate(){
            if ($scope.updating) return;
            
        }

        function paintStep(timestamp){
            if ($state.current.url === currentUrl){
                afID = window.requestAnimationFrame(paintStep);
                //console.log('repainting '+timestamp);
                updateAnimate();
            }
        }

        paintStep();
    }])
    .controller('MyometerCtrl', ['$scope', '$state', '$stateParams', '$ionicPopup','$ionicPopover', '$interval', 'myometerPlot', 'myometerLogic', 'dataHandler', 'hardwareLogic',
    function($scope, $state, $stateParams, $ionicPopup, $ionicPopover, $interval, myometerPlot, myometerLogic, dataHandler, hardwareLogic) {
      var currentUrl = $state.current.url;
      console.log('currentUrl = '+currentUrl);

      addPopover($ionicPopover, $scope, 'popover', 'myometer-settings.html', myometerLogic.updateSettings);
      addPopover($ionicPopover, $scope, 'filterpopover', 'templates/filter-popover.html', myometerLogic.updateSettings);
      addPopover($ionicPopover, $scope, 'helpover','myometer-help.html');
        
      var afID;
      var frameCounts = 0;
      var stateInterval, myPopup, baselineData;
      var GAIN = 1845; // 
      var factor = 1000*2.5/(GAIN*128);
      var yMax = 1000*2.5/GAIN;
        
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
      
      window.pl = myometerLogic;
      
      function updateTargets(chan,val){
        //console.log('DEBUG: updating target '+chan+' to '+val);
        $scope.pageLogic.settings.targets[$scope.pageLogic.settings.baselineMode][chan-1] = val;
        myometerLogic.updateSettings();
      };
      
      $scope.updateLabels = function(){
        //console.log('DEBUG: updated labels: '+angular.toJson(myometerLogic.settings.labels));
      }
      
//      $scope.editLabel = function(index){
//        $scope.pageLogic.settings.labels[index] = 
//      };
      
      $scope.$on('$destroy', function(e){
        console.log('DEBUG: $destroy: '+angular.toJson(e));
        $scope.cancelBaseline();
      });
//      $scope.$on('$locationChangeStart', function(e){
//        console.log('DEBUG: $locationChangeStart: '+angular.toJson(e));
//        console.log($state.current.url === currentUrl);
//      });
//      $scope.$on('$routeChangeStart', function(e){
//        console.log('DEBUG: $routeChangeStart: '+angular.toJson(e));
//        console.log($state.current.url === currentUrl);
//      });
//      
//      $scope.$on('$locationChangeSuccess', function(e){
//        console.log('DEBUG: $locationChangeSuccess: '+angular.toJson(e));
//        init();
//      });
      
      $scope.onChange = function(){
        if (afID){
          window.cancelAnimationFrame(afID);
        }
        afID = undefined;
        $scope.updating  = true;
        console.log('INFO: Settings changed');
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
              var avg = factor*sum/baselineData.length;
              avg = Math.round(avg*100)/100;
              
              $scope.pageLogic.settings.baselines[$scope.pageLogic.settings.baselineMode][$scope.baseline.channel].value = avg;
//              $scope.view.baselines = myometerLogic.settings.baselines.slice(0,myometerLogic.settings.nChannels);
              
              //console.log('DEBUG: updated baseline. myometerLogic: '+angular.toJson(myometerLogic));
            }

          }
        }
        $scope.baseline.msg = $scope.baseline.state.msg.replace('XT',''+$scope.baseline.counter);
        myometerPlot.addText($scope.baseline.msg);
//        setPopup();
      };
      
      // start state machine - fire processor function every second
      $scope.setBaseline = function(chan){
        //console.log('DEBUG: setBaseline called with '+chan);
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
        $scope.pageLogic.settings.baselines[$scope.pageLogic.settings.baselineMode][chan].value = 0;
//        $scope.view.baselines = myometerLogic.settings.baselines.slice(0,myometerLogic.settings.nChannels);
      };

      function updateAnimate(){
        if ($scope.updating)return; // don't try to draw any graphics while the settings are being changed

        var dataIn = dataHandler.getData();
        //console.log(dataIn);
        if (dataIn === null || dataIn === angular.undefined || 
            dataIn[0] === angular.undefined || dataIn[0].length === 0){return;}
    
        // store data if we are taking a baseline
        if ($scope.baseline.state.name === 'measuring'){
          baselineData = baselineData.concat(dataIn[$scope.baseline.channel]);
        }
        
        // convert data to downsampled and sacle-factored form
        var dataOut = [];
        for (var k = 0; k < myometerLogic.settings.nChannels; k++){
          var sum = 0;
          if (dataIn[k].length > 0){
            for (var i = 0; i < dataIn[k].length; i++){
              sum += Math.abs(dataIn[k][i]);
            }
            if ($scope.pageLogic.settings.baselineMode === 'absolute'){
              dataOut[k] = factor*sum/dataIn[k].length - $scope.pageLogic.settings.baselines[$scope.pageLogic.settings.baselineMode][k].value; // adjusting to actual
            } else if ($scope.pageLogic.settings.baselineMode === 'relative'){
              if ($scope.pageLogic.settings.baselines[$scope.pageLogic.settings.baselineMode][k].value){
                dataOut[k] = 100 * (factor*sum/dataIn[k].length) / $scope.pageLogic.settings.baselines[$scope.pageLogic.settings.baselineMode][k].value; // adjusting to actual
              } else {
                dataOut[k] = 100 * (factor*sum/dataIn[k].length) / yMax;
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
                myometerPlot.init('#myometerWindow', myometerLogic.settings, updateTargets);
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
    .controller('HRVCtrl', ['$scope', '$state', '$ionicPopover', 'flexvolt',
    function($scope, $state, $ionicPopover, flexvolt) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);
        
        addPopover($ionicPopover, $scope, 'popover', 'hrv-settings.html');
        addPopover($ionicPopover, $scope, 'helpover','hrv-help.html');
        
        var afID;
        

        function updateAnimate(){
            if ($scope.updating) return;
            
        }

        function paintStep(timestamp){
            if ($state.current.url === currentUrl){
                afID = window.requestAnimationFrame(paintStep);
                //console.log('repainting '+timestamp);
                updateAnimate();
            }
        }

        paintStep();
    }])
    .controller('EKGCtrl', ['$scope', '$state', '$ionicPopover', 'flexvolt',
    function($scope, $state, $ionicPopover, flexvolt) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);
        addPopover($ionicPopover, $scope, 'popover', 'ekg-settings.html');
        addPopover($ionicPopover, $scope, 'helpover','ekg-help.html');


        var afID;


        function updateAnimate(){
            if ($scope.updating) return;

        }

        function paintStep(timestamp){
            if ($state.current.url === currentUrl){
                afID = window.requestAnimationFrame(paintStep);
                //console.log('repainting '+timestamp);
                updateAnimate();
            }
        }

        paintStep();
    }])
    .controller('RecordCtrl', ['$scope', '$interval','dataHandler', function($scope, $interval, dataHandler){
        /***********Record Control****************/
        
        var timerInterval;
        
        $scope.recordControls = {
            live: true,
            recording: false,
            playingBack: false,
            recordedSignals: [
                {
                    name: '09:15:53',
                    data: [1,2,3,4]
                },
                {
                    name: '09:16373',
                    data: [1,2,3,4]
                }
            ],
            selectedRecord: undefined,
            recordTimer: 0
        };
        
        $scope.updateSelectedData = function(){
          if ($scope.recordControls.selectedRecord) {
              if ($scope.recordControls.live){
                  $scope.toggleLive();
              }
          } 
        };
        
        $scope.toggleLive = function(){
            $scope.recordControls.live = !$scope.recordControls.live;
            console.log('DEBUG: toggled live to '+$scope.recordControls.live);
        };
        
        $scope.togglePlayback = function(){
            $scope.recordControls.playingBack = !$scope.recordControls.playingBack;
            if ($scope.recordControls.playingBack){
                // stop playback
            } else {
                // start playback
            }
        };
        
        $scope.startRecording = function(){
            $scope.recordControls.recording = true;
            $scope.recordControls.recordTimer = 0;
            timerInterval = $interval(function(){
                $scope.recordControls.recordTimer += 1;
            },1000);
            dataHandler.startRecording();
            console.log('DEBUG: toggled recording on.');
        };
        
        $scope.stopRecording = function(){
            $scope.recordControls.recording = false;
            if (timerInterval){
                $interval.cancel(timerInterval);
                timerInterval = undefined;
            }
            $scope.recordControls.recordTimer = 0;
            dataHandler.stopRecording();
            console.log('DEBUG: toggled recording off.');
        };
        
        /**************************************/
    }])
    .controller('ConnectionCtrl', 
    ['$scope','$state','$timeout','$ionicModal','$ionicPopover','$ionicPopup','$http','flexvolt','appLogic',
    function($scope, $state, $timeout, $ionicModal, $ionicPopover, $ionicPopup, $http, flexvolt, appLogic) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);
        //addPopover($ionicPopover, $scope, 'helpover','settings-help.html');
                
        $scope.flexvolt = flexvolt;
        $scope.con = flexvolt.api.connection;

        $scope.portList = flexvolt.getPortList;
        $scope.prefPortList = flexvolt.getPrefPortList;
        
        $scope.bugReportFields = {
            name : '',
            email : '',
            comment : ''
        };  

        $scope.updatePorts = function(){
            flexvolt.api.updatePorts();
            // this timeout waits for the async list devices call to fill portList
            $timeout(function(){
                $scope.portList = flexvolt.getPortList;
            },500);
        };
        $scope.updatePorts();

        $scope.attemptToConnect = function(port){
            if (port !== angular.undefined){
                flexvolt.api.manualConnect(port);
            }
        };
        
        $scope.createFile = function(){
            chrome.fileSystem.chooseEntry({type: 'saveFile', 
                suggestedName: 'myfile.csv'}, 
                function(writableFileEntry) {
                    writableFileEntry.createWriter(function(writer) {
                        writer.onwriteend = function(e) {
                            console.log('Save complete!');
                        };
                        writer.write(new Blob(['test text to write'],{type: 'csv'})); 
                }, function(e){console.log('ERROR: in file writer: '+angular.toJson(e));});
            });
            
        };
        
        $scope.submitBugReport = function(){
            console.log('INFO: sending bugreport');
            var d = new Date();
            var month = d.getMonth()+1;
            if (month < 10) {month = '0'+month;};
            var date = d.getFullYear() + '-' + month + '-' + d.getDate();
            
            var cleanName = $scope.bugReportFields.name.replace(/[^a-z0-9.!]/gi, '');
            var cleanEmail = $scope.bugReportFields.email.replace(/[^a-z0-9.!]/gi, '');
            var cleanComment = $scope.bugReportFields.comment.replace(/[^a-z0-9.!]/gi, '');
            
            console.log('Name: '+$scope.bugReportFields.name+', cleanName: '+cleanName);
            console.log('Email: '+$scope.bugReportFields.name+', cleanEmail: '+cleanName);
            console.log('Comment: '+$scope.bugReportFields.name+', cleanComment: '+cleanName);
            
            var data = {
                date: date,
                time: d.toTimeString().slice(0,8),
                report: appLogic.dm.logs,
                browser: window.flexvoltPlatform,
                device: window.platform,
                fvmodel: flexvolt.api.connection.modelNumber !== angular.undefined?flexvolt.api.connection.modelNumber:0,
                fvserial: flexvolt.api.connection.serialNumber !== angular.undefined?flexvolt.api.connection.serialNumber:0,
                fvversion: flexvolt.api.connection.version !== angular.undefined?flexvolt.api.connection.version:0,
                name: cleanName,
                email: cleanEmail,
                comment: cleanComment
            };
            
            //window.data = data;
            
            var title = '';
            var msg = '';
            
            $http({
                method: 'POST',
                url: 'http://www.flexvoltbiosensor.com/wp-content/themes/coraline-child/bugreport.php',
                data: data,
                crossDomain : true,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            })
            .success(function (response) {
                console.log('DEBUG: bugreport response: '+angular.toJson(response));
                if (response !== angular.undefined && response.Error){
                    msg += 'Error in bug report generator.  Try again or contact software@flexvoltbiosensor.com for help.';
                } else if (response !== angular.undefined && response.Date !== angular.undefined 
                        && response.Date === data.date && response.Time !== angular.undefined && response.Time === data.time) {
                    msg += 'Successfully Submited a Bug Report.  Thank you for taking the time to help make the app better!';
                } else {
                    msg += 'Unknown error encountered during bug report upload.  Try again or contact software@flexvoltbiosensor.com for help.';
                }
                
            })
            .catch(function (err){
                console.log('ERROR: Failed connection to bugreport server: '+angular.toJson(err));
                msg += 'Bug Report Submission Failed To Connect to Server. Try again or contact software@flexvoltbiosensor.com for help.';
            })
            .finally(function(){
                $scope.bugmodal.hide();
                $ionicPopup.alert({
                  title: 'Bug Report Submission',
                  template: msg
                });
                
            });
        };

        $scope.dm = appLogic.dm;

        $ionicModal.fromTemplateUrl('templates/logmessages.html', {
            scope: $scope
        }).then(function(modal){
            $scope.modal = modal;
        });

        $scope.showLog = function(){
            $scope.modal.show();
        };
        
        
        $ionicModal.fromTemplateUrl('templates/bugreport.html', {
            scope: $scope
        }).then(function(modal){
            $scope.bugmodal = modal;
        });

        $scope.showBugReportForm = function(){
            $scope.bugmodal.show();
        };

    }])
    .controller('SettingsCtrl', 
    ['$scope','$state','flexvolt','hardwareLogic','file','appLogic',
    function($scope, $state, flexvolt, hardwareLogic, file, appLogic) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);
        
        $scope.channelList = hardwareLogic.channelList;
        $scope.frequencyList = hardwareLogic.frequencyList;
        $scope.settings = hardwareLogic.settings;
        console.log('hardware settings: '+angular.toJson(hardwareLogic.settings));
        
        $scope.file = file;        
        
        $scope.onChange = function(){
            console.log('settings now: '+angular.toJson(hardwareLogic.settings));
            hardwareLogic.updateSettings();
            flexvolt.api.updateSettings();
        };
        
        $scope.app = {
          version: appLogic.dm.version
        };
              
    }])
    .controller('IntroCtrl', ['$scope', function($scope){
//        $scope.emailTaskFeedback = 'mailto:software@flexvoltbiosensor.com?subject=inApp%20Task%20Feedback';
        
        // send email to software, with subject 'inApp Task Feedback'
//        $scope.sendEmail = function(){
//            var cr = '%0D%0A';
//            var bodyStart = 'Task Name: '+cr+'Feedback:'+cr+cr+'OR'+cr+cr+'New task request:';
//            var emailTaskFeedback = 'mailto:software@flexvoltbiosensor.com?subject=inApp%20Task%20Feedback&body='+bodyStart;
//            window.open(emailTaskFeedback);
//        };
    }])
    .controller('FiltersCtrl', ['$scope', 'logicOptions', function($scope, logicOptions){
        /*******Filter Control*********/
        console.log('filtersCtrl loaded with: '+angular.toJson($scope.pageLogic));
        
        $scope.data = {
            state: undefined,
            newFilter: undefined,
            filterOptions: logicOptions.filterOptions
        };

        $scope.resetNewFilter = function(){
            $scope.data.newFilter = {
              type: undefined,
              name: undefined,
              params: undefined
            };
        };

        $scope.addFilter = function(){
            $scope.pageLogic.settings.filters.push(angular.copy($scope.data.newFilter));
            console.log('added filter: '+angular.toJson($scope.data.newFilter));
            $scope.resetNewFilter();
            $scope.onChange();
        };
        
        $scope.moveFilter = function(item, fromIndex, toIndex) {
            $scope.pageLogic.settings.filters.splice(fromIndex, 1);
            $scope.pageLogic.settings.filters.splice(toIndex, 0, item);
            $scope.onChange();
        };

        $scope.onFilterDelete = function(item) {
            $scope.pageLogic.settings.filters.splice($scope.pageLogic.settings.filters.indexOf(item), 1);
            $scope.onChange();
            //delete(item);
        };
        
        /* ********* */
    }])
    .controller('MainCtrl', ['$scope', 'flexvolt', 'appLogic', 'storage', 'dataHandler', 'filters',
    function($scope, flexvolt, appLogic, storage, dataHandler, filters) {
        // high level container for app-wide functions/variables
        $scope.mobile = false;
        $scope.flexvolt=flexvolt;
        if (window.cordova) {$scope.mobile = true;}
        console.log('mobile = '+$scope.mobile);
        
        window.flexvolt = flexvolt;
        window.dataHandler = dataHandler;
        window.filters = filters;
    }]);
}());
