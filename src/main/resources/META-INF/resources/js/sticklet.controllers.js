(function($) { "use strict";

var Sticklet = angular.module("Sticklet");

Sticklet
    .controller("PageCtrl", ["$scope", "UserServ", "Settings", "Offline", "Notify",
                             "Design", "$route", "$location", "network",
                             function($scope, UserServ, Settings, Offline, Notify,
                                     Design, $route, $location, network) {
        $scope.user;
        Settings.get("note.maxTitleLength").then(function(data) {
            $scope.maxTitleLength = data;
        });
        $scope.opts = {
            "screenSize": Design.size,
            "mobile": Design.mobile,
            "display": "stacked",
            "sortBy": "created",
            "order": "ASC",
            "batchSelect": false,
            "menuOpen": false
        };
        $scope.current = {
            "online": true,
            "editing": null,
            "title": null,
            "filters": {
                "colors": [],
                "notTags": [],
                "tags": [],
                "search": ""
            }
        };
        $scope.resetFilters = function() {
            $scope.current.filters = {"colors": [], "tags": [], "search": "", "notTags": []};
        };
        function getUrlFilters() {
            var params = $location.search();
            if (_.isString(params.tags) && params.tags) {
                $scope.current.filters.tags = params.tags.split("|");
            }
            if (_.isString(params["^tags"]) && params["^tags"]) {
                $scope.current.filters.notTags = params["^tags"].split("|");
            }
            if (_.isString(params.colors) && params.colors) {
                $scope.current.filters.colors = params.colors.split("|");
            }
            if (_.isString(params.search)) {
                $scope.current.filters.search = (params.search || "");
            }
        }
        $scope.$watch(function() {
            return Design.size;
        }, function(s) {
            $scope.opts.screenSize = s;
            $scope.opts.mobile = Design.mobile;
        });
        getUrlFilters();
        $scope.template = Design.template;
        UserServ.getUser().then(function(u) {
            $scope.user = u;
            if ($scope.user) {
                $scope.opts.display = $scope.user.prefs.display;
                $scope.opts.sortBy = $scope.user.prefs.sortBy;
                $scope.opts.order = $scope.user.prefs.order;
            }
        });
        var notification;
        if (!network.online) {
            notification = getOfflineNotification();
        }
        Offline.onNetworkChange("PageCtrl", function(online) {
            console.info("network online", online);
            $scope.current.online = online;
            Notify.remove(notification);
            if (!online) {
                notification = getOfflineNotification();
            }
        });
        function getOfflineNotification() {
            return Notify.add("Cannot connect to the server....", true, false);
        }
        var blurTime;
        $(window).on("focus.sticklet", function(ev) {
            if (blurTime && Date.now() - blurTime > 1200000) { //20 minutes
                console.info("reloading page after long unfocus");
                $route.reload();
            }
            blurTime = null;
        }).on("blur.sticklet", function(ev) {
            blurTime = Date.now();
        }).focus();
        $scope.$on("$destroy", function(ev) {
            $(window).off("focus.sticklet blur.sticklet hashchange.sticklet");
        });
        $scope.$on("$routeChangeStart", function(event, next, current) {
            if (next.$$route.originalPath !== "/") {
                $location.search({});
            }
        });
    }])
    .controller("NotesCtrl", ["$scope", "NoteServ", "FilterNotesFilter", "SortNotesFilter", "$location",
                              function($scope, NoteServ, filterNotes, sortNotes, $location) {

        $scope.opts.menuOpen = false; //reset this
        var allNotes = [];
        $scope.notes = [];
        $scope.displayNotes = [];
        $scope.batchSelections = [];
        $scope.viewableNote = function(note) {
            return ($scope.displayNotes.indexOf(note.id) > -1);
        };
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
            if (($event.ctrlKey && !$scope.current.editing && !$scope.current.title) || $scope.opts.batchSelect) {
                if ($event.ctrlKey && !$scope.opts.batchSelect) {
                    $scope.startBatchSelect();
                }
                $scope.toggleBatchSelection(note);
            }
        };
        $scope.toggleMenu = function() {
            $scope.opts.menuOpen = !$scope.opts.menuOpen;
        };
        $scope.createNote = function() {
            NoteServ.create({
                "tags": _.difference($scope.current.filters.tags, $scope.current.filters.notTags),
                "color": $scope.current.filters.colors[0],
                "title": $scope.current.filters.search
            });
        };
        $scope.closeEditor = function() {
            $scope.current.editing = null;
            $scope.current.title = null;
        };
        $scope.$on("notes-updated", function() {
            getNotes();
        });
        $scope.onSearch = _.debounce(function() {
            $scope.$apply(function() {
                filterAndSortNotes();
            });
        }, 250);
        $scope.$watchGroup([function() {
            return $scope.current.filters.tags.length;
        }, function() {
            return $scope.current.filters.notTags.length;
        }, function() {
            return $scope.current.filters.colors.length;
        }, function() {
            return $scope.opts.order;
        }, function() {
            return $scope.opts.sortBy;
        }], function() {
            filterAndSortNotes();
        });

        function filterAndSortNotes() {
            $scope.notes = sortNotes(filterNotes(allNotes, $scope.current.filters),
                    $scope.opts.sortBy, $scope.opts.order);
            updateUrl();
        }
        function updateUrl() {
            var state = {
                "tags": $scope.current.filters.tags.join("|") || null,
                "^tags": $scope.current.filters.notTags.join("|") || null,
                "colors": $scope.current.filters.colors.join("|") || null,
                "search": $scope.current.filters.search || null
            };
            $location.search(state).replace();
        }

        getNotes();
        function getNotes() {
            //get data
            NoteServ.getNotes().then(function(notes) {
                allNotes = notes;
                filterAndSortNotes();
            });
        }
    }])
    .controller("MenuCtrl", ["$scope", "TagServ", "HTTP", "Settings", function($scope, TagServ, HTTP, Settings) {
        $scope.cur = {
            "isOpen": false,
            "trashEnabled": false
        };
        $scope.status = {
            "filterOpen": true,
            "sortOpen": false,
            "settingsOpen": false
        };
        $scope.tags = [];
        $scope.filterOpened = function() {
            if ($scope.cur.isOpen) {
                TagServ.getTags().then(function(tags) {
                    $scope.tags = tags.filter(function(tag) {
                        return _.some($scope.notes, function(note) {
                            return TagServ.noteHasTag(note, tag);
                        });
                    });
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
            if ($scope.current.filters.tags.indexOf(tag.id) === -1) {
                $scope.current.filters.tags.push(tag.id);
                closeFilter();
            }
        };
        $scope.removeTagFilter = function(tag) {
            $scope.current.filters.tags = $scope.current.filters.tags.filter(function(t) {
                return t !== tag.id;
            });
            $scope.current.filters.notTags = $scope.current.filters.notTags.filter(function(t) {
                return t !== tag.id;
            });
        };
        $scope.toggleNotTag = function(tag) {
            if ($scope.current.filters.notTags.indexOf(tag.id) === -1) {
                $scope.current.filters.notTags.push(tag.id);
            } else {
                $scope.current.filters.notTags = _.without($scope.current.filters.notTags, tag.id);
            }
        };
        $scope.hasFilter = function() {
            return ($scope.current.filters.tags.length || 
                    $scope.current.filters.colors.length || 
                    $scope.current.filters.search);
        }
        $scope.logout = function() {
            HTTP.post("/custom-logout").then(function() {
                window.location = "/login.html";
            });
        }
        Settings.get("note.trash.enabled").then(function(enabled) {
            $scope.cur.trashEnabled = (enabled === true);
        });
        function closeFilter() {
            $scope.cur.isOpen = false;
        }
    }])
    .controller("BatchEditCtrl", ["$scope", "NoteServ", "TagServ", "Popup",
                                  function($scope, NoteServ, TagServ, Popup) {
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
            Popup.confirm("Are you sure you wish to delete these notes?", "Delete Notes").then(function() {
                NoteServ.removeAll($scope.batchSelections).then(function() {
                    $scope.clearBatchSelect();
                });
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
    .controller("NoteListNoteCtrl", ["$scope", "NoteServ", "TagServ", "Popup", "$location",
                                     function($scope, NoteServ, TagServ, Popup, $location) {
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
                if ($scope.opts.display === "title") {
                    $location.path("/note/" + $scope.note.id);
                } else {
                    $scope.current.title = $scope.note;
                }
                return false;
            }
        };
        $scope.shareNote = function() {
            var $modalInst = Popup.popup({
                "animation": true,
                "templateUrl": "/templates/share.html",
                "controller": "ShareCtrl",
                "backdrop": true,
                "keyboard": false,
                "backdropClass": "sticklet-popup-backdrop",
                "windowClass": "sticklet-popup-window",
                "resolve": {
                    "note": function() { return $scope.note; }
                }
            });
            $modalInst.result.then(function(res) {
                if (res === "save") {
                    NoteServ.save($scope.note);
                }
            });
        };
        $scope.archiveNote = function() {
            NoteServ.archive($scope.note);
        };
        $scope.deleteNote = function() {
            Popup.confirm("Are you sure you wish to delete this note?", "Delete Note").then(function() {
                NoteServ.remove($scope.note);
            });
        };
        $scope.updateNote = function() {
            NoteServ.titleFromContent($scope.note);
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
        $scope.openNoteMenu = function($event) {
            $event.preventDefault();
            var $modalInst = Popup.popup({
                "animation": true,
                "templateUrl": "/templates/mobile/note-menu.html",
                "controller": "NoteMenuCtrl",
                "backdrop": true,
                "keyboard": false,
                "size": "sm",
                "backdropClass": "sticklet-popup-backdrop",
                "windowClass": "sticklet-popup-window",
                "resolve": {
                    "note": function() { return $scope.note; },
                    "maxTitleLength": function() { return $scope.maxTitleLength; }
                }
            });
            $modalInst.result.then(function(result) {
                if (result === "save") {
                    $scope.tmpColor = $scope.note.color;
                    NoteServ.save($scope.note);
                } else if (result === "delete") {
                    NoteServ.remove($scope.note);
                } else if (result === "archive") {
                    NoteServ.archive($scope.note);
                }
            });
        };
        $scope.$watch(function() {
            return $scope.note.color;
        }, function(col, old) {
            if (col !== old && $scope.tmpColor !== col) {
                $scope.tmpColor = col;
            }
        });
        $scope.$on("update-temp-color", function($event, notes, color) {
            if (notes.indexOf($scope.note) >= 0) {
                $scope.tmpColor = (color || $scope.note.color);
            }
        });
    }])
    .controller("ShareCtrl", ["$scope", "note", "$uibModalInstance", function($scope, note, $modalInst) {
        var orig = !!note.isPublic;
        $scope.note = note;
        $scope.save = function() {
            if (orig !== $scope.note.isPublic) {
                $modalInst.close("save");
            } else {
                $modalInst.dismiss("no-change");
            }
        };
        $scope.cancel = function() {
            $modalInst.dismiss("cancel");
        };
    }])
    .controller("NoteMenuCtrl", ["$scope", "note", "maxTitleLength", "$uibModalInstance",
                                 function($scope, note, maxTitleLength, $modalInst) {
        $scope.maxTitleLength = maxTitleLength;
        $scope.note = _.extend({}, note);
        $scope.deleteNote = function() {
            $modalInst.close("delete");
        }
        $scope.archiveNote = function() {
            $modalInst.close("archive");
        }
        $scope.changeColor = function(color) {
            $scope.note.color = color;
        };
        $scope.save = function() {
            _.extend(note, $scope.note);
            $modalInst.close("save");
        };
        $scope.cancel = function() {
            $modalInst.dismiss("cancel");
        };
    }])
    .controller("NoteCtrl", ["$scope", "$routeParams", "NoteServ", "TagServ", "$location", "STOMP", "Settings", "Design",
                             function($scope, $routeParams, NoteServ, TagServ, $location, STOMP, Settings, Design) {

        var thisEditor,
            topicAdd = ".NoteCtrl";

        $scope.note = null;
        $scope.cur = {
            "content": "",
            "title": "",
            "editingNote": false
        };

        Settings.get("note.autoSaveInterval").then(function(time) {
            $scope.update = _.debounce(update, time);
        });

        function update() {
            if ($scope.cur.content !== $scope.note.content || $scope.cur.title !== $scope.note.title) {
                $scope.note.title = $scope.cur.title;
                $scope.note.content = $scope.cur.content;
                if (NoteServ.titleFromContent($scope.note)){
                    $scope.cur.title = $scope.note.title;
                }
                NoteServ.save($scope.note);
            }
        }

        STOMP.registerSetting("noteUpdate", topicAdd, function(note) {
            if (note.id === $scope.note.id) {
                $scope.$apply(function() {
                    _.extend($scope.note, note);
                });
            }
        });
        $scope.$on("$destroy", function() {
            STOMP.deregisterSetting("noteUpdate", topicAdd);
        });

        function loadNote() {
            NoteServ.getNote($routeParams.noteID).then(function(note) {
                $scope.note = note;
                if (note) {
                    $scope.cur.title = $scope.note.title;
                    $scope.cur.content = $scope.note.content;
                } else {
                    $location.path("/notes");
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
    .controller("VersionCtrl", ["$scope", "$routeParams", "NoteServ", "$location",
                             function($scope, $routeParams, NoteServ, $location) {

        $scope.note = null;
        $scope.versions = null;
        $scope.revertTo = function(version) {
            NoteServ.revertTo($scope.note, version).then(function() {
                $location.path("/");
            });
        };
        function load() {
            NoteServ.getNote($routeParams.noteID).then(function(note) {
                $scope.note = note
                if (!note) {
                    $location.path("/notes");
                    return;
                }
                NoteServ.getVersions(note).then(function(versions) {
                    $scope.versions = versions;
                });
            });
        }

        $scope.$watch(function() {
            return $routeParams.noteID;
        }, function() {
            load();
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
    .controller("SettingsCtrl", ["$scope", "$location", "HTTP",
                                 function($scope, $location, HTTP) {

        $scope.sortOptions = ["created", "updated", "title", "color"];
        $scope.mockUser;
        $scope.saveSettings = function() {
            if (!$scope.mockUser.password || ($scope.mockUser.password === $scope.mockUser.password2)) {
                HTTP.put("/user", $scope.mockUser).then(function() {
                    $location.path("/notes");
                });
            } else {
                console.warn("passwords don't match");
            }
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
    .controller("TagsAdminCtrl", ["$scope", "TagServ", "HTTP", "Popup",
                                  function($scope, TagServ, HTTP, Popup) {
        $scope.tags = [];
        $scope.activeTag = null;
        $scope.removeTag = function(tag) {
            Popup.confirm("Are you sure you want to delete the tag from all notes?", "Delete Tag").then(function() {
                TagServ.remove(tag);
            });
        };
        $scope.tagActivated = function(tag) {
            $scope.activeTag = tag;
        };
        $scope.archiveTaggedNotes = function(tag) {
            Popup.confirm("Are you sure you want to archive all tagged notes?", "Archive Tagged Notes").then(function() {
                TagServ.archiveTaggedNotes(tag).then(function() {
                    getTags();
                });
            });
        };
        $scope.deleteTaggedNotes = function(tag) {
            Popup.confirm("Are you sure you want to delete all tagged notes?", "Delete Tagged Notes").then(function() {
                TagServ.deleteTaggedNotes(tag).then(function() {
                    getTags();
                });
            });
        };
        $scope.checkShowArchive = function(tag) {
            return (tag.noteCount > 0 && tag.archivedCount < (tag.noteCount - tag.deletedCount));
        };
        $scope.checkShowDelete = function(tag) {
            return (tag.noteCount > 0 && tag.deletedCount < tag.noteCount);
        };

        getTags()
        $scope.$on("tags-updated", function() {
            getTags();
        });

        function getTags() {
            HTTP.get("/tags", {"noteCount": true}).then(function(tags) {
                $scope.tags = tags;
            });
        }
    }])
    .controller("DataCtrl", ["$scope", "FileUploadServ", "Notify", "Popup", "HTTP",
                             function($scope, FileUploadServ, Notify, Popup, HTTP) {
        //upload
        $scope.o = {"type": ""};
        $scope.importTypes = ["Sticklet", "Evernote", "Keep", "OneNote"];
        $scope.file = null;
        $scope.uploadProgress = 0;
        $scope.deleteAccount = function() {
            Popup.confirm("Are you sure you want to delete your account? This is not recoverable.", 
                    "Delete Account").then(function() {
                HTTP.remove("/data/account").then(function() {
                    location.href = "/login.html";
                });
            });
        };
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
    .controller("ArchiveCtrl", ["$scope", "Archive", "Settings", "NoteServ", "Popup", "SortNotesFilter",
                                function($scope, Archive, Settings, NoteServ, Popup, sortNotes) {
        $scope.opts = {"trashEnabled": false};
        $scope.archived = [];
        $scope.activeNote = null;
        $scope.noteActivated = function(note) {
            $scope.activeNote = note;
        };
        $scope.restoreNote = function(note) {
            NoteServ.unarchive(note).then(function() {
                $scope.archived = $scope.archived.filter(function(n) {
                    return n.id !== note.id;
                });
            });
        };
        $scope.deleteNote = function(note) {
            Popup.confirm("Are you sure you want to delete this note?", "Delete Note").then(function() {
                NoteServ.remove(note).then(function() {
                    $scope.archived = $scope.archived.filter(function(n) {
                        return n.id !== note.id;
                    });
                });
            });
        };
        Archive.get().then(function(archived) {
            $scope.archived = sortNotes(archived, 'updated', true);
        });
        Settings.get("note.trash.enabled").then(function(enabled) {
            $scope.opts.trashEnabled = enabled;
        });
    }])
    .controller("TrashCtrl", ["$scope", "Trash", "Settings", "NoteServ", "SortNotesFilter",
                              function($scope, Trash, Settings, NoteServ, sortNotes) {
        Settings.get("note.trash.enabled").then(function(enabled) {
            if (enabled) {
                $scope.trash = [];
                $scope.activeNote = null;
                $scope.restoreNote = function(note) {
                    NoteServ.restore(note).then(function() {
                        $scope.trash = $scope.trash.filter(function(n) {
                            return n.id !== note.id;
                        });
                    });
                };
                $scope.noteActivated = function(note) {
                    $scope.activeNote = note;
                };
                Trash.get().then(function(trash) {
                    $scope.trash = sortNotes(trash, 'deleted', true);
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