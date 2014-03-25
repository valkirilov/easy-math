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
        
        $scope.watching = {  };
                 
       /*
        $scope.$watch(function () { return GameClassicFactory.currentQuestion; },
            function (value) {
                $scope.currentQuestion = value;
                $scope.rotateQuestions(); // Apply the animation
            }
        );
        $scope.$watch(function () { return GameClassicFactory.questions; },
            function (value) {
                $scope.questions = value;
            }
        );
        */
                                           
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
            if ($scope.gameStatus !== 2)
                return;
            
            GameClassicFactory.currentQuestion.answer = answer;
            var isTrue = QuestionsService.checkAnswer(GameClassicFactory.currentQuestion, answer);
            
            GameClassicFactory.nextQuestion();
            $scope.modeSpecialOnAnswer(isTrue);
            
            // Apply the animations
            $scope.rotateQuestions();
            $scope.updateScore();
            
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
            }, 500);
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