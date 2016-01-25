(function() { "use strict";
    var __sticklet = window.__sticklet = {
        "authenticated": null,
        "serviceWorker": true,
        "network": {
            "online": false,
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
        fetch("/authenticate", {"credentials": "include"}).then(function(resp) {
            console.info("autenticated", resp.status);
            if (resp.status === 401) {
                do401();
            } else if (resp.status === 200) {
                __sticklet.authenticated = true;
            } 
        }, function(resp) {
            console.info("authenticate error status", resp.status);
            if (resp.status === 401) {
                do401();
            }
        });

        navigator.serviceWorker.register('/sticklet.service-worker.js').then(function(reg) {
            __sticklet.serviceWorker = true;
            console.info("Service worker registered on scope:", reg.scope);
        }).catch(function(error) {
            __sticklet.serviceWorker = false;
            console.warn('Service worker registration failed with ' + error);
        });
    } else {
        console.warn("this site requires a modern browser.");
    }

    function do401() {
        __sticklet.authenticated = false;
        location.href = "/login.html";
    }
}());
