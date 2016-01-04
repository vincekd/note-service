(function($) { "use strict";

var Sticklet = angular.module("Sticklet");
Sticklet
    .filter("SortNotes", [function() {
        return function(notes, sortBy, reverse) {
            var sorted = _.sortBy(notes, function(n) {
                return n[sortBy];
            });
            return (reverse ? _.reverse(sorted) : sorted);
        };
    }])
    .filter("CancelEvent", [function() {
        return function($event) {
            console.log("canceling event", $event);
            $event.stopPropagation();
            $event.preventDefault();
            return false;
        };
    }])
;
}(jQuery));
