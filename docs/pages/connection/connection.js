(function () {
    'use strict';

    angular.module('flexvolt.connection', [])
    .directive('connectionStatus', function(){
        return {
            restrict: 'E',
            controller: function($scope, flexvolt){
    //            $scope.isFlexVoltConnected = flexvolt.isConnected;
                $scope.isFlexVoltConnected = flexvolt.getConnectionStatus;

    //            $scope.$watch(
    //                flexvolt.getConnectionStatus,
    //                function(){$scope.isFlexVoltConnected = flexvolt.getConnectionStatus;},
    //                true
    //            );
            },
            templateUrl: 'pages/connection/connection-indicator.html'
        };
    })
    .controller('ConnectionCtrl',
    ['$scope','$state','$timeout','$ionicModal','$ionicPopover','$ionicPopup','$http','flexvolt','appLogic','devices',
    function($scope, $state, $timeout, $ionicModal, $ionicPopover, $ionicPopup, $http, flexvolt, appLogic, devices) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);

        $scope.flexvolt = flexvolt;
        $scope.con = flexvolt.api.connection;

        $scope.portList = flexvolt.getPortList;
        $scope.prefPortList = flexvolt.getPrefPortList;

        $scope.bugReportFields = {
            name : '',
            email : '',
            comment : ''
        };

        $scope.updatePorts = function(){
            flexvolt.api.updatePorts();
            // this timeout waits for the async list devices call to fill portList
            $timeout(function(){
                $scope.portList = flexvolt.getPortList;
            },500);
        };
        $scope.updatePorts();

        $scope.attemptToConnect = function(port){
            if (port !== angular.undefined){
                flexvolt.api.manualConnect(port);
            }
        };

        $scope.createFile = function(){
            chrome.fileSystem.chooseEntry({type: 'saveFile',
                suggestedName: 'myfile.csv'},
                function(writableFileEntry) {
                    writableFileEntry.createWriter(function(writer) {
                        writer.onwriteend = function(e) {
                            console.log('Save complete!');
                        };
                        writer.write(new Blob(['test text to write'],{type: 'csv'}));
                }, function(e){console.log('ERROR: in file writer: '+angular.toJson(e));});
            });

        };

        $scope.submitBugReport = function(){
            console.log('INFO: sending bugreport');
            var d = new Date();
            var month = d.getMonth()+1;
            if (month < 10) {month = '0'+month;};
            var date = d.getFullYear() + '-' + month + '-' + d.getDate();

            var cleanName = $scope.bugReportFields.name.replace(/[^a-z0-9.!]/gi, '');
            var cleanEmail = $scope.bugReportFields.email.replace(/[^a-z0-9.!]/gi, '');
            var cleanComment = $scope.bugReportFields.comment.replace(/[^a-z0-9.!]/gi, '');

            console.log('Name: '+$scope.bugReportFields.name+', cleanName: '+cleanName);
            console.log('Email: '+$scope.bugReportFields.name+', cleanEmail: '+cleanName);
            console.log('Comment: '+$scope.bugReportFields.name+', cleanComment: '+cleanName);

            var data = {
                date: date,
                time: d.toTimeString().slice(0,8),
                report: appLogic.dm.logs,
                browser: window.flexvoltPlatform,
                device: window.platform,
                fvmodel: flexvolt.api.connection.modelNumber !== angular.undefined?flexvolt.api.connection.modelNumber:0,
                fvserial: flexvolt.api.connection.serialNumber !== angular.undefined?flexvolt.api.connection.serialNumber:0,
                fvversion: flexvolt.api.connection.version !== angular.undefined?flexvolt.api.connection.version:0,
                name: cleanName,
                email: cleanEmail,
                comment: cleanComment
            };

            //window.data = data;

            var title = '';
            var msg = '';

            $http({
                method: 'POST',
                url: 'http://www.flexvoltbiosensor.com/wp-content/themes/coraline-child/bugreport.php',
                data: data,
                crossDomain : true,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            })
            .success(function (response) {
                console.log('DEBUG: bugreport response: '+angular.toJson(response));
                if (response !== angular.undefined && response.Error){
                    msg += 'Error in bug report generator.  Try again or contact software@flexvoltbiosensor.com for help.';
                } else if (response !== angular.undefined && response.Date !== angular.undefined
                        && response.Date === data.date && response.Time !== angular.undefined && response.Time === data.time) {
                    msg += 'Successfully Submited a Bug Report.  Thank you for taking the time to help make the app better!';
                } else {
                    msg += 'Unknown error encountered during bug report upload.  Try again or contact software@flexvoltbiosensor.com for help.';
                }

            })
            .catch(function (err){
                console.log('ERROR: Failed connection to bugreport server: '+angular.toJson(err));
                msg += 'Bug Report Submission Failed To Connect to Server. Try again or contact software@flexvoltbiosensor.com for help.';
            })
            .finally(function(){
                $scope.bugmodal.hide();
                $ionicPopup.alert({
                  title: 'Bug Report Submission',
                  template: msg
                });

            });
        };

        $scope.dm = appLogic.dm;

        $ionicModal.fromTemplateUrl('templates/logmessages.html', {
            scope: $scope
        }).then(function(modal){
            $scope.modal = modal;
        });

        $scope.showLog = function(){
            $scope.modal.show();
        };


        $ionicModal.fromTemplateUrl('templates/bugreport.html', {
            scope: $scope
        }).then(function(modal){
            $scope.bugmodal = modal;
        });

        $scope.showBugReportForm = function(){
            $scope.bugmodal.show();
        };

    }]);
}());
