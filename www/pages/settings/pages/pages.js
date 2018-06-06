(function () {
    'use strict';

    angular.module('flexvolt.pages', [])
    .controller('PagesCtrl',
    ['$scope','$state',
    function($scope, $state) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);

        $scope.pageList = [
          {
            name: 'RMS',
            link: 'rms-settings',
            icon: 'ion-ios-pulse'
          },
          {
            name: 'Myometer',
            link: 'myometer-settings',
            icon: 'ion-speedometer'
          },
          {
            name: 'Balloon',
            link: 'balloon-settings',
            icon: 'ion-android-pin'
          },
        ];

    }]);

}());
