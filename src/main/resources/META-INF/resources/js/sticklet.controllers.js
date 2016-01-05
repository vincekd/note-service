(function($) { "use strict";

var Sticklet = angular.module("Sticklet");

Sticklet
    .controller("NotesCtrl", ["$scope", "HTTP", "NoteServ", function($scope, HTTP, NoteServ) {
        $scope.opts = {
            display: "stacked",
            sortBy: "updated",
            globalEdit: true
        };
        $scope.current = {
            editing: null,
            filters: null
        };
        $scope.notes = [];

        $scope.createNote = function() {
            //TODO: replace with websocket callbacks
            NoteServ.create().then(function(note) {
                $scope.notes.push(note);
            });
        };

        NoteServ.getNotes().then(function(notes) {
            $scope.notes = notes;
        });
    }])
    .controller("TopBarCtrl", ["$scope", function($scope) {
        
    }])
    .controller("NoteListNoteCtrl", ["$scope", "NoteServ", function($scope, NoteServ) {
        $scope.editing = false;
        $scope.changeColor = function(color) {
            $scope.note.color = color;
            NoteServ.save($scope.note);
        };
        $scope.editNote = function() {
            $scope.current.editing = $scope.note;
        };
        $scope.deleteNote = function() {
            NoteServ.remove($scope.note);
        };
        $scope.updateContent = function() {
            NoteServ.save($scope.note);
        };
        $scope.closeEditor = function() {
            $scope.current.editing = null;
        };
    }])
    .controller("NoteCtrl", ["$scope", function($scope) {
        console.log("noteID", $scope.noteID);
    }]);
}(jQuery));