(function() { "use strict";
    //register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sticklet.service-worker.js').then(function(reg) { 
            console.log("Service worker registered on scope:", reg.scope);
            //window.stickletActiveServiceWorker = reg.active;
        }).catch(function(error) {
            console.warn('Service worker registration failed with ' + error);
        });
    };
}());