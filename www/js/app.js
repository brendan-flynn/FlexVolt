// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js

(function () {
    'use strict';
    angular.module('flexvolt', [
        'ionic',
        'ngSanitize',
        'flexvolt.controllers',
        'flexvolt.services',
        'flexvolt.customPopover',
        'flexvolt.records',
        'flexvolt.directives',
        'flexvolt.devices',
        'flexvolt.flexvolt',
        'flexvolt.d3plots',
        'flexvolt.appLogic',
        'flexvolt.taskLogic',
        'flexvolt.dsp',
        // pages
        'flexvolt.balloon',
        'flexvolt.connection',
        'flexvolt.demos',
        'flexvolt.ekg',
        'flexvolt.godot',
        'flexvolt.home',
        'flexvolt.hrv',
        'flexvolt.intro',
        'flexvolt.myometer',
        'flexvolt.myometerPlot',
        'flexvolt.rms',
        'flexvolt.settings',
        'flexvolt.snake',
        'flexvolt.trace'
    ])

    .run(function($ionicPlatform, appLogic) {
      //editableOptions.theme = 'default'; // bootstrap3 theme. Can be also 'bs2', 'bs3', 'default'

      $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        // if(window.cordova && window.cordova.plugins.Keyboard) {
        //   cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        // }
        if(window.StatusBar) {
          // org.apache.cordova.statusbar required
          StatusBar.styleDefault();
        }
        // make sure we have a way to control frame rate
        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = (function() {
                return window.webkitRequestAnimationFrame ||
                    window.mozRequestAnimationFrame || // comment out if FF4 is slow (it caps framerate at ~30fps: https://bugzilla.mozilla.org/show_bug.cgi?id=630127)
                    window.oRequestAnimationFrame ||
                    window.msRequestAnimationFrame ||
                    function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
                        window.setTimeout(callback, 1000 / 60);
                        };
                    })();
        }
        if (!window.cancelAnimationFrame) {
            window.cancelAnimationFrame = (function() {
                return window.cancelAnimationFrame || window.mozCancelAnimationFrame ||
                        window.webkitCancelAnimationFrame;
            })();
        }

        function doOnOrientationChange()
        {
            switch(window.orientation)
            {
                case -90:
                    console.log('-landscape');
                    break;
                case 90:
                    console.log('landscape');
                    break;
                default:
                    console.log('portrait');
                    break;
            }
        }

        //    window.addEventListener('orientationchange', doOnOrientationChange);

        window.onresize = function(){
            //console.log('INFO: Resized to w:'+window.innerWidth+', h:'+window.innerHeight);
            //setTimeout(doOnOrientationChange,0);
        };

        console.log('INFO: screen:  W:'+screen.width+'H:'+screen.height);
        console.log('INFO: Resized to w:'+window.innerWidth+', h:'+window.innerHeight);
        appLogic.appWidth = window.innerWidth;
        appLogic.appHeight = window.innerHeight;

        // get version
        if (window.cordova) {
          // get cordova version
          appLogic.dm.version = 'unavailable'; // TODO - fix this!
        } else if (window.chrome && window.chrome.runtime && window.chrome.runtime.getManifest) {
          appLogic.dm.version = chrome.runtime.getManifest().version;
        }
      });
    })
    //.config(function($ionicConfigProvider){
    //    $ionicConfigProvider.views.maxCache(0);
    //})
//    .config(function($provide) {
//        // Prevent Angular from sniffing for the history API
//        // since it's not supported in packaged apps.
//        $provide.decorator('$window', function($delegate) {
//            $delegate.history = null;
//            Object.defineProperty($delegate, 'history', {get: function() {return null;}});
//            return $delegate;
//        });
//    })
    .config(function($ionicConfigProvider){
        $ionicConfigProvider.backButton.previousTitleText(false).text('');
    })
    .config(function($stateProvider, $urlRouterProvider) {

      function dataOn($stateParams, flexvolt, insomnia, dataHandler){
          if (!$stateParams.demo){
              console.log('DEBUG: app dataOn');
              insomnia.keepAwake();
              dataHandler.controls.resume(); // ensure proper state - unpaused, not recording, live
              flexvolt.api.turnDataOn();
          }
      }

      function exitFunction($stateParams, flexvolt, insomnia, dataHandler){
        console.log('DEBUG: app dataOff');
        flexvolt.api.turnDataOff(); // always call - even if in demos or not actually connected!
        insomnia.allowSleepAgain();
        dataHandler.controls.closeOut(); // end any recordings, switch states back to defaults

        // return resize function control (in each page it is redefined to resize that animation/plot
        window.onresize = function(){
            //console.log('INFO: Resized to w:'+window.innerWidth+', h:'+window.innerHeight);
            //setTimeout(doOnOrientationChange,0);
        };
      }

      $stateProvider
        .state('home', {
            url: '/',
            templateUrl: 'pages/home/home.html',
            controller: 'HomeCtrl'
        })

        .state('trace', {
            url: '/trace/:demo',
            templateUrl: 'pages/trace/trace.html',
            controller: 'TraceCtrl',
            onEnter: dataOn,
            onExit: exitFunction
        })

        .state('rms', {
            url: '/rms/:demo',
            templateUrl: 'pages/rms/rms.html',
            controller: 'RMSCtrl',
            onEnter: dataOn,
            onExit: exitFunction
        })

        .state('godot', {
            url: '/godot/:demo',
            templateUrl: 'pages/godot/godot.html',
            controller: 'GodotCtrl',
            onEnter: dataOn,
            onExit: exitFunction
        })

        .state('snake', {
            url: '/snake/:demo',
            templateUrl: 'pages/snake/snake.html',
            controller: 'SnakeCtrl'
//            onEnter: dataOn,
//            onExit: exitFunction
        })

        .state('myometer', {
            url: '/myometer:demo',
            templateUrl: 'pages/myometer/myometer.html',
            controller: 'MyometerCtrl',
            onEnter: dataOn,
            onExit: exitFunction
        })

        .state('balloon', {
            url: '/balloon:demo',
            templateUrl: 'pages/balloon/balloon.html',
            controller: 'BalloonCtrl',
            onEnter: dataOn,
            onExit: exitFunction
        })

        .state('ekg', {
            url: '/ekg',
            templateUrl: 'pages/ekg/ekg.html',
            controller: 'EKGCtrl'
//            onEnter: dataOn,
//            onExit: exitFunction
        })

        .state('hrv', {
            url: '/hrv',
            templateUrl: 'pages/hrv/hrv.html',
            controller: 'HRVCtrl'
//            onEnter: dataOn,
//            onExit: exitFunction
        })

        .state('demos', {
            url: '/demos',
            templateUrl: 'pages/demos/demos.html',
            controller: 'DemoCtrl'
        })

        .state('help', {
            url: '/help',
            templateUrl: 'pages/help/help.html',
            controller: 'ConnectionCtrl'
        })

        .state('intro', {
            url: '/intro',
            templateUrl: 'pages/intro/intro.html',
            controller: 'IntroCtrl'
        })

        .state('settings', {
            url: '/settings',
            templateUrl: 'pages/settings/settings.html',
            controller: 'SettingsCtrl'
        })

        .state('connection', {
            url: '/connection',
            templateUrl: 'pages/connection/connection.html',
            controller: 'ConnectionCtrl'
        })

        ;

      // if none of the above states are matched, use this as the fallback
      $urlRouterProvider.otherwise('/');

    });
}());
