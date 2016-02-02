"use strict";

self.importScripts('/bower_components/localforage/dist/localforage.min.js');

var VERSION = "v0.1.47",
    CACHED_STORAGE_NAME = "sticklet.cache",
    SYNCED_STORAGE_NAME = "sticklet.sync",
    CACHE_NAME = 'sticklet-cache.' + VERSION,
    SECONDARY_CACHE_NAME = 'sticklet-secondary-cache.' + VERSION,
    OFFLINE_CACHE_NAME = "sticklet-offline-cache." + VERSION,
    CACHE_WHITELIST = [CACHE_NAME, SECONDARY_CACHE_NAME, OFFLINE_CACHE_NAME],
    fetchOpts = {"credentials": "include"},
    fileRegex = /\.(?:html|js|less|css|woff|ttf|map|woff2|otf|ico)$/i,
    uriRegex = /https?:\/\/[^\/]+(\/[^#?]*).*/i;

self.addEventListener('message', onMessage);
self.addEventListener('fetch', function(event) {
    var uri = getUri(event.request.url);
    if (uri.indexOf("/registerSocket") === -1 && uri.indexOf("/authenticate") === -1) {
        var ret = new Promise(function(resolve, reject) {
            //get cached uri to determine how to treat different things
            localforage.getItem(CACHED_STORAGE_NAME).then(function(cached) {
                if (isFileGet(event.request.method, uri)) {
                    if (cached.indexOf(uri) !== -1) {
                        //return from catch, don't refetch
                        return doPromise(getFromCache(event));
                    } else {
                        //return cache if available, but still fetch ('eventually fresh')
                        return doPromise(eventuallyFresh(event));
                    }
                } else if (event.request.headers.has("sticklet-cache")) {
                    //neither in cache nor get, check headers for sticklet cache header
                    return doPromise(stickletCache(event));
                } else if (uri.indexOf("/serviceworker") > -1) {
                    return doPromise(serviceWorkerRequest(event, uri));
                }
                return doPromise(myFetch(event));
            }, function() {
                console.warn("error opening localforage", event.url);
                reject(getErrorResp("could not open localforage storage"));
            });
            function doPromise(prom) {
                prom.then(function(resp) {
                    resolve(resp);
                }, function(err) {
                    console.warn("error fetching", event.request.url, uri, err);
                    resolve(getErrorResp("failed to find or fetch", event.request.url));
                });
            }
        });
        event.respondWith(ret);
    } else {
        //console.log("skipping ServiceWorker intercept for: ", event.request.url);
    }
});
self.addEventListener('activate', function(event) {
    function activate() {
        console.info("service working activating...");
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
        console.info("installing service worker...")
        return caches.open(CACHE_NAME).then(function(cache) {
            var req = new Request("cache.json", {
                "method": "GET",
                "cache": "no-store"
            });
            return fetch(req, fetchOpts).then(function(resp) {
                return resp.json().then(function(r) {
                    return r;
                }, function(err) {
                    console.error("error parsing json", err);
                });
            }).then(function(resp) {
                //sendMessage({
                //    "command": "install"
                //});
                var toCache = resp.libraries.concat(resp.sticklet) || [];
                localforage.setItem(CACHED_STORAGE_NAME, toCache);
//                return caches.open(CACHE_NAME).then(function(cache) {
//                    return cache.addAll(toCache);
//                }).then(function(d) {
//                    console.info("service worker installed");
//                });
                return Promise.all(toCache.filter(function(res) {
                    var req = new Request(res, {
                        "method": "GET",
                        "cache": "no-store"
                    });
                    return fetch(req).then(function(resp) {
                        if (resp.status === 200) {
                            return caches.open(CACHE_NAME).then(function(cache) {
                                cache.put(req, resp);
                            });
                        }
                        console.warn("failed cache:", req.url, resp.status);
                        return null;
                    });
                })).then(function() {
                    console.info("service worker installed.");
                });
            });
        });
    }
    self.skipWaiting();
    event.waitUntil(install());
});


function myFetch(event) {
    return fetch(event.request, fetchOpts);
}
function getFromCache(event) {
    return caches.match(event.request, {"cacheName": CACHE_NAME}).then(function(cachedResp) {
        if (!cachedResp) {
            console.warn("failed to locate in cache", event.request.url);
            return myFetch(event).then(function(resp) {
                if (resp.status === 200) {
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, resp);
                    });
                }
                return resp.clone();
            }, function(err) {
                return getErrorResp(err);
            });
        }
        return cachedResp;
    });
}
function eventuallyFresh(event) {
    return caches.match(event.request, {"cacheName": SECONDARY_CACHE_NAME}).then(function(cachedResp) {
        var network = myFetch(event).then(function(resp) {
            if (resp.status === 200) {
                caches.open(SECONDARY_CACHE_NAME).then(function(cache) {
                    cache.put(event.request, resp);
                });
            }
            return resp.clone();
        }, function(err) {
            return getErrorResp(err);
        });
        return cachedResp || network;
    });
}
function stickletCache(event) {
    var head = event.request.headers.get("sticklet-cache");
    if (head === "get-store") {
        return myFetch(event).then(function(resp) {
            if (resp.status === 200) {
                caches.open(OFFLINE_CACHE_NAME).then(function(cache) {
                    cache.put(event.request, resp);
                });
            }
            return resp.clone();
        }, function(err) {
            getErrorResp("failed to fetch request");
        });
    } else if (head === "get-fetch") {
        //TODO: could also try to make request, even if we're supposedly offline (eventually fresh)
        var errorMsg = "could not locate item in cache";
        return caches.match(event.request, {"cacheName": OFFLINE_CACHE_NAME}).then(function(cachedResp) {
            return cachedResp || getErrorResp(errorMsg);
        }, function() {
            return getErrorResp(errorMsg);
        });
    }
    return getErrorResp("invalid sticklet-cache value");
}
function serviceWorkerRequest(event, uri) {
    return localforage.getItem(SYNCED_STORAGE_NAME).then(function(syncObj) {
        syncObj = syncObj || {};
        return event.request.json().then(function(data) {
            if (uri === "/serviceworker/sync") {
                getVal(syncObj, data.path, data.data)
                localforage.setItem(SYNCED_STORAGE_NAME, syncObj);
                return getOKResp("sync stored");
            } else if (uri === "/serviceworker/do-sync") {
                if (Object.keys(syncObj).length === 0) {
                    return getOKResp("no requests to sync");
                }

                var req = new Request(data.url, {
                    "method": data.method,
                    "cache": "default",
                    "headers": new Headers({
                        "Content-Type": "application/json;charset=utf-8"
                    }),
                    "body": JSON.stringify(syncObj)
                });

                return fetch(req, fetchOpts).then(function(resp) {
                    if (resp.status === 200) {
                        localforage.setItem(SYNCED_STORAGE_NAME, {});
                    }
                    return resp;
                }, function() {
                    return getErrorResp("failed to sync requests to server");
                });
            } else if (uri === "/serviceworker/update-cache") {
                var req = new Request(data.url, {
                    "method": data.method
                });
                var resp = new Response(JSON.stringify(data.data), {
                    "status": 200,
                    "statusText": "OK",
                    "headers": new Headers({
                        "Content-Type": "application/json"
                    })
                });
                return caches.open(OFFLINE_CACHE_NAME).then(function(cache) {
                    cache.put(req, resp);
                    return getOKResp("cache updated");
                });
            }
            return getErrorResp("invalid serviceworker request: " + uri);
        }, function() {
            return getErrorResp("failed to load request json");
        });
    });
}
function onMessage(m) {
//    console.log("message from client", m.data);
//    if (m.data.command === "networkStatus") {
//        //ONLINE = (m.data.online === true);
//    }
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
function isFileGet(method, uri) {
    return method === "GET" && (uri === "/" || fileRegex.test(uri));
}
function getUri(url) {
    return url.replace(uriRegex, "$1");
}
function getOKResp(statusText) {
    return new Response('{}', {
        "status": 200,
        "statusText": (statusText || "OK"),
        "headers": new Headers({
            "Content-Type": "application/json"
        })
    });
}
function getHtmlErrorResp(statusText) {
    return new Response('<h1>Service Unavailable</h1>', {
        "status": 503,
        "statusText": statusText || 'Service Unavailable',
        "headers": new Headers({
            "Content-Type": "text/html"
        })
    });
}
function getErrorResp(statusText) {
    return new Response('{}', {
        "status": 503,
        "statusText": statusText || "Service Unavailable",
        "headers": new Headers({
            "Content-Type": "application/json"
        })
    });
}
function getVal(context, name, value) {
    var create = (typeof value !== "undefined"),
        namespaces = name.split("."),
        last = namespaces.pop();

    if (!context) {
        return context;
    }

    for (var i = 0; i < namespaces.length; i++) {
        var ns = namespaces[i];
        if (Object.prototype.hasOwnProperty.call(context, ns) && context[ns]) {
            context = context[ns];
        } else if (create) {
            context = context[ns] = {};
        } else {
            return void(0);
        }
    }

    if (create) {
        context[last] = value;
        return context;
    }
    return ((context !== null && typeof context !== "undefined") ? context[last] : void(0));
}
