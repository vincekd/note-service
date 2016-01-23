(function($) { "use strict";

var Sticklet = angular.module("Sticklet");

Sticklet
    .factory("ServiceWorker", ["$rootScope", "network", function($rootScope, network) {
        var supported = ('serviceWorker' in navigator);
        if (supported) {
            navigator.serviceWorker.addEventListener("message", function(ev) {
                if (ev.data.command === "install") {
                    
                }
            });
        }
        function sendMessage(message) {
            if (supported && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage(message);
            }
        }
        $rootScope.$on("network-state-change", function(event) {
            //sendMessage({
            //    "command": "networkStatus",
            //    "online": network.online
            //});
        });

        return {
            get enabled() {
                return supported && navigator.serviceWorker.controller;
            },
            "onMessage": function() {},
            "sendMessage": function(){}
        };
    }])
    .factory("Design", ["$rootScope", function($rootScope) {
        var screen = resize(),
            baseTemp = "/templates",
            nums = {
                "xs": 0,
                "sm": 1,
                "md": 2,
                "lg": 3
            };
        function resize() {
            var size = $(window).width();
            if (size > 1200) {
                return "lg";
            } else if (size > 900) {
                return "md";
            } else if (size > 768) {
                return "sm";
            }
            return "xs";
        }
        $(window).on("resize", _.debounce(function() {
            $rootScope.$apply(function() {
                screen = resize();
            });
        }, 250));

        var Design = {
            get screen() {
                return screen;
            },
            get size() {
                return nums[screen];
            },
            template: _.memoize(function(temp) {
                temp = (/^\//.test(temp) ? temp : "/" + temp);
                return (baseTemp + (Design.size > 1 ? temp : "/mobile" + temp));
            }, function(temp) {
                return temp + "-" + Design.size;
            })
        };

        return Design;
    }])
}(jQuery));
