(function($) { "use strict";

var Sticklet = angular.module("Sticklet");

Sticklet
    .service("Notify", ["$timeout", function($timeout) {
        var notifications = [],
            networkActiveRequests = [];
        Notification.requestPermission();
        var Notify = {
            "get": function() {
                return notifications;
            },
            "add": function(msg, permOrRemoveAfter, html5) {
                var n = {"text": msg, "removable": permOrRemoveAfter !== true};
                if (html5 && Notification.permission === "granted") {
                    n.notif = new Notification("", {
                        "body": msg,
                        "icon": null,
                        "tag": msg,
                        "sticky": n.removable
                    });
                }
                notifications.push(n);
                if (typeof permOrRemoveAfter === "number") {
                    $timeout(function() {
                        Notify.remove(n);
                    }, permOrRemoveAfter * 1000);
                }
                return n;
            },
            "remove": function(notification) {
                notifications = _.without(notifications, notification);
                if (notification && notification.notif) {
                    notification.notif.close();
                }
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
        
        return Notify;
    }])
    .service("HTTP", ["$http", "Notify", function($http, Notify) {
        function getRealUrl(url) {
            if (/^[^\/]/.test(url)) {
                url = "/" + url;
            }
            return location.origin + url;
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
    .service("Settings", ["HTTP", "$q", "Offline", function(HTTP, $q, Offline) {
        var settings = getSettings();
        Offline.onNetworkChange("Settings", function() {
            settings = getSettings();
        });

        function getSettings() {
            return Offline.get("/settings");
        }
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
                        var setting = get(data, name);
                        if (!setting) {
                            reject(setting);
                        }
                        resolve(value(setting));
                    });
                });
            }
        };
    }])
    .service("STOMP", ["HTTP", "$timeout", "$q", "network", "Settings", 
                       function(HTTP, $timeout, $q, network, Settings) {

        var stompClient = null,
            socket = null,
            namespaceRegex = /(\/.+)(?:\.([^\/]+))/,
            jsonRegex = /application\/json/,
            topicBase = "/user/topic",
            //topicBase = "/topic",
            namespaces = {},
            subscribed = {},
            attempts = 0,
            retryEvery = 3000,
            maxInterval = 30000,
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

        function onConnect(frame) {
            console.log("websocket connected");
            connected = true;
            attempts = 0;
            network.setOnline();
            initialRegisterAll();
        }
        function onDisconnect(msg) {
            console.log("disconnected", msg);
            reconnect();
            connected = false;
            network.setOffline();
        }
        
        function reconnect() {
            $timeout(function() {
                console.log("attempting socket reconnect", attempts);
                connect();
            }, Math.min(retryEvery * (++attempts), maxInterval));
        }
        
        function register(topic, callback) {
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
            return STOMP;
        }
        function deregister(topic) {
            var t = getRealTopic(topic),
                realTopic = t[0],
                namespace = t[1];
            delete namespaces[realTopic][namespace];
            if (connected) {
                stompClient.unsubscribe(topicBase + realTopic);
            }
            return STOMP;
        }
        function connect() {
            if (!connected) {
                socket = new SockJS(HTTP.getRealUrl("/registerSocket"));
                stompClient = Stomp.over(socket);

                //set heartbeats
                stompClient.heartbeat.outgoing = 20000;
                stompClient.heartbeat.ingoing = 20000;

                //disable the crazy console output
                stompClient.debug = function() {};

                //connect
                stompClient.connect({}, onConnect, onDisconnect);
            }
        }

        var STOMP = {
            "connect": connect,
            "deregister": deregister,
            "register": register,
            "disconnect": function() {
                return $q(function(resolve, reject) {
                    stompClient.disconnect(function() {
                        connected = false;
                        resolve();
                    });
                });
            },
            "deregisterSetting": function(setting, topicAdd) {
                Settings.get("socket.topic." + setting).then(function(topic) {
                    deregister(topic + "." + topicAdd);
                });
                return STOMP;
            },
            "registerSetting": function(setting, topicAdd, callback) {
                Settings.get("socket.topic." + setting).then(function(topic) {
                    register(topic + "." + topicAdd, callback);
                });
                return STOMP;
            }
        };
        
        return STOMP;
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

        function getPopup(settings) {
            return $modal.open(_.extend(getModalParams(), settings));
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
            },
            "popup": getPopup
        };
    }])
    .service("UserServ", ["STOMP", "Offline", function(STOMP, Offline) {
        var user = getUser(),
            namespace = "UserServ";

        function getUser() {
            return Offline.get("/user");
        }
        Offline.onNetworkChange(namespace, function(online) {
            getUser();
        });
        STOMP.registerSetting("userUpdate", namespace, function(u) {
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
    .service("NoteServ", ["HTTP", "STOMP", "$rootScope", "$q", "Offline", "Settings",
                          function(HTTP, STOMP, $rootScope, $q, Offline, Settings) {
        var offlineID = 0,
            notesGet = "/notes",
            notes = getNotes(),
            colors = getColors(),
            namespace = "NoteServ";

        function getNotes() {
            return Offline.get(notesGet).finally(function() {
                notify();
            });
        }
        function getColors() {
            return Settings.get("note.colors");
        }

        //websocket callbacks
        STOMP.registerSetting("noteCreate", namespace, function(note) {
            createNote(note);
        }).registerSetting("noteDelete", namespace, function(noteID) {
            deleteNote(noteID);
        }).registerSetting("noteUpdate", namespace, function(note) {
            updateNote(note);
        });

        //offline sync register
        Offline.onNetworkChange(namespace, function(online) {
            notes = getNotes();
            colors = getColors();
        });

        function getOfflineNoteID() {
            return $q(function(resolve, reject) {
                Settings.get("note.offline.baseName").then(function(base) {
                    console.log("base", base);
                    notes.then(function(ns) {
                        var ids = ns.filter(function(n) { 
                            return n.id.indexOf(base) !== -1;
                        }).map(function(n) { return n.id; });
                        
                        var id = base + (offlineID++);
                        while (ids.indexOf(id) > -1) {
                            id = base + (offlineID++);
                        }
                        resolve(id);
                    });
                });
            });
        }
        function createNote(note, offline) {
            notes = notes.then(function(data) {
                data.push(note);
                storeNotes(data);
                return data;
            });
            notify();
        }
        function deleteNote(noteID) {
            notes = notes.then(function(data) {
                var o = data.filter(function(n) {
                    return n.id !== noteID;
                });
                storeNotes(o);
                return o;
            });
            notify();
        }
        function deleteNotes(noteIds) {
            notes = notes.then(function(data) {
                var o = data.filter(function(n) {
                    return noteIds.indexOf(n.id) < 0;
                });
                storeNotes(o);
                return o;
            });
            notify();
        }
        function updateNote(note) {
            notes.then(function(data) {
                var n = getNote(data, note.id);
                _.extend(n, note);
                storeNotes(data);
            });
            notify();
        }
        function updateNotes(ns) {
            notes.then(function(data) {
                _.each(ns, function(note) {
                    var n = getNote(data, note.id);
                    _.extend(n, note);
                });
                storeNotes(data);
            });
            notify();
        }
        function storeNotes(notes) {
            Offline.storeRequest("get", notesGet, notes);
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

        var Service = {
            "getNotes": function() {
                return notes;
            },
            "getColors": function() {
                return colors;
            },
            "save": function(note) {
                var data = safe(note);
                return Offline.put("/note/" + note.id, data).then(function() {
                    updateNote(note);
                }).catch(function(msg) {
                    if (msg === "offline") {
                        //Store offline for sync
                        Offline.sync("note." + note.id + ".update", data);
                        updateNote(note);
                    }
                });
            },
            "remove": function(note) {
                return $q(function(resolve, reject) {
                    Offline.remove("/note/" + note.id).then(function(d) {
                        deleteNote(note.id);
                        resolve(d);
                    }).catch(function(msg) {
                        if (msg === "offline") {
                            Offline.sync("note." + note.id + ".delete", true);
                            deleteNote(note.id);
                        }
                    });
                });
            },
            "archive": function(note) {
                return Offline.put("/note/archive/" + note.id).catch(function(msg) {
                    if (msg === "offline") {
                        Offline.sync("note." + note.id + ".archive", true);
                        note.archived = true;
                        updateNote(note);
                    }
                });
            },
            "archiveAll": function(notes) {
                var data = _.getIDs(notes);
                return Offline.put("/notes/archive", data).catch(function(msg) {
                    if (msg === "offline") {
                        _.each(notes, function(note) {
                            note.archived = true;
                            Offline.sync("note." + note.id + ".archive", true);
                        });
                        updateNotes(notes);
                    }
                });
            },
            "removeAll": function(notes) {
                return $q(function(resolve, reject) {
                    var data = _.getIDs(notes);
                    Offline.put("/notes/delete", data).then(function(d) {
                        resolve(d);
                    }).catch(function(msg) {
                        if (msg === "offline") {
                            _.each(notes, function(note) {
                                Offline.sync("note." + note.id + ".delete", true);
                            });
                            deleteNotes(data);
                            resolve(data);
                        }
                    });
                });
            },
            "saveAll": function(notes) {
                var data = _.map(notes, safe);
                return Offline.put("/notes", data).catch(function(msg) {
                    if (msg === "offline") {
                        _.each(notes, function(note) {
                            Offline.sync("note." + note.id + ".update", note);
                        });
                        updateNotes(data);
                    }
                });
            },
            "unarchive": function(note) {
                return HTTP.put("/note/unarchive/" + note.id);
            },
            //restore from trash
            "restore": function(note) {
                return HTTP.put("/note/restore/" + note.id);
            },
            "refresh": function(note) {
                return HTTP.get("/note/" + note.id);
            },
            "create": function() {
                return Offline.post("/note").catch(function(msg) {
                    if (msg === "offline") {
                        getOfflineNoteID().then(function(id) {
                            var now = Date.now();
                            createNote({
                                "id": id,
                                "created": now,
                                "updated": now,
                                "titleEdited": false,
                                "tags": []
                            }, true);
                            Offline.sync("note." + id + ".create", id);
                        });
                    }
                });
            },
            "updateNote": updateNote,
            "updateNotes": updateNotes
        };
        return Service;
    }])
    .service("TagServ", ["HTTP", "STOMP", "$rootScope", "$q", "Offline", "NoteServ",
                         function(HTTP, STOMP, $rootScope, $q, Offline, NoteServ) {
        var tagsGet = "/tags",
            tags = getTags(),
            namespace = "TagServ";

        function getTags() {
            return Offline.get(tagsGet).finally(function() {
                notify();
            });
        }
        Offline.onNetworkChange("TagServ", function(online) {
            tags = getTags();
        });

        //keep tags in sync
        STOMP.registerSetting("tagCreate", namespace, function(tag) {
            tags = tags.then(function(data) {
                data.push(tag);
                return data;
            });
            notify();
        }).registerSetting("tagDelete", namespace, function(tagID) {
            tags = tags.then(function(data) {
                data = data.filter(function(tag) {
                    return tag.id !== tagID;
                });
                return data;
            });
            notify();
        });
        function notify() {
            $rootScope.$broadcast("tags-updated");
        }
        function tagNote(note, tag) {
            note.tags.push(tag);
            NoteServ.updateNote(note);
        }
        function untagNote(note, tag) {
            note.tags = note.tags.filter(function(t) {
                return t.id !== tag.id;
            });
            NoteServ.updateNote(note);
        }
        function tagNotes(notes, tag) {
            _.each(notes, function(n) {
                n.tags.push(tag);
            });
            NoteServ.updateNotes(notes);
        }
        function getStoreData(note, tag) {
            return { "note": { "id": note.id }, "tag": { "id": tag.id } };
        }
        function fromData(data) {
            var tags = {};
            _.each(data, function(d) {
                if (!tags[d.tag.id]) {
                    tags[d.tag.id] = [];
                }
                tags[d.tag.id].push(d.note);
            });
            return tags;
        }

        var TagServ = {
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
                return Offline.put("/tag/" + note.id + "/" + tag.id).catch(function(msg) {
                    if (msg === "offline") {
                        Offline.sync("note." + note.id + ".tag." + tag.id, true);
                        tagNote(note, tag);
                    }
                });
            },
            "untag": function(note, tag) {
                return Offline.remove("/untag/" + note.id + "/" + tag.id).catch(function(msg) {
                    if (msg === "offline") {
                        Offline.sync("note." + note.id + ".tag." + tag.id, false);
                        untagNote(note, tag);
                    }
                });
            },
            "tagAll": function(notes, tag) {
                var data = _.getIDs(notes);
                return Offline.put("/tag/" + tag.id, data).catch(function(msg) {
                    if (msg === "offline") {
                        _.each(notes, function(note) {
                            Offline.sync("note." + note.id + ".tag." + tag.id, true);
                        });
                        tagNotes(notes, tag);
                    }
                });
            },
            "archiveTaggedNotes": function(tag) {
                return HTTP.put("/tag/archive/" + tag.id);
            },
            "deleteTaggedNotes": function(tag) {
                return HTTP.remove("/tag/delete/" + tag.id);
            },
            "noteHasTag": function(note, tag) {
                return _.some(note.tags, function(t) {
                    return tag.id === t.id;
                });
            }
        };
        return TagServ;
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
    .service("FileUploadServ", ["HTTP", "$q", function(HTTP, $q) {
        return {
            "upload": function(file, url, onProg) {
                return $q(function(resolve, reject) {
                    var fd = new FormData(),
                        xhr = new XMLHttpRequest();
    
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
    .service("Offline", ["$rootScope", "network", "$q", "HTTP", "$http", "ServiceWorker",
                         function($rootScope, network, $q, HTTP, $http, ServiceWorker) {

        var registers = {};

        $rootScope.$on("network-state-change", function($event) {
            runCachedRequests().finally(function() {
                _.each(registers, function(fn, p) {
                    try {
                        fn.call(null, network.online);
                    } catch(err) { console.error(err); }
                });
            });
        });

        function runCachedRequests() {
            return $q(function(resolve, reject) {
                if (network.online && ServiceWorker.enabled) {
                    return $http.put("/serviceworker/do-sync", {
                        "url": HTTP.getRealUrl("/notes/sync"),
                        "method": "PUT"
                    }).then(function(resp) {
                        if (resp.status === 200) {
                            resolve(resp.data);
                        } else {
                            reject(resp);
                        }
                    }, function(err) {
                        reject(err);
                    });
                } else {
                    reject();
                }
            });
        }

        var Offline = {
            "sync": function(path, data) {
                if (ServiceWorker.enabled) {
                    return $http.put("/serviceworker/sync", {
                        "path": path,
                        "data": data
                    });
                } 
                return $q.when("no service worker");
            },
            "onNetworkChange": function(path, callback) {
                if (_.isString(path) && _.isFunction(callback)) {
                    registers[path] = callback;
                }
                return Offline;
            },
            "storeRequest": function(method, url, data) {
                if (method && url) {
                    $http.put("/serviceworker/update-cache", {
                        "method": method,
                        "url": HTTP.getRealUrl(url),
                        "data": data
                    });
                }
            },
            "get": function(url) {
                return $http({
                    "method": "GET",
                    "url": HTTP.getRealUrl(url),
                    "headers": {
                        "sticklet-cache": (network.online ? "get-store" : "get-fetch")
                    }
                }).then(function(resp) {
                    return resp.data
                });
            },
            "put": function(url, data) {
                if (network.online) {
                    return HTTP.put(url, data);
                }
                return $q(function(resolve, reject) {
                    reject("offline");
                });
            },
            "post": function(url, data) {
                if (network.online) {
                    return HTTP.post(url, data);
                }
                return $q(function(resolve, reject) {
                    reject("offline");
                });
            },
            "remove": function(url, data) {
                if (network.online) {
                    return HTTP.remove(url);
                }
                return $q(function(resolve, reject) {
                    reject("offline");
                });
            }
        };

        return Offline;
    }])
;
}(jQuery));
