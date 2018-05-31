(function () {
'use strict';

angular.module('flexvolt.build', [])

.constant('BUILD', {
    VERSION: "%%VERSION%%" // %%VERSION%% will be replaced with the actual version from config.xml
});

// // appController.js
// angular.module('equipmentShare').controller('AppController', function ($scope, BUILD) {
//     $scope.appVersion = BUILD.VERSION;
// });
}());
