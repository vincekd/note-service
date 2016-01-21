(function($, angular, undefined) { 'use strict';

var Sticklet = angular.module("StickletLogin", ["ui.bootstrap"]);

Sticklet
    .controller("LoginCtrl", ["$scope", "$uibModal",
                              function($scope, $modal) {
        $scope.opt = {};
        $scope.loginPage = function() {
            $modal.open({
                "animation": true,
                "templateUrl": "loginPage.html",
                "controller": "LoginPageCtrl",
                "backdrop": "static",
                "keyboard": false,
                "backdropClass": "sticklet-popup-backdrop",
                "windowClass": "sticklet-popup-window",
                "resolve": {
                    "username": function() { return $scope.opt.username; }
                }
            });
        };

        $scope.registerPage = function() {
            var $modalInst = $modal.open({
                "animation": true,
                "templateUrl": "registerPage.html",
                "controller": "RegisterPageCtrl",
                "backdrop": "static",
                "keyboard": false,
                "backdropClass": "sticklet-popup-backdrop",
                "windowClass": "sticklet-popup-window"
            });
            $modalInst.result.then(function(username) {
                $scope.opt.username = username;
            });
        };
    }])
    .controller("LoginPageCtrl", ["$scope", "$uibModalInstance", "$http", "username", function($scope, $modalInst, $http, username) {
        $scope.loginVals = {
            "username": username
        };
        $scope.checkLogin = function() {
            return $scope.loginVals.username && $scope.loginVals.password;
        };
        $scope.typing = function($event) {
            if ($event.keyCode === 13) {
                $scope.login();
            }
        };
        $scope.login = function() {
            $("form#login").submit();
        };
    }])
    .controller("RegisterPageCtrl", ["$scope", "$uibModalInstance", "$http", function($scope, $modalInst, $http) {
        $scope.user = {};
        $scope.checkRegister = function() {
            var u = $scope.user;
            return (u.username && u.password && u.password === u.passwordRepeat && u.email);
        };
        $scope.register = function() {
            if ($scope.checkRegister()) {
                $http.post("/user/register", $scope.user).success(function(msg) {
                    $modalInst.close($scope.user.username);
                }).error(function(resp, status) {
                    if (status === 409) {
                        $scope.errorMsg = "User with that username already exists.";
                    } else {
                        $scope.errorMsg = "Please ensure your username has at least 4 characters and password has at least 6 characters, no spaces.";
                    }
                });
            } else {
                $scope.loginError = false;
                $scope.registerError = true;
                $scope.errorMsg = "Invalid register submission.";
            }
        };
        $scope.cancel = function() {
            $modalInst.dismiss("cancel");
        }
    }])
;
}(jQuery, angular));
