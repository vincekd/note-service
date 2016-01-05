(function() { "use strict";
    var Sticklet = angular.module("Sticklet", ["ngRoute", "ui.bootstrap", "perfect_scrollbar", "ui.tinymce"]);

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

        $provide.value("tinymceOpts", {
            //theme: "advanced",
            content_css: "css/tinymce.css",
            plugins: "paste code autoresize",
            toolbar: "undo redo | bold italic underline | bullist numlist outdent indent | alignleft aligncenter alignright alignjustify | code removeformat",
            browser_spellcheck: true,
            menubar: false,
            statusbar: false,
            //width: "100%",
            resize: false,
            toolbar_item_size: "small",
            nowrap: false
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
