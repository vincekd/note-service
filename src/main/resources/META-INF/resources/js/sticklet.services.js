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
            //topicBase = "/user/topic",
            topicBase = "/topic",
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
            "registerSetting": function(setting, topicAdd, callback) {
                Settings.get("socket.topic." + setting).then(function(topic) {
                    register(topic + "." + topicAdd, callback);
                });
                return STOMP;
            },
            "register": register
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
    .service("ServiceWorker", [function() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener("message", function(e) {
                console.log("ServiceWorker message", e);
            });
        }
        return {};
    }])
    .service("UserServ", ["STOMP", "Offline",
                          function(STOMP, Offline) {
        var user = getUser(),
            namespace = "UserServ";

        function getUser() {
            return Offline.get("/user", {});
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
    .service("NoteServ", ["HTTP", "STOMP", "$rootScope", "$q", "Popup", "Offline",
                          function(HTTP, STOMP, $rootScope, $q, Popup, Offline) {
        var notesGet = "/notes",
            colorsGet = "/colors",
            notes = getNotes(),
            colors = getColors(),
            namespace = "NoteServ";

        function getNotes() {
            return Offline.get(notesGet).finally(function() {
                notify();
            });
        }
        function getColors() {
            return Offline.get(colorsGet);
        }

        //websocket callbacks
        STOMP.registerSetting("noteCreate", namespace, function(note) {
            createNote(note);
        }).registerSetting("noteDelete", namespace, function(noteID) {
            deleteNote(noteID);
        }).registerSetting("noteUpdate", namespace, function(note) {
            updateNote(note);
        });

        //offline sync callbacks
        Offline.onSync("note", function(data) {
            return Service.saveAll(data);
        }).onSync("delete-note", function(data) {
            var notes = _.map(data, function(del, id) {
                return { "id": id };
            });
            return Service.removeAll(notes, false);
        }).onSync("archive-note", function(data) {
            var notes = _.map(data, function(arch, id) {
                return { "id": id };
            });
            return Service.archiveAll(notes);
        }).onNetworkChange("noteServ", function(online) {
            notes = getNotes();
            colors = getColors();
        });

        function createNote(note) {
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
                        Offline.sync("note." + note.id, data);
                        updateNote(note);
                    }
                });
            },
            "remove": function(note) {
                return $q(function(resolve, reject) {
                    Popup.confirm("Are you sure you wish to delete this note?", "Confirm Delete").then(function() {
                        Offline.remove("/note/" + note.id).then(function(d) {
                            deleteNote(note.id);
                            resolve(d);
                        }).catch(function(msg) {
                            if (msg === "offline") {
                                Offline.sync("delete-note." + note.id, true);
                                deleteNote(note.id);
                            }
                        });
                    }).catch(function() {
                        reject();
                    });
                });
            },
            "archive": function(note) {
                return Offline.put("/note/archive/" + note.id).catch(function(msg) {
                    if (msg === "offline") {
                        Offline.sync("archive-note." + note.id, true);
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
                            Offline.sync("archive-note." + note.id, true);
                        });
                        updateNotes(notes);
                    }
                });
            },
            "removeAll": function(notes, confirm) {
                return $q(function(resolve, reject) {
                    var data = _.getIDs(notes);
                    function run() {
                        Offline.put("/notes/delete", data).then(function(d) {
                            resolve(d);
                        }).catch(function(msg) {
                            if (msg === "offline") {
                                _.each(notes, function(note) {
                                    Offline.sync("delete-note." + note.id, true);
                                });
                                deleteNotes(data);
                                resolve(data);
                            }
                        });
                    }
                    if (confirm !== false) {
                        Popup.confirm("Are you sure you wish to delete these notes?", "Confirm Delete").then(function() {
                            run();
                        }).catch(function() {
                            reject();
                        });
                    } else {
                        run();
                    }
                });
            },
            "saveAll": function(notes) {
                var data = _.map(notes, safe);
                return Offline.put("/notes", data).catch(function(msg) {
                    if (msg === "offline") {
                        Offline.syncAll("note", "id", data);
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
                        console.log("TODO: handle note creation when offline.");
                        //this will be harder, since we need note ids to do tagging, coloring, etc once created
                    }
                });
            },
            "updateNote": updateNote,
            "updateNotes": updateNotes
        };
        return Service;
    }])
    .service("TagServ", ["HTTP", "STOMP", "$rootScope", "$q", "Storage", "Offline", "NoteServ",
                         function(HTTP, STOMP, $rootScope, $q, Storage, Offline, NoteServ) {
        var tagsGet = "/tags",
            tags = getTags(),
            namespace = "TagServ";

        function getTags() {
            return Offline.get(tagsGet);
        }
        Offline.onSync("tag", function(data) {
            return $q.all(_.map(fromData(data), function(notes, tagID) {
                return TagServ.tagAll(notes, {"id": tagID});
            }));
        }).onSync("untag", function(data) {
            return $q.all(_.map(fromData(data), function(notes, tagID) {
                return TagServ.untagAll(notes, {"id": tagID});
            }));
        }).onNetworkChange("TagServ", function(online) {
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
        function notifyNotes() {
            $rootScope.$broadcast("notes-updated");
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
                        Offline.sync("tag." + note.id + "-" + tag.id, getStoreData(note, tag));
                        tagNote(note, tag);
                    }
                });
            },
            "untag": function(note, tag) {
                return Offline.put("/untag/" + note.id + "/" + tag.id).catch(function(msg) {
                    if (msg === "offline") {
                        Offline.sync("untag." + note.id + "-" + tag.id, getStoreData(note, tag));
                        untagNote(note, tag);
                    }
                });
            },
            "tagAll": function(notes, tag) {
                var data = _.getIDs(notes);
                return Offline.put("/tag/" + tag.id, data).catch(function(msg) {
                    if (msg === "offline") {
                        _.each(notes, function(note) {
                            Offline.sync("tag." + note.id + "-" + tag.id, getStoreData(note, tag));
                        });
                        tagNotes(notes, tag);
                    }
                });
            },
            //only used for syncing after offline session
            "untagAll": function(notes, tag) {
                var data = _.getIDs(notes);
                return Offline.put("/untag/" + tag.id, data).catch(function(msg) {
//                    if (msg === "offline") {
//                        _.each(notes, function(note) {
//                            Offline.sync("untag." + note.id + "-" + tag.id, getStoreData(note, tag));
//                        });
//                        untagNotes(notes, tag);
//                    }
                });
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
    .service("Offline", ["$rootScope", "network", "Storage", "$q", "HTTP",
                         function($rootScope, network, Storage, $q, HTTP) {

        var registers = {},
            syncs = {},
            defaultData = {};
        $rootScope.$on("network-state-change", function($event) {
            runCachedRequests().finally(function() {
                _.each(registers, function(fn, p) {
                    fn.call(null, network.online);
                });
            });
        });

        function runCachedRequests() {
            return $q(function(resolve, reject) {
                if (network.online) {
                    var sync = Storage.get("sync");
                    var promises = _.map(sync, function(data, base) {
                        if (syncs[base]) {
                            var prom = syncs[base].call(null, data);
                            delete sync[base];
                            return prom;
                        } 
                        console.warn("no sync registered for", base);
                    }).filter(_.identity);
                    Storage.set("sync", sync);

                    $q.all(promises).then(function() {
                        resolve();
                    });
                } else {
                    reject();
                }
            });
        }

        var Offline = {
            "onSync": function(base, callback) {
                if (_.isString(base) && _.isFunction(callback)) {
                    syncs[base] = callback;
                }
                return Offline;
            },
            "onNetworkChange": function(path, callback) {
                if (_.isString(path) && _.isFunction(callback)) {
                    registers[path] = callback;
                }
                return Offline;
            },
            "storeRequest": function(method, url, data) {
                if (method && url) {
                    Storage.set(method + "." + url, data);
                }
            },
            "sync": function(path, data) {
                Storage.set("sync." + path, data);
            },
            "syncAll": function(base, prop, data) {
                var path = "sync." + base + ".",
                    save = {};
                _.each(data, function(d) {
                    save[path + d[prop]] = d; 
                });
                Storage.set(save);
            },
            "get": function(url, def) {
                var path = "get." + url;
                if (network.online) {
                    return HTTP.get(url).then(function(data) {
                        Storage.set(path, data);
                        return data;
                    });
                }
                return $q(function(resolve, reject) {
                    resolve(Storage.get(path) || def || []);
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