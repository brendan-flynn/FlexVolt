(function() {
    'use strict'

    angular.module('flexvolt.ekg', [])
    .controller('EKGCtrl', ['$scope', '$state', '$ionicPopover', 'flexvolt', 'customPopover',
    function($scope, $state, $ionicPopover, flexvolt, customPopover) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);
        customPopover.add($ionicPopover, $scope, 'popover', 'pages/ekg/settings.html');
        customPopover.add($ionicPopover, $scope, 'helpover','pages/ekg/help.html');


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

}())
