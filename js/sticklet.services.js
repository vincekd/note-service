(function($) { "use strict";

var Sticklet = angular.module("Sticklet"),
    colors = ["#F7977A", "#C5E3BF", "#c1F0F6", "#FFF79A", "#FDC68A", "#D8BFD8"];

Sticklet
    .service("HTTP", ["$http", "$q", function($http, $q) {
        //TODO: remove
        //create fake data
        var tag = {"id": 1, "name": "Tag 1"};
        var fakeNotes = [];
        var d = Date.now();
        for (var i = 0; i < 50; i++) {
            fakeNotes.push({
                "id": i + 1,
                "created": (d - (1000 * 60 * 60 * i)),
                "updated": (d - (1000 * 60 * i)),
                "title": "Title " + i,
                "tags": (i % 6 ? [tag] : []),
                "content": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue " +
                    "ligula ac quam viverra nec consectetur ante hendrerit. Donec et mollis dolor. Praesent et diam eget libero egestas mattis sit amet " +
                    "vitae augue. Nam tincidunt congue enim, ut porta lorem lacinia consectetur. Donec ut libero sed arcu vehicula ultricies a non tortor. " +
                    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean ut gravida lorem. Ut turpis felis, pulvinar a semper sed, adipiscing " +
                    "id dolor. Pellentesque auctor nisi id magna consequat sagittis. Curabitur dapibus enim sit amet elit pharetra tincidunt feugiat nisl " +
                    "imperdiet. Ut convallis libero in urna ultrices accumsan. Donec sed odio eros. Donec viverra mi quis quam pulvinar at malesuada arcu " +
                    "rhoncus. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In rutrum accumsan ultricies. Mauris " +
                    "vitae nisi at sem facilisis semper ac in est.Vivamus fermentum semper porta. Nunc diam velit, adipiscing ut tristique vitae, sagittis " +
                    "vel odio. Maecenas convallis ullamcorper ultricies. Curabitur ornare, ligula semper consectetur sagittis, nisi diam iaculis velit, " +
                    "id fringilla sem nunc vel mi. Nam dictum, odio nec pretium volutpat, arcu ante placerat erat, non tristique elit urna et turpis. " +
                    "Quisque mi metus, ornare sit amet fermentum et, tincidunt et orci. Fusce eget orci a orci congue vestibulum. Ut dolor diam, elementum " +
                    "et vestibulum eu, porttitor vel elit. Curabitur venenatis pulvinar tellus gravida ornare. Sed et erat faucibus nunc euismod ultricies " +
                    "ut id justo. Nullam cursus suscipit nisi, et ultrices justo sodales nec. Fusce venenatis facilisis lectus ac semper. Aliquam at massa " +
                    "ipsum. Quisque bibendum purus convallis nulla ultrices ultricies. Nullam aliquam, mi eu aliquam tincidunt, purus velit laoreet tortor, " +
                    "viverra pretium nisi quam vitae mi. Fusce vel volutpat elit. Nam sagittis nisi dui."
            });
        }

        function getRealUrl(url) {
            if (/^\//.test(url)) {
                return "www.sticklet.com" + url;
            }
            return url;
        }
        return {
            "getRealUrl": getRealUrl,
            "get": function(url, data) {
                //TODO: remove this
                var d = $q.defer();
                if (url === "/notes") {
                    d.resolve(fakeNotes);
                } else if (url === "/colors") {
                    d.resolve(colors);
                }
                return d.promise;

//                return $http.get(getRealUrl(url), {
//                    params: data
//                });
            },
            "post": function(url, data) {
                //return $http.post(getRealUrl(url), data);
            },
            "put": function(url, data) {
                //return $http.put(getRealUrl(url), data);
            },
            "remove": function(url, data) {
                //return $http["delete"](getRealUrl(url), data);
            }
        };
    }])
    .service("NoteServ", ["HTTP", function(HTTP) {
        return {
            "getNotes": function() {
                return HTTP.get("/notes");
            },
            "getColors": function() {
                return HTTP.get("/colors");
            },
            "save": function(note) {
                return HTTP.put("/note/" + note.id, note);
            },
            "remove": function(note) {
                return HTTP.remove("/note/" + note.id);
            },
            "refresh": function(note) {
                return HTTP.get("/note/" + note.id);
            },
            "create": function() {
                return HTTP.post("/note");
            }
        };
    }])
;
}(jQuery));