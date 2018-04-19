(function() {
    'use strict';

    angular.module('flexvolt.demos', [])

    .controller('DemoCtrl', ['$scope', function($scope){
        $scope.apps =
            {
                active: {
                    row1:{
                        b1:{
                            icon:"icon ion-navigate",
                            ref:"godot({demo: true})",
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
                    },
                    row2:{
                        b1:{
                            icon:"icon ion-android-pin",
                            ref:"balloon({demo: true})",
                            btnName:"Balloon Demo"
                        }
                    }
                },
                development: {
                    row1: {
                        b2:{
                            icon:"icon ion-ios-heart",
                            ref:"ekg",
                            btnName:"EKG"

                        },
                        b3:{
                            icon:"icon ion-android-stopwatch",
                            ref:"hrv",
                            btnName:"HRV"
                        }
                        // b4: {
                        //     icon:"icon ion-ios-game-controller-b",
                        //     ref:"snake",
                        //     btnName:"Snake Game"
                        // }
                    }
                }
            };
    }]);

}());
