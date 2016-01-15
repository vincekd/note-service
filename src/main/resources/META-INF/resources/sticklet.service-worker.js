"use strict";

var self = this,
    version = "v0.0.85",
    LAST_UPDATE = -1,
    CACHE_NAME = 'sticklet-cache.' + version,
    OFFLINE_CACHE_NAME = "sticklet-offline-cache." + version,
    CACHE_WHITELIST = [CACHE_NAME, OFFLINE_CACHE_NAME],
    fetchOpts = {},
    fileRegex = /\.(?:html|js|css|woff|ttf|map|woff2|otf)$/i,
    cached = getCached();

self.addEventListener('message', onMessage);
self.addEventListener('fetch', function(event) {
    if (isFileGet(event)) {
        event.respondWith(response(event));
    }
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
        console.log("installing service worker...")
        LAST_UPDATE = Date.now();
        return caches.open(CACHE_NAME).then(function(cache) {
            console.log("service worker installed.");
            sendMessage({
                "command": "install"
            });
            return cache.addAll(cached);
        });
    }
    event.waitUntil(install());
});
function response(event) {
    return caches.match(event.request, {"cacheName": CACHE_NAME}).then(function(cached) {
        var network = fetch(event.request).then(function(resp) {
            caches.open(CACHE_NAME).then(function(cache) {
                cache.put(event.request, resp);
            });
            return resp.clone();
        }, function(err) {
            return new Response('<h1>Service Unavailable</h1>', {
                "status": 503,
                "statusText": 'Service Unavailable',
                "headers": new Headers({
                    "Content-Type": "text/html"
                })
            });
        });
        return cached || network;
    });
}
function onMessage(m) {
    if (m.data.command === "networkStatus") {
        //ONLINE = (m.data.online === true);
    }
}
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
function isFileGet(event) {
    return (/GET/i.test(event.request.method) && fileRegex.test(event.request.url));
}
function getCached() {
    return [
       //library objects
       "/bower_components/bootstrap/dist/css/bootstrap.min.css",
       "/bower_components/perfect-scrollbar/min/perfect-scrollbar.min.css",
       "/bower_components/jquery/dist/jquery.min.js",
       "/bower_components/sockjs/sockjs.min.js",
       "/bower_components/stomp-websocket/lib/stomp.min.js",
       "/bower_components/underscore/underscore-min.js",
       "/bower_components/angular/angular.min.js",
       //"/bower_components/angular-animate/angular-animate.min.js",
       "/bower_components/angular-route/angular-route.min.js",
       "/bower_components/bootstrap/dist/js/bootstrap.min.js",
       "/bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.woff",
       "/bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.woff2",
       "/bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.ttf",
       "/bower_components/open-iconic/font/fonts/open-iconic.woff",
       "/bower_components/open-iconic/font/fonts/open-iconic.otf",
       "/bower_components/bootstrap/dist/css/bootstrap.min.css.map",
       "/bower_components/open-iconic/font/css/open-iconic-bootstrap.min.css",
       "/bower_components/angular-bootstrap/ui-bootstrap.min.js",
       "/bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js",
       "/bower_components/perfect-scrollbar/min/perfect-scrollbar.min.js",
       "/bower_components/angular-perfect-scrollbar/src/angular-perfect-scrollbar.js",
       "/bower_components/wysihtml/dist/wysihtml-toolbar.min.js",
       "/bower_components/wysihtml/parser_rules/advanced.js"
    ].concat([
       //sticklet objects
       '/index.html', '/404.html', '/templates/notes.html', 
       '/templates/note.html', '/templates/tags.html', 
       '/templates/editable-area.html', '/templates/color-choices.html', 
       '/templates/menu.html', "/templates/wysihtml-toolbar.html",
       "/templates/tag-selector.html", "/templates/popup.html",
       "/templates/notifications.html", "/templates/archive.html",
       "/templates/tags-admin.html", '/templates/settings.html',
       "/templates/data.html", "/templates/trash.html", 
       "/less/css/sticklet.css", "/js/sticklet.js",
       "/js/sticklet.controllers.js", "/js/sticklet.services.js",
       "/js/sticklet.directives.js", "/js/sticklet.filters.js",
       "/js/sticklet.factory.js", "/js/sticklet.register.js",
       "/js/wysihtml.js"
    ]);
}