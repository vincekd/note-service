(function($) { "use strict";

var Sticklet = angular.module("Sticklet");

Sticklet
    .controller("NotesCtrl", ["$scope", "HTTP", "NoteServ", "STOMP", "_globals",
                              function($scope, HTTP, NoteServ, STOMP, _globals) {
        var topicAdd = ".NotesCtrl";
        $scope.opts = {
            "display": "stacked",
            "sortBy": "created"
        };
        $scope.current = {
            "editing": null,
            "title": null,
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
            $scope.current.title = null;
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
        STOMP.register(_globals.noteCreateTopic + topicAdd, function(note) {
            $scope.$apply(function() { 
                $scope.notes.push(note);
            });
        });
        STOMP.register(_globals.noteDeleteTopic + topicAdd, function(noteID) {
            $scope.$apply(function() {
                $scope.notes = $scope.notes.filter(function(n) {
                    return n.id !== noteID;
                });
            });
        });
        STOMP.register(_globals.noteUpdateTopic + topicAdd, function(note) {
            $scope.$apply(function() {
                var n = getNote(note.id);
                _.extend(n, note);
            });
        });
        $scope.$on("$destroy", function() {
            STOMP.deregister(_globals.noteUpdateTopic + topicAdd);
            STOMP.deregister(_globals.noteCreateTopic + topicAdd);
            STOMP.deregister(_globals.noteDeleteTopic + topicAdd);
        });

        //get data
        NoteServ.getNotes().then(function(notes) {
            $scope.notes = notes;
        });
    }])
    .controller("TopBarCtrl", ["$scope", "TagServ", "HTTP", function($scope, TagServ, HTTP) {
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
        $scope.logout = function() {
            HTTP.post("/custom-logout").success(function() {
                window.location = "login.html";
            });
        }
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
        $scope.editTitle = function() {
            $scope.current.title = $scope.note;
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
    .controller("NoteCtrl", ["$scope", "$routeParams", "NoteServ", "TagServ", 
                             "tinymceOpts", "STOMP", "_globals",
                             function($scope, $routeParams, NoteServ, TagServ, 
                                     tinymceOpts, STOMP, _globals) {
        var thisEditor,
            topicAdd = ".NoteCtrl";

        $scope.note = null;
        $scope.tinymceOptions = _.extend({}, tinymceOpts, {
            "autoresize": false,
            "init_instance_callback": function(editor) {
                thisEditor = editor;
            }
        });
        $scope.update = _.throttle(function() {
            console.log("model updated", $scope.note);
            NoteServ.save($scope.note);
        }, _globals.autoSaveInterval, {trailing: true});

        STOMP.register(_globals.noteUpdateTopic + topicAdd, function(note) {
            if (note.id === $scope.note.id) {
                $scope.$apply(function() {
                    _.extend($scope.note, note);
                });
            }
        });

        function loadNote() {
            NoteServ.getNotes().then(function(notes) {
                $scope.note = _.find(notes, function(n) {
                    return n.id === $routeParams.noteID;
                });
                if (!$scope.note) {
                    //redirect back
                    location.hash = ("!/notes");
                }
            });
        }

        $scope.$watch(function() {
            return $routeParams.noteID;
        }, function() {
            loadNote();
        });
        $scope.$on("$destroy", function() {
            STOMP.deregister(_globals.noteUpdateTopic + topicAdd);
        });
    }])
    .controller("SettingsCtrl", ["$scope", function($scope) {
        
    }])
;
}(jQuery));