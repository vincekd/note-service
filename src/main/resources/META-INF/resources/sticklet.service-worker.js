"use strict";

var self = this,
    version = "v0.0.58",
    DEV = true,
    LAST_UPDATE = -1,
    CACHE_NAME = 'sticklet-cache' + '.' + version,
    OFFLINE_CACHE_NAME = "sticklet-offline-cache" + "." + version,
    CACHE_WHITELIST = [CACHE_NAME, OFFLINE_CACHE_NAME],
    fetchOpts = {},
    ignoreRequests = new RegExp(["registerSocket"].join("|")),
    cached = getCached();


//function myFetch(req, opts) {
//    return fetch(req, opts).then(function(resp) {
//        sendMessage("online");
//        return resp;
//    }).catch(function() {
//        sendMessage("offline");
//    });
//}
function sendMessage(msg) {
    self.clients.matchAll().then(function(res) {
        if (!res) {
            return;
        }
        res.forEach(function(client) {
            client.postMessage(msg);
        });
    });
}
function isGet(event) {
    return /GET/i.test(event.request.method);
}
function onCacheError(event) {
    var resp = new Response("", {
        status: 408,
        statusText: "Request timed out"
    });
    return resp;
}
function onGetCacheError(event) {
    return caches.match('/404.html');
}

self.addEventListener('fetch', function(event) {
    function response() {
        return caches.match(event.request, {"cacheName": CACHE_NAME}).then(function(response) {
            if (response) {
                return response;
            }
            return fetch(event.request, fetchOpts).then(function(resp) {
                sendMessage("online");
                if (isGet(event)) {
                    return caches.open(OFFLINE_CACHE_NAME).then(function(cache) {
                        cache.put(event.request, resp.clone());
                        return resp;
                    });
                }
                return resp;
            }).catch(function() {
                sendMessage("offline");
                if (isGet(event)) {
                    return caches.match(event.request, {"cacheName": OFFLINE_CACHE_NAME}).catch(function() {
                        return onGetCacheError(event);
                    });
                }
                return onCacheError(event);
            });
        }).catch(function() {
            console.log("why are we here?", event.request.url);
            return onCacheError(event);
        });
    }

    if (!ignoreRequests.test(event.request.url)) {
        //if (isLibraryReq(event)) {
        event.respondWith(response());
        //} else {
        //    event.respondWith(stickletResponse());
        //}
    }
});


self.addEventListener('message', function(msg) {
    console.log('message from client - ' + msg.data);
});

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

function getCached() {
    return [
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
    ].concat(DEV ? [] : [
       '/index.html', '/404.html', '/templates/notes.html', 
       '/templates/note.html', '/templates/tags.html', 
       '/templates/editable-area.html', '/templates/color-choices.html', 
       '/templates/menu.html', '/templates/settings.html',
       "/less/css/sticklet.css", "/js/sticklet.js",
       "/js/sticklet.controllers.js", "/js/sticklet.services.js", 
       "/js/sticklet.directives.js", "/js/sticklet.filters.js",
       "/js/sticklet.register.js", "/templates/notifications.html",
       "/templates/tags-admin.html"
    ]);
}