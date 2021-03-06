'use strict';

/* Filters */

var easyMathFilters = angular.module('easyMath.filters', []);

easyMathFilters.filter('interpolate', ['version', function(version) {
    return function(text) {
        return String(text).replace(/\%VERSION\%/mg, version);
    }
}]);

easyMathFilters.filter('filterAnswered', function () {
    return function (questions) {
        var items = {
            output: []
        };
        angular.forEach(questions, function (value, key) {
            if (value.answer !== undefined)
                this.output.push(value);
        }, items);
        return items.output;
    };
});