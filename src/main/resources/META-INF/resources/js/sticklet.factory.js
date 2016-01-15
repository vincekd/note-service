(function($) { "use strict";

var Sticklet = angular.module("Sticklet");

Sticklet
    .factory("ServiceWorker", ["Offline", function(Offline) {
        var supported = ('serviceWorker' in navigator);
        console.log("here");
        if (supported) {
            navigator.serviceWorker.addEventListener("message", function(e) {
                console.log("ServiceWorker message", e);
            });
            
        }
        function sendMessage(message) {
            if (supported) {
                navigator.serviceWorker.controller.postMessage(message);
            }
        }
        Offline.onNetworkChange("ServiceWorker", function(online) {
            sendMessage(online ? "online": "offline");
        });
        return {
            "onMessage": function() {},
            "sendMessage": function(){}
        };
    }])
}(jQuery));
