(function() {
    var wysihtml = angular.module("wysihtml", []);
    
    var parserRules = {
        "tags": {
            "b":  {}, "i":  {}, "ol": {}, "ul": {}, "li": {}, "br": {}, 
            "h1": {}, "h2": {}, "h3": {}, "h4": {}, "h5": {}, "h6": {},
            "blockquote": {}, "u": 1, "span": {}, "p": {}, "div": {},
            "blink": {}, "caption": {}, "code": {}, "hr": {},
            "img": {
                "check_attributes": {
                    "width": "numbers",
                    "alt": "alt",
                    "src": "url",
                    "height": "numbers"
                }
            },
            "a":  {
                "set_attributes": {
                    "target": "_blank",
                    "rel": "nofollow"
                },
                "check_attributes": {
                    "href": "url"
                }
            },
            
        }
        //,classes": {}
    };
    
    wysihtml.directive("wysihtml", ["$http", "$templateCache", "$timeout",
                                    function($http, $templateCache, $timeout) {
        var useTextArea = false,
            edCount = 0,
            toolbarName = "wysihtml-toolbar";

        $http.get("/templates/wysihtml-toolbar.html").then(function(resp) {
            $templateCache.put("/templates/wysihtml-toolbar.html", resp.data);
        });

        return {
            "restrict": "A",
            "replace": true,
            "transclude": true,
            "scope": {
                "options": "=wysihtml",
                "value": "="
            },
            "template": (useTextArea ? '<textarea ng-model="content"> </textarea>' : 
                '<div ng-bind-html="content | Html"> </div>'),
            "link": function($scope, $element, $attrs) {
                $scope.content = $scope.value;
                var id = $element.attr("id");
                if (!id) {
                    id = "wysihtml-" + (++edCount);
                    $element.attr("id", id);
                }
                var editor = new wysihtml5.Editor(id, { 
                    "toolbar": toolbarName,
                    //"parserRules": wysihtml5ParserRules,
                    "parserRules": parserRules,
                    //"useLineBreaks": false
                });
                var preventBlur = false;
                editor.on("load", function() {
                    editor.focus();
                    //try to stop blurring on links, etc.
                    $(editor.toolbar.container).on("mouseup mousedown", function(ev) {
                        ev.stopPropagation();
                        preventBlur = true;
                        $timeout(function() {
                            preventBlur = false;
                        }, 10);
                    });
                });

                if ($scope.options && $scope.options.events) {
                    if ($scope.options.events.blur) {
                        editor.on("blur", function(ev) {
                            if (!preventBlur) {
                                $scope.options.events.blur.call(null, ev, editor);
                            }
                        });
                    }
                    if ($scope.options.events.keydown) {
                        $element.on("keydown", function(ev) {
                            $scope.options.events.keydown.call(null, ev, editor);
                        });
                    }
                }

//                if ($scope.options) {
//                    _.each($scope.options.events, function(callback, event) {
//                        if (!/key|mouse|click/i.test(event)) {
//                            editor.on(event, function(evt) {
//                                callback.call(null, evt, editor);
//                            });
//                        } else {
//                            $element.on(event, function(evt) {
//                                callback.call(null, evt, editor);
//                            });
//                        }
//                    });
//                }

                function update() {
                    $scope.value = editor.getValue(true);
                }

                //use MutationObserver to monitor when data changes
                var observer = new MutationObserver(function(mutations) {
                    observer.takeRecords();
                    $scope.$apply(function() {
                        update();
                    });
                });
                observer.observe($element[0], {
                    "attributes": true,
                    "childList": true,
                    "characterData": true,
                    "subtree": true
                });

                $scope.$on("$destroy", function(ev) {
                    observer.disconnect();
                    editor.destroy();
                });
            }
        };
    }])
    
}());