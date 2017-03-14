(function() {
    'use strict'

    angular.module('flexvolt.snake', [])
    .controller('SnakeCtrl', ['$scope', '$state', 'xyDot', '$ionicPopover', '$ionicModal', 'customPopover',
    function($scope, $state, xyDot, $ionicPopover, $ionicModal, customPopover) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);

        customPopover.add($ionicPopover, $scope, 'popover', 'pages/snake/settings.html');
        // customPopover.add($ionicPopover, $scope, 'helpover','pages/snake/help.html');
        customPopover.addHelp($ionicModal, $scope, 'helpModal','pages/snake/snake-help.html');

        var afID;

        var frameCounts = 0;
        var speed = 4;
        var x = 128, y = 128;
//
//        xyDot.init('#snakeWindow');

//        function updateAnimate(){
//            if ($scope.updating) return;
//        }
//
//        function paintStep(timestamp){
//            if ($state.current.url === currentUrl){
//                afID = window.requestAnimationFrame(paintStep);
//                frameCounts++;
//                if (frameCounts > 5){
//                    frameCounts = 0;
//                    updateAnimate();
//                }
//            }
//        }
//
//        paintStep();
    }])

}())
