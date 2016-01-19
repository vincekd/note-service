(function($, angular, undefined) { 'use strict';

var Sticklet = angular.module("Sticklet");

Sticklet
    .controller("LoginCtrl", ["$scope", "$http", "$timeout", function($scope, $http, $timeout) {

        $scope.user = {};
        $scope.opts = {"register": false};
        $scope.loginVals = {};

        $scope.checkLogin = function() {
            return $scope.loginVals.username && $scope.loginVals.password;
        };
        $scope.checkRegister = function() {
            var u = $scope.user;
            return (u.username && u.password && u.password === u.passwordRepeat && u.email);
        };

        $scope.login = function() {
            if ($scope.checkLogin()) {
                $("form.login").submit();
            } else {
                //error
                $scope.loginError = true;
                $scope.registerError = false;
                $scope.errorMsg = "Invalid login submission.";
            }
        };
        $scope.register = function() {
            if ($scope.checkRegister()) {
                $http.post("/user/register", $scope.user).success(function(user) {
                    $scope.user = {};
                    $scope.opts.register = false;
                    $scope.loginVals = { "username": user.username };
                    $timeout(function() {
                        $("form.login input[name='username']").focus();
                    });
                }).error(function(resp, status) {
                    $scope.loginError = false;
                    $scope.registerError = true;

                    if (status === 409) {
                        $scope.errorMsg = "User with that username already exists.";
                    } else {
                        $scope.errorMsg = "Please be sure the username and password has at least 4 characters, no spaces.";
                    }
                });
            } else {
                $scope.loginError = false;
                $scope.registerError = true;
                $scope.errorMsg = "Invalid register submission.";
            }
        };
    }])
;
}(jQuery, angular));
