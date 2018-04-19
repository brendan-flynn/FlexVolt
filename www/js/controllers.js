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
    .controller('NotConntectedCtrl', ['$scope', 'dataHandler',
        function($scope, dataHandler){

        $scope.dataHandlerControls = dataHandler.controls;
    }])
    .controller('RecordCtrl', ['$scope', '$state', '$stateParams', '$ionicPopover', '$ionicModal', 'dataHandler', 'hardwareLogic', 'records',
        function($scope, $state, $stateParams, $ionicPopover, $ionicModal, dataHandler, hardwareLogic, records){

        console.log('Record Ctrl loaded');
        /***********Record Control****************/

        $scope.dataHandler = dataHandler;
        $scope.records = records;
        $scope.selectedRecordIndex = undefined;
        if (!dataHandler.controls.live) {
            dataHandler.controls.toggleLive();
        }
        dataHandler.controls.resume(); // reset to a user-friendly state of displaying data
        var task = $state.current.name;

        // var template = '<ion-popover-view><ion-header-bar> <h1 class="title">My Popover Title</h1> </ion-header-bar> <ion-content> Hello! </ion-content></ion-popover-view>';
        $scope.recordModal = $ionicModal.fromTemplateUrl('templates/recordlist.html', {
          scope: $scope,
          animation: 'slide-in-up'
        }).then(function(modal) {
          $scope.recordModal = modal;
        });
        $scope.viewRecordedData = function($event) {
          $scope.recordModal.show();
        };
        $scope.cancelSelectRecord = function($event) {
          $scope.recordModal.hide();
        };
        $scope.selectRecord = function(recordIndex){
          $scope.selectedRecordIndex = recordIndex;
        };
        $scope.selectedStyle = function($index) {
          if ($index === $scope.selectedRecordIndex) {
            return "active";
          }
        };
        $scope.selectRecordDisabled = function() {
          if  (angular.isDefined($scope.selectedRecordIndex) &&
               $scope.selectedRecordIndex >= 0 &&
               $scope.selectedRecordIndex < records.getAll().length) {
                 return false;
          } else {
            return true;
          }
      };
        $scope.viewRecord = function() {
          console.log('viewing record' + $scope.selectedRecordIndex);
          var record = records.getAll()[$scope.selectedRecordIndex];
          console.log(record);
          if (angular.isDefined(record) && angular.isDefined(record.fileName)) {
            dataHandler.controls.selectedRecord = record;
            if (dataHandler.controls.live){
                dataHandler.controls.toggleLive();
            }
            if (dataHandler.controls.paused){
                dataHandler.controls.unpause();
            }
            $scope.recordModal.hide();
            dataHandler.controls.serveRecord();
          }
      };
        $scope.$on('$destroy', function() {
          $scope.recordModal.remove();
        });
        $scope.$on('modal.hidden', function() {
          // Execute action
        });
        $scope.$on('modal.removed', function() {
          // Execute action
        });

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

        $scope.isDesktopRecordDisabled = function() {
            var disabled = false;

            // not live, or already recording
            if (dataHandler.controls.recording || !dataHandler.controls.live) {disabled = true;}
            // if not demo mode AND not connected with data one
            if (!$stateParams.demo && (flexvolt.api.connection.state !== 'connected' ||
            flexvolt.api.connection.data !== 'on')) {disabled = true;}
            return disabled;
        };

        $scope.isDesktopPauseDisabled = function() {
            var disabled = false;

            // not live, or already paused
            if (dataHandler.controls.paused || !dataHandler.controls.live) {disabled = true;}
            // if not demo mode AND not connected with data one
            if (!$stateParams.demo && (flexvolt.api.connection.state !== 'connected' ||
            flexvolt.api.connection.data !== 'on')) {disabled = true;}
            return disabled;
        };

        $scope.isMobileRecordDisabled = function() {
            var disabled = false;
            if (dataHandler.controls.recording) {
                // recording, stop button is displayed
                // disabled if not recording
                if (!dataHandler.controls.recording) {disabled = true;}
            } else if (!dataHandler.controls.recording){
                // record button shown, disabled when:
                disabled = $scope.isDesktopRecordDisabled();
            }
            return disabled;
        };

        $scope.isMobilePauseDisabled = function() {
            var disabled = false;
            if (!dataHandler.controls.live || dataHandler.controls.paused){
                // not live, or already paused.  'resume' button is displayed
                if (dataHandler.controls.live && !dataHandler.controls.paused) {disabled = true;}
            } else if (dataHandler.controls.live && !dataHandler.controls.paused) {
                // pause button is displayed
                $scope.isDesktopPauseDisabled();
            }
            return disabled;
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
    .controller('MainCtrl', ['$scope', 'flexvolt', 'appLogic', 'storage', 'dataHandler', 'filters', 'records', 'hardwareLogic', 'devices',
    function($scope, flexvolt, appLogic, storage, dataHandler, filters, records, hardwareLogic, devices) {
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
        window.devices = devices;
    }]);
}());
