'use strict';


// Declare app level module which depends on filters, and services
angular.module('easyMath', [
	'ngRoute',
    'ngAnimate',
    'ngCookies',
    'ipCookie',
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
    $routeProvider.when('/embeded', {templateUrl: 'partials/mode-embeded.html', controller: 'HomeController'});
    $routeProvider.when('/highscores', {templateUrl: 'partials/highscores.html', controller: 'HomeController'});
	$routeProvider.otherwise({redirectTo: '/home'});
}]).
config(['$httpProvider', function($httpProvider) {
        $httpProvider.defaults.useXDomain = true;
        delete $httpProvider.defaults.headers.common['X-Requested-With']; 
}]);
