(function($) { "use strict";

var Sticklet = angular.module("Sticklet");
Sticklet
    .filter("FilterNotes", [function() {
        return function(notes, filters) {
            var reg = new RegExp(filters.search, "i");
            return notes.filter(function(n) {
                return (!n.archived && !n.deleted && ((_.isEmpty(filters.colors) || (filters.colors.indexOf(n.color) > -1)) && 
                        (_.isEmpty(filters.tags) || findTags(filters.tags, n)) && 
                        (!filters.search || reg.test(n.content) || reg.test(n.title))));
            });
        };
        function findTags(tags, note) {
            return _.every(tags, function(t) { 
                return _.some(note.tags, function(tt) {
                    return tt.id === t.id; 
                }); 
            });
        }
    }])
    .filter("SortNotes", [function() {
        return function(notes, sortBy, reverse) {
            reverse = (reverse === "DESC" || reverse === true);
            var sorted = _.sortBy(notes, function(n) {
                return n[sortBy];
            });
            return (reverse ? _.reverse(sorted) : sorted);
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
    .filter("Empty", [function() {
        return function(o) {
            return _.isEmpty(o);
        };
    }])
    .filter("FilterTags", [function() {
        //TODO: make this smarter
        return function(tags, search) {
            if (!search) {
                return tags;
            }
            var reg = new RegExp(search, "i");
            return tags.filter(function(tag) {
                return reg.test(tag.name);
            });
        };
    }])
    .filter("DispDate", ["$filter", function($filter) {
        var short = "MM/dd/yy h:mma",
            long = "MMM d, yyyy h:mm a"
        return function(date, l) {
            //return $filter("date")(date, "short");
            return $filter("date")(date, l ? long : short);
        };
    }])
    .filter("Limit", [function() {
        return function(arr, len, from) {
            if (_.isArray(arr)) {
                return arr.slice(from || 0, len);
            }
            return arr;
        };
    }])
    .filter("TagsUsed", [function() {
        return function(tags, filtered) {
            if (filtered && filtered.length && tags && tags.length) {
                return tags.filter(function(t) {
                    return filtered.indexOf(t) === -1;
                });
            }
            return tags;
        };
    }])
;
}(jQuery));
