"use strict";

var self = this,
    version = "v0.0.50",
    DEV = true,
    LAST_UPDATE = -1,
    CACHE_NAME = 'sticklet-cache' + '.' + version,
    OFFLINE_CACHE_NAME = "sticklet-offline-cache" + "." + version,
    CACHE_WHITELIST = [CACHE_NAME, OFFLINE_CACHE_NAME],
    CACHE_ALL = false,
    fetchOpts = {},
    ignoreRequests = new RegExp(["registerSocket"].join("|")),
    libraries,
    stickletFiles,
    cached;

libraries = [
    "/bower_components/bootstrap/dist/css/bootstrap.min.css",
    "/bower_components/perfect-scrollbar/min/perfect-scrollbar.min.css",
    "/bower_components/jquery/dist/jquery.min.js",
    "/bower_components/sockjs/sockjs.min.js",
    "/bower_components/stomp-websocket/lib/stomp.min.js",
    "/bower_components/underscore/underscore-min.js",
    "/bower_components/angular/angular.min.js",
    "/bower_components/angular-animate/angular-animate.min.js",
    "/bower_components/angular-route/angular-route.min.js",
    "/bower_components/bootstrap/dist/js/bootstrap.min.js",
    "/bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.woff2",
    "/bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.ttf",
    "/bower_components/bootstrap/dist/css/bootstrap.min.css.map",
    "/bower_components/angular-bootstrap/ui-bootstrap.min.js",
    "/bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js",
    "/bower_components/perfect-scrollbar/min/perfect-scrollbar.min.js",
    "/bower_components/angular-perfect-scrollbar/src/angular-perfect-scrollbar.js",
    "/bower_components/tinymce-dist/tinymce.js",
    "/bower_components/angular-ui-tinymce/src/tinymce.js",
    "/bower_components/tinymce-dist/skins/lightgray/content.min.css",
    "/bower_components/tinymce-dist/themes/modern/theme.js",
    "/bower_components/tinymce-dist/plugins/code/plugin.js",
    "/bower_components/tinymce-dist/skins/lightgray/skin.min.css",
    "/bower_components/tinymce-dist/skins/lightgray/fonts/tinymce.woff"
];
if (DEV) {
    stickletFiles = [];
} else {
    stickletFiles = [
        '/index.html', '/404.html', '/templates/notes.html', 
        '/templates/note.html', '/templates/tags.html', 
        '/templates/editable-area.html', '/templates/color-choices.html', 
        '/templates/menu.html', '/templates/settings.html',
        "/less/css/sticklet.css", "/js/sticklet.js",
        "/js/sticklet.controllers.js", "/js/sticklet.services.js", 
        "/js/sticklet.directives.js", "/js/sticklet.filters.js",
        "/js/sticklet.register.js"
    ];
}
cached = libraries.concat(stickletFiles);

function onCacheError(event) {
    var resp = new Response("", {
        status: 408,
        statusText: "Request timed out"
    });
    //return caches.match('/404.html');
    return resp;
}

self.addEventListener('fetch', function(event) {
    function response() {
        return caches.match(event.request, {"cacheName": CACHE_NAME}).then(function(response) {
            if (response) {
                return response;
            }
            return fetch(event.request, fetchOpts).then(function(resp) {
                return caches.open(OFFLINE_CACHE_NAME).then(function(cache) {
                    cache.put(event.request, resp.clone());
                    return resp;
                });
            }).catch(function() {
                if (/GET/i.test(event.request.method)) {
                    //console.log("Offline or request failed. Supply last cached entry if it exists", event.request.url);
                    return caches.match(event.request, {"cacheName": OFFLINE_CACHE_NAME}).catch(function() {
                        return onCacheError(event);
                    });
                } else {
                    return onCacheError(event);
                }
            });
        }).catch(function() {
            return onCacheError(event);
        });
    }

    if (!ignoreRequests.test(event.request.url)) {
        event.respondWith(response());
    }
});

//self.addEventListener('message', function(msg) {
//    console.log('event from client - ' + msg.data);
//    self.clients.matchAll().then(function(res) {
//        if (!res.length) {
//            console.log("no clients are currently controlled!");
//            return;
//        }
//        res[0].postMessage(msg.data === 'ping' ? 'pong' : msg.data);
//    });
//});

self.addEventListener('activate', function(event) {
    function activate() {
        console.log("service working activating...");
        return caches.keys().then(function(keyList) {
            return Promise.all(keyList.map(function(key, i) {
                if (CACHE_WHITELIST.indexOf(key) === -1) {
                    return caches.delete(keyList[i]);
                }
            }));
        });
    }
    event.waitUntil(activate());
});

self.addEventListener('install', function(event) {
    function install() {
        console.log("installing service worker...");
        LAST_UPDATE = Date.now();
        return caches.open(CACHE_NAME).then(function(cache) {
            console.log("service workebr installed.");
            return cache.addAll(cached);
        });
    }
    event.waitUntil(install());
});

