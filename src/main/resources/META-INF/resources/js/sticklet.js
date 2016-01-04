(function() { "use strict";
    var Sticklet = angular.module("Sticklet", ["ngRoute", "ui.bootstrap", "perfect_scrollbar"]);

    Sticklet.config(["$routeProvider", "$locationProvider", "$provide", function($routeProvider, $locationProvider, $provide) {
        $locationProvider.hashPrefix("!");
        $routeProvider.when("/notes", {
            templateUrl: "templates/notes.html",
            controller: "NotesCtrl"
        }).when("/note/:noteID", {
            templateUrl: "templates/note.html",
            controller: "NoteCtrl"
        }).otherwise({
            redirectTo: function(a) {
                return "/notes";
            }
        });
    }]);
    
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
