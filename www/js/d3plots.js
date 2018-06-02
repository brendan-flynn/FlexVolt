/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* Original Author:  Brendan Flynn
 *
 * factory for drawing the xyDot and trace plots
 *
 */
(function () {
'use strict';

angular.module('flexvolt.d3plots', [])

.factory('xyDot', function() {
    var mar, margin, width, height, plotElement;
    mar = 10;
    margin = {top: mar, right: mar, bottom: mar, left: mar};
    var headerPadding = 44;
    var footerPadding = 68;
    var xValue, xScale, xMap, yValue, yScale, yMap;
    var tail = true;
    var dataset = [];
    var nDots = 6;

    var svg;

    var api = {
        init:undefined,
        update:undefined,
        resize:undefined,
        dotRadius:undefined,
        settings:{
            s1:1,
            s2:2
        }
    };

    api.dotRadius = 15;

    api.reset = function(){
        if (svg){
          d3.select('svg').remove();
        }
        svg = d3.select(plotElement).append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        xValue = function(d) { return d.x;};
        xScale = d3.scale.linear()
            .range([api.dotRadius, width-api.dotRadius])
            .domain([0, 255]);
        xMap = function(d) {return xScale(xValue(d));};
        yValue = function(d) { return d.y;};
        yScale = d3.scale.linear()
            .range([height-2*api.dotRadius, api.dotRadius])
            .domain([0, 255]);
        yMap = function(d) {return yScale(yValue(d));};

        if (!!tail){
          for (var i=0; i<nDots;i++){
            dataset[i]={
              x:width/2,
              y:height/2,
              r:api.dotRadius,
              c:'#1f77b4',
              o:(1.0-i/nDots)
            };
          }
        } else {
          dataset[0]={
            x:width/2,
            y:height/28,
            r:api.dotRadius,
            c:'#1f77b4',
            o:1.0
          };
        }
    };

    api.init = function(element){
        plotElement = element;
        width = window.innerWidth - margin.left - margin.right;
        height = window.innerHeight - margin.top - headerPadding - margin.bottom - footerPadding;

        api.reset();
    };

    api.update = function(xIn, yIn){
        if(!!tail){
          for (var i=nDots-1; i>0; i--){
                dataset[i].x = dataset[i-1].x;
                dataset[i].y = dataset[i-1].y;
            }
            dataset[0].x = xIn;
            dataset[0].y = yIn;
        } else {
          dataset[0].x = xIn;
          dataset[0].y = yIn;
        }

        svg.selectAll('circle').remove();
        svg.selectAll('circle')
            .data(dataset)
            .enter().append('circle')
            .style('stroke', function(d){return d.c;})
            .style('fill', function(d){return d.c;})
            .style('opacity', function(d){return d.o;})
            .attr('r', function(d){return d.r;})
            .attr('cx', xMap)
            .attr('cy', yMap);
    };

    api.resize = function(){
        width = window.innerWidth - margin.left - margin.right;
        height = window.innerHeight - margin.top - headerPadding - margin.bottom - footerPadding;

        api.reset();
    };

    return api;
})
.factory('tracePlot', function() {
    var colorList = ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf'];
    var margin, width, height, plotElement, htmlElement;
    var mar = 10;
    margin = {left: mar, right: mar, top: mar, bottom: 20};
    var PADDINGOFFSET = 8;

    var yMax;
    var tmpData = [];
    var xPos = 0, startPos = 0;

    var svg, yA, lineA;

    var api = {
      init:undefined,
      reset:undefined,
      resize:undefined,
      update:undefined,
      setN:undefined,
      settings:{
        nChannels: 2
      }
    };

    function setN(newN) {
      api.settings.nChannels = newN;
    }

    api.reset = function(){
        if (svg){
          svg.selectAll('path.line').remove();
        }
        d3.select('svg').remove();
        svg = d3.select(plotElement).append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        svg.append('rect')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('fill', 'white');

        xPos = 0;
        startPos = 0;
        yA = [];
        tmpData = [];
        for (var i = 0; i < api.settings.nChannels; i++){
            tmpData[i] = undefined;
            yA[i] = d3.scale.linear()
                .range([height-i*(height/api.settings.nChannels), height-(i+1)*(height/api.settings.nChannels)])
                .domain([-yMax, +yMax]);
        }

        lineA = [];
        if (api.settings.nChannels > 0){
            lineA[0] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[0](d); });
        }
        if (api.settings.nChannels > 1){
            lineA[1] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[1](d); });
        }
        if (api.settings.nChannels > 2){
            lineA[2] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[2](d); });
        }
        if (api.settings.nChannels > 3){
            lineA[3] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[3](d); });
        }
        if (api.settings.nChannels > 4){
            lineA[4] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[4](d); });
        }
        if (api.settings.nChannels > 5){
            lineA[5] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[5](d); });
        }
        if (api.settings.nChannels > 6){
            lineA[6] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[6](d); });
        }
        if (api.settings.nChannels > 7){
            lineA[7] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[7](d); });
        }
    };

    api.init = function(element, nChannels, vMax){
        htmlElement = element;
        plotElement = '#'+element;
        var html = document.getElementById(htmlElement);
        width = html.clientWidth - margin.left - margin.right;
        height = html.clientHeight - margin.top - margin.bottom - PADDINGOFFSET;

        yA = [];
        lineA = [];
        svg = undefined;
        api.settings.nChannels = nChannels;
        yMax = vMax;

        api.reset();
    };

    api.update = function(dataBundle, isLive){
        var iChan;
        var timestamps = dataBundle[0];
        var dataIn = dataBundle[1];
        startPos = xPos > 0?xPos-1:0;
        xPos += dataIn[0].length;
        if (isLive) {
            if (xPos >= width){
                xPos = xPos%width;
                startPos = 0;
                for (var ind in dataIn){
                    dataIn[ind].splice(0,dataIn[ind].length-xPos); // over ran width, splice out data up to width
                }
                tmpData = [];
                for (iChan = 0; iChan < api.settings.nChannels;iChan++){
                    tmpData[iChan] = undefined;
                }
                svg.selectAll('path.line').remove();
            }
        } else {
          svg.selectAll('path.line').remove(); // just clear the plot prior to showing all data
          startPos = 0;
        }

        for (iChan = 0; iChan < api.settings.nChannels; iChan++){
            if (tmpData[iChan]) {dataIn[iChan].splice(0,0,tmpData[iChan]);}
            svg.append('svg:path')
                .attr('class','line')
                .attr('stroke', colorList[iChan])
                .attr('d', lineA[iChan](dataIn[iChan]));
            tmpData[iChan] = dataIn[iChan].slice(-1)[0];
        }
    };

    api.resize = function(){
        var html = document.getElementById(htmlElement);
        width = html.clientWidth - margin.left - margin.right;
        height = html.clientHeight - margin.top - margin.bottom - PADDINGOFFSET;

        api.reset();
    };

    api.setN = setN;

    return api;
})
;

}());
