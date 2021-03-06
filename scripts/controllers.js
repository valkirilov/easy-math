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
            if ($location.path() === '/home' || $location.path() === '/embeded') {
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
            };
            var removeChange = function() {
                $scope.option1.removeClass('change');
                $scope.option2.removeClass('change');
            };
            
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
                                       'GameClassicFactory', 'SoundsService', 'DatabaseService', 'NameService', 'HighScoreService', '$cookies', '$cookieStore', 'ipCookie',
                                       function($scope, $route, $timeout, $interval, $location, QuestionsService, TimerService, 
                                                 GameClassicFactory, SoundsService, DatabaseService, NameService, HighScoreService, $cookies, $cookieStore, ipCookie) {

                                           
        // Some controller values
        //$scope.questions = null;
        //$scope.currentQuestion = null;

        $scope.game = GameClassicFactory;
        $scope.mode = null;
        $scope.highscores = null;
        //$scope.currentScore = null;
                                           
        $scope.mute = {
            music: false,
            sounds: false,
        };
                     
        
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
                    if (HighScoreService.playerName) {
                        //console.log('We have a name: ' + HighScoreService.playerName);
                        name = HighScoreService.playerName;
                    }
                    else {
                        //console.log('Generating a name');
                        name = NameService.getName();
                        HighScoreService.playerName = name;
                        ipCookie('playerName', name, { expires: 365 });
                    }
                    var newScore = [ null, name, $scope.game.score, new Date().toDateString(), 'ip here'];
                    var tableName = ($scope.mode.type == 'classic') ? 'score_classic' : 'score_timelimit';
                    
                    $scope.currentScore = newScore;
                    
                    DatabaseService.addTableData(tableName, newScore, function(success) {
                        $scope.currentScore[0] = DatabaseService.getLatestAddedId();

                        if ($scope.mode.type == 'timelimit') {
                            console.log("Old: " + HighScoreService.timelimitYourScore + "; New: " + $scope.game.score);
                            if (HighScoreService.timelimitYourScore < $scope.game.score) {
                                console.log('New high score');
                                ipCookie('timelimitScore', $scope.game.score, { expires: 365 });
                                HighScoreService.timelimitYourScore = $scope.game.score;
                            }
                            HighScoreService.fetchTimelimit();  
                            $timeout(HighScoreService.fetchTimelimit, 300);
                        }
                        else if ($scope.mode.type == 'classic') {
                            console.log("Old: " + HighScoreService.classicYourScore + "; New: " + $scope.game.score);
                            if (HighScoreService.classicYourScore < $scope.game.score) {
                                console.log('New high score');
                                HighScoreService.classicYourScore = $scope.game.score;
                                ipCookie('classicScore', $scope.game.score,  { expires: 365 });
                            }
                            
                            HighScoreService.fetchClassic();  
                            $timeout(HighScoreService.fetchClassic, 300);
                        }
                        
                    });
                }
            }
        );
                                                                 

        $scope.init = function() {
            
            $scope.HighScoreService = HighScoreService;
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