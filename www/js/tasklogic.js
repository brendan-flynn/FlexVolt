/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* Original Author:  Brendan Flynn
 * 
 * task factories
 * 
 */
(function () {
'use strict';

angular.module('flexvolt.taskLogic', [])

.factory('logicOptions', [function(){
    var api = {};
    
    api.colorOptions = ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf'];
    
    api.filterOptions = [
        {
          type: 'Rectify',
          name: 'Rectify'
        },
        {
          type: 'Gain',
          name: 'Gain',
          params: {
            gain: {
              name: 'Value',
              value: 1,
              input: {
                type: 'slider',
                range: {
                  low: 0.00,
                  high: 5.00,
                  step: 0.1
                }
              }
            }
          }
        },
        {
          type: 'Offset',
          name: 'Offset',
          params: {
            offset: {
              name: 'Value',
              value: 0,
              unit: 'bits',
              input: {
                type: 'slider',
                range: {
                  low: -25,
                  high: 25,
                  step: 1
                }
              }
            }
          }
        },
        {
          type: 'RMS',
          name: 'RMS',
          params: {
            windowSize: {
              name: 'Window Size',
              value: 21,
              unit: 'samples',
              input: {
                type: 'slider',
                range: {
                  low: 1,
                  high: 101,
                  step: 2
                }
              }
            }
          }
        },
        {
          type: 'Average',
          name: 'Average',
          params: {
            windowSize: {
              name: 'Window Size',
              value: 21,
              unit: 'samples',
              input: {
                type: 'slider',
                range: {
                  low: 1,
                  high: 101,
                  step: 2
                }
              }
            }
          }
        },
        {
          type: 'Velocity',
          name: 'Velocity',
          params: {
            windowSize: {
              name: 'Window Size',
              value: 25,
              unit: 'samples',
              input: {
                type: 'slider',
                range: {
                  low: 1,
                  high: 101,
                  step: 2
                }
              }
            }
          }
        },
        {
          type: 'Area',
          name: 'Area',
          params: {
            reducingFactor: {
              name: 'Reducing Factor',
              value: 25,
              input: {
                type: 'slider',
                range: {
                  low: 1,
                  high: 101,
                  step: 2
                }
              }
            }
          }
        },
        {
          type: 'DFT',
          name: 'Frequency - Low Pass',
          params: {
            f2: {
              name: 'Cutoff Frequency',
              value: 50,
              unit: 'Hz',
              input: {
                type: 'slider',
                range: {
                  low: 0,
                  high: 100,
                  step: 1
                }
              }
            },
            fS: {
                value: 1000
            },
            bandType: {
              value: 'LOW_PASS'
            }
          }
        },
        {
          type: 'DFT',
          name: 'Frequency - High Pass',
          params: {
            f1: {
              name: 'Cuton Frequency',
              value: 10,
              unit: 'Hz',
              input: {
                type: 'slider',
                range: {
                  low: 0,
                  high: 100,
                  step: 1
                }
              }
            },
            fS: {
                value: 1000
            },
            bandType: {
              value: 'HIGH_PASS'
            }
          }
        },
        {
          type: 'DFT',
          name: 'Frequency - Band Pass',
          params: {
            f1: {
              name: 'Cut-On Frequency',
              value: 5,
              unit: 'Hz',
              input: {
                type: 'slider',
                range: {
                  low: 0,
                  high: 100,
                  step: 1
                }
              }
            },
            f2: {
              name: 'Cut-Off Frequency',
              value: 50,
              unit: 'Hz',
              input: {
                type: 'slider',
                range: {
                  low: 0,
                  high: 100,
                  step: 1
                }
              }
            },
            fS: {
                value: 1000
            },
            bandType: {
              value: 'BAND_PASS'
            }
          }
        }
    ];
        
    api.gainList = [
        {text: '.5', value: 0.5},
        {text: '1', value: 1},
        {text: '1.5', value: 1.5},
        {text: '2', value: 2},
        {text: '5', value: 5}
    ];
    
    api.zoomList = [
        {text: "none", value: "NONE"},
        {text: "x/y", value: "X AND Y"},
        {text: "x only", value: "X ONLY"},
        {text: "y only", value: "Y ONLY"}
    ];
    
    return api;
}])

.factory('xyLogic', ['$q', 'flexvolt', 'storage', 'xyDot', function($q, flexvolt, storage, xyDot) {
    
    var deferred = $q.defer();
    var settings = {
        bounds : {
            min: 0,
            max: 255
        },
        thresh : {
            yH : '220',
            yL : '10',
            xH : '250',
            xL : '75'
        },
        plot : {
            thresh : true
        },
        fakeData : {
            useRandom: true,
            x: 128,
            y: 128
        }
    };
    
    storage.get('xySettings')
        .then(function(tmp){
            if (tmp){
                for (var field in tmp){
                    settings[field] = tmp[field];
                }
                console.log('DEBUG: settings: '+angular.toJson(settings));
            }
            deferred.resolve();
        });
    
    var x = 128, y = 128;
    
    function rms(arr){
        var ret = 0;
        for (var i = 0; i < arr.length; i++){
            ret += Math.pow((arr[i]-127.5),2);
        }
        ret = 2*Math.sqrt(ret/arr.length);
        return ret;
    }
    
    function updateAnimate(demo){
        //console.log('updating, demo:'+$stateParams.demo);
        //console.log('updating, threshmode:'+settings.plot.mode);
        var speed = 4;
        if (demo) {
            if (settings.fakeData.useRandom) {
                x = Math.min(Math.max(x+speed*(Math.random()-0.5),0),256);
                y = Math.min(Math.max(y+speed*(Math.random()-0.5),0),256);
                xyDot.update(x,y);
                return;
            } else {
                var dataIn = [];
                // have to trick the rms calculator into returning the numbers selected!
                dataIn[0] = [parseInt(settings.fakeData.x)/2+127.5];
                dataIn[1] = [parseInt(settings.fakeData.y)/2+127.5];
            }
        } else {
            //if (!flexvolt.api.isConnected){return;}  BROKEN?!
            var dataIn = flexvolt.api.getDataParsed();
            if (dataIn === null || dataIn === angular.undefined || dataIn[0] === angular.undefined){return;}

            var n = dataIn[0].length;
            if (n <= 0){return;}
        }

//            if (settings.mode.selected === 'Track raw data'){
//                x = dataIn[0][n-1];
//                y = dataIn[1][n-1];
//            } else 
        if (settings.plot.thresh){
            //console.log('thresh');
            //calculate RMS, then apply thresholds for motion
            var xtmp = rms(dataIn[0]);
            var ytmp = rms(dataIn[1]);
            //console.log(dataIn[0]);
            if (xtmp > settings.thresh.xH){
                x += speed;
            } else if (xtmp < settings.thresh.xL){
                x -= speed;
            }

            
            if (ytmp > settings.thresh.yH){
                y += speed;
            } else if (ytmp < settings.thresh.yL){
                y -= speed;
            }
            
            //console.log('x: '+xtmp+', y: '+ytmp);

            if (x > 255){x=255;}
            if (x < 0){ x=0;}
            if (y > 255){y=255;}
            if (y < 0){ y=0;}
        } else {
            //console.log('rms');
            // just track RMS
            x = rms(dataIn[0]);
            y = rms(dataIn[1]);
        }
        //console.log('x:'+x+', y:'+y);
        xyDot.update(x,y);
    }

    function updateSettings(){
        storage.set({xySettings:settings});
    }

    return {
        settings: settings,
        updateSettings: updateSettings,
        updateAnimate: updateAnimate,
        ready: function(){return deferred.promise;}
    };
}])
.factory('traceLogic', ['$q', 'storage', 'logicOptions', function($q, storage, logicOptions) {
    
    var deferred = $q.defer();
    var settings = {
        nChannels: 2,
        filters:[]
    };
    
    storage.get('traceSettings')
        .then(function(tmp){
            if (tmp){
                for (var field in tmp){
                    settings[field] = tmp[field];
                }
                //console.log('DEBUG: settings: '+angular.toJson(settings));
            }
            deferred.resolve();
        });

    function updateSettings(){
        storage.set({traceSettings:settings});
    }
    
    return {
        settings: settings,
        updateSettings: updateSettings,
        ready: function(){return deferred.promise;}
    };
}])
.factory('rmsTimeLogic', ['$q', 'storage', 'logicOptions', function($q, storage, logicOptions) {
    
    var deferred = $q.defer();
    var settings = {
        nChannels: 1,
        zoomOption: 'NONE',
        filters:[],
        xMax: 20,
        labels:[]
    };
    
    for (var j = 0; j < 8; j++){
      settings.labels.push({ch: (j+1),name: 'CH '+(j+1),color: logicOptions.colorOptions[j]});
    }
    
    storage.get('rmsTimeSettings')
        .then(function(tmp){
            if (tmp){
                for (var field in tmp){
                    settings[field] = tmp[field];
                }
                //console.log('DEBUG: settings: '+angular.toJson(settings));
            } else {
              settings.zoomOption = 'X AND Y';
              
              var F1 = angular.copy(logicOptions.filterOptions.filter(function(item){ return item.type === 'RMS';})[0]);
              F1.params.windowSize.value = 21;
              settings.filters.push(F1);
            }
            deferred.resolve();
        });

    function updateSettings(){
        storage.set({rmsTimeSettings:settings});
    }
    
    var xMaxList = [
        {text: "1", value: "1"},
        {text: "5", value: "5"},
        {text: "20", value: "20"},
        {text: "120", value: "120"}
    ];
    
    return {
        settings: settings,
        zoomList: logicOptions.zoomList,
        xMaxList: xMaxList,
        updateSettings: updateSettings,
        ready: function(){return deferred.promise;}
    };
}])
.factory('myometerLogic', ['$q', 'storage', 'logicOptions', function($q, storage, logicOptions) {
    
    var deferred = $q.defer();
    var settings = {
        nChannels: 1,
        zoomOption: 'NONE',
        filters:[],
        xMax: 20,
        baselineMode: undefined,
        baselineModeList: [{text: 'Absolute',value: 'absolute'},{text: 'Relative Max',value: 'relative'}],
        baselines: {},
        targets: {
          absolute: [50,50,50,50,50,50,50,50],
          relative:  [50,50,50,50,50,50,50,50]
        },
        labels: []
    };
    
    settings.baselineMode = settings.baselineModeList[0].value;
    for (var i = 0; i < settings.baselineModeList.length; i++){
      settings.baselines[settings.baselineModeList[i].value] = [];
    }
    
    for (var j = 0; j < 8; j++){
      settings.labels.push({ch: (j+1),name: 'CH '+(j+1)});
      settings.baselines['absolute'].push({ch: (j+1),value: 0});
      settings.baselines['relative'].push({ch: (j+1),value: 1.35});
    }
    
    storage.get('myometerSettings')
        .then(function(tmp){
            if (tmp){
                for (var field in tmp){
                    settings[field] = tmp[field];
                }
            } else {
              // Defaults - high pass to remove DC, RMS to downsample
              var Filter1 = angular.copy(logicOptions.filterOptions.filter(function(item){ return item.name === 'Frequency - High Pass';})[0]);
              Filter1.params.f1.value = 5;
              settings.filters.push(Filter1);
            }
            deferred.resolve();
        });

    function updateSettings(){
        storage.set({myometerSettings:settings});
    }
    
    return {
        settings: settings,
        updateSettings: updateSettings,
        ready: function(){return deferred.promise;}
    };
}])
.factory('snakeLogic', [function() {
    
    
}])
.factory('ekgLogic', [function() {
    
    
}])
.factory('hrvLogic', [function() {
    
    
}])


.factory('hardwareLogic', ['storage', function(storage) {
    console.log('initializing hardware settings');
    
    var channelList8 = [
        {text: '1', value: 1},
        {text: '2', value: 2},
        {text: '4', value: 4},
        {text: '8', value: 8}
    ];
    
    var channelList4 = [
        {text: '1', value: 1},
        {text: '2', value: 2},
        {text: '4', value: 4}
    ];
    
    var channelList2 = [
        {text: '1', value: 1},
        {text: '2', value: 2}
    ];
    
    var channelList1 = [
        {text: '1', value: 1}
    ];
    
    var channelList = channelList8;
    
    var availableChannelList = channelList8;
    
    var frequencyList = [
        {text: '50',  value: 50},
        {text: '100',  value: 100},
        {text: '200',  value: 200},
        {text: '500',  value: 500},
        {text: '1000', value: 1000},
        {text: '1500', value: 1500},
        {text: '2000', value: 2000}
    ];

    var settings = {
        nChannels: 4,
        frequency: 1000,
        bitDepth10: false,
        smoothFilterFlag: false,
        smoothFilterVal: 8
    };
    
    storage.get('hardwareSettings')
        .then(function(tmp){
            if (tmp){
                for (var field in tmp){
                    //console.log('getting field '+field);
                    settings[field] = tmp[field];
                }
                console.log('DEBUG: settings: '+angular.toJson(settings));
            } else {
                console.log('DEBUG: no settings found for hardware, using defaults');
            }
        });
    

    function updateSettings(){
        storage.set({hardwareSettings:settings});
    }
    
    return {
        channelList: channelList,
        availableChannelList: function(){
            if (settings.nChannels === 1){
                return channelList1;
            } else if (settings.nChannels === 2){
                return channelList2;
            } else if (settings.nChannels === 4){
                return channelList4;
            } else {
                return channelList8;
            }
        },
        frequencyList: frequencyList,
        settings: settings,
        updateSettings: updateSettings
    };
}])

;

}());
