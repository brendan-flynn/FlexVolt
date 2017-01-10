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
    .controller('RecordCtrl', ['$scope', '$state', 'dataHandler', 'hardwareLogic', 'records',
        function($scope, $state, dataHandler, hardwareLogic, records){
        /***********Record Control****************/

        $scope.dataHandler = dataHandler;
        $scope.records = records;
        if (!dataHandler.controls.live) {
            dataHandler.controls.toggleLive();
                }
        dataHandler.controls.resume(); // reset to a user-friendly state of displaying data
        var task = $state.current.name;

        $scope.onRecordSelected = function(){
          if (dataHandler.controls.selectedRecord) {
              if (dataHandler.controls.live){
                  dataHandler.controls.toggleLive();
              }
              dataHandler.controls.serveRecord();
          }
        };

        $scope.toggleLive = function(){
            dataHandler.controls.toggleLive();
            console.log('DEBUG: toggled live to '+dataHandler.controls.live);
        };

        $scope.togglePlayback = function(){
            dataHandler.controls.playingBack = !dataHandler.controls.playingBack;
            if (dataHandler.controls.playingBack){
                // stop playback
            } else {
                // start playback
            }
        };

        /**************************************/
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
        if (window.cordova) {
            $scope.mobile = true;
            console.log('INFO: App Running in a Mobile Device');
        } else {
            console.log('INFO: App Running in Chrome');
        }

        window.flexvolt = flexvolt;
        window.dataHandler = dataHandler;
        window.filters = filters;
        window.records = records;
        window.hardwareLogic = hardwareLogic;
    }]);
}());
