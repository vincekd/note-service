(function($, _, angular, undefined) {

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
}(jQuery, _, angular));
