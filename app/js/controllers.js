'use strict';

/* Controllers */

angular.module('easyMath.controllers', []).
    controller('HomeController', ['$scope', function($scope) {

    }])
    .controller('PlayController', ['$scope', function($scope) {

        // Watch for changes in views and call init function when the view is loaded
        $scope.$watch('$viewContentLoaded', function(){
            $scope.init();
        });

        $scope.init = function() {
            console.log('Init function called.');

            $scope.questions = [];
            for (var i=0; i<9; i++)
                $scope.questions.push(generateQuestion(10));
        };

        // Some controller values
        $scope.questions = null;

        $scope.checkAnswers = function() {

            for (var questionIndex in $scope.questions) {
                var currentQuestion = $scope.questions[questionIndex];
                
                if ((currentQuestion.option1 >= currentQuestion.option2) &&
                    currentQuestion.answer === '>') {
                    currentQuestion.isTrue = true;
                }
                else if ((currentQuestion.option1 <= currentQuestion.option2) &&
                    currentQuestion.answer === '<') {
                    currentQuestion.isTrue = true;
                }
                else 
                    currentQuestion.isTrue = false;
            }
        };

        // Some functions for my use
        
        // This is a simple function which generates random numbers
        function getRandom(max) {
            return Math.floor(Math.random() * max);
        };

        // This is function that generates question
        function generateQuestion(levelOfDifficult) {
            var newQuestion = {};

            newQuestion.option1 = getRandom(levelOfDifficult);
            newQuestion.option2 = getRandom(levelOfDifficult);
            newQuestion.answer = "?";
            newQuestion.isTrue = undefined;


            return newQuestion;
        };
        function checkAnswer(option1, option2, answers) {

        };



    }])