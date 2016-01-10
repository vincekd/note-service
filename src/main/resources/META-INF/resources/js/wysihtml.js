(function() {
    var wysihtml = angular.module("wysihtml", []);
    
    var parserRules = {
        "tags": {
            "b":  {}, "i":  {}, "br": {}, "ol": {}, "ul": {}, "li": {},
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
    
    wysihtml.directive("wysihtml", ["$http", "$templateCache", function($http, $templateCache) {
        var edCount = 0,
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
            "template": '<div ng-bind-html="content | Html"> </div>',
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
                    "parserRules": parserRules
                });
                editor.on("load", function() {
                    editor.focus();
                });

                if ($scope.options) {
                    _.each($scope.options.events, function(callback, event) {
                        if (!/key|mouse|click/i.test(event)) {
                            editor.on(event, function(evt) {
                                callback.call(null, evt, editor);
                            });
                        } else {
                            $element.on(event, function(evt) {
                                callback.call(null, evt, editor);
                            });
                        }
                    });
                }

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