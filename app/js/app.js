'use strict';


// Declare app level module which depends on filters, and services
angular.module('easyMath', [
	'ngRoute',
	'easyMath.filters',
	'easyMath.services',
	'easyMath.directives',
	'easyMath.controllers'
]).
config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/home', {templateUrl: 'partials/home.html', controller: 'HomeController'});
	$routeProvider.when('/play', {templateUrl: 'partials/play.html', controller: 'PlayController'});
	$routeProvider.otherwise({redirectTo: '/home'});
}]);
