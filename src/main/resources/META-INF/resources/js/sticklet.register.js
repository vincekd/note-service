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
        },
        "authenticate": authenticate,
        "initServiceWorker": initServiceWorker
    };

    //register service worker
    function authenticate() {
        if ('serviceWorker' in navigator && 'fetch' in window) {
            var req = new Request("/authenticate", {
                "method": "GET",
                "cache": "no-store"
            });
            fetch(req, {"credentials": "include"}).then(function(resp) {
                console.info("autenticated", resp.status);
                if (resp.status === 401) {
                    return do401();
                } else if (resp.status === 200) {
                    __sticklet.authenticated = true;
                }
                initServiceWorker();
            }, function(resp) {
                console.info("authenticate error status", resp.status);
                if (resp.status === 401) {
                    do401();
                }
            });
        } else {
            console.warn("this site requires a modern browser.");
        }
    }

    function initServiceWorker() {
        //TODO: remove
        return;
        navigator.serviceWorker.register('/sticklet.service-worker.js').then(function(reg) {
            __sticklet.serviceWorker = true;
            console.info("Service worker registered on scope:", reg.scope);
        }).catch(function(error) {
            __sticklet.serviceWorker = false;
            console.warn('Service worker registration failed with ' + error);
        });
    }

    function do401() {
        __sticklet.authenticated = false;
        location.href = "/login.html";
    }
}());
