(function($) { "use strict";

var Sticklet = angular.module("Sticklet");

Sticklet
    .service("Notify", [function() {
        var notifications = [],
            networkActiveRequests = [];
        return {
            "get": function() {
                return notifications;
            },
            "add": function(msg, perm) {
                var n = {"text": msg, "removable": !perm};
                notifications.push(n);
                return n;
            },
            "remove": function(notification) {
                notifications = _.without(notifications, notification);
            },
            "getNet": function() {
                return networkActiveRequests;
            },
            "networkActiveRequest": function() {
                var n = {};
                networkActiveRequests.push(n);
                return n;
            },
            "removeNetworkActiveRequest": function(n) {
                networkActiveRequests = _.without(networkActiveRequests, n);
            }
        };
    }])
    .service("HTTP", ["$http", "Notify", function($http, Notify) {
        function getRealUrl(url) {
            if (/^[^\/]/.test(url)) {
                return "/" + url;
            }
            return url;
        }
        return {
            "getRealUrl": getRealUrl,
            "get": function(url, data) {
                var n = Notify.networkActiveRequest();
                return $http.get(getRealUrl(url), {
                    params: data
                }).finally(function() {
                    Notify.removeNetworkActiveRequest(n);
                });
            },
            "post": function(url, data) {
                var n = Notify.networkActiveRequest();
                return $http.post(getRealUrl(url), data).finally(function() {
                    Notify.removeNetworkActiveRequest(n);
                });
            },
            "put": function(url, data) {
                var n = Notify.networkActiveRequest();
                return $http.put(getRealUrl(url), data).finally(function() {
                    Notify.removeNetworkActiveRequest(n);
                });
            },
            "remove": function(url, data) {
                var n = Notify.networkActiveRequest();
                return $http["delete"](getRealUrl(url), data).finally(function() {
                    Notify.removeNetworkActiveRequest(n);
                });
            }
        };
    }])
    .service("STOMP", ["HTTP", "$timeout", function(HTTP, $timeout) {

        var stompClient = null,
            socket = null,
            namespaceRegex = /(\/.+)(?:\.([^\/]+))/,
            jsonRegex = /application\/json/,
            //topicBase = "/user/topic",
            topicBase = "/topic",
            namespaces = {},
            subscribed = {},
            connected = false,
            sendBase = "/socket"
        ;

        function initialRegisterAll() {
            _.each(namespaces, function(callbacks, topic) {
                stompClient.subscribe(topicBase + topic, function(data) {
                    executeCallbacks(namespaces[topic], data);
                });
            });
        }

        function executeCallbacks(callbacks, data) {
            var json = data.body;
            if (jsonRegex.test(data.headers["content-type"])) {
                try {
                    json = JSON.parse(data.body);
                } catch (err) {
                    console.warn("error parsing json", data.body);
                    json = data.body;
                }
            }

            _.each(callbacks, function(fn) {
                if (typeof fn === "function") {
                    fn.call(null, json);
                }
            });
        }

        return {
            "connect": function() {
                if (!connected) {
                    socket = new SockJS(HTTP.getRealUrl("/registerSocket"));
                    stompClient = Stomp.over(socket);

                    stompClient.heartbeat.outgoing = 20000;
                    stompClient.heartbeat.ingoing = 20000;

                    //disable the crazy console output
                    stompClient.debug = function() {};

                    stompClient.connect({}, function(frame) {
                        console.log("websocket connected");
                        connected = true;
                        initialRegisterAll();
                    });
                }
            },
            "disconnect": function(fn) {
                stompClient.disconnect(function() {
                    connected = false;
                    _.isFunction(fn) && fn.call(null);
                });
            },
            "deregister": function(topic) {
                var realTopic, namespace;
                if (namespaceRegex.test(topic)) {
                    var match = topic.match(namespaceRegex),
                    realTopic = match[1];
                    namespace = match[2];
                } else {
                    realTopic = topic;
                    namespace = "default";
                }

                if (!namespaces[realTopic]) {
                    namespaces[realTopic] = {};
                }
                delete namespaces[realTopic][namespace];
                if (connected) {
                    stompClient.unsubscribe(topicBase + realTopic);
                }
            },
            "register": function(topic, callback) {
                if (_.isString(topic) && _.isFunction(callback)) {
                    var realTopic, namespace;
                    if (namespaceRegex.test(topic)) {
                        var match = topic.match(namespaceRegex),
                        realTopic = match[1];
                        namespace = match[2];
                    } else {
                        realTopic = topic;
                        namespace = "default";
                    }

                    if (!namespaces[realTopic]) {
                        namespaces[realTopic] = {};
                    }
                    namespaces[realTopic][namespace] = callback;

                    if (connected && !subscribed[topicBase + realTopic]) {
                        stompClient.subscribe(topicBase + realTopic, function(data) {
                            executeCallbacks(namespaces[realTopic], data);
                        });
                        subscribed[topicBase + realTopic] = true;
                    }
                }
            }
        };
    }])
    .service("ServiceWorker", ["HTTP", "STOMP", "NoteServ", "$route", "_globals", "$rootScope", "$timeout", "Notify",
                               function(HTTP, STOMP, NoteServ, $route, _globals, $rootScope, $timeout, Notify) {
        var ServiceWorker;
        if ('serviceWorker' in navigator) {
            ServiceWorker = {
                "message": function(message) {
                    send(message);
                },
                "onMessage": function(name, callback) {
                    if (_.isFunction(callback)) {
                        msgHandlers[name] = callback
                    }
                }
            };
            navigator.serviceWorker.addEventListener("message", function(e) {
                _.each(msgHandlers, function(fn) {
                    fn.call(null, e);
                });
            });
        } else {
            ServiceWorker = {
                "message": function(message) {},
                "onMessage": function(name, callback) {}
            };
        }
        var msgHandlers = {},
            attempts = 0,
            delay = 3000,
            timer,
            notification;

        function send(message) {
            navigator.serviceWorker.controller.postMessage(message);
        }
        function setOnline(online) {
            if (!online || !_globals.online) {
                var orig = _globals.online;
                _globals.setOnline(online);
                ping(online);
                if (online !== orig) {
                    Notify.remove(notification);
                    if (!online) {
                        notification = Notify.add("Cannot connect to sticklet.com...", true);
                    }
                    $rootScope.$apply();
                }
            }
        }
        function ping(online) {
            if (online) {
                $timeout.cancel(timer);
                timer = null;
                attempts = 0;
                //reconnect websocket
                STOMP.disconnect(function() {
                    STOMP.connect();
                });
                //save all edited notes
                NoteServ.saveFailedNotes();
                //reload scopes
                $route.reload();
            } else if (!timer) {
                timer = $timeout(function() {
                    console.log("pinging server, attempt: ", attempts + 1);
                    timer = null;
                    HTTP.get("/ping");
                }, (delay * attempts));
                attempts++;
            }
        }

        //server worker online settings
        ServiceWorker.onMessage("ServiceWorker", function(m) {
            if (m.data === "online") {
                setOnline(true);
            } else if (m.data === "offline") {
                setOnline(false);
            } else {
                console.log("unidentified ServiceWorker message", m.data);
            }
        });

        return ServiceWorker;
    }])
    .service("UserServ", ["HTTP", "STOMP", function(HTTP, STOMP) {
        var user = HTTP.get("/user").then(function(resp) {
            return resp.data;
        });
        STOMP.register("/userUpdated.UserServ", function(u) {
            user = user.then(function(us) {
                _.extend(us, u);
                return us;
            });
        });
        return {
            "getUser": function() {
                return user;
            }
        };
    }])
    .service("NoteServ", ["HTTP", "STOMP", "Storage", function(HTTP, STOMP, Storage) {
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
                return HTTP.put("/note/" + note.id, _.omit(note, ["tags"])).catch(function(resp) {
                    if (resp.status === 408) {
                        //TODO: //record
                        console.log("failed to save note with service worker", resp.statusText);
                    }
                });
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
                return HTTP.post("/note").then(function(resp) {
                    return resp.data;
                });
            },
            "saveFailedNotes": function() {
                console.log("save failed notes");
            }
        };
    }])
    .service("TagServ", ["HTTP", "STOMP", "_globals", function(HTTP, STOMP, _globals) {
        var tags = HTTP.get("/tags").then(function(resp) {
            return resp.data;
        }), 
            topicAdd = ".TagServ";

        //keep tags in sync
        STOMP.register(_globals.tagCreateTopic + topicAdd, function(tag) {
            tags = tags.then(function(data) {
                data.push(tag);
                return data;
            });
        });
        STOMP.register(_globals.tagCreateTopic + topicAdd, function(tagID) {
            tags = tags.then(function(data) {
                data = data.filter(function(tag) {
                    return tag.id !== tagID;
                });
                return data;
            });
        });

        return {
            "getTags": function() {
                return tags;
            },
            "remove": function(tag) {
                return HTTP.remove("/tag/" + tag.id);
            },
            "create": function(tag) {
                return HTTP.post("/tag", tag).then(function(resp) {
                    return resp.data;
                });
            },
            "tag": function(note, tag) {
                return HTTP.put("/tag/" + note.id + "/" + tag.id);
            },
            "untag": function(note, tag) {
                return HTTP.remove("/untag/" + note.id + "/" + tag.id);
            }
        };
    }])
    .service("Storage", [function() {
        var storage = window.localStorage,
            name = "sticklet",
            obj = get();

        function get() {
            return JSON.parse(storage.getItem(name) || "{}");
        }
        function set() {
            storage.setItem(name, JSON.stringify(obj));
        }

        return {
            "set": function(path, val) {
                //pass object of key/value pairs
                if (_.isObject(path)) {
                    _.each(path, function(v, k) {
                        _.val(obj, k, v);
                    });
                } else {
                    _.val(obj, path, val);
                }
                set();
            },
            "get": function(path) {
                return _.val(obj, path);
            }
        };
    }])
;
}(jQuery));