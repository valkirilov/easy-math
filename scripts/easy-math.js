'use strict';


// Declare app level module which depends on filters, and services
angular.module('easyMath', [
	'ngRoute',
    'ngAnimate',
    'ngCookies',
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

'use strict';

/* Controllers */

angular.module('easyMath.controllers', []).
    controller('HomeController', ['$scope', '$timeout', '$interval', '$location', '$anchorScroll', 'QuestionsService', 'DatabaseService', 'HighScoreService', 
                                  function($scope, $timeout, $interval, $location, $anchorScroll, QuestionsService, DatabaseService, HighScoreService) {

        $scope.questions = null;
        $scope.currentQuestion = null;
        $scope.playerName = HighScoreService.playerName;
          
        $scope.$watch(function () { return HighScoreService.timelimitUpdated; },
            function (value) {
                console.log('Timelimit updated');
                $scope.timelimitScores = HighScoreService.timelimitScores;
            }
        );
        $scope.$watch(function () { return HighScoreService.classicUpdated; },
            function (value) {
                console.log('Classic updated');
                $scope.classicScores = HighScoreService.classicScores;
            }
        );

        $scope.init = function() {
            $scope.previewEnabled = true;
            $scope.generateQuestion();
            $interval($scope.generateQuestion, 3000);
            $timeout($scope.solveQuestion, 1500);
            
            //GameClassicFactory.initGame(QuestionsService, TimerService, $scope.mode.time);
            //SoundsService.playTheme();

            //$scope.currentQuestion = GameClassicFactory.currentQuestion;
            
            // Select and display the highscore table
            HighScoreService.init();

        };
        
        $scope.generateQuestion = function() {
            if ($location.path() === '/home') {
                $scope.currentQuestion = QuestionsService.generateQuestion(1);
                $scope.rotatePreview();
            }
        };
        
        $scope.solveQuestion = function() {
            var answer = (getRandom(2) === 1) ? '<' : '>';
            if ($scope.currentQuestion) {
                $scope.currentQuestion.answer = answer;
                $scope.currentQuestion.isTrue = QuestionsService.checkAnswer($scope.currentQuestion, $scope.currentQuestion.answer);
                $timeout($scope.solveQuestion, 3000);
            }
        };
                                      
        $scope.rotatePreview = function() {

            $scope.option1 = angular.element("#option1");
            $scope.option2 = angular.element("#option2");

            var addChange = function() {
                $scope.option1.addClass('change');
                setTimeout(function() {    
                    $scope.option2.addClass('change');
                }, 100);
            }
            var removeChange = function() {
                $scope.option1.removeClass('change');
                $scope.option2.removeClass('change');
            }
            
            if ($scope.option2.hasClass('change')) {
                removeChange();
            }
            
            addChange();
            setTimeout(function() {
                removeChange();
            }, 500);
        };
        var getRandom = function (max) {
            return Math.floor(Math.random() * max);
        };
                                      
        $scope.learnMoreScroll = function() {
            $location.hash('more-info');
 
            // call $anchorScroll()
            $anchorScroll();    
        };
        $scope.updateHighscores = function() {
            HighScoreService.fetchTimelimit();  
        };
        
        $scope.init();
        
    }])
    .controller('PlayController', ['$scope', 'QuestionsService', function($scope, QuestionsService) {

        // Watch for changes in views and call init function when the view is loaded
        $scope.$watch('$viewContentLoaded', function(){
            //$scope.init();
        });

    }]).
    controller('TimelimitController', ['$scope', '$route', '$timeout',  '$interval', '$location', 'QuestionsService', 'TimerService', 
                                       'GameClassicFactory', 'SoundsService', 'DatabaseService', 'NameService', 'HighScoreService', '$cookies', '$cookieStore',
                                       function($scope, $route, $timeout, $interval, $location, QuestionsService, TimerService, 
                                                 GameClassicFactory, SoundsService, DatabaseService, NameService, HighScoreService, $cookies, $cookieStore) {

        // Watch for changes in views and call init function when the view is loaded
        $scope.$watch('$viewContentLoaded', function(){
            $scope.init();
        });
                                           
        // Watch for changes in high score
        $scope.$watch(function () { return HighScoreService.timelimitUpdated; },
            function (value) {
                $scope.highscores = HighScoreService.timelimitScores;
            }
        );
        $scope.$watch(function () { return HighScoreService.classicUpdated; },
            function (value) {
                $scope.highscores = HighScoreService.classicScores;
            }
        );
                                           
        $scope.$watch(function () { return GameClassicFactory.gameStatus; },
            function (value) {
                $scope.gameStatus = value;
                
                // Game end
                if ($scope.gameStatus == 3) {
                    angular.element('.score').addClass('final');
                    $scope.final = GameClassicFactory.final;
                    SoundsService.playFinish();
                    
                    // Generate name and save the result
                    var name;
                    if (HighScoreService.playerName)
                        name = HighScoreService.playerName;
                    else {
                        name = NameService.getName();
                        HighScoreService.playerName = name;
                        $cookieStore.put('playerName', name);
                    }
                    var newScore = [ null, name, $scope.score, new Date().toDateString(), 'ip here'];
                    var tableName = ($scope.mode.type == 'classic') ? 'score_classic' : 'score_timelimit';
                    
                    DatabaseService.addTableData(tableName, newScore, function(success) {
                        $scope.currentScore = DatabaseService.getLatestAddedId();

                        if ($scope.mode.type == 'timelimit') {
                            $cookieStore.put('timelimitScore', $scope.score);
                            HighScoreService.fetchTimelimit();  
                            $timeout(HighScoreService.fetchTimelimit, 300);
                        }
                        else if ($scope.mode.type == 'classic') {
                            $cookieStore.put('classicScore', $scope.score);
                            HighScoreService.fetchClassic();  
                            $timeout(HighScoreService.fetchClassic, 300);
                        }
                        
                    });
                }
            }
        );
                                           
        /*
        $scope.$watch(function () { return GameClassicFactory.score; },
            function (value) { $scope.score = value; $scope.updateScore(); }
        );
               */                                /*
        $scope.$watch(function () { return GameClassicFactory.time; },
            function (value) { $scope.time = { 
                min: Math.floor(value/60000), 
                sec: (value <= 3600) ? parseInt(value/1000) : parseInt((value-(Math.floor(value/60000)*60000))/1000), 
                milisec: value%1000 }; }
        );
        */

        
        // Some controller values
        //$scope.questions = null;
        //$scope.currentQuestion = null;

        $scope.game = GameClassicFactory;
        $scope.mode = null;
        $scope.highscores = null;
                                           
        $scope.mute = {
            music: false,
            sounds: false,
        };
                                           

        $scope.init = function() {
            
            HighScoreService.init();
            
            if ($route.current.templateUrl === 'partials/mode-classic.html') {
                $scope.mode = { type: 'classic', time: { min: 1, sec: 30 }};
                HighScoreService.fetchClassic();
            }
            else if ($route.current.templateUrl === 'partials/mode-timelimit.html') {
                $scope.mode = { type: 'timelimit', time: { min: 0, sec: 30 }};
                HighScoreService.fetchTimelimit();
            }

            GameClassicFactory.initGame(QuestionsService, TimerService, $scope.mode.time);
            SoundsService.playTheme();
            

            $scope.currentQuestion = GameClassicFactory.currentQuestion;
            
            // Attach listeners
            document.addEventListener('keyup', $scope.keyIsDown, false);
        };

        $scope.startGame = function() {
            $scope.questions = new Array();
            GameClassicFactory.start();
        };
        $scope.skipQuestion = function() {
            GameClassicFactory.skipQuestion(GameClassicFactory.currentQuestion); 
        };
        $scope.setAnswer = function(answer) {
            if ($scope.game.gameStatus !== 2)
                return;
            
            // Apply the animations
            $scope.rotateQuestions();
            $scope.updateScore();
            
            GameClassicFactory.currentQuestion.answer = answer;
            var isTrue = QuestionsService.checkAnswer(GameClassicFactory.currentQuestion, answer);
            
            GameClassicFactory.nextQuestion();
            $scope.modeSpecialOnAnswer(isTrue);
        };
        $scope.modeSpecialOnAnswer = function(answer) {
            if (answer) {
                GameClassicFactory.score += GameClassicFactory.questionPoints;
                SoundsService.playSuccess();
            }
            else {
                GameClassicFactory.TimerService.addTime(0,-1);
                GameClassicFactory.score -= GameClassicFactory.questionPoints/2;
                SoundsService.playError();
            }
            switch ($scope.mode.type) {
                case 'classic':
                    if (answer) {
                        //$scope.updateScore();
                    }
                    break;
                case 'timelimit':
                    if (answer) {
                        GameClassicFactory.TimerService.addTime(0,0.5);
                    }
                    break;
            }
        };
                                           
       $scope.changeMute = function() {
           SoundsService.mute($scope.mute);
       };
        
        // Animations
        $scope.rotateQuestions = function() {
            if ($scope.option1 === undefined || $scope.option2 === undefined) {
                $scope.option1 = angular.element("#option1");
                $scope.option2 = angular.element("#option2");
            }
            
            var addChange = function() {
                $scope.option1.addClass('change');
                setTimeout(function() {    
                    $scope.option2.addClass('change');
                }, 100);
            }
            var removeChange = function() {
                $scope.option1.removeClass('change');
                $scope.option2.removeClass('change');
            }
            
            /*
            if ($scope.option2.hasClass('change')) {
                removeChange();
            }
            */
            
            
            addChange();
            setTimeout(function() {
                removeChange();
            }, 600);
        };
        $scope.updateScore = function() {
            $scope.scoreDiv = angular.element(".score");
            
            var addChange = function() {
                $scope.scoreDiv.addClass('update');
            }
            var removeChange = function() {
                $scope.scoreDiv.removeClass('update');
            }
            
            
            addChange();
            setTimeout(function() {
                removeChange();
            }, 600);
        };
        
        $scope.keyIsDown = function(event) {
            //console.log(event.which);
            
            var charCode = typeof event.which == "number" ? event.which : event.keyCode;
            
            switch (charCode) {
                case 13:  // enter
                case 32: // space
                    if ($scope.gameStatus === 1) {
                        $scope.$apply(function() {
                            $scope.startGame();
                        });
                        return;
                    }
                    break; 
                case 37: 
                    $scope.$apply(function() {
                        $scope.setAnswer('<'); // smaller <
                    });
                    break;
                case 39: 
                    $scope.$apply(function() {
                        $scope.setAnswer('>'); // greather >
                    });
                    break;
                case 38: // up
                case 40: // down
                    if ($scope.gameStatus === 2) {
                        $scope.$apply(function() {
                            $scope.skipQuestion();
                        });
                    }
                    break; 
                
            };
        };
                                           



    }]);
'use strict';

/* Directives */


angular.module('easyMath.directives', []).
	directive('appVersion', ['version', function(version) {
		return function(scope, elm, attrs) {
			elm.text(version);
		};
	}]);
'use strict';


// Declare app level module which depends on filters, and services
angular.module('easyMath', [
	'ngRoute',
    'ngAnimate',
    'ngCookies',
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

'use strict';

/* Controllers */

angular.module('easyMath.controllers', []).
    controller('HomeController', ['$scope', '$timeout', '$interval', '$location', '$anchorScroll', 'QuestionsService', 'DatabaseService', 'HighScoreService', 
                                  function($scope, $timeout, $interval, $location, $anchorScroll, QuestionsService, DatabaseService, HighScoreService) {

        $scope.questions = null;
        $scope.currentQuestion = null;
        $scope.playerName = HighScoreService.playerName;
          
        $scope.$watch(function () { return HighScoreService.timelimitUpdated; },
            function (value) {
                console.log('Timelimit updated');
                $scope.timelimitScores = HighScoreService.timelimitScores;
            }
        );
        $scope.$watch(function () { return HighScoreService.classicUpdated; },
            function (value) {
                console.log('Classic updated');
                $scope.classicScores = HighScoreService.classicScores;
            }
        );

        $scope.init = function() {
            $scope.previewEnabled = true;
            $scope.generateQuestion();
            $interval($scope.generateQuestion, 3000);
            $timeout($scope.solveQuestion, 1500);
            
            //GameClassicFactory.initGame(QuestionsService, TimerService, $scope.mode.time);
            //SoundsService.playTheme();

            //$scope.currentQuestion = GameClassicFactory.currentQuestion;
            
            // Select and display the highscore table
            HighScoreService.init();

        };
        
        $scope.generateQuestion = function() {
            if ($location.path() === '/home') {
                $scope.currentQuestion = QuestionsService.generateQuestion(1);
                $scope.rotatePreview();
            }
        };
        
        $scope.solveQuestion = function() {
            var answer = (getRandom(2) === 1) ? '<' : '>';
            if ($scope.currentQuestion) {
                $scope.currentQuestion.answer = answer;
                $scope.currentQuestion.isTrue = QuestionsService.checkAnswer($scope.currentQuestion, $scope.currentQuestion.answer);
                $timeout($scope.solveQuestion, 3000);
            }
        };
                                      
        $scope.rotatePreview = function() {

            $scope.option1 = angular.element("#option1");
            $scope.option2 = angular.element("#option2");

            var addChange = function() {
                $scope.option1.addClass('change');
                setTimeout(function() {    
                    $scope.option2.addClass('change');
                }, 100);
            }
            var removeChange = function() {
                $scope.option1.removeClass('change');
                $scope.option2.removeClass('change');
            }
            
            if ($scope.option2.hasClass('change')) {
                removeChange();
            }
            
            addChange();
            setTimeout(function() {
                removeChange();
            }, 500);
        };
        var getRandom = function (max) {
            return Math.floor(Math.random() * max);
        };
                                      
        $scope.learnMoreScroll = function() {
            $location.hash('more-info');
 
            // call $anchorScroll()
            $anchorScroll();    
        };
        $scope.updateHighscores = function() {
            HighScoreService.fetchTimelimit();  
        };
        
        $scope.init();
        
    }])
    .controller('PlayController', ['$scope', 'QuestionsService', function($scope, QuestionsService) {

        // Watch for changes in views and call init function when the view is loaded
        $scope.$watch('$viewContentLoaded', function(){
            //$scope.init();
        });

    }]).
    controller('TimelimitController', ['$scope', '$route', '$timeout',  '$interval', '$location', 'QuestionsService', 'TimerService', 
                                       'GameClassicFactory', 'SoundsService', 'DatabaseService', 'NameService', 'HighScoreService', '$cookies', '$cookieStore',
                                       function($scope, $route, $timeout, $interval, $location, QuestionsService, TimerService, 
                                                 GameClassicFactory, SoundsService, DatabaseService, NameService, HighScoreService, $cookies, $cookieStore) {

        // Watch for changes in views and call init function when the view is loaded
        $scope.$watch('$viewContentLoaded', function(){
            $scope.init();
        });
                                           
        // Watch for changes in high score
        $scope.$watch(function () { return HighScoreService.timelimitUpdated; },
            function (value) {
                $scope.highscores = HighScoreService.timelimitScores;
            }
        );
        $scope.$watch(function () { return HighScoreService.classicUpdated; },
            function (value) {
                $scope.highscores = HighScoreService.classicScores;
            }
        );
                                           
        $scope.$watch(function () { return GameClassicFactory.gameStatus; },
            function (value) {
                $scope.gameStatus = value;
                
                // Game end
                if ($scope.gameStatus == 3) {
                    angular.element('.score').addClass('final');
                    $scope.final = GameClassicFactory.final;
                    SoundsService.playFinish();
                    
                    // Generate name and save the result
                    var name;
                    if (HighScoreService.playerName)
                        name = HighScoreService.playerName;
                    else {
                        name = NameService.getName();
                        HighScoreService.playerName = name;
                        $cookieStore.put('playerName', name);
                    }
                    var newScore = [ null, name, $scope.score, new Date().toDateString(), 'ip here'];
                    var tableName = ($scope.mode.type == 'classic') ? 'score_classic' : 'score_timelimit';
                    
                    DatabaseService.addTableData(tableName, newScore, function(success) {
                        $scope.currentScore = DatabaseService.getLatestAddedId();

                        if ($scope.mode.type == 'timelimit') {
                            $cookieStore.put('timelimitScore', $scope.score);
                            HighScoreService.fetchTimelimit();  
                            $timeout(HighScoreService.fetchTimelimit, 300);
                        }
                        else if ($scope.mode.type == 'classic') {
                            $cookieStore.put('classicScore', $scope.score);
                            HighScoreService.fetchClassic();  
                            $timeout(HighScoreService.fetchClassic, 300);
                        }
                        
                    });
                }
            }
        );
                                           
        /*
        $scope.$watch(function () { return GameClassicFactory.score; },
            function (value) { $scope.score = value; $scope.updateScore(); }
        );
               */                                /*
        $scope.$watch(function () { return GameClassicFactory.time; },
            function (value) { $scope.time = { 
                min: Math.floor(value/60000), 
                sec: (value <= 3600) ? parseInt(value/1000) : parseInt((value-(Math.floor(value/60000)*60000))/1000), 
                milisec: value%1000 }; }
        );
        */

        
        // Some controller values
        //$scope.questions = null;
        //$scope.currentQuestion = null;

        $scope.game = GameClassicFactory;
        $scope.mode = null;
        $scope.highscores = null;
                                           
        $scope.mute = {
            music: false,
            sounds: false,
        };
                                           

        $scope.init = function() {
            
            HighScoreService.init();
            
            if ($route.current.templateUrl === 'partials/mode-classic.html') {
                $scope.mode = { type: 'classic', time: { min: 1, sec: 30 }};
                HighScoreService.fetchClassic();
            }
            else if ($route.current.templateUrl === 'partials/mode-timelimit.html') {
                $scope.mode = { type: 'timelimit', time: { min: 0, sec: 30 }};
                HighScoreService.fetchTimelimit();
            }

            GameClassicFactory.initGame(QuestionsService, TimerService, $scope.mode.time);
            SoundsService.playTheme();
            

            $scope.currentQuestion = GameClassicFactory.currentQuestion;
            
            // Attach listeners
            document.addEventListener('keyup', $scope.keyIsDown, false);
        };

        $scope.startGame = function() {
            $scope.questions = new Array();
            GameClassicFactory.start();
        };
        $scope.skipQuestion = function() {
            GameClassicFactory.skipQuestion(GameClassicFactory.currentQuestion); 
        };
        $scope.setAnswer = function(answer) {
            if ($scope.game.gameStatus !== 2)
                return;
            
            // Apply the animations
            $scope.rotateQuestions();
            $scope.updateScore();
            
            GameClassicFactory.currentQuestion.answer = answer;
            var isTrue = QuestionsService.checkAnswer(GameClassicFactory.currentQuestion, answer);
            
            GameClassicFactory.nextQuestion();
            $scope.modeSpecialOnAnswer(isTrue);
        };
        $scope.modeSpecialOnAnswer = function(answer) {
            if (answer) {
                GameClassicFactory.score += GameClassicFactory.questionPoints;
                SoundsService.playSuccess();
            }
            else {
                GameClassicFactory.TimerService.addTime(0,-1);
                GameClassicFactory.score -= GameClassicFactory.questionPoints/2;
                SoundsService.playError();
            }
            switch ($scope.mode.type) {
                case 'classic':
                    if (answer) {
                        //$scope.updateScore();
                    }
                    break;
                case 'timelimit':
                    if (answer) {
                        GameClassicFactory.TimerService.addTime(0,0.5);
                    }
                    break;
            }
        };
                                           
       $scope.changeMute = function() {
           SoundsService.mute($scope.mute);
       };
        
        // Animations
        $scope.rotateQuestions = function() {
            if ($scope.option1 === undefined || $scope.option2 === undefined) {
                $scope.option1 = angular.element("#option1");
                $scope.option2 = angular.element("#option2");
            }
            
            var addChange = function() {
                $scope.option1.addClass('change');
                setTimeout(function() {    
                    $scope.option2.addClass('change');
                }, 100);
            }
            var removeChange = function() {
                $scope.option1.removeClass('change');
                $scope.option2.removeClass('change');
            }
            
            /*
            if ($scope.option2.hasClass('change')) {
                removeChange();
            }
            */
            
            
            addChange();
            setTimeout(function() {
                removeChange();
            }, 600);
        };
        $scope.updateScore = function() {
            $scope.scoreDiv = angular.element(".score");
            
            var addChange = function() {
                $scope.scoreDiv.addClass('update');
            }
            var removeChange = function() {
                $scope.scoreDiv.removeClass('update');
            }
            
            
            addChange();
            setTimeout(function() {
                removeChange();
            }, 600);
        };
        
        $scope.keyIsDown = function(event) {
            //console.log(event.which);
            
            var charCode = typeof event.which == "number" ? event.which : event.keyCode;
            
            switch (charCode) {
                case 13:  // enter
                case 32: // space
                    if ($scope.gameStatus === 1) {
                        $scope.$apply(function() {
                            $scope.startGame();
                        });
                        return;
                    }
                    break; 
                case 37: 
                    $scope.$apply(function() {
                        $scope.setAnswer('<'); // smaller <
                    });
                    break;
                case 39: 
                    $scope.$apply(function() {
                        $scope.setAnswer('>'); // greather >
                    });
                    break;
                case 38: // up
                case 40: // down
                    if ($scope.gameStatus === 2) {
                        $scope.$apply(function() {
                            $scope.skipQuestion();
                        });
                    }
                    break; 
                
            };
        };
                                           



    }]);
'use strict';

/* Directives */


angular.module('easyMath.directives', []).
	directive('appVersion', ['version', function(version) {
		return function(scope, elm, attrs) {
			elm.text(version);
		};
	}]);
'use strict';


// Declare app level module which depends on filters, and services
angular.module('easyMath', [
	'ngRoute',
    'ngAnimate',
    'ngCookies',
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

'use strict';angular.module('easyMath',['ngRoute','ngAnimate','ngCookies','easyMath.filters','easyMath.services','easyMath.directives','easyMath.controllers','ui.bootstrap']).config(['$routeProvider',function($routeProvider){$routeProvider.when('/home',{templateUrl:'partials/home.html',controller:'HomeController'});$routeProvider.when('/play',{templateUrl:'partials/play.html',controller:'PlayController'});$routeProvider.when('/about',{templateUrl:'partials/about.html',controller:'HomeController'});$routeProvider.when('/classic',{templateUrl:'partials/mode-classic.html',controller:'TimelimitController'});$routeProvider.when('/timelimit',{templateUrl:'partials/mode-timelimit.html',controller:'TimelimitController'});$routeProvider.when('/highscores',{templateUrl:'partials/highscores.html',controller:'HomeController'});$routeProvider.otherwise({redirectTo:'/home'});}]);
'use strict';

/* Controllers */

angular.module('easyMath.controllers', []).
    controller('HomeController', ['$scope', '$timeout', '$interval', '$location', '$anchorScroll', 'QuestionsService', 'DatabaseService', 'HighScoreService', 
                                  function($scope, $timeout, $interval, $location, $anchorScroll, QuestionsService, DatabaseService, HighScoreService) {

        $scope.questions = null;
        $scope.currentQuestion = null;
        $scope.playerName = HighScoreService.playerName;
          
        $scope.$watch(function () { return HighScoreService.timelimitUpdated; },
            function (value) {
                console.log('Timelimit updated');
                $scope.timelimitScores = HighScoreService.timelimitScores;
            }
        );
        $scope.$watch(function () { return HighScoreService.classicUpdated; },
            function (value) {
                console.log('Classic updated');
                $scope.classicScores = HighScoreService.classicScores;
            }
        );

        $scope.init = function() {
            $scope.previewEnabled = true;
            $scope.generateQuestion();
            $interval($scope.generateQuestion, 3000);
            $timeout($scope.solveQuestion, 1500);
            
            //GameClassicFactory.initGame(QuestionsService, TimerService, $scope.mode.time);
            //SoundsService.playTheme();

            //$scope.currentQuestion = GameClassicFactory.currentQuestion;
            
            // Select and display the highscore table
            HighScoreService.init();

        };
        
        $scope.generateQuestion = function() {
            if ($location.path() === '/home') {
                $scope.currentQuestion = QuestionsService.generateQuestion(1);
                $scope.rotatePreview();
            }
        };
        
        $scope.solveQuestion = function() {
            var answer = (getRandom(2) === 1) ? '<' : '>';
            if ($scope.currentQuestion) {
                $scope.currentQuestion.answer = answer;
                $scope.currentQuestion.isTrue = QuestionsService.checkAnswer($scope.currentQuestion, $scope.currentQuestion.answer);
                $timeout($scope.solveQuestion, 3000);
            }
        };
                                      
        $scope.rotatePreview = function() {

            $scope.option1 = angular.element("#option1");
            $scope.option2 = angular.element("#option2");

            var addChange = function() {
                $scope.option1.addClass('change');
                setTimeout(function() {    
                    $scope.option2.addClass('change');
                }, 100);
            }
            var removeChange = function() {
                $scope.option1.removeClass('change');
                $scope.option2.removeClass('change');
            }
            
            if ($scope.option2.hasClass('change')) {
                removeChange();
            }
            
            addChange();
            setTimeout(function() {
                removeChange();
            }, 500);
        };
        var getRandom = function (max) {
            return Math.floor(Math.random() * max);
        };
                                      
        $scope.learnMoreScroll = function() {
            $location.hash('more-info');
 
            // call $anchorScroll()
            $anchorScroll();    
        };
        $scope.updateHighscores = function() {
            HighScoreService.fetchTimelimit();  
        };
        
        $scope.init();
        
    }])
    .controller('PlayController', ['$scope', 'QuestionsService', function($scope, QuestionsService) {

        // Watch for changes in views and call init function when the view is loaded
        $scope.$watch('$viewContentLoaded', function(){
            //$scope.init();
        });

    }]).
    controller('TimelimitController', ['$scope', '$route', '$timeout',  '$interval', '$location', 'QuestionsService', 'TimerService', 
                                       'GameClassicFactory', 'SoundsService', 'DatabaseService', 'NameService', 'HighScoreService', '$cookies', '$cookieStore',
                                       function($scope, $route, $timeout, $interval, $location, QuestionsService, TimerService, 
                                                 GameClassicFactory, SoundsService, DatabaseService, NameService, HighScoreService, $cookies, $cookieStore) {

        // Watch for changes in views and call init function when the view is loaded
        $scope.$watch('$viewContentLoaded', function(){
            $scope.init();
        });
                                           
        // Watch for changes in high score
        $scope.$watch(function () { return HighScoreService.timelimitUpdated; },
            function (value) {
                $scope.highscores = HighScoreService.timelimitScores;
            }
        );
        $scope.$watch(function () { return HighScoreService.classicUpdated; },
            function (value) {
                $scope.highscores = HighScoreService.classicScores;
            }
        );
                                           
        $scope.$watch(function () { return GameClassicFactory.gameStatus; },
            function (value) {
                $scope.gameStatus = value;
                
                // Game end
                if ($scope.gameStatus == 3) {
                    angular.element('.score').addClass('final');
                    $scope.final = GameClassicFactory.final;
                    SoundsService.playFinish();
                    
                    // Generate name and save the result
                    var name;
                    if (HighScoreService.playerName)
                        name = HighScoreService.playerName;
                    else {
                        name = NameService.getName();
                        HighScoreService.playerName = name;
                        $cookieStore.put('playerName', name);
                    }
                    var newScore = [ null, name, $scope.score, new Date().toDateString(), 'ip here'];
                    var tableName = ($scope.mode.type == 'classic') ? 'score_classic' : 'score_timelimit';
                    
                    DatabaseService.addTableData(tableName, newScore, function(success) {
                        $scope.currentScore = DatabaseService.getLatestAddedId();

                        if ($scope.mode.type == 'timelimit') {
                            $cookieStore.put('timelimitScore', $scope.score);
                            HighScoreService.fetchTimelimit();  
                            $timeout(HighScoreService.fetchTimelimit, 300);
                        }
                        else if ($scope.mode.type == 'classic') {
                            $cookieStore.put('classicScore', $scope.score);
                            HighScoreService.fetchClassic();  
                            $timeout(HighScoreService.fetchClassic, 300);
                        }
                        
                    });
                }
            }
        );
                                           
        /*
        $scope.$watch(function () { return GameClassicFactory.score; },
            function (value) { $scope.score = value; $scope.updateScore(); }
        );
               */                                /*
        $scope.$watch(function () { return GameClassicFactory.time; },
            function (value) { $scope.time = { 
                min: Math.floor(value/60000), 
                sec: (value <= 3600) ? parseInt(value/1000) : parseInt((value-(Math.floor(value/60000)*60000))/1000), 
                milisec: value%1000 }; }
        );
        */

        
        // Some controller values
        //$scope.questions = null;
        //$scope.currentQuestion = null;

        $scope.game = GameClassicFactory;
        $scope.mode = null;
        $scope.highscores = null;
                                           
        $scope.mute = {
            music: false,
            sounds: false,
        };
                                           

        $scope.init = function() {
            
            HighScoreService.init();
            
            if ($route.current.templateUrl === 'partials/mode-classic.html') {
                $scope.mode = { type: 'classic', time: { min: 1, sec: 30 }};
                HighScoreService.fetchClassic();
            }
            else if ($route.current.templateUrl === 'partials/mode-timelimit.html') {
                $scope.mode = { type: 'timelimit', time: { min: 0, sec: 30 }};
                HighScoreService.fetchTimelimit();
            }

            GameClassicFactory.initGame(QuestionsService, TimerService, $scope.mode.time);
            SoundsService.playTheme();
            

            $scope.currentQuestion = GameClassicFactory.currentQuestion;
            
            // Attach listeners
            document.addEventListener('keyup', $scope.keyIsDown, false);
        };

        $scope.startGame = function() {
            $scope.questions = new Array();
            GameClassicFactory.start();
        };
        $scope.skipQuestion = function() {
            GameClassicFactory.skipQuestion(GameClassicFactory.currentQuestion); 
        };
        $scope.setAnswer = function(answer) {
            if ($scope.game.gameStatus !== 2)
                return;
            
            // Apply the animations
            $scope.rotateQuestions();
            $scope.updateScore();
            
            GameClassicFactory.currentQuestion.answer = answer;
            var isTrue = QuestionsService.checkAnswer(GameClassicFactory.currentQuestion, answer);
            
            GameClassicFactory.nextQuestion();
            $scope.modeSpecialOnAnswer(isTrue);
        };
        $scope.modeSpecialOnAnswer = function(answer) {
            if (answer) {
                GameClassicFactory.score += GameClassicFactory.questionPoints;
                SoundsService.playSuccess();
            }
            else {
                GameClassicFactory.TimerService.addTime(0,-1);
                GameClassicFactory.score -= GameClassicFactory.questionPoints/2;
                SoundsService.playError();
            }
            switch ($scope.mode.type) {
                case 'classic':
                    if (answer) {
                        //$scope.updateScore();
                    }
                    break;
                case 'timelimit':
                    if (answer) {
                        GameClassicFactory.TimerService.addTime(0,0.5);
                    }
                    break;
            }
        };
                                           
       $scope.changeMute = function() {
           SoundsService.mute($scope.mute);
       };
        
        // Animations
        $scope.rotateQuestions = function() {
            if ($scope.option1 === undefined || $scope.option2 === undefined) {
                $scope.option1 = angular.element("#option1");
                $scope.option2 = angular.element("#option2");
            }
            
            var addChange = function() {
                $scope.option1.addClass('change');
                setTimeout(function() {    
                    $scope.option2.addClass('change');
                }, 100);
            }
            var removeChange = function() {
                $scope.option1.removeClass('change');
                $scope.option2.removeClass('change');
            }
            
            /*
            if ($scope.option2.hasClass('change')) {
                removeChange();
            }
            */
            
            
            addChange();
            setTimeout(function() {
                removeChange();
            }, 600);
        };
        $scope.updateScore = function() {
            $scope.scoreDiv = angular.element(".score");
            
            var addChange = function() {
                $scope.scoreDiv.addClass('update');
            }
            var removeChange = function() {
                $scope.scoreDiv.removeClass('update');
            }
            
            
            addChange();
            setTimeout(function() {
                removeChange();
            }, 600);
        };
        
        $scope.keyIsDown = function(event) {
            //console.log(event.which);
            
            var charCode = typeof event.which == "number" ? event.which : event.keyCode;
            
            switch (charCode) {
                case 13:  // enter
                case 32: // space
                    if ($scope.gameStatus === 1) {
                        $scope.$apply(function() {
                            $scope.startGame();
                        });
                        return;
                    }
                    break; 
                case 37: 
                    $scope.$apply(function() {
                        $scope.setAnswer('<'); // smaller <
                    });
                    break;
                case 39: 
                    $scope.$apply(function() {
                        $scope.setAnswer('>'); // greather >
                    });
                    break;
                case 38: // up
                case 40: // down
                    if ($scope.gameStatus === 2) {
                        $scope.$apply(function() {
                            $scope.skipQuestion();
                        });
                    }
                    break; 
                
            };
        };
                                           



    }]);
'use strict';

/* Directives */


angular.module('easyMath.directives', []).
	directive('appVersion', ['version', function(version) {
		return function(scope, elm, attrs) {
			elm.text(version);
		};
	}]);
'use strict';


// Declare app level module which depends on filters, and services
angular.module('easyMath', [
	'ngRoute',
    'ngAnimate',
    'ngCookies',
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

'use strict';angular.module('easyMath',['ngRoute','ngAnimate','ngCookies','easyMath.filters','easyMath.services','easyMath.directives','easyMath.controllers','ui.bootstrap']).config(['$routeProvider',function($routeProvider){$routeProvider.when('/home',{templateUrl:'partials/home.html',controller:'HomeController'});$routeProvider.when('/play',{templateUrl:'partials/play.html',controller:'PlayController'});$routeProvider.when('/about',{templateUrl:'partials/about.html',controller:'HomeController'});$routeProvider.when('/classic',{templateUrl:'partials/mode-classic.html',controller:'TimelimitController'});$routeProvider.when('/timelimit',{templateUrl:'partials/mode-timelimit.html',controller:'TimelimitController'});$routeProvider.when('/highscores',{templateUrl:'partials/highscores.html',controller:'HomeController'});$routeProvider.otherwise({redirectTo:'/home'});}]);
'use strict';

/* Controllers */

angular.module('easyMath.controllers', []).
    controller('HomeController', ['$scope', '$timeout', '$interval', '$location', '$anchorScroll', 'QuestionsService', 'DatabaseService', 'HighScoreService', 
                                  function($scope, $timeout, $interval, $location, $anchorScroll, QuestionsService, DatabaseService, HighScoreService) {

        $scope.questions = null;
        $scope.currentQuestion = null;
        $scope.playerName = HighScoreService.playerName;
          
        $scope.$watch(function () { return HighScoreService.timelimitUpdated; },
            function (value) {
                console.log('Timelimit updated');
                $scope.timelimitScores = HighScoreService.timelimitScores;
            }
        );
        $scope.$watch(function () { return HighScoreService.classicUpdated; },
            function (value) {
                console.log('Classic updated');
                $scope.classicScores = HighScoreService.classicScores;
            }
        );

        $scope.init = function() {
            $scope.previewEnabled = true;
            $scope.generateQuestion();
            $interval($scope.generateQuestion, 3000);
            $timeout($scope.solveQuestion, 1500);
            
            //GameClassicFactory.initGame(QuestionsService, TimerService, $scope.mode.time);
            //SoundsService.playTheme();

            //$scope.currentQuestion = GameClassicFactory.currentQuestion;
            
            // Select and display the highscore table
            HighScoreService.init();

        };
        
        $scope.generateQuestion = function() {
            if ($location.path() === '/home') {
                $scope.currentQuestion = QuestionsService.generateQuestion(1);
                $scope.rotatePreview();
            }
        };
        
        $scope.solveQuestion = function() {
            var answer = (getRandom(2) === 1) ? '<' : '>';
            if ($scope.currentQuestion) {
                $scope.currentQuestion.answer = answer;
                $scope.currentQuestion.isTrue = QuestionsService.checkAnswer($scope.currentQuestion, $scope.currentQuestion.answer);
                $timeout($scope.solveQuestion, 3000);
            }
        };
                                      
        $scope.rotatePreview = function() {

            $scope.option1 = angular.element("#option1");
            $scope.option2 = angular.element("#option2");

            var addChange = function() {
                $scope.option1.addClass('change');
                setTimeout(function() {    
                    $scope.option2.addClass('change');
                }, 100);
            }
            var removeChange = function() {
                $scope.option1.removeClass('change');
                $scope.option2.removeClass('change');
            }
            
            if ($scope.option2.hasClass('change')) {
                removeChange();
            }
            
            addChange();
            setTimeout(function() {
                removeChange();
            }, 500);
        };
        var getRandom = function (max) {
            return Math.floor(Math.random() * max);
        };
                                      
        $scope.learnMoreScroll = function() {
            $location.hash('more-info');
 
            // call $anchorScroll()
            $anchorScroll();    
        };
        $scope.updateHighscores = function() {
            HighScoreService.fetchTimelimit();  
        };
        
        $scope.init();
        
    }])
    .controller('PlayController', ['$scope', 'QuestionsService', function($scope, QuestionsService) {

        // Watch for changes in views and call init function when the view is loaded
        $scope.$watch('$viewContentLoaded', function(){
            //$scope.init();
        });

    }]).
    controller('TimelimitController', ['$scope', '$route', '$timeout',  '$interval', '$location', 'QuestionsService', 'TimerService', 
                                       'GameClassicFactory', 'SoundsService', 'DatabaseService', 'NameService', 'HighScoreService', '$cookies', '$cookieStore',
                                       function($scope, $route, $timeout, $interval, $location, QuestionsService, TimerService, 
                                                 GameClassicFactory, SoundsService, DatabaseService, NameService, HighScoreService, $cookies, $cookieStore) {

        // Watch for changes in views and call init function when the view is loaded
        $scope.$watch('$viewContentLoaded', function(){
            $scope.init();
        });
                                           
        // Watch for changes in high score
        $scope.$watch(function () { return HighScoreService.timelimitUpdated; },
            function (value) {
                $scope.highscores = HighScoreService.timelimitScores;
            }
        );
        $scope.$watch(function () { return HighScoreService.classicUpdated; },
            function (value) {
                $scope.highscores = HighScoreService.classicScores;
            }
        );
                                           
        $scope.$watch(function () { return GameClassicFactory.gameStatus; },
            function (value) {
                $scope.gameStatus = value;
                
                // Game end
                if ($scope.gameStatus == 3) {
                    angular.element('.score').addClass('final');
                    $scope.final = GameClassicFactory.final;
                    SoundsService.playFinish();
                    
                    // Generate name and save the result
                    var name;
                    if (HighScoreService.playerName)
                        name = HighScoreService.playerName;
                    else {
                        name = NameService.getName();
                        HighScoreService.playerName = name;
                        $cookieStore.put('playerName', name);
                    }
                    var newScore = [ null, name, $scope.score, new Date().toDateString(), 'ip here'];
                    var tableName = ($scope.mode.type == 'classic') ? 'score_classic' : 'score_timelimit';
                    
                    DatabaseService.addTableData(tableName, newScore, function(success) {
                        $scope.currentScore = DatabaseService.getLatestAddedId();

                        if ($scope.mode.type == 'timelimit') {
                            $cookieStore.put('timelimitScore', $scope.score);
                            HighScoreService.fetchTimelimit();  
                            $timeout(HighScoreService.fetchTimelimit, 300);
                        }
                        else if ($scope.mode.type == 'classic') {
                            $cookieStore.put('classicScore', $scope.score);
                            HighScoreService.fetchClassic();  
                            $timeout(HighScoreService.fetchClassic, 300);
                        }
                        
                    });
                }
            }
        );
                                           
        /*
        $scope.$watch(function () { return GameClassicFactory.score; },
            function (value) { $scope.score = value; $scope.updateScore(); }
        );
               */                                /*
        $scope.$watch(function () { return GameClassicFactory.time; },
            function (value) { $scope.time = { 
                min: Math.floor(value/60000), 
                sec: (value <= 3600) ? parseInt(value/1000) : parseInt((value-(Math.floor(value/60000)*60000))/1000), 
                milisec: value%1000 }; }
        );
        */

        
        // Some controller values
        //$scope.questions = null;
        //$scope.currentQuestion = null;

        $scope.game = GameClassicFactory;
        $scope.mode = null;
        $scope.highscores = null;
                                           
        $scope.mute = {
            music: false,
            sounds: false,
        };
                                           

        $scope.init = function() {
            
            HighScoreService.init();
            
            if ($route.current.templateUrl === 'partials/mode-classic.html') {
                $scope.mode = { type: 'classic', time: { min: 1, sec: 30 }};
                HighScoreService.fetchClassic();
            }
            else if ($route.current.templateUrl === 'partials/mode-timelimit.html') {
                $scope.mode = { type: 'timelimit', time: { min: 0, sec: 30 }};
                HighScoreService.fetchTimelimit();
            }

            GameClassicFactory.initGame(QuestionsService, TimerService, $scope.mode.time);
            SoundsService.playTheme();
            

            $scope.currentQuestion = GameClassicFactory.currentQuestion;
            
            // Attach listeners
            document.addEventListener('keyup', $scope.keyIsDown, false);
        };

        $scope.startGame = function() {
            $scope.questions = new Array();
            GameClassicFactory.start();
        };
        $scope.skipQuestion = function() {
            GameClassicFactory.skipQuestion(GameClassicFactory.currentQuestion); 
        };
        $scope.setAnswer = function(answer) {
            if ($scope.game.gameStatus !== 2)
                return;
            
            // Apply the animations
            $scope.rotateQuestions();
            $scope.updateScore();
            
            GameClassicFactory.currentQuestion.answer = answer;
            var isTrue = QuestionsService.checkAnswer(GameClassicFactory.currentQuestion, answer);
            
            GameClassicFactory.nextQuestion();
            $scope.modeSpecialOnAnswer(isTrue);
        };
        $scope.modeSpecialOnAnswer = function(answer) {
            if (answer) {
                GameClassicFactory.score += GameClassicFactory.questionPoints;
                SoundsService.playSuccess();
            }
            else {
                GameClassicFactory.TimerService.addTime(0,-1);
                GameClassicFactory.score -= GameClassicFactory.questionPoints/2;
                SoundsService.playError();
            }
            switch ($scope.mode.type) {
                case 'classic':
                    if (answer) {
                        //$scope.updateScore();
                    }
                    break;
                case 'timelimit':
                    if (answer) {
                        GameClassicFactory.TimerService.addTime(0,0.5);
                    }
                    break;
            }
        };
                                           
       $scope.changeMute = function() {
           SoundsService.mute($scope.mute);
       };
        
        // Animations
        $scope.rotateQuestions = function() {
            if ($scope.option1 === undefined || $scope.option2 === undefined) {
                $scope.option1 = angular.element("#option1");
                $scope.option2 = angular.element("#option2");
            }
            
            var addChange = function() {
                $scope.option1.addClass('change');
                setTimeout(function() {    
                    $scope.option2.addClass('change');
                }, 100);
            }
            var removeChange = function() {
                $scope.option1.removeClass('change');
                $scope.option2.removeClass('change');
            }
            
            /*
            if ($scope.option2.hasClass('change')) {
                removeChange();
            }
            */
            
            
            addChange();
            setTimeout(function() {
                removeChange();
            }, 600);
        };
        $scope.updateScore = function() {
            $scope.scoreDiv = angular.element(".score");
            
            var addChange = function() {
                $scope.scoreDiv.addClass('update');
            }
            var removeChange = function() {
                $scope.scoreDiv.removeClass('update');
            }
            
            
            addChange();
            setTimeout(function() {
                removeChange();
            }, 600);
        };
        
        $scope.keyIsDown = function(event) {
            //console.log(event.which);
            
            var charCode = typeof event.which == "number" ? event.which : event.keyCode;
            
            switch (charCode) {
                case 13:  // enter
                case 32: // space
                    if ($scope.gameStatus === 1) {
                        $scope.$apply(function() {
                            $scope.startGame();
                        });
                        return;
                    }
                    break; 
                case 37: 
                    $scope.$apply(function() {
                        $scope.setAnswer('<'); // smaller <
                    });
                    break;
                case 39: 
                    $scope.$apply(function() {
                        $scope.setAnswer('>'); // greather >
                    });
                    break;
                case 38: // up
                case 40: // down
                    if ($scope.gameStatus === 2) {
                        $scope.$apply(function() {
                            $scope.skipQuestion();
                        });
                    }
                    break; 
                
            };
        };
                                           



    }]);
'use strict';

/* Directives */


angular.module('easyMath.directives', []).
	directive('appVersion', ['version', function(version) {
		return function(scope, elm, attrs) {
			elm.text(version);
		};
	}]);
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
'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
var easyMathServices = angular.module('easyMath.services', []);
	
easyMathServices.value('version', '0.1');

easyMathServices.service('TimerService', function($timeout) {
    
    var time = null;
    var finishTime = null;
    var timeout = null;
    
    var TIME_STEP = 100;
    
    var init = function(minutes, seconds) {
        var currentTime = new Date();
        var newTime = (minutes*60 + seconds)*1000;
        finishTime = new Date();
        time = new Date();
        
        finishTime.setTime(currentTime.getTime() + newTime);
    };
    
    var tick = function() {
        var currentTime = new Date();
        time.setTime(finishTime.getTime() - currentTime.getTime());
        //time -= TIME_STEP;    
        //show();
        
    };
    var pause = function() {
          
        $timeout.cancel(timeout);
        
    };
    var show = function() {
        console.log(time);
    };
    var getTime = function() {
        return time;
    };
    
    var addTime = function(minutes, seconds) {
        var newTime = (minutes*60 + seconds)*1000;
        
        finishTime.setTime(finishTime.getTime() + newTime);
    };
    
    this.init = init;
    this.tick = tick;
    this.show = show;
    this.getTime = getTime;
    this.addTime = addTime;
    this.time = time;
});


easyMathServices.service('NameService', function($timeout) {
    
    var objects = ['Lion', 'Beef', 'Bed', 'Cow' ,'Bananas', 'Hamster', 'Rhino', 'Knife', 'Tiger', 
                   'Phone', 'Dog', 'Bottle', 'Squirrel', 'Crow', 'Apple', 'Sheep', 'Panda', 
                   'Zebra', 'Lamp', 'Giraffe', 'Chicken', '', '', '', ''];
    
    var adjectives = ['impossible', 'inexpensive', 'innocent', 'inquisitive', 'modern', 'mushy', 'odd', 
                      'open', 'outstanding', 'poor', 'powerful', 'prickly', 'puzzled', 'real', 'rich', 
                      'shy', 'sleepy', 'stupid', 'super', 'talented', 'tame', 'tender', 'tough', 
                      'uninterested', 'vast', 'wandering', 'wild', 'wrong'];
    
    var getRandom = function (max) {
        return Math.floor(Math.random() * max);
    };
    
    var getName = function() {
        var name = adjectives[getRandom(adjectives.length)] + ' ' + objects[getRandom(objects.length)];
        return name;
    };
    
    this.getName = getName;
    
});

easyMathServices.service('DatabaseService', function($timeout) {
    
    var uid = 'p0000001362';
    var authcode = '-';
    var rdb = new SQLEngine(uid,authcode,'www.rdbhost.com');

    var latestId = 0;
    
    var getTableData = function(table, options, callback) {
        var query = 'SELECT * FROM '+table+' '+options;
        var res2 = rdb.query( {
            'callback' : callback,
            'q' : query } );
    };
    
    var addTableData = function(table, data, callback) {
        
        getTableData(table, 'ORDER BY id DESC LIMIT 1', function(success) {
            if (success.records.rows)
                data[0] = (parseInt(success.records.rows[0][0]))+1;
            else 
                data[0] = 1;
            latestId = data[0];
            
            var query = 'INSERT INTO '+table+' VALUES (%s, %s, %s, %s, %s)';
            var res = rdb.query( {
                'callback' : callback,
                'q' : query,
                'args': data} );  
        }) + 1;
    };
    
    var getLatestAddedId = function() {
        return latestId;    
    };
    
    this.getTableData = getTableData;
    this.addTableData = addTableData;
    this.getLatestAddedId = getLatestAddedId;
    
});

easyMathServices.factory('HighScoreService', function(DatabaseService, $cookies, $cookieStore) {
    
    var highscores = {}; 
    
    highscores.timelimitScores = null;
    highscores.classicScores = null;
    
    highscores.timelimitUpdated = 0;
    highscores.classicUpdated = 0;
    
    highscores.playerName = $cookieStore.get('playerName');
    highscores.classicYourScore = $cookieStore.get('classicScore');
    highscores.timelimitYourScore = $cookieStore.get('timelimitScore');
    
    var fetchClassic = function() {
        // Select and display the highscore table
        DatabaseService.getTableData('score_classic', 'ORDER BY SCORE DESC LIMIT 10', function(success) {
            highscores.classicScores = success.records.rows;
            highscores.classicUpdated++;
        });
    };
    var fetchTimelimit = function() {
        // Select and display the highscore table
        DatabaseService.getTableData('score_timelimit', 'ORDER BY SCORE DESC LIMIT 10', function(success) {
            highscores.timelimitScores = success.records.rows;
            highscores.timelimitUpdated++;
        });
        
    };
    
    var init = function() {
        fetchClassic();
        fetchTimelimit();
    };
    
    highscores.init = init;
    highscores.fetchClassic = fetchClassic;
    highscores.fetchTimelimit = fetchTimelimit;
    
    
    return highscores;
});



easyMathServices.service('SoundsService', function($timeout) {
    
    // Resources
    var answerSuccessRes = "sounds/success-cc0.wav";
    var answerErrorRes = "sounds/error2-cca3.wav";
    var tickSoundRes = "sounds/tick-cca3.wav";
    var finishSoundRes = "sounds/complete-cca3.wav"
    
    var themeSongRes = "sounds/theme-cc0.wav";
    var testRes = "http://soundbible.com/grab.php?id=989&type=mp3";
    
    // Sound variables
    var tickSound = new Audio(tickSoundRes);
    var themeSong = null;
    
    var answerSuccess = new Audio(tickSoundRes);
    var answerError = new Audio(answerErrorRes);
    var finishSound = new Audio(finishSoundRes);
    
    var themeTimeout = null;
    
    var init = function() {
        themeSong = new Audio(themeSongRes);
        themeSong.setAttribute('preload', 'auto');
    
        document.body.appendChild(themeSong);
        themeSong.addEventListener('ended', function() {
            themeSong.load();
            themeSong.play();
        });
        //themeSong.setAttribute('src', themeSongRes); // tova daje he trugva :D даи бровсер
        themeSong.load(); // stiga sahse ne stava :D basi mamata :X:X:X nali..
        
        answerSuccess.setAttribute("preload", "auto");
        
    };
    init();
    
    this.playTheme = function() {        
        themeSong.load();
        themeSong.play();        
    };
    this.stopTheme = function() {
        themeSong.pause();
    };
    
    this.playSuccess = function() {
        //answerSuccess.load();
        if (answerSuccess) {
            answerSuccess.currentTime = 0;
        }
        answerSuccess.play();
    };
    this.playError = function() {
        //answerError.load();
        if (answerError) {
            answerError.currentTime = 0;
        }
        answerError.play();
    };
    this.playFinish = function() {
        finishSound.load();
        finishSound.play();
    };
    this.mute = function(properties) {
        themeSong.muted = properties.music;    
        
        // And sounds
        answerSuccess.muted = properties.sounds;  
        answerError.muted = properties.sounds;
        finishSound.muted = properties.sounds;
    };
});

easyMathServices.service('QuestionsService', function(){
    
     // This is a simple function which generates random numbers
    var getRandom = function (max) {
        return Math.floor(Math.random() * max);
    };
    var getIntRandom = function(max) {
        return getRandom(max);
    };
    var getFloatRandom = function(max, precision) {
        return parseFloat((Math.random() * max).toPrecision(precision));
    };

    // This is function that generates question
    var generateQuestion = function(levelOfDifficult) {
        var newQuestion = {};

        var randomizer = null;
        var max = null;
        var precision = undefined;
        switch(levelOfDifficult) {
            case 1: 
                randomizer = getIntRandom;
                max = 10;
                break;
            case 2: 
                randomizer = getIntRandom;
                max = 20;
                break;
            case 3: 
                randomizer = getIntRandom;
                max = 50;
                break;
            case 4: 
                randomizer = getIntRandom;
                max = 100;
                break;
            case 5: 
                randomizer = getFloatRandom;
                precision = 3;
                max = 10;
                break;
            case 6: 
                randomizer = getFloatRandom;
                precision = 3;
                max = 20;
                break;
            case 7: 
                randomizer = getFloatRandom;
                precision = 4;
                max = 50;
                break;
            case 8: 
                randomizer = getFloatRandom;
                precision = 5;
                max = 50;
                break;
            case 9: 
                randomizer = getFloatRandom;
                precision = 5;
                max = 100;
                break;
            default: 
                randomizer = getFloatRandom;
                precision = 4;
                max = 500;
                break;
        }
        newQuestion.option1 = randomizer(max, precision);
        newQuestion.option2 = randomizer(max, precision);
        newQuestion.answer = undefined;
        newQuestion.isTrue = undefined;
        newQuestion.style = undefined;

        return newQuestion;
    };
        
    var checkAnswer = function(question, answer) {
        // 1. Find the valid answer
        // 2. Compare it with the given one
        
        var validAnswer = (question.option1 > question.option2) ? '>' : '<';
        question.isTrue = (answer == validAnswer) ? true : false;
        
        // If the options are equal we have a special case
        question.isTrue = (question.option1 === question.option2) ? true : question.isTrue;
        
        // Set some styles
        question.style = (question.isTrue) ? 'progress-bar-success' : 'progress-bar-danger';
        
        return question.isTrue;
    };
    
    this.getRandom = getRandom;
    this.generateQuestion = generateQuestion;
    this.checkAnswer = checkAnswer;
});

easyMathServices.factory('GameClassicFactory', function($interval) {
     
    var factory = {}; 
    
    // GAME SPECIFICATIONS
    var questionsCount = 10;
    var STEP_TIMER = 300;
    factory.questionPoints = 10;
    
    factory.score = 0;
    factory.level = 0;
    factory.questions = null;
    factory.currentQuestion = null;
    factory.gameStatus = 0;
    factory.time = null;
    
    factory.QuestionsService = null;
    factory.TimerService = null;
    factory.gameDuration = null;
    
    var timerInterval = null;
    
    factory.initGame = function(QuestionsService, TimerService, duration) {        
        factory.gameStatus = 1; // Initializing
        
        factory.QuestionsService = QuestionsService;
        factory.TimerService = TimerService;
        factory.gameDuration = duration;
        
        factory.time = factory.TimerService.time;
        
    };

    var initProperties = function() {
        factory.questions = [];
        factory.currentQuestion = { index: -1 };
        
        factory.score = 0;
        factory.level = 0;
        
        generateQuestions();
        factory.TimerService.init(factory.gameDuration.min, factory.gameDuration.sec);
    };
    
    factory.start = function() {
        initProperties();
        
        factory.gameStatus = 2; // Starting
        factory.nextQuestion();
        
        $interval.cancel(timerInterval);
        timerInterval = $interval(tickTimer, STEP_TIMER);
        
    };
    
    var generateQuestions = function() {
        var currentLength = parseInt(factory.questions.length);
        factory.level++;
        for (var i=0; i<questionsCount; i++) {
            var newQuestion = factory.QuestionsService.generateQuestion(factory.level);

            newQuestion.index = currentLength+i;
            factory.questions.push(newQuestion);
        }
    };
    
    var tickTimer = function() {
        factory.time = factory.TimerService.getTime();
        if (factory.time <= 0) {
            factory.gameStatus = 3;
            factory.final = { title: "Well done!", message: "" };
            
            $interval.cancel(timerInterval);
            return;
        }

        factory.TimerService.tick();
    };
    
    factory.nextQuestion = function() {
        var nextIndex = factory.currentQuestion.index+1;
        if (nextIndex >= factory.questions.length) {
            generateQuestions();
        }
            
        var next = factory.questions[nextIndex];
        factory.currentQuestion = next;
    }
    factory.skipQuestion = function(question) {
        question.answer = "?";
        factory.nextQuestion();
    };
 
    return factory;
});

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
'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
var easyMathServices = angular.module('easyMath.services', []);
	
easyMathServices.value('version', '0.1');

easyMathServices.service('TimerService', function($timeout) {
    
    var time = null;
    var finishTime = null;
    var timeout = null;
    
    var TIME_STEP = 100;
    
    var init = function(minutes, seconds) {
        var currentTime = new Date();
        var newTime = (minutes*60 + seconds)*1000;
        finishTime = new Date();
        time = new Date();
        
        finishTime.setTime(currentTime.getTime() + newTime);
    };
    
    var tick = function() {
        var currentTime = new Date();
        time.setTime(finishTime.getTime() - currentTime.getTime());
        //time -= TIME_STEP;    
        //show();
        
    };
    var pause = function() {
          
        $timeout.cancel(timeout);
        
    };
    var show = function() {
        console.log(time);
    };
    var getTime = function() {
        return time;
    };
    
    var addTime = function(minutes, seconds) {
        var newTime = (minutes*60 + seconds)*1000;
        
        finishTime.setTime(finishTime.getTime() + newTime);
    };
    
    this.init = init;
    this.tick = tick;
    this.show = show;
    this.getTime = getTime;
    this.addTime = addTime;
    this.time = time;
});


easyMathServices.service('NameService', function($timeout) {
    
    var objects = ['Lion', 'Beef', 'Bed', 'Cow' ,'Bananas', 'Hamster', 'Rhino', 'Knife', 'Tiger', 
                   'Phone', 'Dog', 'Bottle', 'Squirrel', 'Crow', 'Apple', 'Sheep', 'Panda', 
                   'Zebra', 'Lamp', 'Giraffe', 'Chicken', '', '', '', ''];
    
    var adjectives = ['impossible', 'inexpensive', 'innocent', 'inquisitive', 'modern', 'mushy', 'odd', 
                      'open', 'outstanding', 'poor', 'powerful', 'prickly', 'puzzled', 'real', 'rich', 
                      'shy', 'sleepy', 'stupid', 'super', 'talented', 'tame', 'tender', 'tough', 
                      'uninterested', 'vast', 'wandering', 'wild', 'wrong'];
    
    var getRandom = function (max) {
        return Math.floor(Math.random() * max);
    };
    
    var getName = function() {
        var name = adjectives[getRandom(adjectives.length)] + ' ' + objects[getRandom(objects.length)];
        return name;
    };
    
    this.getName = getName;
    
});

easyMathServices.service('DatabaseService', function($timeout) {
    
    var uid = 'p0000001362';
    var authcode = '-';
    var rdb = new SQLEngine(uid,authcode,'www.rdbhost.com');

    var latestId = 0;
    
    var getTableData = function(table, options, callback) {
        var query = 'SELECT * FROM '+table+' '+options;
        var res2 = rdb.query( {
            'callback' : callback,
            'q' : query } );
    };
    
    var addTableData = function(table, data, callback) {
        
        getTableData(table, 'ORDER BY id DESC LIMIT 1', function(success) {
            if (success.records.rows)
                data[0] = (parseInt(success.records.rows[0][0]))+1;
            else 
                data[0] = 1;
            latestId = data[0];
            
            var query = 'INSERT INTO '+table+' VALUES (%s, %s, %s, %s, %s)';
            var res = rdb.query( {
                'callback' : callback,
                'q' : query,
                'args': data} );  
        }) + 1;
    };
    
    var getLatestAddedId = function() {
        return latestId;    
    };
    
    this.getTableData = getTableData;
    this.addTableData = addTableData;
    this.getLatestAddedId = getLatestAddedId;
    
});

easyMathServices.factory('HighScoreService', function(DatabaseService, $cookies, $cookieStore) {
    
    var highscores = {}; 
    
    highscores.timelimitScores = null;
    highscores.classicScores = null;
    
    highscores.timelimitUpdated = 0;
    highscores.classicUpdated = 0;
    
    highscores.playerName = $cookieStore.get('playerName');
    highscores.classicYourScore = $cookieStore.get('classicScore');
    highscores.timelimitYourScore = $cookieStore.get('timelimitScore');
    
    var fetchClassic = function() {
        // Select and display the highscore table
        DatabaseService.getTableData('score_classic', 'ORDER BY SCORE DESC LIMIT 10', function(success) {
            highscores.classicScores = success.records.rows;
            highscores.classicUpdated++;
        });
    };
    var fetchTimelimit = function() {
        // Select and display the highscore table
        DatabaseService.getTableData('score_timelimit', 'ORDER BY SCORE DESC LIMIT 10', function(success) {
            highscores.timelimitScores = success.records.rows;
            highscores.timelimitUpdated++;
        });
        
    };
    
    var init = function() {
        fetchClassic();
        fetchTimelimit();
    };
    
    highscores.init = init;
    highscores.fetchClassic = fetchClassic;
    highscores.fetchTimelimit = fetchTimelimit;
    
    
    return highscores;
});



easyMathServices.service('SoundsService', function($timeout) {
    
    // Resources
    var answerSuccessRes = "sounds/success-cc0.wav";
    var answerErrorRes = "sounds/error2-cca3.wav";
    var tickSoundRes = "sounds/tick-cca3.wav";
    var finishSoundRes = "sounds/complete-cca3.wav"
    
    var themeSongRes = "sounds/theme-cc0.wav";
    var testRes = "http://soundbible.com/grab.php?id=989&type=mp3";
    
    // Sound variables
    var tickSound = new Audio(tickSoundRes);
    var themeSong = null;
    
    var answerSuccess = new Audio(tickSoundRes);
    var answerError = new Audio(answerErrorRes);
    var finishSound = new Audio(finishSoundRes);
    
    var themeTimeout = null;
    
    var init = function() {
        themeSong = new Audio(themeSongRes);
        themeSong.setAttribute('preload', 'auto');
    
        document.body.appendChild(themeSong);
        themeSong.addEventListener('ended', function() {
            themeSong.load();
            themeSong.play();
        });
        //themeSong.setAttribute('src', themeSongRes); // tova daje he trugva :D даи бровсер
        themeSong.load(); // stiga sahse ne stava :D basi mamata :X:X:X nali..
        
        answerSuccess.setAttribute("preload", "auto");
        
    };
    init();
    
    this.playTheme = function() {        
        themeSong.load();
        themeSong.play();        
    };
    this.stopTheme = function() {
        themeSong.pause();
    };
    
    this.playSuccess = function() {
        //answerSuccess.load();
        if (answerSuccess) {
            answerSuccess.currentTime = 0;
        }
        answerSuccess.play();
    };
    this.playError = function() {
        //answerError.load();
        if (answerError) {
            answerError.currentTime = 0;
        }
        answerError.play();
    };
    this.playFinish = function() {
        finishSound.load();
        finishSound.play();
    };
    this.mute = function(properties) {
        themeSong.muted = properties.music;    
        
        // And sounds
        answerSuccess.muted = properties.sounds;  
        answerError.muted = properties.sounds;
        finishSound.muted = properties.sounds;
    };
});

easyMathServices.service('QuestionsService', function(){
    
     // This is a simple function which generates random numbers
    var getRandom = function (max) {
        return Math.floor(Math.random() * max);
    };
    var getIntRandom = function(max) {
        return getRandom(max);
    };
    var getFloatRandom = function(max, precision) {
        return parseFloat((Math.random() * max).toPrecision(precision));
    };

    // This is function that generates question
    var generateQuestion = function(levelOfDifficult) {
        var newQuestion = {};

        var randomizer = null;
        var max = null;
        var precision = undefined;
        switch(levelOfDifficult) {
            case 1: 
                randomizer = getIntRandom;
                max = 10;
                break;
            case 2: 
                randomizer = getIntRandom;
                max = 20;
                break;
            case 3: 
                randomizer = getIntRandom;
                max = 50;
                break;
            case 4: 
                randomizer = getIntRandom;
                max = 100;
                break;
            case 5: 
                randomizer = getFloatRandom;
                precision = 3;
                max = 10;
                break;
            case 6: 
                randomizer = getFloatRandom;
                precision = 3;
                max = 20;
                break;
            case 7: 
                randomizer = getFloatRandom;
                precision = 4;
                max = 50;
                break;
            case 8: 
                randomizer = getFloatRandom;
                precision = 5;
                max = 50;
                break;
            case 9: 
                randomizer = getFloatRandom;
                precision = 5;
                max = 100;
                break;
            default: 
                randomizer = getFloatRandom;
                precision = 4;
                max = 500;
                break;
        }
        newQuestion.option1 = randomizer(max, precision);
        newQuestion.option2 = randomizer(max, precision);
        newQuestion.answer = undefined;
        newQuestion.isTrue = undefined;
        newQuestion.style = undefined;

        return newQuestion;
    };
        
    var checkAnswer = function(question, answer) {
        // 1. Find the valid answer
        // 2. Compare it with the given one
        
        var validAnswer = (question.option1 > question.option2) ? '>' : '<';
        question.isTrue = (answer == validAnswer) ? true : false;
        
        // If the options are equal we have a special case
        question.isTrue = (question.option1 === question.option2) ? true : question.isTrue;
        
        // Set some styles
        question.style = (question.isTrue) ? 'progress-bar-success' : 'progress-bar-danger';
        
        return question.isTrue;
    };
    
    this.getRandom = getRandom;
    this.generateQuestion = generateQuestion;
    this.checkAnswer = checkAnswer;
});

easyMathServices.factory('GameClassicFactory', function($interval) {
     
    var factory = {}; 
    
    // GAME SPECIFICATIONS
    var questionsCount = 10;
    var STEP_TIMER = 300;
    factory.questionPoints = 10;
    
    factory.score = 0;
    factory.level = 0;
    factory.questions = null;
    factory.currentQuestion = null;
    factory.gameStatus = 0;
    factory.time = null;
    
    factory.QuestionsService = null;
    factory.TimerService = null;
    factory.gameDuration = null;
    
    var timerInterval = null;
    
    factory.initGame = function(QuestionsService, TimerService, duration) {        
        factory.gameStatus = 1; // Initializing
        
        factory.QuestionsService = QuestionsService;
        factory.TimerService = TimerService;
        factory.gameDuration = duration;
        
        factory.time = factory.TimerService.time;
        
    };

    var initProperties = function() {
        factory.questions = [];
        factory.currentQuestion = { index: -1 };
        
        factory.score = 0;
        factory.level = 0;
        
        generateQuestions();
        factory.TimerService.init(factory.gameDuration.min, factory.gameDuration.sec);
    };
    
    factory.start = function() {
        initProperties();
        
        factory.gameStatus = 2; // Starting
        factory.nextQuestion();
        
        $interval.cancel(timerInterval);
        timerInterval = $interval(tickTimer, STEP_TIMER);
        
    };
    
    var generateQuestions = function() {
        var currentLength = parseInt(factory.questions.length);
        factory.level++;
        for (var i=0; i<questionsCount; i++) {
            var newQuestion = factory.QuestionsService.generateQuestion(factory.level);

            newQuestion.index = currentLength+i;
            factory.questions.push(newQuestion);
        }
    };
    
    var tickTimer = function() {
        factory.time = factory.TimerService.getTime();
        if (factory.time <= 0) {
            factory.gameStatus = 3;
            factory.final = { title: "Well done!", message: "" };
            
            $interval.cancel(timerInterval);
            return;
        }

        factory.TimerService.tick();
    };
    
    factory.nextQuestion = function() {
        var nextIndex = factory.currentQuestion.index+1;
        if (nextIndex >= factory.questions.length) {
            generateQuestions();
        }
            
        var next = factory.questions[nextIndex];
        factory.currentQuestion = next;
    }
    factory.skipQuestion = function(question) {
        question.answer = "?";
        factory.nextQuestion();
    };
 
    return factory;
});

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
'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
var easyMathServices = angular.module('easyMath.services', []);
	
easyMathServices.value('version', '0.1');

easyMathServices.service('TimerService', function($timeout) {
    
    var time = null;
    var finishTime = null;
    var timeout = null;
    
    var TIME_STEP = 100;
    
    var init = function(minutes, seconds) {
        var currentTime = new Date();
        var newTime = (minutes*60 + seconds)*1000;
        finishTime = new Date();
        time = new Date();
        
        finishTime.setTime(currentTime.getTime() + newTime);
    };
    
    var tick = function() {
        var currentTime = new Date();
        time.setTime(finishTime.getTime() - currentTime.getTime());
        //time -= TIME_STEP;    
        //show();
        
    };
    var pause = function() {
          
        $timeout.cancel(timeout);
        
    };
    var show = function() {
        console.log(time);
    };
    var getTime = function() {
        return time;
    };
    
    var addTime = function(minutes, seconds) {
        var newTime = (minutes*60 + seconds)*1000;
        
        finishTime.setTime(finishTime.getTime() + newTime);
    };
    
    this.init = init;
    this.tick = tick;
    this.show = show;
    this.getTime = getTime;
    this.addTime = addTime;
    this.time = time;
});


easyMathServices.service('NameService', function($timeout) {
    
    var objects = ['Lion', 'Beef', 'Bed', 'Cow' ,'Bananas', 'Hamster', 'Rhino', 'Knife', 'Tiger', 
                   'Phone', 'Dog', 'Bottle', 'Squirrel', 'Crow', 'Apple', 'Sheep', 'Panda', 
                   'Zebra', 'Lamp', 'Giraffe', 'Chicken', '', '', '', ''];
    
    var adjectives = ['impossible', 'inexpensive', 'innocent', 'inquisitive', 'modern', 'mushy', 'odd', 
                      'open', 'outstanding', 'poor', 'powerful', 'prickly', 'puzzled', 'real', 'rich', 
                      'shy', 'sleepy', 'stupid', 'super', 'talented', 'tame', 'tender', 'tough', 
                      'uninterested', 'vast', 'wandering', 'wild', 'wrong'];
    
    var getRandom = function (max) {
        return Math.floor(Math.random() * max);
    };
    
    var getName = function() {
        var name = adjectives[getRandom(adjectives.length)] + ' ' + objects[getRandom(objects.length)];
        return name;
    };
    
    this.getName = getName;
    
});

easyMathServices.service('DatabaseService', function($timeout) {
    
    var uid = 'p0000001362';
    var authcode = '-';
    var rdb = new SQLEngine(uid,authcode,'www.rdbhost.com');

    var latestId = 0;
    
    var getTableData = function(table, options, callback) {
        var query = 'SELECT * FROM '+table+' '+options;
        var res2 = rdb.query( {
            'callback' : callback,
            'q' : query } );
    };
    
    var addTableData = function(table, data, callback) {
        
        getTableData(table, 'ORDER BY id DESC LIMIT 1', function(success) {
            if (success.records.rows)
                data[0] = (parseInt(success.records.rows[0][0]))+1;
            else 
                data[0] = 1;
            latestId = data[0];
            
            var query = 'INSERT INTO '+table+' VALUES (%s, %s, %s, %s, %s)';
            var res = rdb.query( {
                'callback' : callback,
                'q' : query,
                'args': data} );  
        }) + 1;
    };
    
    var getLatestAddedId = function() {
        return latestId;    
    };
    
    this.getTableData = getTableData;
    this.addTableData = addTableData;
    this.getLatestAddedId = getLatestAddedId;
    
});

easyMathServices.factory('HighScoreService', function(DatabaseService, $cookies, $cookieStore) {
    
    var highscores = {}; 
    
    highscores.timelimitScores = null;
    highscores.classicScores = null;
    
    highscores.timelimitUpdated = 0;
    highscores.classicUpdated = 0;
    
    highscores.playerName = $cookieStore.get('playerName');
    highscores.classicYourScore = $cookieStore.get('classicScore');
    highscores.timelimitYourScore = $cookieStore.get('timelimitScore');
    
    var fetchClassic = function() {
        // Select and display the highscore table
        DatabaseService.getTableData('score_classic', 'ORDER BY SCORE DESC LIMIT 10', function(success) {
            highscores.classicScores = success.records.rows;
            highscores.classicUpdated++;
        });
    };
    var fetchTimelimit = function() {
        // Select and display the highscore table
        DatabaseService.getTableData('score_timelimit', 'ORDER BY SCORE DESC LIMIT 10', function(success) {
            highscores.timelimitScores = success.records.rows;
            highscores.timelimitUpdated++;
        });
        
    };
    
    var init = function() {
        fetchClassic();
        fetchTimelimit();
    };
    
    highscores.init = init;
    highscores.fetchClassic = fetchClassic;
    highscores.fetchTimelimit = fetchTimelimit;
    
    
    return highscores;
});



easyMathServices.service('SoundsService', function($timeout) {
    
    // Resources
    var answerSuccessRes = "sounds/success-cc0.wav";
    var answerErrorRes = "sounds/error2-cca3.wav";
    var tickSoundRes = "sounds/tick-cca3.wav";
    var finishSoundRes = "sounds/complete-cca3.wav"
    
    var themeSongRes = "sounds/theme-cc0.wav";
    var testRes = "http://soundbible.com/grab.php?id=989&type=mp3";
    
    // Sound variables
    var tickSound = new Audio(tickSoundRes);
    var themeSong = null;
    
    var answerSuccess = new Audio(tickSoundRes);
    var answerError = new Audio(answerErrorRes);
    var finishSound = new Audio(finishSoundRes);
    
    var themeTimeout = null;
    
    var init = function() {
        themeSong = new Audio(themeSongRes);
        themeSong.setAttribute('preload', 'auto');
    
        document.body.appendChild(themeSong);
        themeSong.addEventListener('ended', function() {
            themeSong.load();
            themeSong.play();
        });
        //themeSong.setAttribute('src', themeSongRes); // tova daje he trugva :D даи бровсер
        themeSong.load(); // stiga sahse ne stava :D basi mamata :X:X:X nali..
        
        answerSuccess.setAttribute("preload", "auto");
        
    };
    init();
    
    this.playTheme = function() {        
        themeSong.load();
        themeSong.play();        
    };
    this.stopTheme = function() {
        themeSong.pause();
    };
    
    this.playSuccess = function() {
        //answerSuccess.load();
        if (answerSuccess) {
            answerSuccess.currentTime = 0;
        }
        answerSuccess.play();
    };
    this.playError = function() {
        //answerError.load();
        if (answerError) {
            answerError.currentTime = 0;
        }
        answerError.play();
    };
    this.playFinish = function() {
        finishSound.load();
        finishSound.play();
    };
    this.mute = function(properties) {
        themeSong.muted = properties.music;    
        
        // And sounds
        answerSuccess.muted = properties.sounds;  
        answerError.muted = properties.sounds;
        finishSound.muted = properties.sounds;
    };
});

easyMathServices.service('QuestionsService', function(){
    
     // This is a simple function which generates random numbers
    var getRandom = function (max) {
        return Math.floor(Math.random() * max);
    };
    var getIntRandom = function(max) {
        return getRandom(max);
    };
    var getFloatRandom = function(max, precision) {
        return parseFloat((Math.random() * max).toPrecision(precision));
    };

    // This is function that generates question
    var generateQuestion = function(levelOfDifficult) {
        var newQuestion = {};

        var randomizer = null;
        var max = null;
        var precision = undefined;
        switch(levelOfDifficult) {
            case 1: 
                randomizer = getIntRandom;
                max = 10;
                break;
            case 2: 
                randomizer = getIntRandom;
                max = 20;
                break;
            case 3: 
                randomizer = getIntRandom;
                max = 50;
                break;
            case 4: 
                randomizer = getIntRandom;
                max = 100;
                break;
            case 5: 
                randomizer = getFloatRandom;
                precision = 3;
                max = 10;
                break;
            case 6: 
                randomizer = getFloatRandom;
                precision = 3;
                max = 20;
                break;
            case 7: 
                randomizer = getFloatRandom;
                precision = 4;
                max = 50;
                break;
            case 8: 
                randomizer = getFloatRandom;
                precision = 5;
                max = 50;
                break;
            case 9: 
                randomizer = getFloatRandom;
                precision = 5;
                max = 100;
                break;
            default: 
                randomizer = getFloatRandom;
                precision = 4;
                max = 500;
                break;
        }
        newQuestion.option1 = randomizer(max, precision);
        newQuestion.option2 = randomizer(max, precision);
        newQuestion.answer = undefined;
        newQuestion.isTrue = undefined;
        newQuestion.style = undefined;

        return newQuestion;
    };
        
    var checkAnswer = function(question, answer) {
        // 1. Find the valid answer
        // 2. Compare it with the given one
        
        var validAnswer = (question.option1 > question.option2) ? '>' : '<';
        question.isTrue = (answer == validAnswer) ? true : false;
        
        // If the options are equal we have a special case
        question.isTrue = (question.option1 === question.option2) ? true : question.isTrue;
        
        // Set some styles
        question.style = (question.isTrue) ? 'progress-bar-success' : 'progress-bar-danger';
        
        return question.isTrue;
    };
    
    this.getRandom = getRandom;
    this.generateQuestion = generateQuestion;
    this.checkAnswer = checkAnswer;
});

easyMathServices.factory('GameClassicFactory', function($interval) {
     
    var factory = {}; 
    
    // GAME SPECIFICATIONS
    var questionsCount = 10;
    var STEP_TIMER = 300;
    factory.questionPoints = 10;
    
    factory.score = 0;
    factory.level = 0;
    factory.questions = null;
    factory.currentQuestion = null;
    factory.gameStatus = 0;
    factory.time = null;
    
    factory.QuestionsService = null;
    factory.TimerService = null;
    factory.gameDuration = null;
    
    var timerInterval = null;
    
    factory.initGame = function(QuestionsService, TimerService, duration) {        
        factory.gameStatus = 1; // Initializing
        
        factory.QuestionsService = QuestionsService;
        factory.TimerService = TimerService;
        factory.gameDuration = duration;
        
        factory.time = factory.TimerService.time;
        
    };

    var initProperties = function() {
        factory.questions = [];
        factory.currentQuestion = { index: -1 };
        
        factory.score = 0;
        factory.level = 0;
        
        generateQuestions();
        factory.TimerService.init(factory.gameDuration.min, factory.gameDuration.sec);
    };
    
    factory.start = function() {
        initProperties();
        
        factory.gameStatus = 2; // Starting
        factory.nextQuestion();
        
        $interval.cancel(timerInterval);
        timerInterval = $interval(tickTimer, STEP_TIMER);
        
    };
    
    var generateQuestions = function() {
        var currentLength = parseInt(factory.questions.length);
        factory.level++;
        for (var i=0; i<questionsCount; i++) {
            var newQuestion = factory.QuestionsService.generateQuestion(factory.level);

            newQuestion.index = currentLength+i;
            factory.questions.push(newQuestion);
        }
    };
    
    var tickTimer = function() {
        factory.time = factory.TimerService.getTime();
        if (factory.time <= 0) {
            factory.gameStatus = 3;
            factory.final = { title: "Well done!", message: "" };
            
            $interval.cancel(timerInterval);
            return;
        }

        factory.TimerService.tick();
    };
    
    factory.nextQuestion = function() {
        var nextIndex = factory.currentQuestion.index+1;
        if (nextIndex >= factory.questions.length) {
            generateQuestions();
        }
            
        var next = factory.questions[nextIndex];
        factory.currentQuestion = next;
    }
    factory.skipQuestion = function(question) {
        question.answer = "?";
        factory.nextQuestion();
    };
 
    return factory;
});

"use strict";angular.module("easyMath",["ngRoute","ngAnimate","ngCookies","easyMath.filters","easyMath.services","easyMath.directives","easyMath.controllers","ui.bootstrap"]).config(["$routeProvider",function(a){a.when("/home",{templateUrl:"partials/home.html",controller:"HomeController"}),a.when("/play",{templateUrl:"partials/play.html",controller:"PlayController"}),a.when("/about",{templateUrl:"partials/about.html",controller:"HomeController"}),a.when("/classic",{templateUrl:"partials/mode-classic.html",controller:"TimelimitController"}),a.when("/timelimit",{templateUrl:"partials/mode-timelimit.html",controller:"TimelimitController"}),a.when("/highscores",{templateUrl:"partials/highscores.html",controller:"HomeController"}),a.otherwise({redirectTo:"/home"})}]),angular.module("easyMath.controllers",[]).controller("HomeController",["$scope","$timeout","$interval","$location","$anchorScroll","QuestionsService","DatabaseService","HighScoreService",function(a,b,c,d,e,f,g,h){a.questions=null,a.currentQuestion=null,a.playerName=h.playerName,a.$watch(function(){return h.timelimitUpdated},function(){console.log("Timelimit updated"),a.timelimitScores=h.timelimitScores}),a.$watch(function(){return h.classicUpdated},function(){console.log("Classic updated"),a.classicScores=h.classicScores}),a.init=function(){a.previewEnabled=!0,a.generateQuestion(),c(a.generateQuestion,3e3),b(a.solveQuestion,1500),h.init()},a.generateQuestion=function(){"/home"===d.path()&&(a.currentQuestion=f.generateQuestion(1),a.rotatePreview())},a.solveQuestion=function(){var c=1===i(2)?"<":">";a.currentQuestion&&(a.currentQuestion.answer=c,a.currentQuestion.isTrue=f.checkAnswer(a.currentQuestion,a.currentQuestion.answer),b(a.solveQuestion,3e3))},a.rotatePreview=function(){a.option1=angular.element("#option1"),a.option2=angular.element("#option2");var b=function(){a.option1.addClass("change"),setTimeout(function(){a.option2.addClass("change")},100)},c=function(){a.option1.removeClass("change"),a.option2.removeClass("change")};a.option2.hasClass("change")&&c(),b(),setTimeout(function(){c()},500)};var i=function(a){return Math.floor(Math.random()*a)};a.learnMoreScroll=function(){d.hash("more-info"),e()},a.updateHighscores=function(){h.fetchTimelimit()},a.init()}]).controller("PlayController",["$scope","QuestionsService",function(a){a.$watch("$viewContentLoaded",function(){})}]).controller("TimelimitController",["$scope","$route","$timeout","$interval","$location","QuestionsService","TimerService","GameClassicFactory","SoundsService","DatabaseService","NameService","HighScoreService","$cookies","$cookieStore",function(a,b,c,d,e,f,g,h,i,j,k,l,m,n){a.$watch("$viewContentLoaded",function(){a.init()}),a.$watch(function(){return l.timelimitUpdated},function(){a.highscores=l.timelimitScores}),a.$watch(function(){return l.classicUpdated},function(){a.highscores=l.classicScores}),a.$watch(function(){return h.gameStatus},function(b){if(a.gameStatus=b,3==a.gameStatus){angular.element(".score").addClass("final"),a.final=h.final,i.playFinish();var d;l.playerName?d=l.playerName:(d=k.getName(),l.playerName=d,n.put("playerName",d));var e=[null,d,a.score,(new Date).toDateString(),"ip here"],f="classic"==a.mode.type?"score_classic":"score_timelimit";j.addTableData(f,e,function(){a.currentScore=j.getLatestAddedId(),"timelimit"==a.mode.type?(n.put("timelimitScore",a.score),l.fetchTimelimit(),c(l.fetchTimelimit,300)):"classic"==a.mode.type&&(n.put("classicScore",a.score),l.fetchClassic(),c(l.fetchClassic,300))})}}),a.game=h,a.mode=null,a.highscores=null,a.mute={music:!1,sounds:!1},a.init=function(){l.init(),"partials/mode-classic.html"===b.current.templateUrl?(a.mode={type:"classic",time:{min:1,sec:30}},l.fetchClassic()):"partials/mode-timelimit.html"===b.current.templateUrl&&(a.mode={type:"timelimit",time:{min:0,sec:30}},l.fetchTimelimit()),h.initGame(f,g,a.mode.time),i.playTheme(),a.currentQuestion=h.currentQuestion,document.addEventListener("keyup",a.keyIsDown,!1)},a.startGame=function(){a.questions=new Array,h.start()},a.skipQuestion=function(){h.skipQuestion(h.currentQuestion)},a.setAnswer=function(b){if(2===a.game.gameStatus){a.rotateQuestions(),a.updateScore(),h.currentQuestion.answer=b;var c=f.checkAnswer(h.currentQuestion,b);h.nextQuestion(),a.modeSpecialOnAnswer(c)}},a.modeSpecialOnAnswer=function(b){switch(b?(h.score+=h.questionPoints,i.playSuccess()):(h.TimerService.addTime(0,-1),h.score-=h.questionPoints/2,i.playError()),a.mode.type){case"classic":break;case"timelimit":b&&h.TimerService.addTime(0,.5)}},a.changeMute=function(){i.mute(a.mute)},a.rotateQuestions=function(){(void 0===a.option1||void 0===a.option2)&&(a.option1=angular.element("#option1"),a.option2=angular.element("#option2"));var b=function(){a.option1.addClass("change"),setTimeout(function(){a.option2.addClass("change")},100)},c=function(){a.option1.removeClass("change"),a.option2.removeClass("change")};b(),setTimeout(function(){c()},600)},a.updateScore=function(){a.scoreDiv=angular.element(".score");var b=function(){a.scoreDiv.addClass("update")},c=function(){a.scoreDiv.removeClass("update")};b(),setTimeout(function(){c()},600)},a.keyIsDown=function(b){var c="number"==typeof b.which?b.which:b.keyCode;switch(c){case 13:case 32:if(1===a.gameStatus)return void a.$apply(function(){a.startGame()});break;case 37:a.$apply(function(){a.setAnswer("<")});break;case 39:a.$apply(function(){a.setAnswer(">")});break;case 38:case 40:2===a.gameStatus&&a.$apply(function(){a.skipQuestion()})}}}]),angular.module("easyMath.directives",[]).directive("appVersion",["version",function(a){return function(b,c){c.text(a)}}]),angular.module("easyMath",["ngRoute","ngAnimate","ngCookies","easyMath.filters","easyMath.services","easyMath.directives","easyMath.controllers","ui.bootstrap"]).config(["$routeProvider",function(a){a.when("/home",{templateUrl:"partials/home.html",controller:"HomeController"}),a.when("/play",{templateUrl:"partials/play.html",controller:"PlayController"}),a.when("/about",{templateUrl:"partials/about.html",controller:"HomeController"}),a.when("/classic",{templateUrl:"partials/mode-classic.html",controller:"TimelimitController"}),a.when("/timelimit",{templateUrl:"partials/mode-timelimit.html",controller:"TimelimitController"}),a.when("/highscores",{templateUrl:"partials/highscores.html",controller:"HomeController"}),a.otherwise({redirectTo:"/home"})}]),angular.module("easyMath",["ngRoute","ngAnimate","ngCookies","easyMath.filters","easyMath.services","easyMath.directives","easyMath.controllers","ui.bootstrap"]).config(["$routeProvider",function(a){a.when("/home",{templateUrl:"partials/home.html",controller:"HomeController"}),a.when("/play",{templateUrl:"partials/play.html",controller:"PlayController"}),a.when("/about",{templateUrl:"partials/about.html",controller:"HomeController"}),a.when("/classic",{templateUrl:"partials/mode-classic.html",controller:"TimelimitController"}),a.when("/timelimit",{templateUrl:"partials/mode-timelimit.html",controller:"TimelimitController"}),a.when("/highscores",{templateUrl:"partials/highscores.html",controller:"HomeController"}),a.otherwise({redirectTo:"/home"})}]),angular.module("easyMath.controllers",[]).controller("HomeController",["$scope","$timeout","$interval","$location","$anchorScroll","QuestionsService","DatabaseService","HighScoreService",function(a,b,c,d,e,f,g,h){a.questions=null,a.currentQuestion=null,a.playerName=h.playerName,a.$watch(function(){return h.timelimitUpdated},function(){console.log("Timelimit updated"),a.timelimitScores=h.timelimitScores}),a.$watch(function(){return h.classicUpdated},function(){console.log("Classic updated"),a.classicScores=h.classicScores}),a.init=function(){a.previewEnabled=!0,a.generateQuestion(),c(a.generateQuestion,3e3),b(a.solveQuestion,1500),h.init()},a.generateQuestion=function(){"/home"===d.path()&&(a.currentQuestion=f.generateQuestion(1),a.rotatePreview())},a.solveQuestion=function(){var c=1===i(2)?"<":">";a.currentQuestion&&(a.currentQuestion.answer=c,a.currentQuestion.isTrue=f.checkAnswer(a.currentQuestion,a.currentQuestion.answer),b(a.solveQuestion,3e3))},a.rotatePreview=function(){a.option1=angular.element("#option1"),a.option2=angular.element("#option2");var b=function(){a.option1.addClass("change"),setTimeout(function(){a.option2.addClass("change")},100)},c=function(){a.option1.removeClass("change"),a.option2.removeClass("change")};a.option2.hasClass("change")&&c(),b(),setTimeout(function(){c()},500)};var i=function(a){return Math.floor(Math.random()*a)};a.learnMoreScroll=function(){d.hash("more-info"),e()},a.updateHighscores=function(){h.fetchTimelimit()},a.init()}]).controller("PlayController",["$scope","QuestionsService",function(a){a.$watch("$viewContentLoaded",function(){})}]).controller("TimelimitController",["$scope","$route","$timeout","$interval","$location","QuestionsService","TimerService","GameClassicFactory","SoundsService","DatabaseService","NameService","HighScoreService","$cookies","$cookieStore",function(a,b,c,d,e,f,g,h,i,j,k,l,m,n){a.$watch("$viewContentLoaded",function(){a.init()}),a.$watch(function(){return l.timelimitUpdated},function(){a.highscores=l.timelimitScores}),a.$watch(function(){return l.classicUpdated},function(){a.highscores=l.classicScores}),a.$watch(function(){return h.gameStatus},function(b){if(a.gameStatus=b,3==a.gameStatus){angular.element(".score").addClass("final"),a.final=h.final,i.playFinish();var d;l.playerName?d=l.playerName:(d=k.getName(),l.playerName=d,n.put("playerName",d));var e=[null,d,a.score,(new Date).toDateString(),"ip here"],f="classic"==a.mode.type?"score_classic":"score_timelimit";j.addTableData(f,e,function(){a.currentScore=j.getLatestAddedId(),"timelimit"==a.mode.type?(n.put("timelimitScore",a.score),l.fetchTimelimit(),c(l.fetchTimelimit,300)):"classic"==a.mode.type&&(n.put("classicScore",a.score),l.fetchClassic(),c(l.fetchClassic,300))})}}),a.game=h,a.mode=null,a.highscores=null,a.mute={music:!1,sounds:!1},a.init=function(){l.init(),"partials/mode-classic.html"===b.current.templateUrl?(a.mode={type:"classic",time:{min:1,sec:30}},l.fetchClassic()):"partials/mode-timelimit.html"===b.current.templateUrl&&(a.mode={type:"timelimit",time:{min:0,sec:30}},l.fetchTimelimit()),h.initGame(f,g,a.mode.time),i.playTheme(),a.currentQuestion=h.currentQuestion,document.addEventListener("keyup",a.keyIsDown,!1)},a.startGame=function(){a.questions=new Array,h.start()},a.skipQuestion=function(){h.skipQuestion(h.currentQuestion)},a.setAnswer=function(b){if(2===a.game.gameStatus){a.rotateQuestions(),a.updateScore(),h.currentQuestion.answer=b;var c=f.checkAnswer(h.currentQuestion,b);h.nextQuestion(),a.modeSpecialOnAnswer(c)}},a.modeSpecialOnAnswer=function(b){switch(b?(h.score+=h.questionPoints,i.playSuccess()):(h.TimerService.addTime(0,-1),h.score-=h.questionPoints/2,i.playError()),a.mode.type){case"classic":break;case"timelimit":b&&h.TimerService.addTime(0,.5)}},a.changeMute=function(){i.mute(a.mute)},a.rotateQuestions=function(){(void 0===a.option1||void 0===a.option2)&&(a.option1=angular.element("#option1"),a.option2=angular.element("#option2"));var b=function(){a.option1.addClass("change"),setTimeout(function(){a.option2.addClass("change")},100)},c=function(){a.option1.removeClass("change"),a.option2.removeClass("change")};b(),setTimeout(function(){c()},600)},a.updateScore=function(){a.scoreDiv=angular.element(".score");var b=function(){a.scoreDiv.addClass("update")},c=function(){a.scoreDiv.removeClass("update")};b(),setTimeout(function(){c()},600)},a.keyIsDown=function(b){var c="number"==typeof b.which?b.which:b.keyCode;switch(c){case 13:case 32:if(1===a.gameStatus)return void a.$apply(function(){a.startGame()});break;case 37:a.$apply(function(){a.setAnswer("<")});break;case 39:a.$apply(function(){a.setAnswer(">")});break;case 38:case 40:2===a.gameStatus&&a.$apply(function(){a.skipQuestion()})}}}]),angular.module("easyMath.directives",[]).directive("appVersion",["version",function(a){return function(b,c){c.text(a)}}]),angular.module("easyMath",["ngRoute","ngAnimate","ngCookies","easyMath.filters","easyMath.services","easyMath.directives","easyMath.controllers","ui.bootstrap"]).config(["$routeProvider",function(a){a.when("/home",{templateUrl:"partials/home.html",controller:"HomeController"}),a.when("/play",{templateUrl:"partials/play.html",controller:"PlayController"}),a.when("/about",{templateUrl:"partials/about.html",controller:"HomeController"}),a.when("/classic",{templateUrl:"partials/mode-classic.html",controller:"TimelimitController"}),a.when("/timelimit",{templateUrl:"partials/mode-timelimit.html",controller:"TimelimitController"}),a.when("/highscores",{templateUrl:"partials/highscores.html",controller:"HomeController"}),a.otherwise({redirectTo:"/home"})}]),angular.module("easyMath",["ngRoute","ngAnimate","ngCookies","easyMath.filters","easyMath.services","easyMath.directives","easyMath.controllers","ui.bootstrap"]).config(["$routeProvider",function(a){a.when("/home",{templateUrl:"partials/home.html",controller:"HomeController"}),a.when("/play",{templateUrl:"partials/play.html",controller:"PlayController"}),a.when("/about",{templateUrl:"partials/about.html",controller:"HomeController"}),a.when("/classic",{templateUrl:"partials/mode-classic.html",controller:"TimelimitController"}),a.when("/timelimit",{templateUrl:"partials/mode-timelimit.html",controller:"TimelimitController"}),a.when("/highscores",{templateUrl:"partials/highscores.html",controller:"HomeController"}),a.otherwise({redirectTo:"/home"})}]),angular.module("easyMath.controllers",[]).controller("HomeController",["$scope","$timeout","$interval","$location","$anchorScroll","QuestionsService","DatabaseService","HighScoreService",function(a,b,c,d,e,f,g,h){a.questions=null,a.currentQuestion=null,a.playerName=h.playerName,a.$watch(function(){return h.timelimitUpdated},function(){console.log("Timelimit updated"),a.timelimitScores=h.timelimitScores}),a.$watch(function(){return h.classicUpdated},function(){console.log("Classic updated"),a.classicScores=h.classicScores}),a.init=function(){a.previewEnabled=!0,a.generateQuestion(),c(a.generateQuestion,3e3),b(a.solveQuestion,1500),h.init()},a.generateQuestion=function(){"/home"===d.path()&&(a.currentQuestion=f.generateQuestion(1),a.rotatePreview())},a.solveQuestion=function(){var c=1===i(2)?"<":">";a.currentQuestion&&(a.currentQuestion.answer=c,a.currentQuestion.isTrue=f.checkAnswer(a.currentQuestion,a.currentQuestion.answer),b(a.solveQuestion,3e3))},a.rotatePreview=function(){a.option1=angular.element("#option1"),a.option2=angular.element("#option2");var b=function(){a.option1.addClass("change"),setTimeout(function(){a.option2.addClass("change")},100)},c=function(){a.option1.removeClass("change"),a.option2.removeClass("change")};a.option2.hasClass("change")&&c(),b(),setTimeout(function(){c()},500)};var i=function(a){return Math.floor(Math.random()*a)};a.learnMoreScroll=function(){d.hash("more-info"),e()},a.updateHighscores=function(){h.fetchTimelimit()},a.init()}]).controller("PlayController",["$scope","QuestionsService",function(a){a.$watch("$viewContentLoaded",function(){})}]).controller("TimelimitController",["$scope","$route","$timeout","$interval","$location","QuestionsService","TimerService","GameClassicFactory","SoundsService","DatabaseService","NameService","HighScoreService","$cookies","$cookieStore",function(a,b,c,d,e,f,g,h,i,j,k,l,m,n){a.$watch("$viewContentLoaded",function(){a.init()}),a.$watch(function(){return l.timelimitUpdated},function(){a.highscores=l.timelimitScores}),a.$watch(function(){return l.classicUpdated},function(){a.highscores=l.classicScores}),a.$watch(function(){return h.gameStatus},function(b){if(a.gameStatus=b,3==a.gameStatus){angular.element(".score").addClass("final"),a.final=h.final,i.playFinish();var d;l.playerName?d=l.playerName:(d=k.getName(),l.playerName=d,n.put("playerName",d));var e=[null,d,a.score,(new Date).toDateString(),"ip here"],f="classic"==a.mode.type?"score_classic":"score_timelimit";j.addTableData(f,e,function(){a.currentScore=j.getLatestAddedId(),"timelimit"==a.mode.type?(n.put("timelimitScore",a.score),l.fetchTimelimit(),c(l.fetchTimelimit,300)):"classic"==a.mode.type&&(n.put("classicScore",a.score),l.fetchClassic(),c(l.fetchClassic,300))})}}),a.game=h,a.mode=null,a.highscores=null,a.mute={music:!1,sounds:!1},a.init=function(){l.init(),"partials/mode-classic.html"===b.current.templateUrl?(a.mode={type:"classic",time:{min:1,sec:30}},l.fetchClassic()):"partials/mode-timelimit.html"===b.current.templateUrl&&(a.mode={type:"timelimit",time:{min:0,sec:30}},l.fetchTimelimit()),h.initGame(f,g,a.mode.time),i.playTheme(),a.currentQuestion=h.currentQuestion,document.addEventListener("keyup",a.keyIsDown,!1)},a.startGame=function(){a.questions=new Array,h.start()},a.skipQuestion=function(){h.skipQuestion(h.currentQuestion)},a.setAnswer=function(b){if(2===a.game.gameStatus){a.rotateQuestions(),a.updateScore(),h.currentQuestion.answer=b;var c=f.checkAnswer(h.currentQuestion,b);h.nextQuestion(),a.modeSpecialOnAnswer(c)}},a.modeSpecialOnAnswer=function(b){switch(b?(h.score+=h.questionPoints,i.playSuccess()):(h.TimerService.addTime(0,-1),h.score-=h.questionPoints/2,i.playError()),a.mode.type){case"classic":break;case"timelimit":b&&h.TimerService.addTime(0,.5)}},a.changeMute=function(){i.mute(a.mute)},a.rotateQuestions=function(){(void 0===a.option1||void 0===a.option2)&&(a.option1=angular.element("#option1"),a.option2=angular.element("#option2"));var b=function(){a.option1.addClass("change"),setTimeout(function(){a.option2.addClass("change")},100)},c=function(){a.option1.removeClass("change"),a.option2.removeClass("change")};b(),setTimeout(function(){c()},600)},a.updateScore=function(){a.scoreDiv=angular.element(".score");var b=function(){a.scoreDiv.addClass("update")},c=function(){a.scoreDiv.removeClass("update")};b(),setTimeout(function(){c()},600)},a.keyIsDown=function(b){var c="number"==typeof b.which?b.which:b.keyCode;switch(c){case 13:case 32:if(1===a.gameStatus)return void a.$apply(function(){a.startGame()});break;case 37:a.$apply(function(){a.setAnswer("<")});break;case 39:a.$apply(function(){a.setAnswer(">")});break;case 38:case 40:2===a.gameStatus&&a.$apply(function(){a.skipQuestion()})}}}]),angular.module("easyMath.directives",[]).directive("appVersion",["version",function(a){return function(b,c){c.text(a)}}]);var easyMathFilters=angular.module("easyMath.filters",[]);easyMathFilters.filter("interpolate",["version",function(a){return function(b){return String(b).replace(/\%VERSION\%/gm,a)}}]),easyMathFilters.filter("filterAnswered",function(){return function(a){var b={output:[]};return angular.forEach(a,function(a){void 0!==a.answer&&this.output.push(a)},b),b.output}});var easyMathServices=angular.module("easyMath.services",[]);easyMathServices.value("version","0.1"),easyMathServices.service("TimerService",function(a){var b=null,c=null,d=function(a,d){var e=new Date,f=1e3*(60*a+d);c=new Date,b=new Date,c.setTime(e.getTime()+f)},e=function(){var a=new Date;b.setTime(c.getTime()-a.getTime())},f=function(){console.log(b)},g=function(){return b},h=function(a,b){var d=1e3*(60*a+b);c.setTime(c.getTime()+d)};this.init=d,this.tick=e,this.show=f,this.getTime=g,this.addTime=h,this.time=b}),easyMathServices.service("NameService",function(){var a=["Lion","Beef","Bed","Cow","Bananas","Hamster","Rhino","Knife","Tiger","Phone","Dog","Bottle","Squirrel","Crow","Apple","Sheep","Panda","Zebra","Lamp","Giraffe","Chicken","","","",""],b=["impossible","inexpensive","innocent","inquisitive","modern","mushy","odd","open","outstanding","poor","powerful","prickly","puzzled","real","rich","shy","sleepy","stupid","super","talented","tame","tender","tough","uninterested","vast","wandering","wild","wrong"],c=function(a){return Math.floor(Math.random()*a)},d=function(){var d=b[c(b.length)]+" "+a[c(a.length)];return d};this.getName=d}),easyMathServices.service("DatabaseService",function(){var a="p0000001362",b="-",c=new SQLEngine(a,b,"www.rdbhost.com"),d=0,e=function(a,b,d){{var e="SELECT * FROM "+a+" "+b;c.query({callback:d,q:e})}},f=function(a,b,f){e(a,"ORDER BY id DESC LIMIT 1",function(e){b[0]=e.records.rows?parseInt(e.records.rows[0][0])+1:1,d=b[0];{var g="INSERT INTO "+a+" VALUES (%s, %s, %s, %s, %s)";c.query({callback:f,q:g,args:b})}})+1},g=function(){return d};this.getTableData=e,this.addTableData=f,this.getLatestAddedId=g}),easyMathServices.factory("HighScoreService",function(a,b,c){var d={};d.timelimitScores=null,d.classicScores=null,d.timelimitUpdated=0,d.classicUpdated=0,d.playerName=c.get("playerName"),d.classicYourScore=c.get("classicScore"),d.timelimitYourScore=c.get("timelimitScore");var e=function(){a.getTableData("score_classic","ORDER BY SCORE DESC LIMIT 10",function(a){d.classicScores=a.records.rows,d.classicUpdated++})},f=function(){a.getTableData("score_timelimit","ORDER BY SCORE DESC LIMIT 10",function(a){d.timelimitScores=a.records.rows,d.timelimitUpdated++})},g=function(){e(),f()};return d.init=g,d.fetchClassic=e,d.fetchTimelimit=f,d}),easyMathServices.service("SoundsService",function(){var a="sounds/error2-cca3.wav",b="sounds/tick-cca3.wav",c="sounds/complete-cca3.wav",d="sounds/theme-cc0.wav",e=(new Audio(b),null),f=new Audio(b),g=new Audio(a),h=new Audio(c),i=function(){e=new Audio(d),e.setAttribute("preload","auto"),document.body.appendChild(e),e.addEventListener("ended",function(){e.load(),e.play()}),e.load(),f.setAttribute("preload","auto")};i(),this.playTheme=function(){e.load(),e.play()},this.stopTheme=function(){e.pause()},this.playSuccess=function(){f&&(f.currentTime=0),f.play()},this.playError=function(){g&&(g.currentTime=0),g.play()},this.playFinish=function(){h.load(),h.play()},this.mute=function(a){e.muted=a.music,f.muted=a.sounds,g.muted=a.sounds,h.muted=a.sounds}}),easyMathServices.service("QuestionsService",function(){var a=function(a){return Math.floor(Math.random()*a)},b=function(b){return a(b)},c=function(a,b){return parseFloat((Math.random()*a).toPrecision(b))},d=function(a){var d={},e=null,f=null,g=void 0;switch(a){case 1:e=b,f=10;break;case 2:e=b,f=20;break;case 3:e=b,f=50;break;case 4:e=b,f=100;break;case 5:e=c,g=3,f=10;break;case 6:e=c,g=3,f=20;break;case 7:e=c,g=4,f=50;break;case 8:e=c,g=5,f=50;break;case 9:e=c,g=5,f=100;break;default:e=c,g=4,f=500}return d.option1=e(f,g),d.option2=e(f,g),d.answer=void 0,d.isTrue=void 0,d.style=void 0,d},e=function(a,b){var c=a.option1>a.option2?">":"<";return a.isTrue=b==c?!0:!1,a.isTrue=a.option1===a.option2?!0:a.isTrue,a.style=a.isTrue?"progress-bar-success":"progress-bar-danger",a.isTrue};this.getRandom=a,this.generateQuestion=d,this.checkAnswer=e}),easyMathServices.factory("GameClassicFactory",function(a){var b={},c=10,d=300;b.questionPoints=10,b.score=0,b.level=0,b.questions=null,b.currentQuestion=null,b.gameStatus=0,b.time=null,b.QuestionsService=null,b.TimerService=null,b.gameDuration=null;var e=null;b.initGame=function(a,c,d){b.gameStatus=1,b.QuestionsService=a,b.TimerService=c,b.gameDuration=d,b.time=b.TimerService.time};var f=function(){b.questions=[],b.currentQuestion={index:-1},b.score=0,b.level=0,g(),b.TimerService.init(b.gameDuration.min,b.gameDuration.sec)};b.start=function(){f(),b.gameStatus=2,b.nextQuestion(),a.cancel(e),e=a(h,d)};var g=function(){var a=parseInt(b.questions.length);b.level++;for(var d=0;c>d;d++){var e=b.QuestionsService.generateQuestion(b.level);e.index=a+d,b.questions.push(e)}},h=function(){return b.time=b.TimerService.getTime(),b.time<=0?(b.gameStatus=3,b.final={title:"Well done!",message:""},void a.cancel(e)):void b.TimerService.tick()};return b.nextQuestion=function(){var a=b.currentQuestion.index+1;a>=b.questions.length&&g();var c=b.questions[a];b.currentQuestion=c},b.skipQuestion=function(a){a.answer="?",b.nextQuestion()},b});var easyMathFilters=angular.module("easyMath.filters",[]);easyMathFilters.filter("interpolate",["version",function(a){return function(b){return String(b).replace(/\%VERSION\%/gm,a)}}]),easyMathFilters.filter("filterAnswered",function(){return function(a){var b={output:[]};return angular.forEach(a,function(a){void 0!==a.answer&&this.output.push(a)},b),b.output}});var easyMathServices=angular.module("easyMath.services",[]);easyMathServices.value("version","0.1"),easyMathServices.service("TimerService",function(a){var b=null,c=null,d=function(a,d){var e=new Date,f=1e3*(60*a+d);c=new Date,b=new Date,c.setTime(e.getTime()+f)},e=function(){var a=new Date;b.setTime(c.getTime()-a.getTime())},f=function(){console.log(b)},g=function(){return b},h=function(a,b){var d=1e3*(60*a+b);c.setTime(c.getTime()+d)};this.init=d,this.tick=e,this.show=f,this.getTime=g,this.addTime=h,this.time=b}),easyMathServices.service("NameService",function(){var a=["Lion","Beef","Bed","Cow","Bananas","Hamster","Rhino","Knife","Tiger","Phone","Dog","Bottle","Squirrel","Crow","Apple","Sheep","Panda","Zebra","Lamp","Giraffe","Chicken","","","",""],b=["impossible","inexpensive","innocent","inquisitive","modern","mushy","odd","open","outstanding","poor","powerful","prickly","puzzled","real","rich","shy","sleepy","stupid","super","talented","tame","tender","tough","uninterested","vast","wandering","wild","wrong"],c=function(a){return Math.floor(Math.random()*a)},d=function(){var d=b[c(b.length)]+" "+a[c(a.length)];return d};this.getName=d}),easyMathServices.service("DatabaseService",function(){var a="p0000001362",b="-",c=new SQLEngine(a,b,"www.rdbhost.com"),d=0,e=function(a,b,d){{var e="SELECT * FROM "+a+" "+b;c.query({callback:d,q:e})}},f=function(a,b,f){e(a,"ORDER BY id DESC LIMIT 1",function(e){b[0]=e.records.rows?parseInt(e.records.rows[0][0])+1:1,d=b[0];{var g="INSERT INTO "+a+" VALUES (%s, %s, %s, %s, %s)";c.query({callback:f,q:g,args:b})}})+1},g=function(){return d};this.getTableData=e,this.addTableData=f,this.getLatestAddedId=g}),easyMathServices.factory("HighScoreService",function(a,b,c){var d={};d.timelimitScores=null,d.classicScores=null,d.timelimitUpdated=0,d.classicUpdated=0,d.playerName=c.get("playerName"),d.classicYourScore=c.get("classicScore"),d.timelimitYourScore=c.get("timelimitScore");var e=function(){a.getTableData("score_classic","ORDER BY SCORE DESC LIMIT 10",function(a){d.classicScores=a.records.rows,d.classicUpdated++})},f=function(){a.getTableData("score_timelimit","ORDER BY SCORE DESC LIMIT 10",function(a){d.timelimitScores=a.records.rows,d.timelimitUpdated++})},g=function(){e(),f()};return d.init=g,d.fetchClassic=e,d.fetchTimelimit=f,d}),easyMathServices.service("SoundsService",function(){var a="sounds/error2-cca3.wav",b="sounds/tick-cca3.wav",c="sounds/complete-cca3.wav",d="sounds/theme-cc0.wav",e=(new Audio(b),null),f=new Audio(b),g=new Audio(a),h=new Audio(c),i=function(){e=new Audio(d),e.setAttribute("preload","auto"),document.body.appendChild(e),e.addEventListener("ended",function(){e.load(),e.play()}),e.load(),f.setAttribute("preload","auto")};i(),this.playTheme=function(){e.load(),e.play()},this.stopTheme=function(){e.pause()},this.playSuccess=function(){f&&(f.currentTime=0),f.play()},this.playError=function(){g&&(g.currentTime=0),g.play()},this.playFinish=function(){h.load(),h.play()},this.mute=function(a){e.muted=a.music,f.muted=a.sounds,g.muted=a.sounds,h.muted=a.sounds}}),easyMathServices.service("QuestionsService",function(){var a=function(a){return Math.floor(Math.random()*a)},b=function(b){return a(b)},c=function(a,b){return parseFloat((Math.random()*a).toPrecision(b))},d=function(a){var d={},e=null,f=null,g=void 0;switch(a){case 1:e=b,f=10;break;case 2:e=b,f=20;break;case 3:e=b,f=50;break;case 4:e=b,f=100;break;case 5:e=c,g=3,f=10;break;case 6:e=c,g=3,f=20;break;case 7:e=c,g=4,f=50;break;case 8:e=c,g=5,f=50;break;case 9:e=c,g=5,f=100;break;default:e=c,g=4,f=500}return d.option1=e(f,g),d.option2=e(f,g),d.answer=void 0,d.isTrue=void 0,d.style=void 0,d},e=function(a,b){var c=a.option1>a.option2?">":"<";return a.isTrue=b==c?!0:!1,a.isTrue=a.option1===a.option2?!0:a.isTrue,a.style=a.isTrue?"progress-bar-success":"progress-bar-danger",a.isTrue};this.getRandom=a,this.generateQuestion=d,this.checkAnswer=e}),easyMathServices.factory("GameClassicFactory",function(a){var b={},c=10,d=300;b.questionPoints=10,b.score=0,b.level=0,b.questions=null,b.currentQuestion=null,b.gameStatus=0,b.time=null,b.QuestionsService=null,b.TimerService=null,b.gameDuration=null;var e=null;b.initGame=function(a,c,d){b.gameStatus=1,b.QuestionsService=a,b.TimerService=c,b.gameDuration=d,b.time=b.TimerService.time};var f=function(){b.questions=[],b.currentQuestion={index:-1},b.score=0,b.level=0,g(),b.TimerService.init(b.gameDuration.min,b.gameDuration.sec)};b.start=function(){f(),b.gameStatus=2,b.nextQuestion(),a.cancel(e),e=a(h,d)};var g=function(){var a=parseInt(b.questions.length);b.level++;for(var d=0;c>d;d++){var e=b.QuestionsService.generateQuestion(b.level);e.index=a+d,b.questions.push(e)}},h=function(){return b.time=b.TimerService.getTime(),b.time<=0?(b.gameStatus=3,b.final={title:"Well done!",message:""},void a.cancel(e)):void b.TimerService.tick()};return b.nextQuestion=function(){var a=b.currentQuestion.index+1;a>=b.questions.length&&g();var c=b.questions[a];b.currentQuestion=c},b.skipQuestion=function(a){a.answer="?",b.nextQuestion()},b});var easyMathFilters=angular.module("easyMath.filters",[]);easyMathFilters.filter("interpolate",["version",function(a){return function(b){return String(b).replace(/\%VERSION\%/gm,a)}}]),easyMathFilters.filter("filterAnswered",function(){return function(a){var b={output:[]};return angular.forEach(a,function(a){void 0!==a.answer&&this.output.push(a)},b),b.output}});var easyMathServices=angular.module("easyMath.services",[]);easyMathServices.value("version","0.1"),easyMathServices.service("TimerService",function(a){var b=null,c=null,d=function(a,d){var e=new Date,f=1e3*(60*a+d);c=new Date,b=new Date,c.setTime(e.getTime()+f)},e=function(){var a=new Date;b.setTime(c.getTime()-a.getTime())},f=function(){console.log(b)},g=function(){return b},h=function(a,b){var d=1e3*(60*a+b);c.setTime(c.getTime()+d)};this.init=d,this.tick=e,this.show=f,this.getTime=g,this.addTime=h,this.time=b}),easyMathServices.service("NameService",function(){var a=["Lion","Beef","Bed","Cow","Bananas","Hamster","Rhino","Knife","Tiger","Phone","Dog","Bottle","Squirrel","Crow","Apple","Sheep","Panda","Zebra","Lamp","Giraffe","Chicken","","","",""],b=["impossible","inexpensive","innocent","inquisitive","modern","mushy","odd","open","outstanding","poor","powerful","prickly","puzzled","real","rich","shy","sleepy","stupid","super","talented","tame","tender","tough","uninterested","vast","wandering","wild","wrong"],c=function(a){return Math.floor(Math.random()*a)},d=function(){var d=b[c(b.length)]+" "+a[c(a.length)];return d};this.getName=d}),easyMathServices.service("DatabaseService",function(){var a="p0000001362",b="-",c=new SQLEngine(a,b,"www.rdbhost.com"),d=0,e=function(a,b,d){{var e="SELECT * FROM "+a+" "+b;c.query({callback:d,q:e})}},f=function(a,b,f){e(a,"ORDER BY id DESC LIMIT 1",function(e){b[0]=e.records.rows?parseInt(e.records.rows[0][0])+1:1,d=b[0];{var g="INSERT INTO "+a+" VALUES (%s, %s, %s, %s, %s)";c.query({callback:f,q:g,args:b})}})+1},g=function(){return d};this.getTableData=e,this.addTableData=f,this.getLatestAddedId=g}),easyMathServices.factory("HighScoreService",function(a,b,c){var d={};d.timelimitScores=null,d.classicScores=null,d.timelimitUpdated=0,d.classicUpdated=0,d.playerName=c.get("playerName"),d.classicYourScore=c.get("classicScore"),d.timelimitYourScore=c.get("timelimitScore");var e=function(){a.getTableData("score_classic","ORDER BY SCORE DESC LIMIT 10",function(a){d.classicScores=a.records.rows,d.classicUpdated++})},f=function(){a.getTableData("score_timelimit","ORDER BY SCORE DESC LIMIT 10",function(a){d.timelimitScores=a.records.rows,d.timelimitUpdated++})},g=function(){e(),f()};return d.init=g,d.fetchClassic=e,d.fetchTimelimit=f,d}),easyMathServices.service("SoundsService",function(){var a="sounds/error2-cca3.wav",b="sounds/tick-cca3.wav",c="sounds/complete-cca3.wav",d="sounds/theme-cc0.wav",e=(new Audio(b),null),f=new Audio(b),g=new Audio(a),h=new Audio(c),i=function(){e=new Audio(d),e.setAttribute("preload","auto"),document.body.appendChild(e),e.addEventListener("ended",function(){e.load(),e.play()
}),e.load(),f.setAttribute("preload","auto")};i(),this.playTheme=function(){e.load(),e.play()},this.stopTheme=function(){e.pause()},this.playSuccess=function(){f&&(f.currentTime=0),f.play()},this.playError=function(){g&&(g.currentTime=0),g.play()},this.playFinish=function(){h.load(),h.play()},this.mute=function(a){e.muted=a.music,f.muted=a.sounds,g.muted=a.sounds,h.muted=a.sounds}}),easyMathServices.service("QuestionsService",function(){var a=function(a){return Math.floor(Math.random()*a)},b=function(b){return a(b)},c=function(a,b){return parseFloat((Math.random()*a).toPrecision(b))},d=function(a){var d={},e=null,f=null,g=void 0;switch(a){case 1:e=b,f=10;break;case 2:e=b,f=20;break;case 3:e=b,f=50;break;case 4:e=b,f=100;break;case 5:e=c,g=3,f=10;break;case 6:e=c,g=3,f=20;break;case 7:e=c,g=4,f=50;break;case 8:e=c,g=5,f=50;break;case 9:e=c,g=5,f=100;break;default:e=c,g=4,f=500}return d.option1=e(f,g),d.option2=e(f,g),d.answer=void 0,d.isTrue=void 0,d.style=void 0,d},e=function(a,b){var c=a.option1>a.option2?">":"<";return a.isTrue=b==c?!0:!1,a.isTrue=a.option1===a.option2?!0:a.isTrue,a.style=a.isTrue?"progress-bar-success":"progress-bar-danger",a.isTrue};this.getRandom=a,this.generateQuestion=d,this.checkAnswer=e}),easyMathServices.factory("GameClassicFactory",function(a){var b={},c=10,d=300;b.questionPoints=10,b.score=0,b.level=0,b.questions=null,b.currentQuestion=null,b.gameStatus=0,b.time=null,b.QuestionsService=null,b.TimerService=null,b.gameDuration=null;var e=null;b.initGame=function(a,c,d){b.gameStatus=1,b.QuestionsService=a,b.TimerService=c,b.gameDuration=d,b.time=b.TimerService.time};var f=function(){b.questions=[],b.currentQuestion={index:-1},b.score=0,b.level=0,g(),b.TimerService.init(b.gameDuration.min,b.gameDuration.sec)};b.start=function(){f(),b.gameStatus=2,b.nextQuestion(),a.cancel(e),e=a(h,d)};var g=function(){var a=parseInt(b.questions.length);b.level++;for(var d=0;c>d;d++){var e=b.QuestionsService.generateQuestion(b.level);e.index=a+d,b.questions.push(e)}},h=function(){return b.time=b.TimerService.getTime(),b.time<=0?(b.gameStatus=3,b.final={title:"Well done!",message:""},void a.cancel(e)):void b.TimerService.tick()};return b.nextQuestion=function(){var a=b.currentQuestion.index+1;a>=b.questions.length&&g();var c=b.questions[a];b.currentQuestion=c},b.skipQuestion=function(a){a.answer="?",b.nextQuestion()},b});
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
'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
var easyMathServices = angular.module('easyMath.services', []);
	
easyMathServices.value('version', '0.1');

easyMathServices.service('TimerService', function($timeout) {
    
    var time = null;
    var finishTime = null;
    var timeout = null;
    
    var TIME_STEP = 100;
    
    var init = function(minutes, seconds) {
        var currentTime = new Date();
        var newTime = (minutes*60 + seconds)*1000;
        finishTime = new Date();
        time = new Date();
        
        finishTime.setTime(currentTime.getTime() + newTime);
    };
    
    var tick = function() {
        var currentTime = new Date();
        time.setTime(finishTime.getTime() - currentTime.getTime());
        //time -= TIME_STEP;    
        //show();
        
    };
    var pause = function() {
          
        $timeout.cancel(timeout);
        
    };
    var show = function() {
        console.log(time);
    };
    var getTime = function() {
        return time;
    };
    
    var addTime = function(minutes, seconds) {
        var newTime = (minutes*60 + seconds)*1000;
        
        finishTime.setTime(finishTime.getTime() + newTime);
    };
    
    this.init = init;
    this.tick = tick;
    this.show = show;
    this.getTime = getTime;
    this.addTime = addTime;
    this.time = time;
});


easyMathServices.service('NameService', function($timeout) {
    
    var objects = ['Lion', 'Beef', 'Bed', 'Cow' ,'Bananas', 'Hamster', 'Rhino', 'Knife', 'Tiger', 
                   'Phone', 'Dog', 'Bottle', 'Squirrel', 'Crow', 'Apple', 'Sheep', 'Panda', 
                   'Zebra', 'Lamp', 'Giraffe', 'Chicken', '', '', '', ''];
    
    var adjectives = ['impossible', 'inexpensive', 'innocent', 'inquisitive', 'modern', 'mushy', 'odd', 
                      'open', 'outstanding', 'poor', 'powerful', 'prickly', 'puzzled', 'real', 'rich', 
                      'shy', 'sleepy', 'stupid', 'super', 'talented', 'tame', 'tender', 'tough', 
                      'uninterested', 'vast', 'wandering', 'wild', 'wrong'];
    
    var getRandom = function (max) {
        return Math.floor(Math.random() * max);
    };
    
    var getName = function() {
        var name = adjectives[getRandom(adjectives.length)] + ' ' + objects[getRandom(objects.length)];
        return name;
    };
    
    this.getName = getName;
    
});

easyMathServices.service('DatabaseService', function($timeout) {
    
    var uid = 'p0000001362';
    var authcode = '-';
    var rdb = new SQLEngine(uid,authcode,'www.rdbhost.com');

    var latestId = 0;
    
    var getTableData = function(table, options, callback) {
        var query = 'SELECT * FROM '+table+' '+options;
        var res2 = rdb.query( {
            'callback' : callback,
            'q' : query } );
    };
    
    var addTableData = function(table, data, callback) {
        
        getTableData(table, 'ORDER BY id DESC LIMIT 1', function(success) {
            if (success.records.rows)
                data[0] = (parseInt(success.records.rows[0][0]))+1;
            else 
                data[0] = 1;
            latestId = data[0];
            
            var query = 'INSERT INTO '+table+' VALUES (%s, %s, %s, %s, %s)';
            var res = rdb.query( {
                'callback' : callback,
                'q' : query,
                'args': data} );  
        }) + 1;
    };
    
    var getLatestAddedId = function() {
        return latestId;    
    };
    
    this.getTableData = getTableData;
    this.addTableData = addTableData;
    this.getLatestAddedId = getLatestAddedId;
    
});

easyMathServices.factory('HighScoreService', function(DatabaseService, $cookies, $cookieStore) {
    
    var highscores = {}; 
    
    highscores.timelimitScores = null;
    highscores.classicScores = null;
    
    highscores.timelimitUpdated = 0;
    highscores.classicUpdated = 0;
    
    highscores.playerName = $cookieStore.get('playerName');
    highscores.classicYourScore = $cookieStore.get('classicScore');
    highscores.timelimitYourScore = $cookieStore.get('timelimitScore');
    
    var fetchClassic = function() {
        // Select and display the highscore table
        DatabaseService.getTableData('score_classic', 'ORDER BY SCORE DESC LIMIT 10', function(success) {
            highscores.classicScores = success.records.rows;
            highscores.classicUpdated++;
        });
    };
    var fetchTimelimit = function() {
        // Select and display the highscore table
        DatabaseService.getTableData('score_timelimit', 'ORDER BY SCORE DESC LIMIT 10', function(success) {
            highscores.timelimitScores = success.records.rows;
            highscores.timelimitUpdated++;
        });
        
    };
    
    var init = function() {
        fetchClassic();
        fetchTimelimit();
    };
    
    highscores.init = init;
    highscores.fetchClassic = fetchClassic;
    highscores.fetchTimelimit = fetchTimelimit;
    
    
    return highscores;
});



easyMathServices.service('SoundsService', function($timeout) {
    
    // Resources
    var answerSuccessRes = "sounds/success-cc0.wav";
    var answerErrorRes = "sounds/error2-cca3.wav";
    var tickSoundRes = "sounds/tick-cca3.wav";
    var finishSoundRes = "sounds/complete-cca3.wav"
    
    var themeSongRes = "sounds/theme-cc0.wav";
    var testRes = "http://soundbible.com/grab.php?id=989&type=mp3";
    
    // Sound variables
    var tickSound = new Audio(tickSoundRes);
    var themeSong = null;
    
    var answerSuccess = new Audio(tickSoundRes);
    var answerError = new Audio(answerErrorRes);
    var finishSound = new Audio(finishSoundRes);
    
    var themeTimeout = null;
    
    var init = function() {
        themeSong = new Audio(themeSongRes);
        themeSong.setAttribute('preload', 'auto');
    
        document.body.appendChild(themeSong);
        themeSong.addEventListener('ended', function() {
            themeSong.load();
            themeSong.play();
        });
        //themeSong.setAttribute('src', themeSongRes); // tova daje he trugva :D даи бровсер
        themeSong.load(); // stiga sahse ne stava :D basi mamata :X:X:X nali..
        
        answerSuccess.setAttribute("preload", "auto");
        
    };
    init();
    
    this.playTheme = function() {        
        themeSong.load();
        themeSong.play();        
    };
    this.stopTheme = function() {
        themeSong.pause();
    };
    
    this.playSuccess = function() {
        //answerSuccess.load();
        if (answerSuccess) {
            answerSuccess.currentTime = 0;
        }
        answerSuccess.play();
    };
    this.playError = function() {
        //answerError.load();
        if (answerError) {
            answerError.currentTime = 0;
        }
        answerError.play();
    };
    this.playFinish = function() {
        finishSound.load();
        finishSound.play();
    };
    this.mute = function(properties) {
        themeSong.muted = properties.music;    
        
        // And sounds
        answerSuccess.muted = properties.sounds;  
        answerError.muted = properties.sounds;
        finishSound.muted = properties.sounds;
    };
});

easyMathServices.service('QuestionsService', function(){
    
     // This is a simple function which generates random numbers
    var getRandom = function (max) {
        return Math.floor(Math.random() * max);
    };
    var getIntRandom = function(max) {
        return getRandom(max);
    };
    var getFloatRandom = function(max, precision) {
        return parseFloat((Math.random() * max).toPrecision(precision));
    };

    // This is function that generates question
    var generateQuestion = function(levelOfDifficult) {
        var newQuestion = {};

        var randomizer = null;
        var max = null;
        var precision = undefined;
        switch(levelOfDifficult) {
            case 1: 
                randomizer = getIntRandom;
                max = 10;
                break;
            case 2: 
                randomizer = getIntRandom;
                max = 20;
                break;
            case 3: 
                randomizer = getIntRandom;
                max = 50;
                break;
            case 4: 
                randomizer = getIntRandom;
                max = 100;
                break;
            case 5: 
                randomizer = getFloatRandom;
                precision = 3;
                max = 10;
                break;
            case 6: 
                randomizer = getFloatRandom;
                precision = 3;
                max = 20;
                break;
            case 7: 
                randomizer = getFloatRandom;
                precision = 4;
                max = 50;
                break;
            case 8: 
                randomizer = getFloatRandom;
                precision = 5;
                max = 50;
                break;
            case 9: 
                randomizer = getFloatRandom;
                precision = 5;
                max = 100;
                break;
            default: 
                randomizer = getFloatRandom;
                precision = 4;
                max = 500;
                break;
        }
        newQuestion.option1 = randomizer(max, precision);
        newQuestion.option2 = randomizer(max, precision);
        newQuestion.answer = undefined;
        newQuestion.isTrue = undefined;
        newQuestion.style = undefined;

        return newQuestion;
    };
        
    var checkAnswer = function(question, answer) {
        // 1. Find the valid answer
        // 2. Compare it with the given one
        
        var validAnswer = (question.option1 > question.option2) ? '>' : '<';
        question.isTrue = (answer == validAnswer) ? true : false;
        
        // If the options are equal we have a special case
        question.isTrue = (question.option1 === question.option2) ? true : question.isTrue;
        
        // Set some styles
        question.style = (question.isTrue) ? 'progress-bar-success' : 'progress-bar-danger';
        
        return question.isTrue;
    };
    
    this.getRandom = getRandom;
    this.generateQuestion = generateQuestion;
    this.checkAnswer = checkAnswer;
});

easyMathServices.factory('GameClassicFactory', function($interval) {
     
    var factory = {}; 
    
    // GAME SPECIFICATIONS
    var questionsCount = 10;
    var STEP_TIMER = 300;
    factory.questionPoints = 10;
    
    factory.score = 0;
    factory.level = 0;
    factory.questions = null;
    factory.currentQuestion = null;
    factory.gameStatus = 0;
    factory.time = null;
    
    factory.QuestionsService = null;
    factory.TimerService = null;
    factory.gameDuration = null;
    
    var timerInterval = null;
    
    factory.initGame = function(QuestionsService, TimerService, duration) {        
        factory.gameStatus = 1; // Initializing
        
        factory.QuestionsService = QuestionsService;
        factory.TimerService = TimerService;
        factory.gameDuration = duration;
        
        factory.time = factory.TimerService.time;
        
    };

    var initProperties = function() {
        factory.questions = [];
        factory.currentQuestion = { index: -1 };
        
        factory.score = 0;
        factory.level = 0;
        
        generateQuestions();
        factory.TimerService.init(factory.gameDuration.min, factory.gameDuration.sec);
    };
    
    factory.start = function() {
        initProperties();
        
        factory.gameStatus = 2; // Starting
        factory.nextQuestion();
        
        $interval.cancel(timerInterval);
        timerInterval = $interval(tickTimer, STEP_TIMER);
        
    };
    
    var generateQuestions = function() {
        var currentLength = parseInt(factory.questions.length);
        factory.level++;
        for (var i=0; i<questionsCount; i++) {
            var newQuestion = factory.QuestionsService.generateQuestion(factory.level);

            newQuestion.index = currentLength+i;
            factory.questions.push(newQuestion);
        }
    };
    
    var tickTimer = function() {
        factory.time = factory.TimerService.getTime();
        if (factory.time <= 0) {
            factory.gameStatus = 3;
            factory.final = { title: "Well done!", message: "" };
            
            $interval.cancel(timerInterval);
            return;
        }

        factory.TimerService.tick();
    };
    
    factory.nextQuestion = function() {
        var nextIndex = factory.currentQuestion.index+1;
        if (nextIndex >= factory.questions.length) {
            generateQuestions();
        }
            
        var next = factory.questions[nextIndex];
        factory.currentQuestion = next;
    }
    factory.skipQuestion = function(question) {
        question.answer = "?";
        factory.nextQuestion();
    };
 
    return factory;
});
