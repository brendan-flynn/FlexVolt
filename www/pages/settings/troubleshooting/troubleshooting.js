(function () {
    'use strict';

    angular.module('flexvolt.troubleshooting', [])
    .controller('TroubleshootingCtrl',
    ['$scope','$state','$timeout','$ionicModal','$ionicPopover','$ionicPopup','$http','flexvolt','appLogic','devices',
    function($scope, $state, $timeout, $ionicModal, $ionicPopover, $ionicPopup, $http, flexvolt, appLogic, devices) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);

        $scope.bugReportFields = {
            name : '',
            email : '',
            comment : ''
        };

        $scope.createFile = function(){
            if (chrome && chrome.fileSystem && chrome.fileSystem.chooseEntry) {
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
            }

        };

        $scope.resetBluetoothModule = function() {
            var resetConfirmPopup = $ionicPopup.confirm({
                title: 'Confirm Bluetooth Module Reset',
                template: 'Are you sure?  Once reset, the FlexVolt sensor will disconnect.  '+
                          'You will need to switch the sensor off, count to 5, switch the sensor back on, then wait two minutes for the module to properly reset!'
            });

            resetConfirmPopup.then(function(res) {
                if(res) {
                    console.log('DEBUG: User confirmed bluetooth reset.');
                    // Show alert to make sure user understands what to do next
                    flexvolt.api.resetBluetoothModule();
                    var alertPopup = $ionicPopup.alert({
                        title: 'Reset Bluetooth Module',
                        template: 'Instructions:  Switch your FlexVolt sensor off, wait 5 seconds, then turn it back on.  Wait 2 minutes before attempting to reconnect!'
                    });

                    alertPopup.then(function(res) {
                        console.log('DEBUG: User selected OK in reset info alert.');
                    });
                } else {
                    console.log('DEBUG: user cancelled bluetooth reset.');
                }
            });
        };

        $scope.createBugReportEmail = function() {

          var body = '';
          body += 'If this is not your preferred email client,\r\n';
          body += 'please copy all the text below into your \r\n';
          body += 'email client of choice and send to:\r\n\r\n';
          body += '            software@flexvoltbiosensor.com \r\n\r\n\r\n\r\n';


          body += 'Please enter information here to describe the    \r\n';
          body += 'problem you are having with the FlexVolt software\r\n';
          body += '                                                 \r\n';
          body += '                                                 \r\n';
          body += 'Your feedback helps me make the app better!      \r\n';
          body += '  - Brendan Flynn, FlexVolt Founder              \r\n\r\n\r\n';

          var d = new Date();
          body += 'date: ' + d.toString() + '\r\n';
          body += 'system browser: ' + window.flexvoltPlatform + '\r\n';
          body += 'system platform: ' + window.platform + '\r\n';
          body += 'app version: ' + appLogic.dm.version + '\r\n';
          body += 'device model: ' + (flexvolt.api.connection.modelNumber !== undefined?flexvolt.api.connection.modelNumber:0) + '\r\n';
          body += 'device S/N: ' + (flexvolt.api.connection.serialNumber !== undefined?flexvolt.api.connection.serialNumber:0) + '\r\n';
          body += 'device firmware version: ' + (flexvolt.api.connection.version !== undefined?flexvolt.api.connection.version:0) + '\r\n';
          body += 'report:\r\n\r\n';
          body += appLogic.dm.logs;

          var subject= 'Bug Report';
          var uri = 'mailto:software@flexvoltbiosensor.com?subject=';
          uri += encodeURIComponent(subject);
          uri += '&body=';
          uri += encodeURIComponent(body);
          window.open(uri);
          //window.location.href = uri; -- errors in Chrome
        };

        $scope.submitBugReport = function(){
            console.log('INFO: sending bugreport');
            var d = new Date();
            var month = d.getMonth()+1;
            if (month < 10) {month = '0'+month;}
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
                } else if (response !== angular.undefined && response.Date !== angular.undefined &&
                           response.Date === data.date && response.Time !== angular.undefined && response.Time === data.time) {
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
            $scope.logModal = modal;
        });

        $scope.showLog = function(){
            $scope.logModal.show();
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
