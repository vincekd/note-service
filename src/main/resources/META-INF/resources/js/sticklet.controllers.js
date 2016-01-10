(function($) { "use strict";

var Sticklet = angular.module("Sticklet");

Sticklet
    .controller("PageCtrl", ["$scope", "UserServ", "_globals", "ServiceWorker",
                             function($scope, UserServ, _globals, ServiceWorker) {
        $scope.maxTitleLength = _globals.maxTitleLength;
        $scope.user;
        $scope.opts = {
            "display": "stacked",
            "sortBy": "created",
            "order": "ASC"
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
        UserServ.getUser().then(function(u) {
            $scope.user = u;
            if (u) {
                $scope.opts.display = $scope.user.prefs.display;
                $scope.opts.sortBy = $scope.user.prefs.sortBy;
            }
        });
    }])
    .controller("NotesCtrl", ["$scope", "HTTP", "NoteServ", "STOMP", "_globals",
                              function($scope, HTTP, NoteServ, STOMP, _globals) {
        var topicAdd = ".NotesCtrl";
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
        $scope.updateNote = function() {
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
    .controller("NoteCtrl", ["$scope", "$routeParams", "NoteServ", "TagServ", "$location", "STOMP", "_globals",
                             function($scope, $routeParams, NoteServ, TagServ, $location, STOMP, _globals) {

        var thisEditor,
            topicAdd = ".NoteCtrl";

        $scope.cur = {"content": "", "title": ""};
        $scope.note = null;

        $scope.update = _.throttle(function() {
            if ($scope.cur.content !== $scope.note.content || $scope.cur.title !== $scope.note.title) {
                $scope.note.title = $scope.cur.title;
                $scope.note.content = $scope.cur.content;
                NoteServ.save($scope.note);
            }
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
                    $location.path("/notes");
                } else {
                    $scope.cur.title = $scope.note.title;
                    $scope.cur.content = $scope.note.content;
                }
            });
        }

        $scope.$watch('cur.content', function(o, n) {
            if (o !== n) {
                $scope.update();
            }
        });
        $scope.$watch(function() {
            return $routeParams.noteID;
        }, function() {
            loadNote();
        });
//        $scope.$on("note-content-resize", function() {
//            console.log("note-content-resize");
//        });
        $scope.$on("$destroy", function() {
            STOMP.deregister(_globals.noteUpdateTopic + topicAdd);
        });
    }])
    .controller("SortCtrl", ["$scope", function($scope) {
        $scope.updateSort = function(val) {
            $scope.opts.sortBy = val;
        };
        $scope.updateOrder = function(val) {
            $scope.opts.order = val;
        };
    }])
    .controller("SettingsCtrl", ["$scope", "$route", "$location", "HTTP",
                                 function($scope, $route, $location, HTTP) {

        $scope.sortOptions = ["created", "updated", "title", "color"];
        $scope.mockUser;
        $scope.saveSettings = function() {
            HTTP.put("/user", $scope.mockUser).then(function() {
                $location.path("/notes");
            });
        };

        var sw = $scope.$watch(function() {
            return $scope.user;
        }, function() {
            if ($scope.user) {
                sw();
                $scope.mockUser = _.extend({}, $scope.user);
            }
        });
    }])
    .controller("TagsAdminCtrl", ["$scope", function($scope) {
        
    }])
    .controller("NotificationsCtrl", ["$scope", "Notify", function($scope, Notify) {
        $scope.notifications = [];
        $scope.networkActiveRequests = [];
        $scope.closeNotification = function(notification) {
            Notify.remove(notification);
        };

        $scope.$watch(function() {
            return Notify.get();
        }, function(n) {
            $scope.notifications = n;
        });
        $scope.$watch(function() {
            return Notify.getNet();
        }, function(n) {
            $scope.networkActiveRequests = n;
        });
    }])
;
}(jQuery));