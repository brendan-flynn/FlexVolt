(function () {
'use strict';

angular.module('flexvolt.rmsPlot', [])

.factory('rmsTimePlot', ['generalData', function(generalData) {
    var colorList = ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf'];
    var leftPadding = 0;
    var rightPadding = 0;
    var WidthOffset = 110 + 10; // 110 for col with labels and min/max/mean, 10 for padding

    var margin, width, height, plotElement, htmlElement;
    var mar = 0;
    margin = {left: 50, right: mar, top: mar, bottom: 35};
    var PADDINGOFFSET = 8;

    var svg, x, y, autoY, xAxis, make_x_axis, yAxis, line;
    var panExtent, zoom;
    var xMax, yMax, stopPos, startPos;
    var data = [], tmpData = [];
    var downSampleN, downSampleCounter, downSampleMultiplier = 1;

    var api = {
      init:undefined,
      reset:undefined,
      resize:undefined,
      update:undefined,
      settings:{
        windowSizeInSeconds: undefined,
        userFrequency: undefined,
        nChannels: 1,
        zoomOption: 0,
        autoscaleY: false
      }
    };

    function zoomed() {

      // limit pan within plot limits (avoid panning to -x values, etc.)
      var panL = [0, 0];
      panL = panLimit();
      zoom.translate(panL);

//         redraw existing lines at new scale
      svg.selectAll('path.line').remove();
      startPos = 0;
      xPos = data[0].length;
      for (var i = 0; i < api.settings.nChannels; i++){
          svg.append('svg:path')
              .datum(data[i])
              .attr('class', 'line')
              .attr('clip-path', 'url(#clip)')
              .attr('stroke', colorList[i%colorList.length])
              .attr('d', line);
              //.attr('d', line(dataIn[i]));
      }

      // tried this on-liner, doesn't work yet
//        svg.selectAll('path.line').call(line);

      // reset axes - had to add some code to handle the axis ticks being in seconds, not ms
      // scaleX = d3.scale.linear()
      //     .domain([x.domain()[0]*dT, x.domain()[1]*dT])
      //     .range([0, width]);
      //
      // xAxis = d3.svg.axis()
      //     .scale(scaleX)
      //     .tickSize(-height)
      //     .tickPadding(10)
      //     .tickSubdivide(true)
      //     .orient('bottom');

      svg.select('.x.axis').call(xAxis);
      svg.select('.y.axis').call(yAxis);
    }

    function panLimit() {

      var divisor = {h: height / ((y.domain()[1]-y.domain()[0])*zoom.scale()), w: width / ((x.domain()[1]-x.domain()[0])*zoom.scale())},
        minX = -(((x.domain()[0]-x.domain()[1])*zoom.scale())+(panExtent.x[1]-(panExtent.x[1]-(width/divisor.w)))),
        minY = -(((y.domain()[0]-y.domain()[1])*zoom.scale())+(panExtent.y[1]-(panExtent.y[1]-(height*(zoom.scale())/divisor.h))))*divisor.h,
        maxX = -(((x.domain()[0]-x.domain()[1]))+(panExtent.x[1]-panExtent.x[0]))*divisor.w*zoom.scale(),
        maxY = (((y.domain()[0]-y.domain()[1])*zoom.scale())+(panExtent.y[1]-panExtent.y[0]))*divisor.h*zoom.scale();

      var zoomOption = api.settings.zoomOption;
      var tx = 0, ty = 0;
      if (zoomOption === 'X AND Y'|| zoomOption === 'X ONLY'){
          //console.log('zoom x');
          tx = x.domain()[0] < panExtent.x[0] ?
                      minX :
                      x.domain()[1] > panExtent.x[1] ?
                              maxX :
                              zoom.translate()[0];
      }
      if (!api.settings.autoscaleY && (zoomOption === 'X AND Y'|| zoomOption === 'Y ONLY') ){
          //console.log('zoom y');
          ty = y.domain()[0]  < panExtent.y[0]?
                      minY :
                      y.domain()[1] > panExtent.y[1] ?
                              maxY :
                              zoom.translate()[1];
      }
      //console.log('panX: '+tx+', panY: '+ty);
      return [tx,ty];

    }

    autoY = function(){
        var tmp = [], allData = [];
        // combine all channels
        for (var chInd in data){
            allData = allData.concat(data[chInd]);
        }
        // combine all 'y' values
        for (var dInd in allData){
            tmp.push(allData[dInd].y);
        }
        // find the max
        var maxArr = Math.max.apply(Math, tmp);
        var ret = maxArr > 1? maxArr:1;
        return ret;
    };

    function zeroData() {
        data = [];
        for (var i = 0; i < api.settings.nChannels;i++){
            data[i] = [];
            tmpData[i] = undefined;
        }
    }

    api.reset = function(){

        if (svg){
            svg.selectAll('path.line').remove();
            d3.select('svg').remove();
        }

        // startPos = Date.now();
        // stopPos = startPos + xMax;
        // zeroData();
        downSampleCounter = 0;

        x = d3.time.scale()
            .domain([startPos, stopPos])
            .range([0, width]);

        y = d3.scale.linear().range([height, 0]);
        if (api.settings.autoscaleY){
            y.domain([0, autoY()]);
        } else {
            y.domain([-0.02*yMax, yMax*1.02]);
        }

        if (api.settings.zoomOption === 'NONE'){
          zoom = function(){};
        } else if (api.settings.zoomOption === 'X ONLY') {
          zoom = d3.behavior.zoom()
              .x(x)
              .scaleExtent([1, 10])
              .on('zoom', zoomed);
        } else if (api.settings.zoomOption === 'Y ONLY') {
          zoom = d3.behavior.zoom()
              .y(y)
              .scaleExtent([1, 10])
              .on('zoom', zoomed);
        } else if (api.settings.zoomOption === 'X AND Y') {
          zoom = d3.behavior.zoom()
              .x(x)
              .y(y)
              .scaleExtent([1, 10])
              .on('zoom', zoomed);
        }

        svg = d3.select(plotElement).append('svg')
            .attr('width', width + margin.left + margin.right + leftPadding)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + (margin.left + leftPadding) + ',' + margin.top + ')')
            .call(zoom);

        svg.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', 'white');

        line = d3.svg.line()
            .interpolate('linear')
            .x(function(d) { return x(d.time); })
            .y(function(d) { return y(d.value); });

        var nTicks = Math.floor(width/75)-1;
        xAxis = d3.svg.axis()
            .scale(x)
            .tickSubdivide(true)
            .orient('bottom')
            .tickFormat(d3.time.format("%M:%S"))
            .ticks(nTicks);

        make_x_axis = function() {
            return d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .ticks(nTicks);
        };

        yAxis = d3.svg.axis()
            .scale(y)
            .tickPadding(10)
            .tickSize(0)
            .tickSubdivide(true)
            .orient('left');

        svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxis)
            .selectAll("text")
            .attr("y", 2)
            .attr("x", 9)
            .attr("dy", ".35em")
            .attr("transform", "rotate(25)")
            .style("text-anchor", "start");

        svg.append("g")
            .attr("class", "grid")
            .attr("transform", "translate(0," + height + ")")
            .call(make_x_axis()
                .tickSize(-height, 0, 0)
                .tickFormat("")
            );

        svg.append('g')
            .attr('class', 'y axis')
            .call(yAxis);

        svg.append('g')
            .attr('class', 'y label')
            .append('text')
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('y', (-margin.left) + 10)
            .attr('x', -height/2-50)
            .text('Muscle Signal, uV');

        svg.append('g')
            .attr('class', 'x label')
            .append('text')
            .attr('class', 'axis-label')
            .attr('y', height+35)
            .attr('x', width/2)
            .text('Time, minutes:seconds');

        // keeps the zoom frame inside the plot window!
        svg.append('clipPath')
            .attr('id', 'clip')
            .append('rect')
            .attr('width', width)
            .attr('height', height);

    };

    function calculateDownSample() {
      var maxDataPoints = api.settings.windowSizeInSeconds * api.settings.userFrequency / hardwareLogic.settings.downSampleCount; // max number of datapoints
      downSampleN = Math.max(1,Math.round(maxDataPoints / width / downSampleMultiplier)); // downsample since can't show them all anyway
    }

    api.init = function(element, rmsTimeLogicSettings, hardwareLogicSettings){
        htmlElement = element;
        plotElement = '#'+element;
        var html = document.getElementById(htmlElement);
        var calculatedWidth = window.innerWidth - WidthOffset;
        width = calculatedWidth - margin.left - margin.right - leftPadding - rightPadding;
        // width = html.clientWidth - margin.left - margin.right - leftPadding - rightPadding,
        height = html.clientHeight - margin.top - margin.bottom - PADDINGOFFSET;

        api.settings.zoomOption = rmsTimeLogicSettings.zoomOption;
        api.settings.nChannels = rmsTimeLogicSettings.nChannels;
        api.settings.userFrequency = hardwareLogicSettings.frequency;
        api.settings.windowSizeInSeconds = rmsTimeLogicSettings.xMax; // It's in seconds!

        xMax = api.settings.windowSizeInSeconds*1000; // size of Window in milliseconds (all times are in ms)
        yMax = generalData.settings.scale;
        calculateDownSample(); // check out downSampleMultiplier
        panExtent = {x: [0,xMax], y: [-0.01*yMax,1.01*yMax] };

        // window start/stop points in time
        startPos = Date.now();
        stopPos = startPos + xMax;
        zeroData();


        api.reset(); // setup all the svg/d3 stuff
    };

    api.initPlayback = function(element, rmsTimeLogicSettings, hardwareLogicSettings, dataBundle){
        htmlElement = element;
        plotElement = '#'+element;
        var html = document.getElementById(htmlElement);
        var calculatedWidth = window.innerWidth - 10 - 150;
        if (window.cordova) {calculatedWidth += 80;}
        width = calculatedWidth - margin.left - margin.right - leftPadding - rightPadding;

        // width = html.clientWidth - margin.left - margin.right - leftPadding - rightPadding,
        height = html.clientHeight - margin.top - margin.bottom - PADDINGOFFSET;

        api.settings.zoomOption = rmsTimeLogicSettings.zoomOption;
        api.settings.nChannels = rmsTimeLogicSettings.nChannels;
        api.settings.userFrequency = hardwareLogicSettings.frequency;
        var timestamps = dataBundle[0];
        // window start/stop points in time
        startPos = timestamps[0];
        stopPos = timestamps[timestamps.length-1];
        xMax = (stopPos-startPos)/1000;
        api.settings.windowSizeInSeconds = xMax; // It's in seconds!

        xMax = api.settings.windowSizeInSeconds*1000; // size of Window in milliseconds (all times are in ms)
        yMax = generalData.settings.scale;
        calculateDownSample(); // check out downSampleMultiplier
        panExtent = {x: [0,xMax], y: [-0.02*yMax,1.02*yMax] };

        zeroData();
        api.reset(); // setup all the svg/d3 stuff
        api.update(dataBundle);
    };

    api.update = function(dataBundle){
        var timestamps = dataBundle[0];
        var dataIn = dataBundle[1];
        // console.log(JSON.stringify(dataIn[0]));

        // see if data goes past current window
        if (timestamps[timestamps.length-1] > stopPos){

            // reset stored data and remove all lines from plot
            zeroData();
            svg.selectAll('path.line').remove();
            svg.selectAll('g.grid').remove();

            // throw away any data points that would be on the previous plot
            var ind = timestamps.findIndex(function(el){return el >= stopPos;});
            timestamps.slice(0,ind);
            for (var iC=0; iC < api.settings.nChannels; iC++){
              dataIn[iC].slice(0,ind);
            }

            // update time window for x axis
            startPos = stopPos;
            stopPos = startPos + xMax;
            x.domain([startPos, stopPos]);
            xAxis.scale(x);
            svg.select("g.x.axis")
              .call(xAxis)
              .selectAll("text")
              .attr("y", 2)
              .attr("x", 9)
              .attr("dy", ".35em")
              .attr("transform", "rotate(25)")
              .style("text-anchor", "start");

            svg.append("g")
              .attr("class", "grid")
              .attr("transform", "translate(0," + height + ")")
              .call(make_x_axis()
                .tickSize(-height, 0, 0)
                .tickFormat("")
              );
        }

        if (api.settings.autoscaleY){
            y.domain([0, autoY()]);
        }

        // convert the new data to the object format desired by d3, then add it to the current data object
        for (var i=0; i<api.settings.nChannels; i++){
            // put last element from previous path into first position, so lines connect
            if (tmpData[i]) {data[i].splice(0,0,tmpData[i]);}

            // cycling through nChannels times, only modify downSampleCounter once
            var tmpDownSampleCounter = downSampleCounter;

            for (var j=0; j<timestamps.length; j++){
                if (dataIn[i][j] !== angular.undefined) {
                    tmpDownSampleCounter ++;
                    if (tmpDownSampleCounter === downSampleN) {
                        data[i].push({time: timestamps[j], value: dataIn[i][j]});
                        tmpDownSampleCounter = 0;
                    }
                }
            }

            // add a new path with the updated data
            // (plus one data point from the preceding path so the paths are continuous)
            svg.append('svg:path')
                .datum(data[i])
                .attr('class', 'line')
                .attr('clip-path', 'url(#clip)')
                .attr('stroke', colorList[i%colorList.length])
                .attr('d', line);

            tmpData[i] = data[i].slice(-1)[0]; // grab last element to connect next path
            data[i] = []; // already plotted data - clear it for next update

            if (i === api.settings.nChannels -1){
                downSampleCounter = tmpDownSampleCounter;
            }
        }
    };

    api.changeScale = function(newScale) {
        yMax = newScale;
        api.resize();
    };

    api.resize = function(){
        var html = document.getElementById(htmlElement);
        var calculatedWidth = window.innerWidth - WidthOffset;
        width = calculatedWidth - margin.left - margin.right - leftPadding - rightPadding;
        height = html.clientHeight - margin.top - margin.bottom - PADDINGOFFSET;

        calculateDownSample(); // number of pixels changed - might need to alter downsampling

        api.reset();
    };

    return api;
});

}());
