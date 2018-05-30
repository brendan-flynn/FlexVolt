(function () {
'use strict';

angular.module('flexvolt.myometerPlot', [])

/**
 * Abstracts the flexvolt, deals with bluetooth communications, etc.
 */
.factory('myometerPlot', function() {
    var mar, margin, width, height, plotElement;
    mar = 0;
    margin = {top: mar, right: mar, bottom: 15, left: 70};
    var headerPadding = 10;
    var footerPadding = 150;
    width = window.innerWidth - margin.left - margin.right;
    height = window.innerHeight - margin.top - headerPadding - margin.bottom - footerPadding;

    // target properties
    var targetRectHeight = 4;
    var targetCircleRadius = 26;

    var yMax;

    var svg, xScale, xAxis, yScale, yAxis, data = [], bar, yLabel;
    var textLabel;
    var updateTargets;
    var yTicks = [0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5];

    var api = {
      init:undefined,
      reset:undefined,
      resize:undefined,
      update:undefined,
      settings:undefined,
      addText: undefined,
      removeText: undefined
    };

    var dragging = false;

    // for dragging threshold bars around
    function dragStart(d) {
        dragging = true;
        console.log('dragstart arguments: ' + JSON.stringify(arguments));
    }
    function dragMove(d) {
        console.log('dragmove arguments: ' + JSON.stringify(arguments));
        console.log('d3.event: ' + JSON.stringify(d3.event));
        var newVal = d3.event.y;
        var limitedVal = Math.min(Math.max(d3.event.y,0),height);
        // dragger.attr('y', function(){return newVal;});
        var scaledVal, maxLevel;
        if (api.settings.baselineMode === 'absolute'){
          scaledVal = yMax*(height-limitedVal)/height;
          maxLevel = yMax/2;
        } else if (api.settings.baselineMode === 'relative'){
          scaledVal = 100*(height-limitedVal)/height;
          maxLevel = 100/2;
        }
        scaledVal = Math.round(scaledVal);
        console.log('scaled val1: ' + scaledVal);
        var translateY = targetCircleRadius * (scaledVal/maxLevel-1);

        d3.select(this).select('text')
            .attr('y', d.y = limitedVal+(targetRectHeight/2))
            .text(scaledVal)
            .attr('transform', 'translate(' + 0 + ',' + translateY + ')');
        d3.select(this).select('rect')
            .attr('y', d.y = limitedVal);
        d3.select(this).select('circle')
            .attr('cy', d.y = limitedVal+(targetRectHeight/2))
            .attr('transform', 'translate(' + 0 + ',' + translateY + ')');
    }
    function dragEnd(){
        console.log('dragend arguments: ' + JSON.stringify(arguments));
        console.log('d3.event: ' + JSON.stringify(d3.event));
        var colInd = arguments[0].x;
        var newVal = arguments[0].y;
        var scaledVal;
        if (api.settings.baselineMode === 'absolute'){
          scaledVal = yMax*(height-newVal)/height;
        } else if (api.settings.baselineMode === 'relative'){
          scaledVal = 100*(height-newVal)/height;
        }
        scaledVal = Math.round(scaledVal);
        console.log('scaled val2: ' + scaledVal);
        //console.log('ob: '+colInd+'to: '+ newVal+ ', and scaled: '+scaledVal);
        updateTargets(colInd, scaledVal);
        api.targets[api.settings.baselineMode][colInd] = scaledVal;
        api.reset();
        dragging = false;
    }


    var drag = d3.behavior.drag()
      .on('dragstart', dragStart)
      .on('drag', dragMove)
      .on('dragend', dragEnd);

    function drawTargets(){

      var limitGroup = svg.selectAll('limits')
          .data(data)
          .enter().append('g')
          .call(drag);

      var maxLevel;
      if (api.settings.baselineMode === 'absolute'){
        maxLevel = yMax/2;
      } else if (api.settings.baselineMode === 'relative'){
        maxLevel = 100/2;
      }

      // y = radius*(halfMaxLevel - target)/halfMaxLevel
      // y = radius*(50 - 100)/50 = -radius

      limitGroup.append('rect')
        .attr('rx', 6)
        .attr('ry', 6)
        .attr('x', function(d) {return xScale(d.x)-3;})
        .attr('y', function(d) {return yScale(d.target);})
        .attr('width', xScale.rangeBand() - targetCircleRadius)
        .attr('height', targetRectHeight)
        .attr('fill', 'black');
        //.attr('cursor', 'move')

     limitGroup.append('circle')
      .attr('cx', function(d) {return xScale(d.x) + xScale.rangeBand() - targetCircleRadius; })
      .attr('cy', function(d) {return yScale(d.target) + (targetRectHeight/2) + (targetCircleRadius * (d.target/maxLevel-1)); })
      .attr('r', targetCircleRadius)
      .attr('stroke','black')
      .attr('fill', 'rgb(150, 150, 150)');

      limitGroup.append('text')
        .attr('x', function(d) { return xScale(d.x) + xScale.rangeBand() - targetCircleRadius; })
        .attr('y', function(d) { return yScale(d.target) + (targetRectHeight/2) + (targetCircleRadius * (d.target/maxLevel-1)); })
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .attr('font-size', 20)
        .style('fill', 'black')
        .text(function(d) {return d.target;});

    }

    api.reset = function(){
      console.log('api.reset');
      if (svg){
        svg.selectAll('path.rect').remove();
        d3.select('svg').remove();
      }

      data = [];
      console.log('targets');
      console.log(JSON.stringify(api.targets));
      var targetTmp;
      for (var k = 0; k<api.settings.nChannels; k++){
          data[k]={x:0, y:0, limit:-50, label:''};
          data[k].x = k;
          data[k].value = 0;
          if (api.settings.baselineMode === 'relative'){
            targetTmp = api.targets[api.settings.baselineMode][k];
            targetTmp = Math.min(Math.max(targetTmp,0),100);
          } else if (api.settings.baselineMode === 'absolute'){
            targetTmp = api.targets[api.settings.baselineMode][k];
            targetTmp = Math.min(Math.max(targetTmp,0),yMax);
          }
          data[k].target = targetTmp;

          data[k].label = api.settings.labels[k];
      }
      console.log('data');
      console.log(JSON.stringify(data));

      xScale = d3.scale.ordinal()
        .rangeBands([0, width], 0.2)
        .domain(data.map(function(d) { return d.x; }));

      yScale = d3.scale.linear()
        .range([height, 0]);

      if (api.settings.baselineMode === 'absolute'){
        yScale.domain([0, yMax]);
        yLabel = 'Muscle Signal, uV';
      } else if (api.settings.baselineMode === 'relative'){
        yScale.domain([0, 100]);
        yLabel = '% Maximum Contraction';
      }

      yAxis = d3.svg.axis()
              .scale(yScale)
              .orient('left')
//              .tickValues(yTicks)
              .tickSize(10,0)
              .tickSubdivide(true)
              .tickPadding(10)
              .tickSize(-width);

      xAxis = d3.svg.axis().scale(xScale).orient('bottom').tickFormat(function(d,i){return api.settings.labels[i];}).tickSize(10);

      svg = d3.select(plotElement).append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + (margin.top + headerPadding) + ')');

      // x-axis
      svg.append('g')
          .attr('class', 'axisnoline')
          .attr('font-size', 20)
          .attr('fill', 'rgb(0,0,0)')
          .attr('format', 'd')
          .attr('transform', 'translate(0,' + height + ')')
          .call(xAxis);

      // y-axis
      svg.append('g')
          .attr('class', 'axisnoline')
          .attr('font-size', 16)
          .attr('fill', 'rgb(0,0,0)')
          .call(yAxis)
          .append('text')
          .attr('class', 'label')
          .attr('transform', 'rotate(-90)')
          .attr('y', -60)
          .attr('x', -height/2)
          .attr('dy', '.71em')
          .attr('fill', 'rgb(0,0,0)')
          .style('text-anchor', 'middle')
          .text(yLabel);

      drawTargets();
    };

    api.init = function(element, settings, vMax, targets, limitsCB){
        width = window.innerWidth - margin.left - margin.right;
        height = window.innerHeight - margin.top - headerPadding - margin.bottom - footerPadding;
        plotElement = element;
        api.settings = settings;
        api.targets = targets;
        yMax = vMax;
        updateTargets = limitsCB;

        api.reset();
    };

    api.addText = function(text){
      d3.select('#notificationText').remove();
      textLabel = text;
    };

    api.removeText = function(){
      d3.select('#notificationText').remove();
      textLabel = undefined;
    };

    api.update = function(dataIn){
      if (dragging){
        // don't update rectangles while dragging - race conditions
        return;
      }

      for (var k = 0; k < api.settings.nChannels; k++){
        data[k].value = Math.max(0,dataIn[k]); // adjusting to actual
      }

      svg.selectAll('rect').remove();
      svg.selectAll('bars')
        .data(data)
        .enter()
        .append('rect')
        .attr('rx', 10)
        .attr('ry', 10)
        .attr('x', function(d) {return xScale(d.x);})
        .attr('y', function(d) {return yScale(d.value);})
        .attr('width', xScale.rangeBand())
        .attr('height', function(d) {return height-yScale(d.value);})
        .attr('stroke', 'rgb(0,0,0)')
        .attr('fill', function(d) {if(d.value > d.target){return 'orange';} else {return 'blue';}});

      drawTargets();

      if (textLabel){
        d3.select('#notificationText').remove();
        svg.append('text')
          .attr('id','notificationText')
          .attr('x', width/2)
          .attr('y', margin.top+height/2)
          .text(textLabel)
          .attr('fill','black')
          .attr('text-anchor', 'middle')
          .style('font', '16px Helvetica');
      }
  };

    api.resize = function(){
        console.log('DEBUG: plot resized');
        width = window.innerWidth - margin.left - margin.right;
        height = window.innerHeight - margin.top - headerPadding - margin.bottom - footerPadding;

        api.reset();
    };

    return api;
});

}());
