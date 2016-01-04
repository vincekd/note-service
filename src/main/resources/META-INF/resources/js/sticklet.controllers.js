(function($) { "use strict";

var Sticklet = angular.module("Sticklet");

Sticklet
    .controller("NotesCtrl", ["$scope", "HTTP", "NoteServ", function($scope, HTTP, NoteServ) {
        $scope.opts = {
            display: "stacked",
            sortBy: "updated"
        };
        $scope.filters;
        $scope.notes = [];

        NoteServ.getNotes().then(function(notes) {
            $scope.notes = notes;
        });
    }])
    .controller("TopBarCtrl", ["$scope", function($scope) {
        
    }])
    .controller("NoteListNoteCtrl", ["$scope", "NoteServ", function($scope, NoteServ) {
        $scope.changeColor = function($event, color) {
            $scope.note.color = color;
            console.log($scope.note.color, "to", color);
            NoteServ.save($scope.note);
        };
        $scope.editNote = function() {
            console.log("edit note:", $scope.note);
        };
    }])
    .controller("NoteCtrl", ["$scope", function($scope) {
        console.log("noteID", $scope.noteID);
    }]);
}(jQuery));