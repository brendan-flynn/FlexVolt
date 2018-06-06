(function() {
    'use strict';

    angular.module('flexvolt.home', [])
    .controller('HomeCtrl', ['$scope','$state','introRecords', function($scope,$state,introRecords){
        introRecords.ready()
          .then(function(){
            function showIntro(){
              d = new Date();
              introRecords.settings.intro.hasBeenShown = true;
              introRecords.settings.intro.dateShown = d;
              introRecords.updateSettings();
              $state.go('intro');
            }

            if (!introRecords.settings.intro.hasBeenShown){
              console.log('INFO: User has not seen intro - going there now.');
              showIntro();
            } else if (introRecords.settings.intro.hasBeenShown) {
              var d = new Date();
              var lastShown = introRecords.settings.intro.dateShown;
              var elapsedTimeDays = (d-lastShown)/(1000*60*60*24);
              if (elapsedTimeDays > 5){
                console.log('INFO: User has not seen intro in ' + elapsedTimeDays + '! going there now.');
                showIntro();
              }
            }

          });

        $scope.apps =
            {
                active: {
                    row1: {
                        b1: {
                            icon:"icon ion-ios-pulse",
                            ref:"rms",
                            btnName:"RMS Plot"
                        },
                        b2: {
                            icon:"icon ion-speedometer",
                            ref:"myometer",
                            btnName:"Myometer"
                        },
                        b3: {
                            icon:"icon ion-android-pin",
                            ref:"balloon",
                            btnName:"Balloon"
                        },
                        b4:{
                            icon:"icon ion-ios-navigate",
                            ref:"godot",
                            btnName:"Go Dot"
                        }
                    // },
                    // row2: {
                    //     b1: {
                    //         icon:"icon ion-android-pin",
                    //         ref:"balloon",
                    //         btnName:"Balloon"
                    //     },
                    //     b2: {
                    //         icon:"icon ion-ios-navigate",
                    //         ref:"godot",
                    //         btnName:"Go Dot"
                    //     }
                    }
                },
                controls: {
                    row1: {
                        b1: {
                            icon:"icon ion-briefcase",
                            ref:"demos",
                            btnName:"Demos"
                        },
                        b2: {
                            icon:"icon ion-information-circled",
                            ref:"intro",
                            btnName:"Get Started"
                        },
                        // b3: {
                        //     icon:"icon ion-settings",
                        //     ref:"settings",
                        //     btnName:"Settings"
                        // },
                        // b4: {
                        //     icon:"icon ion-radio-waves",
                        //     ref:"connection",
                        //     btnName:"Connection"
                        // }
                    }
                }
            };
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
    }]);

}());
