(function($) { "use strict";

var Sticklet = angular.module("Sticklet"),
    keyCodes = {
        "ESCAPE": 27,
        "ENTER": 13
    };
Sticklet
    .directive("routeLoad", ["$location", function($location) {
        return {
            "restrict": "A",
            "link": function($scope, $element, $attrs) {
                $element.on("click.sticklet", function(ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    $scope.$apply(function() {
                        $location.path($attrs.routeLoad);
                    });
                    return false;
                });
            }
        };
    }])
    .directive("tags", ["TagServ", function(TagServ) {
        return {
            "restrict": "E",
            "scope": {
                "note": "=",
                "batch": "="
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
                                return !TagServ.noteHasTag($scope.note, tag);
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
                $scope.$watchCollection('note.tags', function(n, o) {
                    if (n !== o) {
                        //resize scrollbar
                        setTimeout(function() {
                            $element.find(".scrollbar-x").scroll();
                        }, 0);
                    }
                });
            }
        };
    }])
    .directive("colorChoices", ["NoteServ", function(NoteServ) {
        return {
            "restrict": "E",
            "scope": {
                "onChange": "&",
                "mouseover": "&",
                "mouseleave": "&"
            },
            "templateUrl": "templates/color-choices.html",
            "link": function($scope, $element, $attrs) {
                var colors = NoteServ.getColors();
                colors.then(function(c) {
                    $scope.colors = c;
                });
                $scope.colorClick = function($event, color) {
                    $scope.onChange({ "color": color });
                };
                $scope.mouseEnter = function($event, color) {
                    $scope.mouseover({ "color": color });
                };
                $scope.mouseLeave = function($event, color) {
                    $scope.mouseleave({ "color": color });
                };
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
                    $element.on("keydown.sticklet", "input", function(ev) {
                        if ((ev.ctrlKey && ev.keyCode === keyCodes.ENTER) || ev.keyCode === keyCodes.ESCAPE) {
                            ev.preventDefault();
                            ev.stopPropagation();
                            close();
                            return false;
                        }
                    }).on("blur.sticklet", "input", function(event) {
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
        var paddingBottom = 15;
        return {
            "restrict": "A",
            "link": function($scope, $element, $attrs) {
                var $pref = $element.find("> " + $attrs.prefer); //.height("auto");
                function balanceHeights(height, prefHeight) {
                    var $children = $element.children().not($pref);
                    if ($children.length > 0) {
                        $children.height((Math.floor((height - prefHeight) / $children.length) - paddingBottom) + "px");
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
                $element.on("change.sticklet", function(ev) {
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
                                '<div class="col-md-3 hidden-xs hidden-sm"></div>' +
                                '<div class="col-md-6 basic-page-main">' +
                                    '<a class="close" route-load="/">&times;</a>' +
                                    '<div class="basic-page-content">' +
                                        '<ng-transclude></ng-transclude>' +
                                    '</div>' +
                                '</div>' +
                                '<div class="col-md-3 hidden-xs hidden-sm"></div>' +
                            '</div>' +
                        '</div>')
        };
    }])
    .directive("noteContextMenu", [function() {
        return {
            "restrict": "A",
            "link": function($scope, $element, $attrs) {
                $element.on("contextmenu.sticklet", function(ev) {
                    var $target = $(ev.target);
                    if (!$target.is("a[href^='http']")) {
                        ev.preventDefault()
                        ev.stopPropagation();

                        $scope.$apply(function() {
                            setupContextMenu();
                        });

                        return false;
                    }
                });
                function setupContextMenu(ev, $target) {
                    var scope = $element.find(".options").scope();
                    scope.optionsMenuOpen = true;
                }
            }
        };
    }])
    .directive("tagSelector", ["network", "TagServ", "Settings",
                               function(network, TagServ, Settings) {
        return {
            "restrict": "E",
            "templateUrl": "/templates/tag-selector.html",
            "scope": {
                "search": "=",
                "title": "@",
                "tags": "=",
                "onToggle": "&",
                "isOpen": "=",
                "tagSelect": "&",
                "tagAdd": "&",
                "isDisabled": "="
            },
            "link": function($scope, $element, $attrs) {
                var tags;
                TagServ.getTags().then(function(t) {
                    tags = t;
                });
                $scope.canAdd = function() {
                    return (network.online && !_.isEmpty($scope.search) && noExactMatches());
                };
                $scope.tagSelected = function(t) {
                    $scope.tagSelect({ "tag": t });
                };

                $scope.maxNameLength;
                Settings.get("tag.maxNameLength").then(function(len) {
                    $scope.maxNameLength = len;
                });

                function noExactMatches() {
                    return _.every(tags ? tags : $scope.tags, function(tag) {
                        return tag.name.toUpperCase() !== $scope.search.toUpperCase();
                    });
                }
            }
        };
    }])
    .directive("notesInfiniteScroll", ["$timeout", function($timeout) {
        return {
            "restrict": "A",
            "link": function($scope, $element, $attrs) {
                var leeway = 1000,
                    elem = $element[0],
                    $child = $(elem.firstChild);

                function updateDisplayNotes() {
                    var scrollTop = $element.scrollTop(),
                        portal = $element.height(),
                        els = elem.querySelectorAll(".noteContainer"),
                        arr = [];

                    for (var i = 0; i < els.length; i++) {
                        var $el = $(els[i]),
                            top = $el.position().top;
                        
                        if ((top + $el.outerHeight()) >= (scrollTop - leeway) && top <= ((scrollTop + portal) + leeway)) {
                            $el.addClass("stklt-shown");
                            arr.push($el.scope().note.id);
                        } else {
                            $el.removeClass("stklt-shown");
                        }
                    }

                    $scope.displayNotes = arr;
                }

                $element.on("scroll.sticklet", _.throttle(function(ev) {
                    $scope.$apply(function() {
                        updateDisplayNotes();
                    });
                }, 100, {"trailing": true}));

                $timeout(function() {
                    updateDisplayNotes();
                }, 0);
                $scope.$watchCollection('notes', function() {
                    triggerScroll();
                });
                $scope.$watch('opts.display', function(disp, o) {
                    if (disp !== o) {
                        if (disp === "title") {
                            leeway = 250;
                        } else if (disp === "tiled") {
                            leeway = 500;
                        } else {
                            leeway = 1000;
                        }
                        triggerScroll();
                    }
                });
                function triggerScroll(again) {
                    setTimeout(function() {
                        $element.scroll();
                        if (again !== false) {
                            triggerScroll(false);
                        }
                    });
                }
            }
        };
    }])
    .directive("tiledStickies", [function() {
        var namespace = ".stickies ";
        return {
            "restrict": "A",
            "link": function($scope, $element, $attrs) {
                function updatePosition() {
                    $element.css({
                        "left": $scope.note.position.x,
                        "top": $scope.note.position.y,
                        "z-index": $scope.note.position.z
                    });
                }

                function bindDrag() {
                    //TODO: finish this
                    var moved = false,
                        offset = $element.closest(".notes").offset();
                    $element.on("mousedown" + namespace, function(ev) {
                        $element.on("mousemove" + namespace, function(ev) {
                            moved = true;
                            $scope.note.position = $scope.note.position || {};
                            $scope.note.position.x = ev.clientX - offset.left;
                            $scope.note.position.y = ev.clientY - offset.top;
                            var topZ = getTopZ();
                            $scope.note.position.z = topZ > $scope.note.position.z ? topZ + 1 : $scope.note.position.z;
                            $scope.$apply(function() {
                                updatePosition();
                            });
                        });
                    })
                    $(document).on("mouseup" + namespace, function(ev) {
                        $element.off("mousemove" + namespace);
                        if (moved) {
                            //TODO: save
                        }
                    });
                }
                function unbindDrag() {
                    $element.off("mousedown" + namespace + "mouseup" + namespace + "mousemove" + namespace);
                }
                function getTopZ() {
                    return $scope.notes.reduce(function(prev, note) {
                        return (note.position && note.position.z > prev ? note.position.z : prev);
                    }, 0);
                }
                $scope.$watch(function() {
                    if ($scope.note.position) {
                        return $scope.note.position.x + "-" + $scope.note.position.y + "-" + $scope.note.position.z;
                    }
                    return "";
                }, function(v) {
                    if (v) {
                        updatePosition();
                    }
                });
                $scope.$watch(function() {
                    return $scope.opts.display;
                }, function (disp) {
                     if ($scope.opts.screenSize > 1 && disp === "tiled") {
                         bindDrag();
                     } else {
                         unbindDrag();
                     }
                });
            }
        };
    }])
;

}(jQuery));
