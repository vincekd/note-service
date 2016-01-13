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
        function doPromise(prom, notif) {
            return prom.then(function(resp) {
                return resp.data;
            }).finally(function() {
                Notify.removeNetworkActiveRequest(notif);
            });
        }
        return {
            "getRealUrl": getRealUrl,
            "get": function(url, data) {
                var n = Notify.networkActiveRequest();
                return doPromise($http.get(getRealUrl(url), {
                    params: data
                }), n);
            },
            "post": function(url, data) {
                var n = Notify.networkActiveRequest();
                return doPromise($http.post(getRealUrl(url), data), n);
            },
            "put": function(url, data) {
                var n = Notify.networkActiveRequest();
                return doPromise($http.put(getRealUrl(url), data), n);
            },
            "remove": function(url) {
                var n = Notify.networkActiveRequest();
                return doPromise($http["delete"](getRealUrl(url)), n);
            }
        };
    }])
    .service("STOMP", ["HTTP", "$timeout", "$q", function(HTTP, $timeout, $q) {

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
        
        function getRealTopic(topic) {
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

            return [realTopic, namespace];
        }

        return {
            "connect": function() {
                if (!connected) {
                    socket = new SockJS(HTTP.getRealUrl("/registerSocket"));
                    stompClient = Stomp.over(socket);

                    //set heartbeats
                    stompClient.heartbeat.outgoing = 20000;
                    stompClient.heartbeat.ingoing = 20000;

                    //disable the crazy console output
                    stompClient.debug = function() {};

                    //connect
                    stompClient.connect({}, function(frame) {
                        console.log("websocket connected");
                        connected = true;
                        initialRegisterAll();
                    });
                }
            },
            "disconnect": function(fn) {
                //disconnect with callback
                return $q(function(resolve, reject) {
                    stompClient.disconnect(function() {
                        connected = false;
                        resolve();
                    });
                });
            },
            "deregister": function(topic) {
                var t = getRealTopic(topic),
                    realTopic = t[0],
                    namespace = t[1];
                delete namespaces[realTopic][namespace];
                if (connected) {
                    stompClient.unsubscribe(topicBase + realTopic);
                }
            },
            "register": function(topic, callback) {
                if (_.isString(topic) && _.isFunction(callback)) {
                    var t = getRealTopic(topic),
                        realTopic = t[0],
                        namespace = t[1];

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
    .service("Settings", ["HTTP", "STOMP", "$q", function(HTTP, STOMP, $q) {
        var settings = HTTP.get("/settings");
        function get(data, name) {
            return _.find(data, function(setting) {
                return setting.name === name;
            });
        }
        function value(setting) {
            return (setting ? setting.value : null);
        }
        return {
            "get": function(name) {
                return $q(function(resolve, reject) {
                    settings.then(function(data) {
                        resolve(value(get(data, name)));
                    });
                });
            }
        };
    }])
    .service("Popup", ["$q", "$uibModal", function($q, $modal) {
        function getModalParams(type, text, name) {
            return {
                "animation": true,
                "templateUrl": "/templates/popup.html",
                "controller": "PopupCtrl",
                "backdrop": "static",
                "keyboard": false,
                "backdropClass": "sticklet-popup-backdrop",
                "windowClass": "sticklet-popup-window",
                "resolve": {
                    "text": function() { return text; },
                    "type": function() { return type; },
                    "name": function() { return name; }
                }
            };
        }

        function doPopup(type, text, name) {
            var promise = $q(function(resolve, reject) {
                var modalInstance = $modal.open(getModalParams(type, text, name));
                modalInstance.result.then(function(result) {
                    if ((type === "prompt" && typeof(result) === "string") || result === true) {
                        resolve(result);
                    } else {
                        reject(result);
                    }
                });
            });
            return promise;
        }

        return {
            "alert": function(text, name) {
                return doPopup("alert", text, name);
            },
            "confirm": function(text, name) {
                return doPopup("confirm", text, name);
            },
            "prompt": function(text, name) {
                return doPopup("prompt", text, name);
            }
        };
    }])
    .service("ServiceWorker", ["HTTP", "STOMP", "NoteServ", "$route", "$rootScope", "$timeout", "Notify",
                               function(HTTP, STOMP, NoteServ, $route, $rootScope, $timeout, Notify) {
        //TODO: fix this
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
            notification,
            isOnline = true;

        function send(message) {
            navigator.serviceWorker.controller.postMessage(message);
        }
        function setOnline(online) {
            //console.log("setting online", online, isOnline);
            if (isOnline !== online) {
                Notify.remove(notification);
                if (!online) {
                    notification = Notify.add("Cannot connect to sticklet.com...", true);
                }
                isOnline = online;
                //$rootScope.$broadcast("network-status", online, isOnline);
                //$rootScope.$apply();
            }
            if (!online) {
                ping(online);
            }
        }

        function ping(online) {
            if (online) {
                $timeout.cancel(timer);
                timer = null;
                attempts = 0;
                //reconnect websocket
                STOMP.disconnect().then(function() {
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
            //console.log("service worker message", m);
            if (m.data === "online") {
                //setOnline(true);
            } else if (m.data === "offline") {
                //setOnline(false);
            } else {
                console.log("unidentified ServiceWorker message", m.data);
            }
        });

        return ServiceWorker;
    }])
    .service("UserServ", ["HTTP", "STOMP", function(HTTP, STOMP) {
        var user = HTTP.get("/user");
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
    .service("NoteServ", ["HTTP", "STOMP", "Storage", "$rootScope", "$q", "Settings", "Popup",
                          function(HTTP, STOMP, Storage, $rootScope, $q, Settings, Popup) {
        var notes = HTTP.get("/notes").then(function(data) {
                Storage.set("notes", data);
                notify();
                return data;
            }),
            colors = HTTP.get("/colors"),
            topicAdd = ".NoteServ";

        Settings.get("socket.topic.noteCreate").then(function(topic) {
            //websocket callbacks
            STOMP.register(topic + topicAdd, function(note) {
                notes = notes.then(function(data) {
                    data.push(note);
                    return data;
                });
                notesUpdated();
            });
        });

        Settings.get("socket.topic.noteDelete").then(function(topic) {
            STOMP.register(topic + topicAdd, function(noteID) {
                notes = notes.then(function(data) {
                    return data.filter(function(n) {
                        return n.id !== noteID;
                    });
                });
                notesUpdated();
            });
        });
        Settings.get("socket.topic.noteUpdate").then(function(topic) {
            STOMP.register(topic + topicAdd, function(note) {
                notes.then(function(data) {
                    var n = getNote(data, note.id);
                    _.extend(n, note);
                });
                notesUpdated();
            });
        });

        function notesUpdated() {
            notes.then(function(data) {
                Storage.set("notes", data);
            });
            notify();
        }
        function notify() {
            $rootScope.$broadcast("notes-updated");
        }
        function getNote(notes, id) {
            return _.find(notes, function(n) {
                return n.id === id;
            });
        }
        function safe(note) {
            return _.omit(note, ["tags"]);
        }

        return {
            "getNotes": function() {
//                if (notes.$$state.status === 0) {
//                    return $q(function(resolve, reject) {
//                        resolve(Storage.get("notes") || []);
//                    });
//                }
                return notes;
            },
            "getColors": function() {
                return colors;
            },
            "save": function(note) {
                return HTTP.put("/note/" + note.id, safe(note)).catch(function(resp) {
                    if (resp.status === 408) {
                        //TODO: //record
                        console.log("failed to save note with service worker", resp.statusText);
                    }
                });
            },
            "remove": function(note) {
                return $q(function(resolve, reject) {
                    Popup.confirm("Are you sure you wish to delete this note?", "Confirm Delete").then(function() {
                        HTTP.remove("/note/" + note.id).then(function(d) {
                            resolve(d);
                        });
                    }).catch(function() {
                        reject();
                    });
                });
            },
            "archive": function(note) {
                return HTTP.put("/note/archive/" + note.id);
            },
            "archiveAll": function(notes) {
                return HTTP.put("/notes/archive", _.getIDs(notes));
            },
            "removeAll": function(notes) {
                return $q(function(resolve, reject) {
                    Popup.confirm("Are you sure you wish to delete these notes?", "Confirm Delete").then(function() {
                        return HTTP.put("/notes/delete", _.getIDs(notes)).then(function(d) {
                            resolve(d);
                        });
                    }).catch(function() {
                        reject();
                    });
                });
            },
            "saveAll": function(notes) {
                return HTTP.put("/notes", _.map(notes, safe));
            },
            "unarchive": function(note) {
                return HTTP.put("/note/unarchive/" + note.id);
            },
            "restore": function(note) {
                return HTTP.put("/note/restore/" + note.id);
            },
            "refresh": function(note) {
                return HTTP.get("/note/" + note.id);
            },
            "create": function() {
                return HTTP.post("/note");
            },
            "saveFailedNotes": function() {
                console.log("save failed notes");
            }
        };
    }])
    .service("TagServ", ["HTTP", "STOMP", "$rootScope", "Settings",
                         function(HTTP, STOMP, $rootScope, Settings) {
        var tags = HTTP.get("/tags"), 
            topicAdd = ".TagServ";

        //keep tags in sync
        Settings.get("socket.topic.tagCreate").then(function(topic) {
            STOMP.register(topic + topicAdd, function(tag) {
                tags = tags.then(function(data) {
                    data.push(tag);
                    return data;
                });
                notify();
            });
        });
        Settings.get("socket.topic.tagDelete").then(function(topic) {
            STOMP.register(topic + topicAdd, function(tagID) {
                tags = tags.then(function(data) {
                    data = data.filter(function(tag) {
                        return tag.id !== tagID;
                    });
                    return data;
                });
                notify();
            });
        });
        
        function notify() {
            $rootScope.$broadcast("tags-updated");
        }

        return {
            "getTags": function() {
                return tags;
            },
            "remove": function(tag) {
                return HTTP.remove("/tag/" + tag.id);
            },
            "create": function(tag) {
                return HTTP.post("/tag", tag);
            },
            "tag": function(note, tag) {
                return HTTP.put("/tag/" + note.id + "/" + tag.id);
            },
            "untag": function(note, tag) {
                return HTTP.remove("/untag/" + note.id + "/" + tag.id);
            },
            "tagAll": function(notes, tag) {
                return HTTP.put("/tag/" + tag.id, _.getIDs(notes));
            },
            "noteHasTag": function(note, tag) {
                return _.some(note.tags, function(t) {
                    return tag.id === t.id;
                });
            }
        };
    }])
    .service("Archive", ["HTTP", function(HTTP) {
        return {
            "get": function() {
                return HTTP.get("/archive");
            }
        };
    }])
    .service("Trash", ["HTTP", function(HTTP) {
        return {
            "get": function() {
                return HTTP.get("/trash");
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
    .service("FileUploadServ", ["HTTP", "$q", function(HTTP, $q) {
        return {
            "upload": function(file, url, onProg) {
                return $q(function(resolve, reject) {
                    var fd = new FormData(),
                        xhr = new XMLHttpRequest(),
                        promise = $q.defer();
    
                    fd.append("file", file);
                    if (_.isFunction(onProg)) {
                        xhr.upload.addEventListener("progress", onProg, false);
                    }
                    xhr.onreadystatechange = function(ev) {
                        if (xhr.readyState === 4) {
                            if (xhr.status === 200) {
                                resolve(ev);
                            } else {
                                reject(ev);
                            }
                        }
                    };
    
                    xhr.open("POST", url);
                    xhr.send(fd);
                });
            }
        };
    }])
;
}(jQuery));