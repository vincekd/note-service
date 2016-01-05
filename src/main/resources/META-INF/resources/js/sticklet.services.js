(function($) { "use strict";

var Sticklet = angular.module("Sticklet");

Sticklet
    .service("HTTP", ["$http", "$q", function($http, $q) {
        function getRealUrl(url) {
            //if (/^\//.test(url)) {
            //    return "www.sticklet.com" + url;
            //}
            return url;
        }
        return {
            "getRealUrl": getRealUrl,
            "get": function(url, data) {
                return $http.get(getRealUrl(url), {
                    params: data
                });
            },
            "post": function(url, data) {
                return $http.post(getRealUrl(url), data);
            },
            "put": function(url, data) {
                return $http.put(getRealUrl(url), data);
            },
            "remove": function(url, data) {
                return $http["delete"](getRealUrl(url), data);
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
                    //disable the crazy console output
                    stompClient.debug = function() {};
                    stompClient.connect({}, function(frame) {
                        connected = true;
                        initialRegisterAll();
                    });
                }
            },
            "disconnect": function() {
                stompClient.disconnect();
                connected = false;
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
    .service("NoteServ", ["HTTP", "STOMP", function(HTTP, STOMP) {
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
                return HTTP.put("/note/" + note.id, note);
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
            }
        };
    }])
    .service("TagServ", ["HTTP", "STOMP", function(HTTP, STOMP) {
        var tags = HTTP.get("/tags").then(function(resp) {
            return resp.data;
        });

        //get tags in sync
        STOMP.register("/tagCreated", function(tag) {
            tags = tags.then(function(data) {
                data.push(tag);
                return data;
            });
        });
        STOMP.register("/tagDeleted", function(tagID) {
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
;
}(jQuery));