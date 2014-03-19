'use strict';


// Declare app level module which depends on filters, and services
angular.module('easyMath', [
	'ngRoute',
    'ngAnimate',
	'easyMath.filters',
	'easyMath.services',
	'easyMath.directives',
	'easyMath.controllers',
    'ui.bootstrap'
]).
config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/home', {templateUrl: 'partials/home.html', controller: 'HomeController'});
	$routeProvider.when('/play', {templateUrl: 'partials/play.html', controller: 'PlayController'});
    $routeProvider.when('/about', {templateUrl: 'partials/about.html', controller: 'HomeController'});
    $routeProvider.when('/classic', {templateUrl: 'partials/mode-classic.html', controller: 'TimelimitController'});
    $routeProvider.when('/timelimit', {templateUrl: 'partials/mode-timelimit.html', controller: 'TimelimitController'});
    $routeProvider.when('/highscores', {templateUrl: 'partials/highscores.html', controller: 'HomeController'});
	$routeProvider.otherwise({redirectTo: '/home'});
}]);
