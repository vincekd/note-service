(function($) { "use strict";

var Sticklet = angular.module("Sticklet");
Sticklet
    .filter("FilterNotes", [function() {
        return function(notes, filters) {
            return notes;
        };
    }])
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
    .filter("Html", ["$sce", function($sce) {
        return function(text) {
            if (!text || typeof text === "string") {
                return $sce.trustAsHtml(text || "");
            }
            return $sce.trustAsHtml(text.toString());
        };
    }])
;
}(jQuery));
