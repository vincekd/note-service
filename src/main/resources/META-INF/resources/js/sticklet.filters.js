(function($) { "use strict";

var Sticklet = angular.module("Sticklet");
Sticklet
    .filter("FilterNotes", ["TagServ", function(TagServ) {
        return function(notes, filters) {
            var reg = new RegExp(filters.search, "i");
            return notes.filter(function(n) {
                if (n.archived || n.deleted) {
                    return false;
                } else if (!filters.tags && !filters.colors && !filters.search) {
                    return true;
                }

                var tags = _.difference(filters.tags, filters.notTags);
                return ((_.isEmpty(filters.colors) || (filters.colors.indexOf(n.color) > -1)) && 
                        (_.isEmpty(tags) || findTags(tags, n)) &&
                        (_.isEmpty(filters.notTags) || findNotTags(filters.notTags, n)) &&
                        (!filters.search || reg.test(n.content) || reg.test(n.title)));
            });
        };
        function findNotTags(tags, note) {
            return _.every(tags, function(t) {
                return !TagServ.noteHasTag(note, t);
            });
        }
        function findTags(tags, note) {
            return _.every(tags, function(t) {
                return TagServ.noteHasTag(note, t);
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
        return function(tags, search) {
            return _.searchObjList(tags, "name", search);
        };
    }])
    .filter("DispDate", ["$filter", function($filter) {
        var short = "MM/dd/yy h:mma",
            long = "MMM d, yyyy h:mm a";

        return function(date, l) {
            var ago = _.ago(date);
            if (/now|min|hour|day/i.test(ago)) {
                return ago;
            }
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
    .filter("InfiniteScrollLimit", [function() {
        //get last displayed note (already sorted) and add X further notes to it
        return function(notes, displayNotes, len) {
            if (!notes || notes.length < 30) {
                return notes;
            }
            var note = null,
                i = notes.length - 1;
            for (; i >= 0; i--) {
                if (displayNotes.indexOf(notes[i].id) >= 0) {
                    break;
                }
            }
            return notes.slice(0, i + len);
        };
    }])
    .filter("TagsUsed", [function() {
        return function(tags, filtered) {
            if (filtered && filtered.length && tags && tags.length) {
                return tags.filter(function(t) {
                    return filtered.indexOf(t.id) === -1;
                });
            }
            return tags;
        };
    }])
    .filter("Clip", [function() {
        return function(str, len) {
            return ((str && _.isString(str)) ? str.substring(0, len || 400) : str);
        };
    }])
    .filter("CreatedOrUpdated", [function() {
        return function(note, sortBy) {
            return (sortBy === "created" ? note.created : note.updated);
        };
    }])
    .filter("TagsFromIDs", ["TagServ", function(TagServ) {
        return function(tagIDs) {
            var out = _.filter(TagServ.curTags, function(tag) {
                return (tagIDs.indexOf(tag.id) > -1);
            });
            return out;
        };
    }])
    .filter("BoolWord", [function() {
        return function(val) {
            return (val ? "Yes": "No");
        };
    }])
    .filter("FilterContentPage", [function() {
        return function(collection, search, itemProp, defaultHeader) {
            if (!search || !search[itemProp] || !collection || !itemProp) {
                return collection;
            }
            var reg = new RegExp(search[itemProp], "i");
            return _.filter(collection, function(item) {
                return reg.test(item[itemProp] || defaultHeader); 
            });
        };
    }])
    .filter("ShareUrl", ["HTTP", function(HTTP) {
        return function(note) {
            return HTTP.getRealUrl("/note/" + note.id + "/public");
        };
    }])
;
}(jQuery));

