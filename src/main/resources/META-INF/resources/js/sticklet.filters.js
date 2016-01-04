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
    .filter("NotEmpty", [function() {
        return function(obj) {
            return (!obj || (_.isArray(obj) && !obj.length) || (_.isObject(obj) && !Object.keys(obj).length)); 
        };
    }])
;
}(jQuery));
