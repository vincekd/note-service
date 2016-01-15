(function($) { "use strict";

var Sticklet = angular.module("Sticklet");

Sticklet
    .factory("ServiceWorker", ["Offline", function(Offline) {
        var supported = ('serviceWorker' in navigator);
        if (supported) {
            navigator.serviceWorker.addEventListener("message", function(e) {
                console.log("ServiceWorker message", e);
            });
            
        }
        function sendMessage(message) {
            if (supported && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage(message);
            }
        }
        Offline.onNetworkChange("ServiceWorker", function(online) {
            sendMessage({
                "command": "networkStatus",
                "online": online === true
            });
        });
        return {
            "onMessage": function() {},
            "sendMessage": function(){}
        };
    }])
}(jQuery));
