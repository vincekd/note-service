(function() { "use strict";
    var Sticklet,
        network = {
            "online": false,
            "setOnline": function($scope) {
                if (network.online !== true) {
                    network.online = true;
                    if ($scope) {
                        $scope.$broadcast("network-state-change");
                        $scope.$apply();
                    }
                }
            },
            "setOffline": function($scope) {
                if (network.online !== false) {
                    network.online = false;
                    if ($scope) {
                        $scope.$broadcast("network-state-change");
                        $scope.$apply();
                    }
                }
            }
        };

    if (location.pathname === "/login.html") {
        Sticklet = angular.module("Sticklet", []);
    } else {
        Sticklet = angular.module("Sticklet", ["ngRoute", "ui.bootstrap", "perfect_scrollbar", "wysihtml"]);

        Sticklet.config(["$routeProvider", "$locationProvider", "$provide",
                         function($routeProvider, $locationProvider, $provide) {

            $locationProvider.hashPrefix("!");
            $routeProvider.when("/notes", {
                "templateUrl": "/templates/notes.html",
                "controller": "NotesCtrl"
            }).when("/note/:noteID", {
                "templateUrl": "/templates/note.html",
                "controller": "NoteCtrl"
            }).when("/settings", {
                "templateUrl": "/templates/settings.html",
                "controller": "SettingsCtrl"
            }).when("/tags", {
                "templateUrl": "/templates/tags-admin.html",
                "controller": "TagsAdminCtrl"
            }).when("/data", {
                "templateUrl": "/templates/data.html",
                "controller": "DataCtrl"
            }).when("/archive", {
                "templateUrl": "/templates/archive.html",
                "controller": "ArchiveCtrl"
            }).when("/trash", {
                "templateUrl": "/templates/trash.html",
                "controller": "TrashCtrl"
            }).otherwise({
                "redirectTo": "/notes"
            });

            $provide.value("network", {
                get online() {
                    return network.online;
                },
                setOnline: function() {
                    //how to indicate to root scope ?
                    network.online = true;
                },
                setOffline: function() {
                    network.online = false;
                }
            });
        }]);



        Sticklet.run(["STOMP", "Settings", "network", "$rootScope",
                      function(STOMP, Settings, net, $rootScope) {
            net.setOnline = function() {
                network.setOnline($rootScope);
            };
            net.setOffline = function() {
                network.setOffline($rootScope);
            };

            //TODO: remove when done testing
            window.setOffline = net.setOffline;
            window.setOnline = net.setOnline;

            //$(function() {
            STOMP.connect();
            //});
        }]);
    }

    _.mixin({
        "reverse": function(arr) {
            if (!_.isArray(arr)) {
                return arr;
            }
            var newArr = [];
            for (var i = arr.length - 1; i >= 0; i--) {
                newArr.push(arr[i]);
            }
            return newArr;
        },
        "toInt": function(n) {
            return parseInt(n, 10);
        },
        "val": function(context, name, value) {
            var create = (typeof value !== "undefined"),
                namespaces = name.split("."),
                last = namespaces.pop();

            for (var i = 0; i < namespaces.length; i++) {
                var ns = namespaces[i];
                if (_.has(context, ns) && context[ns]) {
                    context = context[ns];
                } else if (create) {
                    context = context[ns] = {};
                } else {
                    return void(0);
                }
            }

            if (create) {
                context[last] = value;
                return context;
            }
            return ((context !== null && typeof context !== "undefined") ? context[last] : void(0));
        },
        "getIDs": function(arr) {
            if (_.isArray(arr)) {
                return _.map(arr, function(a) { return (a ? a.id : a); });
            }
            return arr;
        }
    });
}());
