(function($) { "use strict";

var Sticklet = angular.module("Sticklet");

Sticklet
    .controller("NotesCtrl", ["$scope", "HTTP", "NoteServ", "STOMP", function($scope, HTTP, NoteServ, STOMP) {
        $scope.opts = {
            "display": "stacked",
            "sortBy": "updated",
            "globalEdit": false
        };
        $scope.current = {
            "editing": null,
            "filters": {
                "colors": [],
                "tags": [],
                "search": ""
            }
        };
        $scope.notes = [];

        $scope.createNote = function() {
            NoteServ.create();
        };
        $scope.closeEditor = function() {
            $scope.current.editing = null;
        };
        $scope.resetFilters = function() {
            $scope.current.filters = {"colors": [], "tags": [], "search": ""};
        };
        function getNote(id) {
            return _.find($scope.notes, function(n) {
                return n.id === id;
            });
        }

        //websocket callbacks
        STOMP.register("/noteCreated.NotesCtrl", function(note) {
            $scope.$apply(function() { 
                $scope.notes.push(note);
            });
        });
        STOMP.register("/noteDeleted.NotesCtrl", function(noteID) {
            $scope.$apply(function() {
                $scope.notes = $scope.notes.filter(function(n) {
                    return n.id !== noteID;
                });
            });
        });
        STOMP.register("/noteUpdated.NotesCtrl", function(note) {
            $scope.$apply(function() {
                var n = getNote(note.id);
                _.extend(n, note);
            });
        });

        //get data
        NoteServ.getNotes().then(function(notes) {
            $scope.notes = notes;
        });
    }])
    .controller("TopBarCtrl", ["$scope", "TagServ", function($scope, TagServ) {
        $scope.opts = {
            "isOpen": false
        };
        $scope.tags = [];
        $scope.filterOpened = function() {
            if ($scope.opts.isOpen) {
                TagServ.getTags().then(function(tags) {
                    $scope.tags = tags;
                });
            }
        };
        $scope.filterColor = function(color) {
            if ($scope.current.filters.colors.indexOf(color) === -1) {
                $scope.current.filters.colors.push(color);
                closeFilter();
            }
        };
        $scope.removeColorFilter = function(color) {
            $scope.current.filters.colors = $scope.current.filters.colors.filter(function(c) {
                return c !== color;
            });
        };
        $scope.filterTag = function(tag) {
            if ($scope.current.filters.tags.indexOf(tag) === -1) {
                $scope.current.filters.tags.push(tag);
                closeFilter();
            }
        };
        $scope.removeTagFilter = function(tag) {
            $scope.current.filters.tags = $scope.current.filters.tags.filter(function(t) {
                return t.id !== tag.id;
            });
        };
        function closeFilter() {
            $scope.opts.isOpen = false;
        }
    }])
    .controller("NoteListNoteCtrl", ["$scope", "NoteServ", "TagServ", function($scope, NoteServ, TagServ) {
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
        $scope.addTag = function(tag) {
            if (tag) {
                if (tag.id) {
                    NoteServ.tag($scope.note, tag);
                } else {
                    Tag.create(tag);
                }
            }
        };
    }])
    .controller("NoteCtrl", ["$scope", function($scope) {
        console.log("noteID", $scope.noteID);
    }]);
}(jQuery));