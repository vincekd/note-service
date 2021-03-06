(function($, angular, undefined) { 'use strict';

var Sticklet = angular.module("StickletLogin", ["ui.bootstrap", "perfect_scrollbar"]);
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
        $scope.opts = {
            "pwReset": false
        };
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
            $http.post("/user/passwordReset", {
                "email": $scope.opts.email
            }).then(function(resp) {
                if (resp.status === 200) {
                    $modalInst.dismiss("cancel");
                } else {
                    $scope.warning = "No such user";
                }
            }, function(resp) {
                if (resp.status === 404) {
                    $scope.warning = "No such user";
                } else {
                    $scope.warning = "There was an error sending the email. Please email support at admin@sticklet.com";
                }
            });
        };
        $scope.cancel = function() {
            $modalInst.dismiss("cancel");
        };
        $scope.login = function() {
            if ($scope.checkLogin()) {
                var $form = $("form#login")
                //$form.submit();
                $http({
                    "method": "POST",
                    "url": "/login.html",
                    "data": $form.serialize(),
                    "headers": {
                        "Content-Type": 'application/x-www-form-urlencoded'
                    }
                }).then(function(resp) {
                    if (resp.status === 200) {
                        __sticklet.authenticate(true).then(function(resp) {
                            if (resp && resp.status !== 401) {
                                history.replaceState({}, "main", "/");
                                $timeout(function() {
                                    location.reload();
                                }, 10);
                            }
                        });
                    }
                }, function(err) {
                    console.log("got err", err);
                });
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
                $scope.registering = true;
                $http.post("/user/register", $scope.user).success(function(msg) {
                    //$modalInst.close($scope.user.username);
                }).error(function(resp, status) {
                    if (status === 409) {
                        $scope.errorMsg = "User with that username already exists.";
                    } else {
                        $scope.errorMsg = ("Please ensure your username has at least 4 characters " +
                                "and password has at least 6 characters, no spaces.");
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
