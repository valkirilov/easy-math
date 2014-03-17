'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
var easyMathServices = angular.module('easyMath.services', []);
	
easyMathServices.value('version', '0.1');

easyMathServices.service('TimerService', function($timeout) {
    
    var time = null;
    var timeout = null;
    
    var TIME_STEP = 100;
    
    var init = function(minutes, seconds) {
        time = (minutes*60 + seconds)*1000;
    };
    
    var tick = function() {
        
        time -= TIME_STEP;    
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
        time += (minutes*60 + seconds)*1000;
    };
    
    this.init = init;
    this.tick = tick;
    this.show = show;
    this.getTime = getTime;
    this.addTime = addTime;
    
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
        //themeSong = new Audio(themeSongRes);
        
        //themeSong.setAttribute('loop', 'true'); я сега
        //themeSong.setAttribute('controls', 'controls');
        themeSong.setAttribute('preload', 'auto');
    
        document.body.appendChild(themeSong);
        /*
        themeSong.addEventListener('canplay', function() {
            themeSong.addEventListener('ended', function() {
                themeSong.load();
                themeSong.play();
            });
        });*/
        themeSong.addEventListener('ended', function() {
            themeSong.load();
            themeSong.play();
        });
        //themeSong.setAttribute('src', themeSongRes); // tova daje he trugva :D даи бровсер
        themeSong.load(); // stiga sahse ne stava :D basi mamata :X:X:X nali..
        
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
        answerSuccess.load();
        answerSuccess.play();
    };
    this.playError = function() {
        answerError.load();
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
        return (Math.random() * max).toPrecision(precision);
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
            case 7: 
                randomizer = getFloatRandom;
                precision = 5;
                max = 50;
                break;
            case 8: 
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
        
        var validAnswer = (question.option1 >= question.option2) ? '>' : '<';
        question.isTrue = (question.answer == validAnswer) ? true : false;
        
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
    var STEP_TIMER = 100;
    factory.questionPoints = 10;
    
    factory.score = 0;
    factory.level = 0;
    factory.questions = null;
    factory.currentQuestion = null;
    factory.gameStatus = 0;
    
    factory.QuestionsService = null;
    factory.TimerService = null;
    factory.gameDuration = null;
    
    var timerInterval = null;
    
    factory.initGame = function(QuestionsService, TimerService, duration) {        
        factory.gameStatus = 1; // Initializing
        
        factory.QuestionsService = QuestionsService;
        factory.TimerService = TimerService;
        factory.gameDuration = duration;
        
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
