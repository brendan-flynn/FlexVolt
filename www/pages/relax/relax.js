(function () {
    'use strict';

    angular.module('flexvolt.relax', [])
    .controller('RelaxCtrl', ['$stateParams', '$scope', '$state', '$ionicPopup', '$ionicPopover', '$ionicModal', 'customPopover',
    function($stateParams, $scope, $state, $ionicPopup, $ionicPopover, $ionicModal, customPopover) {
        var currentUrl = $state.current.url;
        $scope.demo = $stateParams;
        console.log('currentUrl = '+currentUrl);

        customPopover.add($ionicPopover, $scope, 'popover', 'pages/relax/relax-settings.html',null);
        // customPopover.add($ionicPopover, $scope, 'filterpopover', 'templates/filter-popover.html',null);
        customPopover.addHelp($ionicModal, $scope, 'helpModal','pages/relax/relax-help.html');

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
    }]);
}());
