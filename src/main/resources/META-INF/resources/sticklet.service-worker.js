"use strict";

var self = this,
    version = "v0.0.92",
    LAST_UPDATE = -1,
    CACHE_NAME = 'sticklet-cache.' + version,
    OFFLINE_CACHE_NAME = "sticklet-offline-cache." + version,
    CACHE_WHITELIST = [CACHE_NAME, OFFLINE_CACHE_NAME],
    fetchOpts = {},
    fileRegex = /\.(?:html|js|css|woff|ttf|map|woff2|otf)$/i;

self.addEventListener('message', onMessage);
self.addEventListener('fetch', function(event) {
    if (isFileGet(event)) {
        //TODO: reenable when not annoying
        //event.respondWith(response(event));
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
            return fetch("/cache.json").then(function(resp) {
                try {
                    return resp.json();
                } catch (err) {
                    console.error(err);
                }
            }).then(function(resp) {
                console.log("service worker installed.");
                sendMessage({
                    "command": "install"
                });
                return cache.addAll(resp.libraries.concat(resp.sticklet));
            });
        });
    }
    event.waitUntil(install());
});
function response(event) {
    return caches.match(event.request, {"cacheName": CACHE_NAME}).then(function(cached) {
        var network = fetch(event.request).then(function(resp) {
            if (resp.status === 200) {
                caches.open(CACHE_NAME).then(function(cache) {
                    cache.put(event.request, resp);
                });
            }
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
