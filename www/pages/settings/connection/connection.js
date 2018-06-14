(function () {
    'use strict';

    angular.module('flexvolt.connection', [])
    .directive('connectionStatus', function(){
        return {
            restrict: 'E',
            controller: function($scope, $timeout, flexvolt){

                $scope.batteryLevelStyle = {
                  "background": "white",
                  "width": "0px"
                };

                // var batteryElem = document.getElementById("battery");
                // var batteryFullWidth = getComputedStyle(batteryElem, null).getPropertyValue("--battery-width");
                // batteryFullWidth = batteryFullWidth.slice(0,batteryFullWidth.indexOf("p"));
                // batteryFullWidth = Math.ceil(batteryFullWidth*.9);
                var batteryFullWidth = 30;
                var batteryLow = 3.2;
                var batteryHigh = 4.2;

                $scope.batteryLevelAvailable = flexvolt.api.getIsBatteryLevelAvailable();

                function updateIndicator() {
                    if (angular.isDefined(flexvolt.api.connection.batteryVoltage) &&
                        flexvolt.api.connection.batteryVoltage !== null &&
                        flexvolt.getConnectionStatus()) {
                        var newLevel = (flexvolt.api.connection.batteryVoltage - batteryLow)/(batteryHigh-batteryLow);
                        newLevel = Math.max(newLevel, 0);
                        newLevel = Math.min(newLevel, 1);

                        // change batter color based on charge level (red, orange, green);
                        var newBackground;
                        if (newLevel > 0.40) {newBackground = "#0f0";}
                        else if (newLevel > 0.15) {newBackground = "orange";}
                        else {newBackground = "red";}
                        var adjustedLevel = Math.round(newLevel * batteryFullWidth);

                        $scope.batteryLevelStyle = {
                          "background": newBackground,
                          "width": adjustedLevel+"px"
                        };

                        // var elem = document.getElementById("battery-level");
                        // if (angular.isDefined(elem) && elem !== null) {
                        //   elem.style.setProperty("width",adjustedLevel + "px");
                        //   elem.style.setProperty("background",newBackground);
                        // } else {console.log('can\'t update battery indicator');}
                    }
                }

                flexvolt.api.updateBatteryIndicator = updateIndicator;
                $timeout(updateIndicator, 100); // have to call this every time this indicator is created on each page
                $timeout(updateIndicator, 500); // have to call this every time this indicator is created on each page
            },
            templateUrl: 'pages/settings/connection/connection-indicator.html'
        };
    })
    .controller('ConnectionCtrl',
    ['$scope','$state','$timeout','$ionicModal','$ionicPopover','$ionicPopup','flexvolt','appLogic','devices',
    function($scope, $state, $timeout, $ionicModal, $ionicPopover, $ionicPopup, flexvolt, appLogic, devices) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);

        $scope.flexvolt = flexvolt;
        $scope.con = flexvolt.api.connection;

        $scope.portList = flexvolt.getPortList;
        $scope.prefPortList = flexvolt.getPrefPortList;

        $scope.updatePorts = function(){
            flexvolt.api.updatePorts();
            // this timeout waits for the async list devices call to fill portList
            $timeout(function(){
                $scope.portList = flexvolt.getPortList;
            },500);
        };
        $scope.updatePorts();

        $scope.attemptToConnect = function(port){
            if (flexvolt.getConnectingStatus() || flexvolt.getConnectionStatus()){
              // already connecting or connected - don't support multiples
            } else {
              // not connected or already connecting
              if (port !== angular.undefined){
                  flexvolt.api.manualConnect(port);
              }
            }
        };

        $scope.dm = appLogic.dm;

        $ionicModal.fromTemplateUrl('pages/settings/connection/connection-info.html', {
            scope: $scope
        }).then(function(modal){
            $scope.connectionInfoModal = modal;
        });

        $scope.showConnectionInfo = function(){
            $scope.connectionInfoModal.show();
        };

        $scope.disconnectCurrentDevice = function() {
          $scope.connectionInfoModal.hide();
          flexvolt.api.disconnect();
        };

    }]);
}());
