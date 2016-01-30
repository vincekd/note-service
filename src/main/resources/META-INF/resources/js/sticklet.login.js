(function($, angular, undefined) { 'use strict';

var Sticklet = angular.module("StickletLogin", ["ui.bootstrap"]);
Sticklet.run([function() {
    $(function() {
        __sticklet.initServiceWorker();
    });
}])

Sticklet
    .service("ValidLogin", [function() {
        return {
            "username": function(username) {
                return (username && username.length >= 4);
            },
            "password": function(password) {
                return (password && password.length >= 6);
            },
            "email": function(email) {
                return /^.+@.+$/.test(email);
            }
        };
    }])
    .controller("LoginCtrl", ["$scope", "$uibModal",
                              function($scope, $modal) {
        $scope.opt = {};
        $scope.loginPage = function() {
            $modal.open({
                "animation": true,
                "templateUrl": "loginPage.html",
                "controller": "LoginPageCtrl",
                "backdrop": "static",
                "keyboard": true,
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
                "keyboard": true,
                "backdropClass": "sticklet-popup-backdrop",
                "windowClass": "sticklet-popup-window"
            });
            $modalInst.result.then(function(username) {
                $scope.opt.username = username;
            });
        };
    }])
    .controller("LoginPageCtrl", ["$scope", "$uibModalInstance", "$http", "username", "ValidLogin", "$timeout",
                                  function($scope, $modalInst, $http, username, ValidLogin, $timeout) {
        $scope.loginVals = {
            "username": username,
            "password": ""
        };
        //get around keypass insertion issues
        $timeout(function() {
            $scope.loginVals.username = (username || $("#username").val());
            $scope.loginVals.password = $("#password").val();
        }, 1000);
        $scope.checkLogin = function() {
            return (ValidLogin.username($scope.loginVals.username) && 
                    ValidLogin.password($scope.loginVals.password));
        };
        $scope.typing = function($event) {
            if ($event.keyCode === 13) {
                $scope.login();
            }
        };
        $scope.passwordReset = function() {
            //TODO: complete this
            console.log($scope.loginVals.email);
        };
        $scope.cancel = function() {
            $modalInst.dismiss("cancel");
        };
        $scope.login = function() {
            if ($scope.checkLogin()) {
                $("form#login").submit();
            } else {
                $scope.warning = "Your username or password is invalid";
            }
        };
    }])
    .controller("RegisterPageCtrl", ["$scope", "$uibModalInstance", "$http", "ValidLogin",
                                     function($scope, $modalInst, $http, ValidLogin) {
        $scope.user = {};
        $scope.checkRegister = function() {
            var u = $scope.user;
            return (ValidLogin.username(u.username) && 
                    ValidLogin.password(u.password) && 
                    u.password === u.passwordRepeat && 
                    ValidLogin.email(u.email));
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
                $scope.errorMsg = "Invalid register submission.";
            }
        };
        $scope.cancel = function() {
            $modalInst.dismiss("cancel");
        }
    }])
    .directive("password", ["ValidLogin", function(ValidLogin) {
        return {
            "require": "ngModel",
            "scope": {
                "password": "="
            },
            "link": function($scope, $element, $attrs, ctrl) {
                ctrl.$validators.password = function(modelValue, viewValue) {
                    return (ValidLogin.password(modelValue) && 
                            ValidLogin.password($scope.password) && 
                            $scope.password === modelValue);                
                };
            }
        };
    }]);
;
}(jQuery, angular));
