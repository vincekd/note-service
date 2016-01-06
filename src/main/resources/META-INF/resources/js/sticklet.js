(function() { "use strict";
    var Sticklet;
    if (location.pathname === "/login.html") {
        Sticklet = angular.module("Sticklet", []);
    } else {
        Sticklet = angular.module("Sticklet", ["ngRoute", "ui.bootstrap", "perfect_scrollbar", "ui.tinymce"]);

        Sticklet.config(["$routeProvider", "$locationProvider", "$provide",
                         function($routeProvider, $locationProvider, $provide) {
            $locationProvider.hashPrefix("!");
            $routeProvider.when("/notes", {
                redirectTo: "/notes/-/-/-"
            }).when("/notes/:colorFilters/:tagFilters/:search", {
                templateUrl: "templates/notes.html",
                controller: "NotesCtrl"
            }).when("/note/:noteID", {
                templateUrl: "templates/note.html",
                controller: "NoteCtrl"
            }).otherwise({
                redirectTo: "/notes/-/-/-"
            });

            $provide.value("tinymceOpts", {
                content_css: "css/tinymce.css",
                plugins: "paste code autoresize",
                toolbar: ("undo redo | bold italic underline | bullist numlist outdent indent " + 
                    "| alignleft aligncenter alignright | code removeformat"),
                browser_spellcheck: true,
                menubar: false,
                statusbar: false,
                resize: false,
                toolbar_item_size: "small",
                nowrap: false
            });

            var isMobile = getIsMobile();

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
                get mobile() {
                    return isMobile;
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
        }
    });
}());
