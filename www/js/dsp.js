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

.factory('dataHandler', ['flexvolt', '$stateParams', 'storage', 'hardwareLogic', 'filters', 'file',
    function (flexvolt, $stateParams, storage, hardwareLogic, filters, file) {

        window.file = file;
        // list of possible filters
        var filterList = [];

        var recordData = false;
        var recordedDataTime = [];
        var recordedDataRaw = [];
        var recordedDataProcessed = [];
        var timeStamp = 0;
        var recordedDataFile = undefined;
        var nChannels = 1; // default
//        var filter, filterSettings, dftSettings, dftFlag = false;
        var metricsArr, metricsFlag = false, metricsNPoints = 500;
        var demoVals = {
            fs: 500,
            time: 0,
            startTime: undefined,
            randAmplitude: 10,
            amplitudes: [.20, .50, .20, .22, .70, .20, .10, .10],
            frequencies: [0.05, 10, 15, 20, 30, 50, 70, 100]
        };

        var api = {
            init: undefined,
//            setDftFilter: undefined,
//            rmDftFilter: undefined,
//            setFilter: undefined,
//            rmFilter: undefined,

            setMetrics: undefined,
            rmMetrics: undefined,
            getMetrics: undefined,
            getData: undefined,


            startRecording: undefined,
            stopRecording: undefined,

            addFilter: undefined,
            rmFilter: undefined
        };

        // Demo simulation data
        function generateData(G) {
            G = (G !== angular.undefined)?G:1;
            var gen = [];
            var tmp = new Date();
            var tmpTime = tmp.getTime();
            var nPoints = Math.round(demoVals.fs*(tmpTime - demoVals.startTime)/1000);

            demoVals.startTime = tmpTime;

            for (var i = 0; i<nPoints; i++) {
                demoVals.time += 1/demoVals.fs;
                for (var ch = 0; ch < nChannels; ch++){
                    if (i === 0){
                        gen[ch] = [];
                    }
                    gen[ch][i] = G*demoVals.amplitudes[ch]*Math.sin(demoVals.time*2*Math.PI*demoVals.frequencies[ch]);
                }
            }
            return gen;
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
            var tmp = new Date();
            demoVals.startTime = tmp.getTime();  // only needed for demo simulation
            demoVals.fs = hardwareLogic.settings.frequency;
            nChannels = nChan;  // have a default of 1

            // clear all filters (otherwise filters get carried between pages!
//            api.rmDftFilter();
//            api.rmFilter();
            clearFilterList();
            for (var i = 0; i < nChan; i++){
                filterList[i] = [];
            }
//            if (filter){
//                filter.init(filterSettings);
//            }
//            if (dftFlag){
//                dftfilter.init(dftSettings);
//            }
        };

        api.addFilter = function(newFilter){
            for (var i = 0; i < nChannels; i++){
                filterList[i].push(new filters(newFilter, hardwareLogic.settings.frequency));
            }
        };

        console.log('DEBUG: filterList: '+filterList);

//        //   DFT-FIR  Discrete fourier transform-based Finite impulse response filter
//        api.setDftFilter = function(settings){
//            if (settings.filterType !== 'NONE'){
//                dftSettings = settings;
//                dftfilter.init(dftSettings);
//                dftFlag = true;
//            }
//        };
//
//        api.rmDftFilter = function(){dftFlag = false;};
//
//
//        //  Other user-selected/designed filters
//        api.setFilter = function(filtertype, settings){
//            filter = undefined;
//            filter = filterList[filtertype];
//            if (filter !== angular.undefined){
//                filterSettings = settings;
//                filter.init(filterSettings);
//            } else {
//                console.log('WARNING: dsp.setFilter called without a proper filter: '+filtertype+', '+JSON.stringify(settings));
//            }
//        };
//
//        api.rmFilter = function(){filter = undefined;};

        // Set metrics buffering
        api.setMetrics = function(nDataPoints){
            metricsFlag = true;
            metricsArr = [];
            if (nDataPoints !== angular.undefined){
                metricsNPoints = nDataPoints; // default
            }
        };

        api.rmMetrics = function(){metricsFlag = false;};

        function addToMetrics(data){
            for (var ch = 0; ch < data.length; ch++){
                if (metricsArr[ch] !== angular.undefined){
                    metricsArr[ch] = metricsArr[ch].concat(data[ch]);
                } else {
                    metricsArr[ch] = data[ch];
                }
                metricsArr[ch].splice(0,metricsArr[ch].length-metricsNPoints);
            }
        }

        api.getData = function(){
            var parsedData;
            // Get Data (real or simulated)
            if ($stateParams.demo){
                // simulate data
                parsedData = generateData();
            } else {
                parsedData = flexvolt.api.getDataParsed();
            }

            if (parsedData[0] === angular.undefined || parsedData[0].length <= 0){
                for (var i = 0; i < nChannels; i++){
                    parsedData[i] = [];
                }
                return parsedData;
            }

            // save raw data if specified
            if (recordData){
                var t = Math.round((new Date()).getTime()/1000) - timeStamp;
                for (var i = 0; i < parsedData[0].length; i++){
                    recordedDataTime.push(t);
                }
                for (var i = 0; i < nChannels; i++){
                    recordedDataRaw[i] = recordedDataRaw[i].concat(parsedData[i]);
                }
            }

            // Make this faster by only processing nChannels
            parsedData.splice(nChannels);

            for (var i = 0; i < nChannels; i++){
                for (var ind in filterList[i]){
                    parsedData[i] = filterList[i][ind].apply(parsedData[i], hardwareLogic.settings.frequency );
                }
            }

            // save processed data if specified
            if (recordData) {
                for (var i = 0; i < nChannels; i++){
                    recordedDataProcessed[i] = recordedDataProcessed[i].concat(parsedData[i]);
                }
                if (recordedDataProcessed[0].length > 5000) {
                  saveRecordedData();
                }
            }

            // Frequency Filter if set
//            if (dftFlag){
//                parsedData = dftfilter.apply(parsedData);
//            }

            // Calculate metrics if set (using DFT-filtered data array (NOT structurally changed RMS-filtered structure)
            if (metricsFlag) {
                addToMetrics(parsedData);
            }

            // Secondary Filter if set (rms, smooth, averaging, etc)
//            if (filter !== angular.undefined){
//                parsedData = filter.apply(parsedData);
//            }
            return parsedData;
        };

        function initRecordedData() {
            // clear recorded data
            recordedDataRaw = [];
            recordedDataProcessed = [];
            recordedDataTime = ['Time (seconds)'];
            for (var i = 0; i < nChannels; i++){
                recordedDataRaw[i] = ['Chan ' + (i+1) + ' Raw'];
                recordedDataProcessed[i] = ['Chan ' + (i+1) + 'Processed'];
            }
            timeStamp = Math.round((new Date()).getTime()/1000);
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
              tmp.push(recordedDataRaw[i]);
            }
            for (var i = 0; i < nChannels; i ++){
              tmp.push(recordedDataProcessed[i].map(function(val){return typeof(val)==='number'?val.toFixed(2):val}));
            }
            clearRecordedData();
            file.writeFile(recordedDataFile, tmp);
        };

        api.startRecording = function(){
            initRecordedData();
            recordData = true;
            var d = new Date();
            recordedDataFile = 'flexvolt-recorded-data--'+d.getFullYear()+'-'
                +(d.getMonth()+1)+'-'+d.getDate()+'--'
                +d.getHours()+'-'+d.getMinutes()+'-'
                +d.getSeconds();
            file.openFile(recordedDataFile);
        };

        api.stopRecording = function(){
            recordData = false;
            // write and close
            saveRecordedData();
            file.closeFile();
            recordedDataFile = undefined;
        };

        api.getMetrics = function(){
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
            return ret;
        };

        return api;
    }
])

/**
 * Root Mean Square filter
 */
//.factory('rmsfilter', [ function() {
//
//  var dataParsed, windowSize, windowSizeDefault = 10;
//
//  // api... contains the API that will be exposed via the 'flexvolt' service.
//  var api = {
//      init: undefined,
//      apply: undefined
//  };
//
//  api.init = function(settings){
//      dataParsed = [];
//      for (var i = 0; i < nChannels; i++){
//          dataParsed[i] = [];
//      }
//      windowSize = (settings.windowSize !== angular.undefined)?settings.windowSize:windowSizeDefault; // default if not defined
//      console.log('rmsWindowSize: '+windowSize);
//  };
//
//  function rms(arr){
//      //var sumOfSquares = arr.reduce(function(sum,x){return (sum + (x)*(x));}, 0);
//      var sumOfSquares = 0;
//      for (var i = 0; i < arr.length; i++){
//          sumOfSquares += Math.pow(arr[i],2);
//      }
//      return Math.sqrt(sumOfSquares/arr.length);
//  };
//
//  // dataIn is a parsed data object - with an array for each channel
//  api.apply = function(dataIn){
//      var dataObject = [];
//
//      for (var ch in dataIn){
//          if (dataParsed[ch] !== angular.undefined){
//              dataParsed[ch] = dataParsed[ch].concat(dataIn[ch]);
//          } else {
//              dataParsed[ch] = dataIn[ch];
//          }
//      }
//
//      var dLength = undefined;
//      if (dataParsed !== angular.undefined && dataParsed[0] !== angular.undefined){
//          dLength = dataParsed[0].length;
//      }
//
//      if (windowSize === angular.undefined) {
//          windowSize = dLength;
//      }
//
//      while (dataParsed[0] !== angular.undefined && dataParsed[0].length >= windowSize){
//          var dataRMS = [];
//          for (var ch in dataParsed){
//              dataRMS[ch] = rms(dataParsed[ch].splice(0,windowSize));
//          }
//          dataObject.push({data:dataRMS,nSamples:windowSize});
//      }
//
//      return dataObject;
//  };
//
//  return api;
//}])

/**
 * Frequency filter
 */
//.factory('dftfilter', [ function() {
//    var dataParsed, bufferLen; // buffer
//    var a, kaiserV;
//    var f1, f2, fN, atten, trband, order, filterType;
//
//    var LOW_PASS = 'LOW_PASS';
//    var HIGH_PASS = 'HIGH_PASS';
//    var BAND_PASS = 'BAND_PASS';
//
//    function bessel(x) {
//        // zero order Bessel function of the first kind
//        var eps = 1.0e-6; // accuracy parameter
//        var fact = 1.0;
//        var x2 = 0.5 * x;
//        var p = x2;
//        var t = p * p;
//        var s = 1.0 + t;
//        for (var k = 2; t > eps; k++) {
//            p *= x2;
//            fact *= k;
//            t = Math.pow((p / fact),2);
//            s += t;
//        }
//        return s;
//    }
//
//    function computeOrder() {
//        // estimate filter order
//        order = 2 * Math.round((atten - 7.95) / (14.36*trband/fN) + 1.0);
//        // estimate Kaiser window parameter
//        if (atten >= 50.0) {kaiserV = 0.1102*(atten - 8.7);}
//        else {
//            if (atten > 21.0) {
//                kaiserV = 0.5842*Math.exp(0.4*Math.log(atten - 21.0))+ 0.07886*(atten - 21.0);
//            }
//        }
//        if (atten <= 21.0) {kaiserV = 0.0;}
//
//    }
//
//    function resetData(){
//        dataParsed = [];
//    }
//
//  // api... contains the API that will be exposed via the 'flexvolt' service.
//    var api = {
//        init: undefined,
//        apply: undefined
//    };
//
//    api.init = function(settings){
//        console.log('DEBUG: setting dft filter: '+JSON.stringify(settings));
//        filterType = settings.filterType;
//        fN=settings.fs*0.5;
//        f1=settings.f1;
//        f2=settings.f2;
//        atten=settings.atten;
//        trband=settings.trband;
//
//        computeOrder();
//        bufferLen = order + Math.round(2*fN/30)+1; // set buffer to order + max number of samples expected per frame
//        console.log('DEBUG: filter oder (# taps): '+order+', buffer length: '+bufferLen);
//        resetData();
//
//        // window function values
//        var I0alpha = 1/bessel(kaiserV);
//        var m = order>>1;
//        var win = new Array(m+1);
//        for (var n=1; n <= m; n++) {
//            win[n] = bessel(kaiserV*Math.sqrt(1.0 - Math.pow((n/m),2))) * I0alpha;
//        }
//
//        var w0 = 0.0;
//        var w1 = 0.0;
//        switch (filterType) {
//            case LOW_PASS:
//                w0 = 0.0;
//                w1 = Math.PI*(f2 + 0.5*trband)/fN;
//                break;
//            case HIGH_PASS:
//                w0 = Math.PI;
//                w1 = Math.PI*(1.0 - (f1 - 0.5*trband)/fN);
//                break;
//            case BAND_PASS:
//                w0 = (Math.PI/2) * (f1 + f2) / fN;
//                w1 = (Math.PI/2) * (f2 - f1 + trband) / fN;
//                break;
//        }
//
//        // filter coefficients (NB not normalised to unit maximum gain)
//        a = new Array(order+1);
//        a[0] = w1 / Math.PI;
//        for (var n=1; n <= m; n++) {
//            a[n] = Math.sin(n*w1)*Math.cos(n*w0)*win[n]/(n*Math.PI);
//        }
//        // shift impulse response to make filter causal:
//        for (var n=m+1; n<=order; n++) {a[n] = a[n - m];}
//        for (var n=0; n<=m-1; n++) {a[n] = a[order - n];}
//        a[m] = w1 / Math.PI;
//    };
//
//    // dataIn is a parsed data object - with an array for each channel
//    api.apply = function(dataIn){
//        var dataObject;
//
//        for (var ch in dataIn){
//            if (dataParsed[ch] !== angular.undefined){
//                dataParsed[ch] = dataParsed[ch].concat(dataIn[ch]);
//            } else {
//                dataParsed[ch] = dataIn[ch];
//            }
//        }
//
//        if (dataParsed[0] !== angular.undefined && dataParsed[0].length >= bufferLen){
//            dataObject = [];
//            for (var ch in dataIn){
//                var newPoints = dataIn[ch].length;
//                dataObject[ch] = fir(dataParsed[ch],newPoints);
//                //console.log(dataParsed);
//                dataParsed[ch].splice(0,newPoints); // remove old points
//            }
//        }
//
//        return dataObject;
//    };
//
//    function fir(ip, nCalc){
//        //console.log('ip.length:'+ip.length+', nCalc:'+nCalc);
//        var op = new Array(nCalc);
//        var sum;
//        for (var i=ip.length-nCalc; i<ip.length; i++) {
//          sum = 0.0;
//          for (var k=0; k<order; k++) sum += ((i-k)<0)?0:a[k]*ip[i-k]; // ternary operator handles indexOutOfBounds
//          op[i - (ip.length-nCalc)] = sum;
//        }
//        return op;
//    }
//
//  return api;
//}])

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
            data[i] = data[i] + params.offset.value;
        }
        //console.log(JSON.stringify(data));
        return data;
    }

    function average(dataIn, params){
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
        var dataOut = calc(params.buffer, params.windowSize.value);
        params.buffer.splice(0,params.buffer.length-2*Math.floor(params.windowSize.value/2));
        return dataOut;
    }

    function rms(dataIn, params){
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
        var dataOut = calc(params.buffer, params.windowSize.value*params.frequency/1000);
        params.buffer.splice(0,params.buffer.length-2*Math.floor(params.windowSize.value*params.frequency/1000/2));
        //console.log('dataOut: '+angular.toJson(dataOut));
        return dataOut;
    }

    function velocity(dataIn, params){
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
        var dataOut = calc(params.buffer, params.windowSize.value);
        params.buffer.splice(0,params.buffer.length-2*Math.floor(params.windowSize.value/2));
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
