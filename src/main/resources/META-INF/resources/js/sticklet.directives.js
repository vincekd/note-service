(function($) { "use strict";

var Sticklet = angular.module("Sticklet"),
    keyCodes = {
        "ESCAPE": 27,
        "ENTER": 13
    };
Sticklet
    .directive("sizeNotesArea", [function() {
        return {
            "restrict": "A",
            "link": function($scope, $element, $attrs) {
                var $w = $(window);
                var resize = function() {
                    var height = ($w.height() - $("#menu").outerHeight());
                    $element.height(height);
                };
                resize();
                $w.on("resize", function() {
                    resize();
                });
            }
        };
    }])
    .directive("tags", ["TagServ", function(TagServ) {
        return {
            "restrict": "E",
            "scope": {
                "note": "="
            },
            "templateUrl": "templates/tags.html",
            "link": function($scope, $element, $attrs) {
                $scope.opts = {
                    "isOpen": false,
                    "search": ""
                };
                $scope.userTags = [];
                $scope.tagsOpened = function() {
                    if ($scope.opts.isOpen) {
                        $scope.opts.search = "";
                        TagServ.getTags().then(function(tags) {
                            $scope.userTags = tags.filter(function(tag) {
                                return _.every($scope.note.tags, function(t) {
                                    return tag.id !== t.id;
                                });
                            });
                        });
                    }
                };

                $scope.addTag = function(tag) {
                    TagServ.tag($scope.note, tag);
                    close();
                };
                $scope.createAndAddTag = function() {
                    TagServ.create({name: $scope.opts.search}).then(function(tag) {
                        $scope.addTag(tag);
                    });
                    close();
                };
                $scope.removeTag = function(tag) {
                    TagServ.untag($scope.note, tag);
                };
                function close() {
                    $scope.opts.search = "";
                    $scope.opts.isOpen = false;
                }
            }
        };
    }])
    .directive("showHideTimer", ["$timeout", function($timeout) {
        return {
            "restrict": "A",
            "link": function($scope, $element, $attrs) {
                var timer;
                $element.on("mousemove", _.debounce(function() {
                    var $el = $element.find($attrs.element).show();
                    $timeout.cancel(timer);
                    timer = $timeout(function() {
                        $el.hide();
                    }, (parseInt($attrs.time, 10) || 6) * 1000);
                }, 200, {leading: true}))
                .on("mouseleave", function() {
                    $element.find($attrs.element).hide();
                    $timeout.cancel(timer);
                    timer = null;
                });
            }
        };
    }])
    .directive("colorChoices", ["NoteServ", function(NoteServ) {
        var colors = NoteServ.getColors();

        return {
            "restrict": "E",
            "scope": {
                "onChange": "&",
                "note": "="
            },
            "templateUrl": "templates/color-choices.html",
            "link": function($scope, $element, $attrs) {
                colors.then(function(c) {
                    $scope.colors = c;
                });
                if ($scope.note) {
                    var originalColor = $scope.note.color;
                    $scope.colorClick = function($event, color) {
                        $scope.note.color = originalColor = color;
                        $scope.onChange({color: color});
                    };
                    $scope.mouseEnter = function($event, color) {
                        $scope.note.color = color;
                    };
                    $scope.mouseLeave = function($event, color) {
                        $scope.note.color = originalColor;
                    };
                } else {
                    $scope.colorClick = function($event, color) {
                        $scope.onChange({color: color});
                    };
                }
            }
        };
    }])
    .directive("editableArea", ["tinymceOpts", function(tinymceOpts) {
        return {
            "restrict": "E",
            "scope": {
                "model": "=",
                "update": "&onUpdate",
                "close": "&onClose",
                "type": "@",
                "prop": "@",
                "global": "@"
            },
            "templateUrl": "templates/editable-area.html",
            "link": function($scope, $element, $attrs) {
                $scope.global = $scope.global === "true"
                $scope.cur = {
                    "value": $scope.model[$scope.prop]
                };
                var close = function() {
                        update();
                        try {
                            tinymce.remove(thisEditor);
                            editor.destroy();
                        } catch (e) {}
                        $scope.close();
                    },
                    update = function() {
                        $scope.model[$scope.prop] = $scope.cur.value;
                        $scope.update();
                    },
                    thisEditor;

                $scope.tinymceOptions = _.extend({}, tinymceOpts, {
                    "init_instance_callback": function(editor) {
                        thisEditor = editor;
                        if (!$scope.global) { 
                            editor.on("keyup keydown click", function(ev) {
                                if ((ev.ctrlKey && ev.keyCode === keyCodes.ENTER) || ev.keyCode === keyCodes.ESCAPE) {
                                    ev.preventDefault();
                                    ev.stopPropagation();
                                    if (ev.type === "keyup") {
                                        close();
                                    }
                                    return false;
                                }
                            });
                            editor.on("blur", function(event) {
                                close();
                            });
                        }
                    }
                });
            }
        };
    }])
;

}(jQuery));
