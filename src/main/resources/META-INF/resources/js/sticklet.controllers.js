(function($) { "use strict";

var Sticklet = angular.module("Sticklet");

Sticklet
    .controller("PageCtrl", ["$scope", "UserServ", "Settings", "Offline", "Notify",
                             function($scope, UserServ, Settings, Offline, Notify) {
        $scope.user;
        Settings.get("note.maxTitleLength").then(function(data) {
            $scope.maxTitleLength = data;
        });
        $scope.opts = {
            "display": "stacked",
            "sortBy": "created",
            "order": "ASC"
        };
        $scope.current = {
            "online": true,
            "editing": null,
            "title": null,
            "filters": {
                "colors": [],
                "tags": [],
                "search": ""
            }
        };
        $scope.resetFilters = function() {
            $scope.current.filters = {"colors": [], "tags": [], "search": ""};
        };
        UserServ.getUser().then(function(u) {
            $scope.user = u;
            if ($scope.user) {
                $scope.opts.display = $scope.user.prefs.display;
                $scope.opts.sortBy = $scope.user.prefs.sortBy;
                $scope.opts.order = $scope.user.prefs.order;
            }
        });
        var notification;
        Offline.onNetworkChange("PageCtrl", function(online) {
            console.log("network online", online);
            $scope.current.online = online;
            if (online) {
                Notify.remove(notification);
            } else {
                notification = Notify.add("Cannot connect to the server....", true);
            }
        });
    }])
    .controller("NotesCtrl", ["$scope", "NoteServ", function($scope, NoteServ) {
        
        $scope.editable = true;
        $scope.notes = [];
        $scope.batchSelections = [];
        $scope.toggleBatchSelection = function(note) {
            if ($scope.batchSelections.indexOf(note) >= 0) {
                $scope.batchSelections = _.without($scope.batchSelections, note);
            } else {
                $scope.batchSelections.push(note);
            }
        };
        $scope.startBatchSelect = function() {
            $scope.opts.batchSelect = true;
            $scope.batchSelections = [];
        };
        $scope.clearBatchSelect = function() {
            $scope.opts.batchSelect = false;
            $scope.batchSelections = [];
        };
        $scope.updateTempColor = function(notes, color) {
            $scope.$broadcast("update-temp-color", notes, color);
        };
        $scope.noteClick = function($event, note) {
            if ($event.ctrlKey || $scope.opts.batchSelect) {
                if ($event.ctrlKey && !$scope.opts.batchSelect) {
                    $scope.startBatchSelect();
                }
                $scope.toggleBatchSelection(note);
            }
        };
        $scope.createNote = function() {
            NoteServ.create();
        };
        $scope.closeEditor = function() {
            $scope.current.editing = null;
            $scope.current.title = null;
        };
        $scope.$on("notes-updated", function() {
            getNotes();
        });

        getNotes();
        function getNotes() {
            //get data
            NoteServ.getNotes().then(function(notes) {
                $scope.notes = notes;
            });
        }
    }])
    .controller("TopBarCtrl", ["$scope", "TagServ", "HTTP", "Settings", function($scope, TagServ, HTTP, Settings) {
        $scope.opts = {
            "isOpen": false,
            "trashEnabled": false
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
        Settings.get("note.trash.enabled").then(function(enabled) {
            $scope.opts.trashEnabled = (enabled === true);
        });
        function closeFilter() {
            $scope.opts.isOpen = false;
        }
    }])
    .controller("BatchEditCtrl", ["$scope", "NoteServ", "TagServ", function($scope, NoteServ, TagServ) {
        $scope.tmp = { "isOpen": false, "search": "" };
        $scope.tags = [];
        $scope.tagsOpened = function() {
            if ($scope.tmp.isOpen) {
                $scope.tmp.search = "";
                TagServ.getTags().then(function(tags) {
                    //filter out tags that are on all selections
                    $scope.tags = tags.filter(function(tag) {
                        return _.some($scope.batchSelections, function(note) {
                            return !TagServ.noteHasTag(note, tag);
                        });
                    });
                });
            }
        };
        $scope.archiveBatch = function() {
            NoteServ.archiveAll($scope.batchSelections).then(function() {
                $scope.clearBatchSelect();
            });
        };
        $scope.deleteBatch = function() {
            NoteServ.removeAll($scope.batchSelections).then(function() {
                $scope.clearBatchSelect();
            });
        };
        $scope.tagBatch = function(tag) {
            TagServ.tagAll($scope.batchSelections, tag).then(function() {
                $scope.clearBatchSelect();
            });
        };
        $scope.createAndTagBatch = function() {
            TagServ.create({name: $scope.tmp.search}).then(function(tag) {
                $scope.tagBatch(tag);
            });
        };
        $scope.colorBatch = function(color) {
            _.each($scope.batchSelections, function(note) {
                note.color = color;
            });
            NoteServ.saveAll($scope.batchSelections).then(function() {
                $scope.clearBatchSelect();
                $scope.updateTempColor($scope.batchSelections);
            });
        };
        $scope.colorMouseover = function(color) {
            $scope.updateTempColor($scope.batchSelections, color);
        };
        $scope.colorMouseleave = function() {
            $scope.updateTempColor($scope.batchSelections);
        };
    }])
    .controller("NoteListNoteCtrl", ["$scope", "NoteServ", "TagServ", function($scope, NoteServ, TagServ) {
        $scope.editing = false;
        $scope.tmpColor = $scope.note.color;
        $scope.changeColor = function(color) {
            $scope.tmpColor = $scope.note.color = color;
            NoteServ.save($scope.note);
        };
        $scope.colorMouseover = function(color) {
            $scope.tmpColor = color;
        };
        $scope.colorMouseleave = function() {
            $scope.tmpColor = $scope.note.color;
        };
        $scope.editNote = function($event) {
            if (!$scope.opts.batchSelect) {
                $event.preventDefault();
                $event.stopPropagation();
                $scope.current.editing = $scope.note;
                return false;
            }
        };
        $scope.editTitle = function($event) {
            if (!$scope.opts.batchSelect) {
                $event.preventDefault();
                $event.stopPropagation();
                $scope.current.title = $scope.note;
                return false;
            }
        };
        $scope.archiveNote = function() {
            NoteServ.archive($scope.note);
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
        $scope.$on("update-temp-color", function($event, notes, color) {
            if (notes.indexOf($scope.note) >= 0) {
                $scope.tmpColor = (color || $scope.note.color);
            }
        });
    }])
    .controller("NoteCtrl", ["$scope", "$routeParams", "NoteServ", "TagServ", "$location", "STOMP", "Settings",
                             function($scope, $routeParams, NoteServ, TagServ, $location, STOMP, Settings) {

        var thisEditor,
            topicAdd = ".NoteCtrl";

        $scope.cur = {"content": "", "title": ""};
        $scope.note = null;

        Settings.get("note.autoSaveInterval").then(function(data) {
            $scope.update = _.throttle(function() {
                if ($scope.cur.content !== $scope.note.content || $scope.cur.title !== $scope.note.title) {
                    $scope.note.title = $scope.cur.title;
                    $scope.note.content = $scope.cur.content;
                    NoteServ.save($scope.note);
                }
            }, data, {trailing: true});
        });

        Settings.get("socket.topic.noteUpdate").then(function(topic) {
            STOMP.register(topic + topicAdd, function(note) {
                if (note.id === $scope.note.id) {
                    $scope.$apply(function() {
                        _.extend($scope.note, note);
                    });
                }
            });
            $scope.$on("$destroy", function() {
                STOMP.deregister(topic + topicAdd);
            });
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
    .controller("TagsAdminCtrl", ["$scope", "TagServ", function($scope, TagServ) {
        $scope.tags = [];
        $scope.removeTag = function(tag) {
            TagServ.remove(tag);
        };
        getTags()
        
        $scope.$on("tags-updated", function() {
            getTags();
        });

        function getTags() {
            TagServ.getTags().then(function(tags) {
                $scope.tags = tags;
            });
        }
    }])
    .controller("DataCtrl", ["$scope", "FileUploadServ", "Notify", function($scope, FileUploadServ, Notify) {
        //upload
        $scope.o = {"type": ""};
        $scope.importTypes = ["Evernote", "Keep", "OneNote"];
        $scope.file = null;
        $scope.uploadProgress = 0;
        $scope.fileSelected = function(file) {
            $scope.file = file;
        };
        $scope.upload = function() {
            if ($scope.file) {
                $scope.uploadInProgress = true;
                $scope.uploadProgress = 0;
                FileUploadServ.upload($scope.file, "/data/import/" + $scope.o.type, function(ev) {
                    $scope.$apply(function() {
                        $scope.uploadProgress = Math.ceil((ev.loaded / ev.total) * 100);
                    });
                }).then(function(ev) {
                    $scope.file = null;
                    $scope.o.type = "";
                    Notify.add("File successfully uploaded");
                }, function(ev) {
                    console.warn("error uploading file: " + $scope.file.name);
                    Notify.add("File failed to upload");
                }).finally(function() {
                    $scope.uploadInProgress = false;
                });
            }
        };
    }])
    .controller("ArchiveCtrl", ["$scope", "Archive", "Settings", "NoteServ", function($scope, Archive, Settings, NoteServ) {
        $scope.opts = {"trashEnabled": false};
        $scope.archived = [];
        $scope.restoreNote = function(note) {
            NoteServ.unarchive(note).then(function() {
                $scope.archived = $scope.archived.filter(function(n) {
                    return n.id !== note.id;
                });
            });
        };
        $scope.deleteNote = function(note) {
            NoteServ.remove(note).then(function() {
                $scope.archived = $scope.archived.filter(function(n) {
                    return n.id !== note.id;
                });
            });
        };
        Archive.get().then(function(archived) {
            $scope.archived = archived;
        });
        Settings.get("note.trash.enabled").then(function(enabled) {
            $scope.opts.trashEnabled = enabled;
        });
    }])
    .controller("TrashCtrl", ["$scope", "Trash", "Settings", "NoteServ", function($scope, Trash, Settings, NoteServ) {
        Settings.get("note.trash.enabled").then(function(enabled) {
            if (enabled) {
                $scope.trash = [];
                $scope.restoreNote = function(note) {
                    NoteServ.restore(note).then(function() {
                        $scope.trash = $scope.trash.filter(function(n) {
                            return n.id !== note.id;
                        });
                    });
                };
                Trash.get().then(function(trash) {
                    $scope.trash = trash;
                });
            }
        });
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
    .controller("PopupCtrl", ["$scope", "$uibModalInstance", "type", "text", "name",
                              function($scope, $modalInstance, type, text, name) {
        $scope.type = type;
        $scope.text = text;
        $scope.name = name;
        $scope.input = {val: ""};
        $scope.cancel = function() {
            $modalInstance.close($scope.type === 'prompt' ? null : false);
        };
        $scope.accept = function() {
            $modalInstance.close($scope.type === 'prompt' ? $scope.input.val : true);
        };
    }])
;
}(jQuery));