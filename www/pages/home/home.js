(function() {
    'use strict'

    angular.module('flexvolt.home', [])
    .controller('HomeCtrl', ['$scope', function($scope){
        $scope.apps =
            {
                active: {
                    row1: {
                        b1: {
                            icon:"icon ion-information-circled",
                            ref:"intro",
                            btnName:"Get Started"
                        },
                        b2: {
                            icon:"icon ion-ios-pulse-strong",
                            ref:"trace",
                            btnName:"Trace"
                        },
                        b3: {
                            icon:"icon ion-ios-navigate",
                            ref:"godot",
                            btnName:"Go Dot"
                        },
                        b4:{
                            icon:"icon ion-ios-pulse",
                            ref:"rms",
                            btnName:"RMS Plot"
                        }
                    },
                    row2: {
                        b1: {
                            icon:"icon ion-speedometer",
                            ref:"myometer",
                            btnName:"Myometer"
                        },
                        b2: {
                            icon:"icon ion-speedometer",
                            ref:"balloon",
                            btnName:"Balloon"
                        }
                    }
                },
                controls: {
                    row1: {
                        b1: {
                            icon:"icon ion-briefcase",
                            ref:"demos",
                            btnName:"Demos"
                        },
                        // b2: {
                        //     icon:"icon ion-help",
                        //     ref:"help",
                        //     btnName:"Help"
                        // },
                        b3: {
                            icon:"icon ion-settings",
                            ref:"settings",
                            btnName:"Settings"
                        },
                        b4: {
                            icon:"icon ion-radio-waves",
                            ref:"connection",
                            btnName:"Connection"
                        }
                    }
                }
            }
    //                row3:{
    //                    b1:{
    //                        icon:"icon ion-nuclear",
    //                        ref:"home",
    //                        btnName:"activity"
    //                    },
    //                    b2:{
    //                        icon:"icon ion-ios-infinite",
    //                        ref:"home",
    //                        btnName:"mind"
    //                    },
    //                    b3:{
    //                        icon:"icon ion-ios-body",
    //                        ref:"home",
    //                        btnName:"excercise"
    //                    },
    //                    b4:{
    //                        icon:"icon ion-ios-game-controller-b",
    //                        ref:"home",
    //                        btnName:"controller"
    //                    }
    //                },
                // row4:{
    //                    b1:{
    //                        icon:"icon ion-navigate",
    //                        ref:"circle",
    //                        btnName:"test"
    //                    },

                  //                    b4:{
                  //                        icon:"icon ion-leaf",
                  //                        ref:"home",
                  //                        btnName:"Relax"
                  //                    }
    }])

}())
