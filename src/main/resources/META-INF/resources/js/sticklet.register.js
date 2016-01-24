(function() { "use strict";
    var __sticklet = window.__sticklet = {
        "authenticated": null,
        "serviceWorker": true,
        "network": {
            "online": null,
            "setOnline": function($scope) {
                if (__sticklet.network.online !== true) {
                    __sticklet.network.online = true;
                    if ($scope) {
                        $scope.$broadcast("network-state-change");
                        $scope.$apply();
                    }
                }
            },
            "setOffline": function($scope) {
                if (__sticklet.network.online !== false) {
                    __sticklet.network.online = false;
                    if ($scope) {
                        $scope.$broadcast("network-state-change");
                        $scope.$apply();
                    }
                }
            }
        }
    };

    //register service worker
    if ('serviceWorker' in navigator && 'fetch' in window) {
        console.log("fetching '/authenticate'");
        fetch("/authenticate", {"credentials": "include"}).then(function(resp) {
            console.log("autenticated", resp.status);
            if (resp.status === 200) {
                __sticklet.authenticated = true;
//                navigator.serviceWorker.register('/sticklet.service-worker.js').then(function(reg) {
//                    console.log("Service worker registered on scope:", reg.scope);
//                }).catch(function(error) {
//                    console.warn('Service worker registration failed with ' + error);
//                });
            }
        }, function(resp) {
            console.log("authenticate error status", resp.status);
            //TODO: fix this for offline access
            __sticklet.authenticated = false;
            if (resp.status === 401) {
                location.href = HTTP.getRealUrl("/login.html");
            }
        });
    } else {
        console.warn("this site requires a modern browser.");
    }
}());
