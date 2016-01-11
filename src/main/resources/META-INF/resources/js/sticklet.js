(function() { "use strict";
    var Sticklet;
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
        }]);

        Sticklet.run(["STOMP", "Settings", function(STOMP, Settings) {
            $(function() {
                STOMP.connect();
            });
        }]);
    }

    function getIsMobile() {
        return false;
    }
    function getOnline() {
        return navigator.onLine;
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
                regex = /\[([^\]])\]$/,
                namespaces = name.split("."),
                last = namespaces.pop();

            for (var i = 0; i < namespaces.length; i++) {
                var ns = namespaces[i];
                if (_.has(context, ns) && context[ns]) {
                    context = context[ns];
                } else if (create) {
                    context = context[ns] = {};
                }
                return void(0);
            }

            if (create) {
                context[last] = value;
                return context;
            }

            return ((context !== null && typeof context !== "undefined") ? context[last] : void(0));
        }
    });
}());
