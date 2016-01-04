(function($) { "use strict";

var Sticklet = angular.module("Sticklet");
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
    .directive("tags", [function() {
        return {
            "restrict": "E",
            "templateUrl": "templates/tags.html",
            "link": function($scope, $element, $attrs) {}
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
                "onChange": "&"
            },
            "templateUrl": "templates/color-choices.html",
            "link": function($scope, $element, $attrs) {
                colors.then(function(c) {
                    $scope.colors = c;
                });
                $scope.colorClick = function($event, color) {
                    console.log("color clicked", color);
                    $scope.onChange(color);
                };
            }
        };
    }])
;

}(jQuery));
