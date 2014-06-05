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
    'ui.bootstrap',
    'angulartics', 'angulartics.google.analytics'
]).
config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/home', {templateUrl: 'partials/home.html', controller: 'HomeController'});
	$routeProvider.when('/play', {templateUrl: 'partials/play.html', controller: 'PlayController'});
    $routeProvider.when('/about', {templateUrl: 'partials/about.html', controller: 'HomeController'});
    $routeProvider.when('/classic', {templateUrl: 'partials/mode-classic.html', controller: 'TimelimitController'});
    $routeProvider.when('/timelimit', {templateUrl: 'partials/mode-timelimit.html', controller: 'TimelimitController'});
    $routeProvider.when('/highscores', {templateUrl: 'partials/highscores.html', controller: 'HomeController'});
	$routeProvider.otherwise({redirectTo: '/home'});
}]).
config(['$httpProvider', function($httpProvider) {
        $httpProvider.defaults.useXDomain = true;
        delete $httpProvider.defaults.headers.common['X-Requested-With']; 
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
                   'Zebra', 'Lamp', 'Giraffe', 'Chicken'];
    
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

easyMathServices.factory('HighScoreService', function(DatabaseService, $cookies, $cookieStore, ipCookie) {
    
    var highscores = {}; 
    
    highscores.timelimitScores = null;
    highscores.classicScores = null;
    
    highscores.timelimitUpdated = 0;
    highscores.classicUpdated = 0;
    
    highscores.playerName = ipCookie('playerName');
    highscores.classicYourScore = ipCookie('classicScore') || 0;
    highscores.timelimitYourScore = ipCookie('timelimitScore') || 0;
    
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
