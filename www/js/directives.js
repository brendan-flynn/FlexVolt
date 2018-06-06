/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* Original Author:  Brendan Flynn
 *
 * app directives
 *
 */

(function () {
'use strict';

angular.module('flexvolt.directives', [])
// to grab the values from range inputs (it converts them to strings) and convert them back to numbers
.directive('input', function() {
    return {
        restrict: 'E',
        require: '?ngModel',
        link: function(scope, element, attrs, ngModel) {
            if ('type' in attrs && attrs.type.toLowerCase() === 'range') {
                ngModel.$parsers.push(parseFloat);
            }
        }
    };
})
//.directive('numericbinding', function () {
//    return {
//        restrict: 'A',
//        require: 'ngModel',
//        scope: {
//            model: '=ngModel'
//        },
//        link: function (scope, element, attrs, ngModelCtrl) {
//            if (scope.model && typeof scope.model === 'string') {
//                scope.model = parseFloat(scope.model);
//            }
//            scope.$watch('model', function(val, old) {
//                if (typeof val === 'string'){
//                    scope.model = parseFloat(val);
//                }
//           });
//        }
//    };
//})
//.directive('integer', function(){
//    return {
//        require: 'ngModel',
//        link: function(scope, ele, attr, ctrl){
//            ctrl.$parsers.unshift(function(viewValue){
//                return parseInt(viewValue, 10);
//            });
//        }
//    };
//})
.directive('settingsPopover', function(){
    return {
        restrict: 'E',
        template: '<button class="button button-icon" ng-click="popover.show($event)"><i class="icon ion-levels dark"></i></button>'
    };
})
.directive('filtersPopover', function(){
    return {
        restrict: 'E',
        template: '<button class="button button-icon" ng-click="filterpopover.show($event)"><i class="icon ion-levels dark"></i></button>'
    };
})
.directive('helpPopover', function(){
    return {
        restrict: 'E',
        template: '<button ng-if="helpModal" class="button button-icon" ng-click="helpModal.show()"><i class="icon ion-help dark"></i></button>'
    };
})
.directive('filterOptions', function(){
    return {
        restrict: 'E',
        templateUrl: 'templates/filteroptions.html'
    };
})
.directive('savePanel', function(){
    return {
        restrict: 'E',
        templateUrl: 'templates/savepanel.html'
    };
})
.directive('notConnected', function () {
    return {
        restrict: 'E',
        templateUrl: 'templates/not-connected.html'
    };
});

}());
