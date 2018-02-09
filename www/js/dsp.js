/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* Author: Brendan Flynn
 *
 * Stand-alone factory to handle all FlexVolt digital signal processing
 *
 *
 */

(function () {
'use strict';

angular.module('flexvolt.dsp', [])

.factory('dataHandler', ['flexvolt', '$stateParams', '$ionicPopup', '$interval', '$state', 'storage', 'hardwareLogic', 'filters', 'file', 'records',
    function (flexvolt, $stateParams, $ionicPopup, $interval, $state, storage, hardwareLogic, filters, file, records) {

        window.file = file;
        // list of possible filters
        var filterList = [];

        var localRecordedData = [];
        var recordedDataTime = [];
        var recordedDataRaw = [];
        var recordedDataProcessed = [];
        var recordedDataFile = undefined;
        var selectedRecordLocal = undefined;
        var nChannels = 1; // default
        var metricsArr, metricsFlag = false, metricsNPoints = 500;
        var demoVals = {
            fs: 1000,
            time: 0,
            startTime: undefined,
            randAmplitude: 10,
            amplitudes: [.50, .50, .50, .50, .50, .50, .50, .50],
            frequencies: [0, 0.10, 0.5, 1, 5, 10, 50, 100]
        };

        var timerInterval;

        var api = {
            init: undefined,

            setMetrics: undefined,
            rmMetrics: undefined,
            getMetrics: undefined,
            getData: undefined,
            addFilter: undefined,
            rmFilter: undefined,

            controls: {
                live: true, // live vs playingBack
                paused: false, // can pause live only - playback is single screen?
                recording: false, // can only record live

                toggleLive: undefined,
                pause: undefined, // accessor methods
                resume: undefined,

                startRecording: undefined,
                stopRecording: undefined,
                recordTimer: 0,
                selectedRecord: undefined,
                serveRecord: undefined
            }
        };

        // Demo simulation data
        function generateData(G) {
            G = (G !== angular.undefined)?G:1;
            var genTimes = [];
            var genData = [];
            var tmpTime = Date.now();
            var nPoints = Math.round(demoVals.fs*(tmpTime - demoVals.startTime)/1000);

            demoVals.startTime = tmpTime;

            for (var i = 0; i<nPoints; i++) {
                demoVals.time += 1000/demoVals.fs;
                genTimes[i] = demoVals.time;
                for (var ch = 0; ch < nChannels; ch++){
                    if (i === 0){
                        genData[ch] = [];
                    }
                    genData[ch][i] = G*demoVals.amplitudes[ch]*Math.sin((demoVals.time/1000)*2*Math.PI*demoVals.frequencies[ch]);
                }
            }
            return [genTimes, genData];
        }

        // memory management - completely remove all reference to filter objects
        // so garbage collector will mark and delete
        function clearFilterList(){
            for (var iList = 0; iList < filterList.length; iList++){
                var subList = filterList[iList];
                for (var iSub = 0; iSub < subList.length; iSub++){
                    delete subList[iSub];
                }
            }
            filterList = [];
        }

        // Handles changes to settings in real time
        api.init = function(nChan){
            var tmp = Date.now();
            demoVals.startTime = tmp;  // only needed for demo simulation
            demoVals.time = tmp;
            demoVals.fs = hardwareLogic.settings.frequency;
            nChannels = nChan;  // have a default of 1

            // clear all filters (otherwise filters get carried between pages!
            clearFilterList();
            for (var i = 0; i < nChan; i++){
                filterList[i] = [];
            }
        };

        api.addFilter = function(newFilter){
            for (var i = 0; i < nChannels; i++){
                filterList[i].push(new filters(newFilter, hardwareLogic.settings.frequency));
            }
        };

        console.log('DEBUG: filterList: '+filterList);

        // Set metrics buffering
        // api.setMetrics = function(nDataPoints){
        //     metricsFlag = true;
        //     metricsArr = [];
        //     for (var iChan = 0; iChan < nChannels; iChan++) {
        //       metricsArr[iChan] = {
        //         min: 0,
        //         max: 0,
        //         mean: 0
        //       };
        //     }
        //     if (nDataPoints !== angular.undefined){
        //         metricsNPoints = nDataPoints; // default
        //     }
        // };

        api.setMetrics = function(nDataPoints){
            metricsFlag = true;
            metricsArr = [];
            for (var iChan = 0; iChan < nChannels; iChan++) {
              metricsArr[iChan] = [];
            }
            if (nDataPoints !== angular.undefined){
                metricsNPoints = nDataPoints; // default
            }
        };

        // api.getMetrics = function(){
        //     var tic = performance.now();
        //     var ret = [];
        //     for (var ch = 0; ch < metricsArr.length; ch++){
        //         ret[ch] = {
        //             minAmplitude: metricsArr[ch].min,
        //             maxAmplitude: metricsArr[ch].max,
        //             meanAmplitude: metricsArr[ch].mean
        //         };
        //     }
        //     var toc = performance.now();
        //     console.log('getMetrics new took ' + (toc-tic));
        //     return ret;
        // };

        api.getMetrics = function(){
            // var tic = performance.now();
            var ret = [];
            for (var ch = 0; ch < metricsArr.length; ch++){
                ret[ch] = {
                    minAmplitude: undefined,
                    maxAmplitude: undefined,
                    meanAmplitude: undefined
                };
                var tmp = metricsArr[ch];
                ret[ch].minAmplitude = Math.min.apply(Math,tmp);
                ret[ch].maxAmplitude = Math.max.apply(Math,tmp);
                var tmpSum = 0;
                for (var i = 0; i < tmp.length; i++){
                    tmpSum += tmp[i];
                }
                ret[ch].meanAmplitude = tmpSum/tmp.length;
            }
            // var toc = performance.now();
            // console.log('getMetrics old took ' + (toc-tic));
            return ret;
        };

        api.rmMetrics = function(){metricsFlag = false;};

        // function addToMetrics(data){
        //     var tic = performance.now();
        //     for (var ch = 0; ch < data.length; ch++){
        //         if (metricsArr[ch] === angular.undefined){
        //             metricsArr[ch] = {
        //               min: 0,
        //               max: 0,
        //               mean: 0
        //             };
        //         }
        //         metricsArr[ch].max = Math.max(metricsArr[ch].max, Math.max.apply(Math, data[ch]));
        //         metricsArr[ch].min = Math.min(metricsArr[ch].min, Math.min.apply(Math, data[ch]));
        //         data[ch].forEach(function(datum) {
        //           metricsArr[ch].mean = metricsArr[ch].mean + (datum - metricsArr[ch].mean)/metricsNPoints;
        //         });
        //     }
        //     var toc = performance.now();
        //     console.log('addToMetrics new took ' + (toc-tic));
        // }

        function addToMetrics(data){
            // var tic = performance.now();
            for (var ch = 0; ch < data.length; ch++){
                if (metricsArr[ch] !== angular.undefined){
                    metricsArr[ch] = metricsArr[ch].concat(data[ch]);
                } else {
                    metricsArr[ch] = data[ch];
                }
                metricsArr[ch] = metricsArr[ch].slice(metricsArr[ch].length-metricsNPoints);
            }
            // var toc = performance.now();
            // console.log('addToMetrics old took ' + (toc-tic));
        }

        api.controls.serveRecord = function() {
            selectedRecordLocal = api.controls.selectedRecord.data;
        };

        api.getData = function(){
            var dataBundle;
            var parsedData, timestamps;
            // Get Data (real or simulated)
            if (!api.controls.live) {
                // only serve this data once, then undefined
                dataBundle = selectedRecordLocal; // [timestamps, dataIn]
                selectedRecordLocal = undefined;
                return dataBundle;
            } else {
              if ($stateParams.demo){
                  // simulate data
                  dataBundle = generateData(); // [timestamps, dataIn]
              } else {
                  dataBundle = flexvolt.api.getDataParsed(); // [timestamps, dataIn]
              }
            }

            // if we are paused, getDataParsed clears the flexvolt service buffer, then do not waste time running filters or saving data
            if (api.controls.paused) {
                return undefined;
            }

            if (dataBundle === null || dataBundle === angular.undefined || dataBundle[0] === angular.undefined || dataBundle[0].length <= 0){
                parsedData = [];
                timestamps = [];
                for (var i = 0; i < nChannels; i++){
                    parsedData[i] = [];
                }
                return [timestamps, parsedData];
            }

            timestamps = dataBundle[0];
            parsedData = dataBundle[1];

            // save raw data if specified
            if (api.controls.recording){
                recordedDataTime = recordedDataTime.concat(timestamps);
                for (var i = 0; i < nChannels; i++){
                    recordedDataRaw[i] = recordedDataRaw[i].concat(parsedData[i]);
                    localRecordedData[i] = localRecordedData[i].concat(parsedData[i]);
                }
            }

            // Make this faster by only processing nChannels
            parsedData.splice(nChannels);

            // run any filters
            for (var i = 0; i < nChannels; i++){
                for (var ind in filterList[i]){
                    parsedData[i] = filterList[i][ind].apply(parsedData[i], hardwareLogic.settings.frequency );
                }
            }

            // save processed data if specified
            if (api.controls.recording) {
                for (var i = 0; i < nChannels; i++){
                    recordedDataProcessed[i] = recordedDataProcessed[i].concat(parsedData[i]);
                }
                if (recordedDataProcessed[0].length > 5000) {
                  saveRecordedData();
                }
            }

            // Calculate metrics if set (using DFT-filtered data array (NOT structurally changed RMS-filtered structure)
            if (metricsFlag) {
                addToMetrics(parsedData);
            }

            return [timestamps, parsedData];
        };

        function initRecordedData() {
            // clear recorded data
            localRecordedData = [];
            recordedDataRaw = [];
            recordedDataProcessed = [];
            recordedDataTime = ['Time (ms)'];
            for (var i = 0; i < nChannels; i++){
                recordedDataRaw[i] = ['Chan ' + (i+1) + ' Raw'];
                recordedDataProcessed[i] = ['Chan ' + (i+1) + 'Processed'];
                localRecordedData[i] = [];
            }
        }

        function clearRecordedData() {
          // clear recorded data
          recordedDataRaw = [];
          recordedDataProcessed = [];
          recordedDataTime = [];
          for (var i = 0; i < nChannels; i++){
              recordedDataRaw[i] = [];
              recordedDataProcessed[i] = [];
          }
        }

        function saveRecordedData(){
            var tmp = [recordedDataTime];
            for (var i = 0; i < nChannels; i ++){
              tmp.push(recordedDataRaw[i].map(function(val){return typeof(val)==='number'?(val*1000).toFixed(3):val}));
            }
            for (var i = 0; i < nChannels; i ++){
              tmp.push(recordedDataProcessed[i].map(function(val){return typeof(val)==='number'?(val*1000).toFixed(3):val}));
            }
            clearRecordedData();
            // add data to the running txt file
            file.writeFile(recordedDataFile, tmp);
        };

        api.controls.pause = function() {
            api.controls.paused = true;
        }

        api.controls.resume = function() {
            api.controls.paused = false;
        }

        api.controls.toggleLive = function() {
          api.controls.live = !api.controls.live;
        }

        api.controls.startRecording = function(){
            if (angular.isDefined(file.path)) {
              api.controls.recording = true;
              api.controls.recordTimer = 0;
              timerInterval = $interval(function(){
                  api.controls.recordTimer += 1;
              },1000);
              initRecordedData();
              var d = new Date();
              recordedDataFile = 'flexvolt-recorded-data--'+d.getFullYear()+'-'
                  +(d.getMonth()+1)+'-'+d.getDate()+'--'
                  +d.getHours()+'-'+d.getMinutes()+'-'
                  +d.getSeconds();
              file.openFile(recordedDataFile);
            } else {
              $ionicPopup.alert({
                title: 'Data Export - Folder Not Set',
                template: 'Please set an export folder on the settings page.'
              });
            }
        };

        api.controls.stopRecording = function(){
            console.log('stopped recording');
            api.controls.recording = false;
            if (timerInterval){
                $interval.cancel(timerInterval);
                timerInterval = undefined;
            }
            api.controls.recordTimer = 0;

            // write and close txt file
            saveRecordedData();
            file.closeFile();
            recordedDataFile = undefined;

            // put the record in records container for later viewing
            var newRecord = {
              task: $state.current.name,
              dateTime: (new Date()).toLocaleString(),
              length: localRecordedData[0].length,
              settings: hardwareLogic.settings,
              data: localRecordedData
            }
            localRecordedData = [];
            records.put(newRecord);
        };

        return api;
    }
])


.factory('filters', [function(){

    var filters = {
        Rectify: {
            apply: rectify
        },
        Gain: {
            apply: gain
        },
        Offset: {
            apply: offset
        },
        RMS: {
            apply: rms,
            init: function(p){p.buffer = [];}
        },
        Average: {
            apply: average,
            init: function(p){p.buffer = [];}
        },
        Velocity: {
            apply: velocity,
            init: function(p){p.buffer = [];}
        },
        Area: {
            apply: area,
            init: function(p){p.storedArea = 0;}
        },
        DFT: {
            apply: dftApply,
            init: dftInit
        }
    };

    var Filter = function(newFilter, frequency){
        this.filterType = newFilter.type;
        this.params = (newFilter.params)?angular.copy(newFilter.params):{}; // deep copy, so each object actually has its own params
        this.params.frequency = frequency;
        if (filters[this.filterType] && filters[this.filterType].init) {filters[this.filterType].init(this.params);}
        this.apply = function(data){
            return filters[this.filterType].apply(data,this.params);
        };
    };

    function rectify(data, params){
        //console.log('Rectify apply');
        for (var i in data){
            data[i] = Math.abs(data[i]);
        }
        return data;
    }

    function gain(data, params){
        //console.log('Gain apply');
        for (var i in data){
            data[i] = params.gain.value*data[i];
        }
        return data;
    }

    function offset(data, params){
        //console.log('Offset apply'+JSON.stringify(data));
        for (var i in data){
            data[i] = data[i] + params.offset.value/1000;
        }
        //console.log(JSON.stringify(data));
        return data;
    }

    function average(dataIn, params){
        var timeWindow = params.windowSize.value*params.frequency/1000;
        function calc(dIn, windowSize){
            var w = Math.floor(windowSize/2);
            var dOut = [];
            for (var i = w; i < dIn.length - w; i++){
                var sum = 0;
                for (var is = i-w; is <= i+w; is++){
                    sum += dIn[is];
                }
                dOut[i-w] = sum/windowSize;
            }
            return dOut;
        }
        params.buffer = params.buffer.concat(dataIn);
        var dataOut = calc(params.buffer, timeWindow);
        params.buffer.splice(0,params.buffer.length-2*Math.floor(timeWindow/2));
        return dataOut;
    }

    function rms(dataIn, params){
        var timeWindow = params.windowSize.value*params.frequency/1000;
        //console.log('dataIn: '+angular.toJson(dataIn));
        function calc(dIn, windowSize){
            var w = Math.floor(windowSize/2);
            var dOut = [];
            for (var i = w; i < dIn.length - w; i++){
                var sum = 0;
                for (var is = i-w; is <= i+w; is++){
                    sum += dIn[is]*dIn[is];
                }
                dOut[i-w] = Math.sqrt(sum/windowSize);
            }
            return dOut;
        }
        // add data onto buffer, only if input is defined and length is not 0
//        if (dataIn !== angular.undefined && dataIn.length > 0){
//            if (params.buffer !== angular.undefined){
//                params.buffer = params.buffer.concat(dataIn);
//            } else {
//                params.buffer = dataIn;
//            }
//        }
        params.buffer = params.buffer.concat(dataIn);
        var dataOut = calc(params.buffer, timeWindow);
        params.buffer.splice(0,params.buffer.length-2*Math.floor(timeWindow/2));
        //console.log('dataOut: '+angular.toJson(dataOut));
        return dataOut;
    }

    function velocity(dataIn, params){
        var timeWindow = params.windowSize.value*params.frequency/1000;
        function calc(dIn, windowSize){
            var w = Math.floor(windowSize/2);
            var dOut = [];
            for (var i = w; i < dIn.length - w; i++){
                var sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
                for (var is = i-w; is <= i+w; is++){
                    sumX += is;
                    sumY += dIn[is];
                    sumXY += is*dIn[is];
                    sumXX += is*is;
                }
                var slope = ((sumXY - sumX * sumY / windowSize) ) / (sumXX - sumX * sumX / windowSize);
                //console.log('x: '+sumX+', y: '+sumY+', xy: '+sumXY+', xx: '+sumXX+', ws: '+windowSize+', slope: '+slope);
                dOut[i-w] = 32*slope;
            }
            return dOut;
        }
        params.buffer = params.buffer.concat(dataIn);
        var dataOut = calc(params.buffer, timeWindow);
        params.buffer.splice(0,params.buffer.length-2*Math.floor(timeWindow/2));
        //console.log('dataOut: '+angular.toJson(dataOut));
        return dataOut;
    }

    function area(dataIn, params){
        var dataOut = [];
            for (var i in dataIn){
                params.storedArea += dataIn[i]/params.reducingFactor.value;
                dataOut[i] = params.storedArea;
            }
        return dataOut;
    }

    // DFT filter - low-pass, high-pass, band-pass
    function dftInit(params){
        //console.log('dft params.frequency: ' + params.frequency);
        //console.log('DEBUG: setting dft filter: '+JSON.stringify(params));

        params.atten = 40; // consider allowing user to change these
        params.trband = 5; // consider allowing user to change these

        function computeOrder(atten, trband, fN) {
            // estimate filter order
            var order =  2 * Math.round((atten - 7.95) / (14.36*trband/fN) + 1.0);
            return order;
        }

        function computeKaiser(atten){
            // estimate Kaiser window parameter
            var kaiserV;
            if (atten >= 50.0) {kaiserV = 0.1102*(atten - 8.7);}
            else {
                if (atten > 21.0) {
                    kaiserV = 0.5842*Math.exp(0.4*Math.log(atten - 21.0))+ 0.07886*(atten - 21.0);
                }
            }
            if (atten <= 21.0) {kaiserV = 0.0;}
            return kaiserV;
        }

        function bessel(x) {
            // zero order Bessel function of the first kind
            var eps = 1.0e-6; // accuracy parameter
            var fact = 1.0;
            var x2 = 0.5 * x;
            var p = x2;
            var t = p * p;
            var s = 1.0 + t;
            for (var k = 2; t > eps; k++) {
                p *= x2;
                fact *= k;
                t = Math.pow((p / fact),2);
                s += t;
            }
            return s;
        }

        var fN=params.frequency*0.5;

        params.order = computeOrder(params.atten, params.trband, fN); // this will be used later
        var kaiserV = computeKaiser(params.atten); // this will be used to cap the buffer
        params.bufferLen = params.order + Math.round(2*fN/30)+1; // set buffer to order + max number of samples expected per frame
        //console.log('DEBUG: filter oder (# taps): '+params.order+', buffer length: '+params.bufferLen);

        params.buffer = [];

        // window function values
        var I0alpha = 1/bessel(kaiserV);
        var m = params.order>>1;
        var win = new Array(m+1);
        for (var n=1; n <= m; n++) {
            win[n] = bessel(kaiserV*Math.sqrt(1.0 - Math.pow((n/m),2))) * I0alpha;
        }

        var w0 = 0.0;
        var w1 = 0.0;
        switch (params.bandType.value) {
            case 'LOW_PASS':
                //console.log('lowpass');
                w0 = 0.0;
                w1 = Math.PI*(params.f2.value + 0.5*params.trband)/fN;
                break;
            case 'HIGH_PASS':
                //console.log('highpass');
                w0 = Math.PI;
                w1 = Math.PI*(1.0 - (params.f1.value - 0.5*params.trband)/fN);
                break;
            case 'BAND_PASS':
                //console.log('bandpass');
                w0 = (Math.PI/2) * (params.f1.value + params.f2.value) / fN;
                w1 = (Math.PI/2) * (params.f2.value - params.f1.value + params.trband) / fN;
                break;
        }

        // filter coefficients (NB not normalised to unit maximum gain)
        var a = new Array(params.order+1);
        a[0] = w1 / Math.PI;
        for (var n=1; n <= m; n++) {
            a[n] = Math.sin(n*w1)*Math.cos(n*w0)*win[n]/(n*Math.PI);
        }
        // shift impulse response to make filter causal:
        for (var n=m+1; n<=params.order; n++) {a[n] = a[n - m];}
        for (var n=0; n<=m-1; n++) {a[n] = a[params.order - n];}
        a[m] = w1 / Math.PI;
        params.a = a; // this coefficient array is the goal!
    }

    function dftApply(dataIn, params){
        //console.log('DFT apply');

//        function fir(ip, nCalc){
//            //console.log('ip.length:'+ip.length+', nCalc:'+nCalc);
//            var op = new Array(nCalc);
//            var sum;
//            for (var i=ip.length-nCalc; i<ip.length; i++) {
//              sum = 0.0;
//              for (var k=0; k<params.order; k++) sum += ((i-k)<0)?0:params.a[k]*ip[i-k]; // ternary operator handles indexOutOfBounds
//              op[i - (ip.length-nCalc)] = sum;
//            }
//            return op;
//        }
        function fir(ip){
            var nCalc = 1+ip.length - params.order;
            var op = new Array(nCalc);
            var sum;
            for (var i=ip.length-nCalc; i<ip.length; i++) {
              sum = 0.0;
              for (var k=0; k<params.order; k++) sum += ((i-k)<0)?0:params.a[k]*ip[i-k]; // ternary operator handles indexOutOfBounds
              op[i - (ip.length-nCalc)] = sum;
            }
            return op;
        }

        var dataOut = [];

        // add data onto buffer, only if input is defined and length is not 0
        if (dataIn !== angular.undefined && dataIn.length > 0){
            if (params.buffer !== angular.undefined){
                params.buffer = params.buffer.concat(dataIn);
            } else {
                params.buffer = dataIn;
            }
        }

        //console.log('prefilteredData: '+JSON.stringify(params.buffer));
        // once buffer is long enough, start filtering
        if (params.buffer !== angular.undefined && params.buffer.length >= params.bufferLen){
            //var newPoints = dataIn.length;
            //dataOut = fir(params.buffer,newPoints);
            //params.buffer.splice(0,newPoints); // remove old points
            dataOut = fir(params.buffer);
            params.buffer.splice(0,1+params.buffer.length - params.order); // go back to min buffer size
        }

        return dataOut;
    };

    return Filter;

}])

;



}());
