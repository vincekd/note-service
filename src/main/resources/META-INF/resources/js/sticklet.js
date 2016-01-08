(function() { "use strict";
    var Sticklet;
    if (location.pathname === "/login.html") {
        Sticklet = angular.module("Sticklet", []);
    } else {
        Sticklet = angular.module("Sticklet", ["ngRoute", "ui.bootstrap", "perfect_scrollbar", "ui.tinymce"]);

        Sticklet.config(["$routeProvider", "$locationProvider", "$provide",
                         function($routeProvider, $locationProvider, $provide) {
            $locationProvider.hashPrefix("!");
            //$routeProvider.when("/notes/:colorFilters/:tagFilters/:search", {
            $routeProvider.when("/notes", {
                "templateUrl": "templates/notes.html",
                "controller": "NotesCtrl"
            }).when("/note/:noteID", {
                "templateUrl": "templates/note.html",
                "controller": "NoteCtrl"
            }).when("/settings", {
                "templateUrl": "templates/settings.html",
                "controller": "SettingsCtrl"
            }).when("/tags", {
                "templateUrl": "templates/tags-admin.html",
                "controller": "TagsAdminCtrl"
            }).otherwise({
                //"redirectTo": "/notes/-/-/-"
                "redirectTo": "/notes"
            });

            $provide.value("tinymceOpts", {
                plugins: "code",
                toolbar: ("undo redo | bold italic underline | bullist numlist outdent indent " + 
                    "| alignleft aligncenter alignright | code removeformat"),
                browser_spellcheck: true,
                menubar: false,
                statusbar: false,
                resize: false,
                toolbar_item_size: "small",
                nowrap: false
            });

            var online = getOnline(),
                isMobile = getIsMobile();

            $provide.value("_globals", {
                get noteUpdateTopic() {
                    return "/noteUpdated";
                },
                get noteCreateTopic() {
                    return "/noteCreated";
                },
                get noteDeleteTopic() {
                    return "/noteDeleted";
                },
                get tagUpdateTopic() {
                    return "/tagUpdated";
                },
                get tagCreateTopic() {
                    return "/tagCreated";
                },
                get tagDeleteTopic() {
                    return "/tagDeleted";
                },
                get autoSaveInterval() {
                    return 750; //milliseconds
                },
                get maxTitleLength() {
                    return 100;
                },
                get mobile() {
                    return isMobile;
                },
                get online() {
                    return online;
                },
                setOnline: function(onl) {
                    if (onl !== online) {
                        online = onl;
                    }
                }
            });
        }]);

        Sticklet.run(["STOMP", function(STOMP) {
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
