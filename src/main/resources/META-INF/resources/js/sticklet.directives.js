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
                "batch": "=",
                "disabled": "="
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
                var $pref = $element.find("> " + $attrs.prefer);
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
                }, function() {
                    return $($element[0].children[1]).height();
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
    .directive("contentPage", [function() {
        return {
            "restrict": "E",
            "transclude": true,
            "replace": true,
            "templateUrl": "/templates/content-page.html",
            "scope": {
                "displayProp": "@",
                "defaultHeader": "@",
                "collection": "=",
                "onSelect": "&",
                "header": "@"
            },
            "link": function($scope, $element, $attrs) {
                $scope.active = null;
                $scope.activateItem = function(item) {
                    $scope.active = item;
                    $scope.onSelect({
                        "item": item
                    });
                };
                $scope.$watch('collection', function() {
                    if (!_.isEmpty($scope.collection)) {
                        $scope.activateItem($scope.collection[0]);
                    }
                });
            }
        };
    }])
    .directive("staticNote", [function() {
        return {
            "restrict": "E",
            "templateUrl": "/templates/static-note.html",
            "scope": {
                "note": "=",
                "overlord": "@"
            },
            "link": function($scope, $element, $attrs) {
                if ($scope.overlord) {
                    $scope.$watch('note.color', function() {
                        if ($scope.note) {
                            $element.closest($scope.overlord).css("background", $scope.note.color);
                        } else {
                            $element.closest($scope.overlord).css("background", "");
                        }
                    });
                }
            }
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

                    //ng-if creates new scope...
                    $scope.$parent.displayNotes = arr;
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
                            //no longer used
                            leeway = 500;
                        } else {
                            leeway = 1000;
                        }
                        triggerScroll();
                    }
                });
                $scope.$on("$destroy", function() {
                    $element.off("scroll.sticklet");
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
    .directive("tiledStickies", ["NoteServ", function(NoteServ) {
        var namespace = ".stickies ";
        return {
            "restrict": "A",
            "link": function($scope, $element, $attrs) {
                function updatePosition() {
                    $element.css({
                        "left": $scope.note.position.x + "px",
                        "top": $scope.note.position.y + "px",
                        "height": $scope.note.position.height + "px",
                        "width": $scope.note.position.width + "px",
                        "z-index": $scope.note.position.z
                    });
                }

                function bindDrag() {
                    var moved = false,
                        offset = $element.closest(".notes").offset(),
                        position = hasPosition() ? $scope.note.position : getDefaultPosition();
                    $element.css({
                        "left": position.x + "px",
                        "top": position.y + "px",
                        "z-index": (position.z || 0),
                        "height": position.height + "px",
                        "width": position.width + "px"
                    });

                    $element.on("mousedown" + namespace, function(ev) {
                        ev.preventDefault();
                        ev.stopPropagation();
                        var origX = ev.clientX + window.scrollX, //where the mousedown was
                            origY = ev.clientY + window.scrollY,
                            pos = $element.position(); //element position where the mousedown was

                        if (ev.target.classList.contains("resize-area") || ev.target.classList.contains("stklt-resize-both")) {
                            var width = $element.width(),
                                height = $element.height();
                            $(document).on("mousemove" + namespace, function(ev) {
                                ev.preventDefault();
                                ev.stopPropagation();
                                $element.addClass("resizing");
                                moved = true;

                                var x = ev.clientX + window.scrollX,
                                    y = ev.clientY + window.scrollY;

                                $scope.note.position.z = getZ();
                                $scope.note.position.width = Math.round(width + (x - origX));
                                $scope.note.position.height = Math.round(height + (y - origY));

                                $scope.$apply(function() {
                                    updatePosition();
                                });

                                return false;
                            });
                            return false;
                        }

                        $(document).on("mousemove" + namespace, function(ev) {
                            ev.preventDefault();
                            ev.stopPropagation();
                            $element.addClass("dragging");
                            moved = true;
                             var x = ev.clientX + window.scrollX,
                                 y = ev.clientY + window.scrollY;

                            $scope.note.position = $scope.note.position || {};
                            var newX =  Math.max(0, pos.left + x - origX),
                                newY = Math.max(0, pos.top + y - origY);
                            $scope.note.position.x = newX;
                            $scope.note.position.y = newY;

                            $scope.note.position.z = getZ();

                            $scope.$apply(function() {
                                updatePosition();
                            });

                            return false;
                        });
                        return false;
                    });
                    $(document).on("mouseup" + namespace, function(ev) {
                        $element.removeClass("dragging resizing");
                        $(document).off("mousemove" + namespace);
                        if (moved) {
                            NoteServ.save($scope.note);
                        }
                        moved = false;
                    });
                }
                function unbindDrag() {
                    $element.css({
                        "top": "",
                        "left": "",
                        "z-index": "",
                        "height": "",
                        "width": ""
                    }).off("mousedown" + namespace);
                    $(document).off("mouseup" + namespace + "mousemove" + namespace)
                }
                function getTopZ() {
                    return $scope.notes.reduce(function(prev, note) {
                        return (hasPosition(note) && note.position.z > prev ? note.position.z : prev);
                    }, 1);
                }
                function getZ() {
                    var topZ = getTopZ();
                    return topZ > $scope.note.position.z ? topZ + 1 : $scope.note.position.z;
                }
                function hasPosition(note) {
                    note = note || $scope.note;
                    return (note.position && _.isNumber(note.position.x) && _.isNumber(note.position.y));
                }
                function getDefaultPosition() {
                    return {
                        "x": Math.floor(($element.parent().width() / 2) - ($element.width() / 2)),
                        "y": Math.floor(($element.parent().height() / 2) - ($element.height / 2)),
                        "z": 0,
                        "height": "",
                        "width": ""
                    };
                }
                $scope.$watch(function() {
//                    if (hasPosition()) {
//                        return $scope.note.position.x + "-" + $scope.note.position.y + "-" + $scope.note.position.z;
//                    }
                    return "";
                }, function(v, o) {
                    if (v && v !== o) {
                        updatePosition();
                    }
                });
                $scope.$watch(function() {
                    return $scope.opts.display;
                }, function (disp) {
                     if (!$scope.opts.mobile && disp === "tiled") {
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
