(function($) { "use strict";

var Sticklet = angular.module("Sticklet"),
    keyCodes = {
        "ESCAPE": 27,
        "ENTER": 13
    };
Sticklet
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
                    }, _.toInt($attrs.time || 6) * 1000);
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
    .directive("editableArea", ["$timeout", function($timeout) {
        return {
            "restrict": "E",
            "scope": {
                "model": "=",
                "update": "&onUpdate",
                "close": "&onClose",
                "type": "@",
                "prop": "@"
            },
            "templateUrl": "templates/editable-area.html",
            "link": function($scope, $element, $attrs) {
                $scope.cur = {
                    "value": $scope.model[$scope.prop]
                };
                var close = function() {
                        $scope.$apply(function() {
                            update();
                            $scope.close();
                        });
                    },
                    update = function() {
                        if ($scope.model[$scope.prop] !== $scope.cur.value) {
                            $scope.model[$scope.prop] = $scope.cur.value;
                            $scope.update();
                        }
                    };

                if ($scope.type === "textarea") {
                    $scope.options = {
                        "events": {
                            "blur": function(ev, editor) {
                                close();
                            },
                            "keydown": function(ev, editor) {
                                if ((ev.ctrlKey && ev.keyCode === keyCodes.ENTER) || ev.keyCode === keyCodes.ESCAPE) {
                                    ev.preventDefault();
                                    ev.stopPropagation();
                                    close();
                                    return false;
                                }
                            }
                        }
                    };
                } else {
                    $element.on("keydown", "input", function(ev) {
                        if ((ev.ctrlKey && ev.keyCode === keyCodes.ENTER) || ev.keyCode === keyCodes.ESCAPE) {
                            ev.preventDefault();
                            ev.stopPropagation();
                            close();
                            return false;
                        }
                    }).on("blur", "input", function(event) {
                        close();
                    });
                    $timeout(function() {
                        $element.find("input").focus();
                    }, 500);
                }
            }
        };
    }])
    .directive("balanceHeights", ["$rootScope", function($rootScope) {
        return {
            "restrict": "A",
            "link": function($scope, $element, $attrs) {
                var $pref = $element.find("> " + $attrs.prefer); //.height("auto");
                function balanceHeights(height, prefHeight) {
                    var $children = $element.children().not($pref);
                    if ($children.length > 0) {
                        $children.height(Math.floor((height - prefHeight) / $children.length) + "px");
                    }
                    $rootScope.$broadcast("note-content-resize");
                }

                $scope.$watchGroup([function() {
                    //also watch other elements?
                    return $element.height();
                }, function() {
                    return $pref.outerHeight();
                }], function(height) {
                    balanceHeights(height[0], height[1]);
                });
            }
        };
    }])
    .directive("notifications", ["Notify", function(Notify) {
        return {
            "restrict": "E",
            "templateUrl": "/templates/notifications.html",
            "link": function($scope, $element, $attrs) {
                
            }
        };
    }])
    .directive("fileUpload", [function() {
        return {
            restrict: "A",
            scope: {
                change: "&fileUpload"
            },
            link: function($scope, $element, attrs) {
                $element.on("change", function(ev) {
                    $scope.$apply(function() {
                        $scope.change({file: $element[0].files[0]});
                    });
                });
            }
        };
    }])
    .directive("basicPage", [function() {
        return {
            "restrict": "E",
            "transclude": true,
            "replace": true,
            "template": ('<div class="container-fluid row-full-height basic-page">' +
                            '<div class="row">' +
                                '<div class="col-sm-3"></div>' +
                                '<div class="col-sm-6 basic-page-main">' +
                                    '<a class="close" ng-href="#!/">&times;</a>' +
                                    '<div class="basic-page-content">' +
                                        '<ng-transclude></ng-transclude>' +
                                    '</div>' +
                                '</div>' +
                                '<div class="col-sm-3"></div>' +
                            '</div>' +
                        '</div>')
        };
    }])
;

}(jQuery));
