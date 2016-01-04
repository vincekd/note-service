(function($) { "use strict";

var Sticklet = angular.module("Sticklet");

Sticklet
    .service("HTTP", ["$http", "$q", function($http, $q) {
        function getRealUrl(url) {
            //if (/^\//.test(url)) {
            //    return "www.sticklet.com" + url;
            //}
            return url;
        }
        return {
            "getRealUrl": getRealUrl,
            "get": function(url, data) {
                return $http.get(getRealUrl(url), {
                    params: data
                });
            },
            "post": function(url, data) {
                return $http.post(getRealUrl(url), data);
            },
            "put": function(url, data) {
                return $http.put(getRealUrl(url), data);
            },
            "remove": function(url, data) {
                return $http["delete"](getRealUrl(url), data);
            }
        };
    }])
    .service("NoteServ", ["HTTP", function(HTTP) {
        var notes = HTTP.get("/notes").then(function(resp) {
            return resp.data;
        }), colors = HTTP.get("/colors").then(function(resp) {
            return resp.data;
        });
        return {
            "getNotes": function() {
                return notes;
            },
            "getColors": function() {
                return colors;
            },
            "save": function(note) {
                return HTTP.put("/note/" + note.id, note);
            },
            "remove": function(note) {
                return HTTP.remove("/note/" + note.id);
            },
            "refresh": function(note) {
                return HTTP.get("/note/" + note.id).then(function(r) {
                    return r.data;
                });
            },
            "create": function() {
                return HTTP.post("/note").then(function(r) {
                    return r.data;
                });
            }
        };
    }])
;
}(jQuery));