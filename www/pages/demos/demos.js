(function() {
    'use strict'

    angular.module('flexvolt.demos', [])

    .controller('DemoCtrl', ['$scope', function($scope){
        $scope.apps =
            {
                row1:{
                    b1:{
                        icon:"icon ion-navigate",
                        ref:"xy({demo: true})",
                        btnName:"Go Dot Demo"
                    },
                    b2:{
                        icon:"icon ion-ios-pulse",
                        ref:"trace({demo: true})",
                        btnName:"Trace Demo"
                    },
                    b3:{
                        icon:"icon ion-ios-pulse",
                        ref:"rms({demo: true})",
                        btnName:"RMS Plot Demo"
                    },
                    b4:{
                        icon:"icon ion-speedometer",
                        ref:"myometer({demo: true})",
                        btnName:"Myometer"
                    }
    //                    b4: {
    //                        icon:"icon ion-ios-game-controller-b",
    //                        ref:"snake",
    //                        btnName:"Snake Demo"
    //                    }
                }
            };
    }])

}());
