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
              unit: 'uV',
              input: {
                type: 'slider',
                range: {
                  low: -50,
                  high: 50,
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
              unit: 'ms',
              input: {
                type: 'slider',
                range: {
                  low: 10,
                  high: 500,
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
              unit: 'ms',
              input: {
                type: 'slider',
                range: {
                  low: 10,
                  high: 500,
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
              unit: 'ms',
              input: {
                type: 'slider',
                range: {
                  low: 10,
                  high: 500,
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

.factory('xyLogic', ['$q', 'storage', function($q, storage) {

    var deferred = $q.defer();
    var settings = {
        thresh : {
            yH : '0.8',
            yL : '0.4',
            xH : '0.8',
            xL : '0.4'
        },
        plot : {
            thresh : true
        },
        fakeData : {
            useRandom: true,
            x: 0.75,
            y: 0.75
        }
    };

    storage.get('xySettings')
        .then(function(tmp){
            if (tmp){
                for (var field in tmp){
                    settings[field] = tmp[field];
                }
                //console.log('DEBUG: settings: '+angular.toJson(settings));
            } else {
                var filter1 = angular.copy(logicOptions.filterOptions.filter(function(item){ return item.name === 'Frequency - High Pass';})[0]);
                filter1.params.f1.value = 5;
                settings.filters.push(filter1);
                var filter2 = angular.copy(logicOptions.filterOptions.filter(function(item){ return item.type === 'RMS';})[0]);
                filter2.params.windowSize.value = 21;
                settings.filters.push(filter2);
            }
            deferred.resolve();
        });

    function updateSettings(){
        storage.set({xySettings:settings});
    }

    return {
        settings: settings,
        updateSettings: updateSettings,
        ready: function(){return deferred.promise;}
    };
}])
.factory('traceLogic', ['$q', 'storage', function($q, storage) {

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
        windowMin: 10,
        windowMax: 500,
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
              settings.zoomOption = 'NONE';

              var F1 = angular.copy(logicOptions.filterOptions.filter(function(item){ return item.type === 'RMS';})[0]);
              F1.params.windowSize.value = 21;
              settings.filters.push(F1);
            }
            deferred.resolve();
        });

    function updateSettings(){
        storage.set({rmsTimeSettings:settings});
    }

    // var xMaxList = [
    //     {text: "1", value: "1"},
    //     {text: "5", value: "5"},
    //     {text: "20", value: "20"},
    //     {text: "120", value: "120"}
    // ];

    return {
        settings: settings,
        zoomList: logicOptions.zoomList,
        // xMaxList: xMaxList,
        updateSettings: updateSettings,
        ready: function(){return deferred.promise;}
    };
}])
.factory('generalData', ['$q', 'storage', 'logicOptions', function($q, storage, logicOptions){
    var deferred = $q.defer();
    var settings = {
        baselineModeList: [{text: 'Absolute',value: 'absolute'},{text: 'Relative Max',value: 'relative'}],
        baselineMode: undefined,
        baselines: [],
        mvcs: [],
        targets: {
          absolute: [500,500,500,500,500,500,500,500],
          relative:  [50,50,50,50,50,50,50,50]
        },
        labels: [],
        scale: 100,
        scaleList: [10, 20, 50, 100, 500, 1000, 1500],
        tone: {
            enable: false,
            modeList: ['Proportional', 'Threshold'],
            mode: 'Proportional',
            volume: 50,
            thresholdTypeList : ['Below', 'Above'],
            thresholdType: 'Below',
            proportionalMinFreq: 440,
            proportionalMaxFreq: 1760,
            aboveThresholdFreq: 880,
            aboveThreshold: 500,
            belowThresholdFreq: 440,
            belowThreshold: 20
        }
    };

    storage.get('generalData')
        .then(function(tmp){
            if (tmp){
                for (var field in tmp){
                    settings[field] = tmp[field];
                }
            } else {
              // Defaults
              settings.baselineMode = settings.baselineModeList[0].value;

              for (var j = 0; j < 8; j++){
                settings.labels.push('CH '+(j+1));
                settings.baselines.push(0);
                settings.mvcs.push(0);
              }
            }
            deferred.resolve();
        });

    function updateSettings(){
        storage.set({generalData:settings});
    }

    return {
        settings: settings,
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
        baselines: [],
        targets: {
          absolute: [0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8],
          relative:  [50,50,50,50,50,50,50,50]
        },
        labels: []
    };

    settings.baselineMode = settings.baselineModeList[0].value;

    for (var j = 0; j < 8; j++){
      settings.labels.push('CH '+(j+1));
      settings.baselines.push(0);
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
.factory('balloonLogic', ['$q', 'storage', 'logicOptions', function($q, storage, logicOptions) {

    var deferred = $q.defer();
    var settings = {
      filters: [],
        baseline: undefined,
        label: undefined,
        presets: [],
        intensity: {
          min: 0,
          max: 100,
          step: 5,
          threshold: 50
        },
        time: {
          min: 0.2,
          max: 5,
          step: 0.1,
          threshold: 1
        }
    };

    storage.get('balloonSettings')
        .then(function(tmp){
            if (tmp){
                for (var field in tmp){
                    settings[field] = tmp[field];
                }
            } else {
              // Defaults - high pass to remove DC, RMS to downsample
              var filter1 = angular.copy(logicOptions.filterOptions.filter(function(item){ return item.name === 'Frequency - High Pass';})[0]);
              filter1.params.f1.value = 5;
              settings.filters.push(filter1);
              var filter2 = angular.copy(logicOptions.filterOptions.filter(function(item){ return item.type === 'RMS';})[0]);
              filter2.params.windowSize.value = 21;
              settings.filters.push(filter2);
            }
            deferred.resolve();
        });

    function updateSettings(){
        storage.set({balloon:settings});
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

    var rmsWindowList = [
        {text: '8', value: 3},
        {text: '16', value: 4},
        {text: '32', value: 5},
        {text: '64', value: 6},
        {text: '128', value: 7},
        {text: '256', value: 8},
        {text: '512', value: 9},
        {text: '1024', value: 10}
    ];

    var exportModeList = [
        {text: 'Raw Data', value: 'raw'},
        {text: 'Processed Data', value: 'processed'},
        {text: 'Raw + Processed', value: 'raw + processed'}
    ];

    var settings = {
        nChannels: 4,
        frequency: 1000,
        bitDepth10: false,
        smoothFilterFlag: false,
        smoothFilterMode: 0, // 0 is shift filter, 1 is RMS
        hpFilterFlag: false,
        smoothFilterVal: 5,
        downSampleCount: 1,
        rmsWindowSizePower: 5,
        enableBatteryTest: true,
        exportMode: 'raw',
        vMax: undefined, //1.355mV, usb, default,
        frequencyCustom : 0,
        timer0PartialCount : 6, // empirical
        timer0AdjustVal : 10, // empirical
        prescalerPic : 2,
        plugTestDelay : 0
    };

    var timerAdjustments = {
        frequencyDefaults: {
            500: {
                timer0AdjustVal : 20,
                timer0PartialCount : 6
            },
            1000: {
                timer0AdjustVal : 10,
                timer0PartialCount : 6
            },
            2000: {
                timer0AdjustVal : 9,
                timer0PartialCount : 6
            }
        },
        defaultTimer0AdjustVal: 10,
        defaultTimer0PartialCount: 6
    };

    /* Timing Settings
     * 1kHz
     * timer0PartialCount: 8
     * timer0AdjustVal: 9
     * interval slightly too small

     * timer0PartialCount: 7
     * timer0AdjustVal: 9
     * interval slightly too small
     *
     * 500Hz
     */

    var constants = {
        smoothFilterMode_Shift: 0,
        smoothFilterMode_RMS: 1
    };

    storage.get('hardwareSettings')
        .then(function(tmp){
            if (tmp){
                for (var field in tmp){
                    //console.log('getting field '+field);
                    settings[field] = tmp[field];
                }
                console.log('DEBUG: hardware settings: '+angular.toJson(settings));
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
        rmsWindowList: rmsWindowList,
        settings: settings,
        updateSettings: updateSettings,
        constants: constants,
        timerAdjustments: timerAdjustments
    };
}])

;

}());
