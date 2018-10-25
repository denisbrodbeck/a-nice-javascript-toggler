"use strict";
var App;
(function (App) {
    /**
     * Enables the extension to store and retrieve data.
     */
    class Storage {
        /**
         * Get data belonging to a given key.
         * @param key An identifier.
         */
        async get(key) {
            const item = await browser.storage.local.get(key);
            if (item[key] != null) {
                return item[key];
            }
            return null;
        }
        /**
         * Check if the given key exists in storage area.
         * @param key An identifier.
         */
        async has(key) {
            const item = await browser.storage.local.get(key);
            return item[key] != null;
        }
        /**
         * Remove one item from storage area.
         * @param key An identifier.
         */
        async remove(key) {
            return browser.storage.local.remove(key);
        }
        /**
         * Save or updates one item in storage area.
         * @param key An identifier
         * @param val The data.
         */
        async save(key, val) {
            return browser.storage.local.set({ [key]: val });
        }
        /**
         * Clear all items from storage area.
         */
        async clear() {
            return browser.storage.local.clear();
        }
    }
    App.Storage = Storage;
})(App || (App = {}));
/// <reference path="storage.ts" />
var App;
(function (App) {
    let Mode;
    (function (Mode) {
        Mode[Mode["Allow"] = 0] = "Allow";
        Mode[Mode["Block"] = 1] = "Block";
    })(Mode = App.Mode || (App.Mode = {}));
    function isValid(obj) {
        return obj != null && typeof obj.mode === 'number';
    }
    class SettingsLoader {
        constructor(storage) {
            this.storage = storage;
        }
        /**
         * Load current settings from storage.
         * @throws Will throw an error if the stored {Settings} object is null or invalid.
         */
        async load() {
            const obj = await this.storage.get('settings');
            if (isValid(obj) === false) {
                throw new Error("invalid 'Settings' object: " + JSON.stringify(obj));
            }
            return obj;
        }
        /**
         * Load current settings from storage.
         * Save and return default settings in case none are found.
         */
        async init() {
            try {
                return await this.load();
            }
            catch (error) {
                console.log('failed to load {Settings} object: ', error);
            }
            const settings = { mode: Mode.Allow };
            await this.storage.save('settings', settings);
            return settings;
        }
    }
    App.SettingsLoader = SettingsLoader;
})(App || (App = {}));
/// <reference path="storage.ts" />
/// <reference path="settings.ts" />
var App;
(function (App) {
    class Host {
        constructor(hostname, settings, storage) {
            this.name = hostname;
            this.settings = settings;
            this.storage = storage;
        }
        async block() {
            const exists = await this.storage.has(this.name);
            if (this.settings.mode === App.Mode.Block && exists === false) {
                return true;
            }
            if (this.settings.mode === App.Mode.Allow && exists) {
                return true;
            }
            return false;
        }
        async exists() {
            return this.storage.has(this.name);
        }
    }
    App.Host = Host;
    class HostFactory {
        constructor(settings, storage) {
            this.settings = settings;
            this.storage = storage;
        }
        create(hostname) {
            return new Host(hostname.toLowerCase(), this.settings, this.storage);
        }
    }
    App.HostFactory = HostFactory;
})(App || (App = {}));
/// <reference path="../storage.ts" />
/// <reference path="../host.ts" />
var App;
(function (App) {
    class PageActionClickedHandler {
        constructor(storage, factory) {
            this.storage = storage;
            this.factory = factory;
        }
        /**
         * Handle clicking on the extension's icon by the user.
         * @param tab The {browser.tabs.Tab} type.
         */
        async handle(tab) {
            const host = this.factory.create(new URL(tab.url).hostname);
            if (await host.exists()) {
                await this.storage.remove(host.name);
            }
            else {
                await this.storage.save(host.name, true);
            }
            await browser.tabs.reload(tab.id, { bypassCache: true });
        }
    }
    App.PageActionClickedHandler = PageActionClickedHandler;
})(App || (App = {}));
/// <reference path="../host.ts" />
var App;
(function (App) {
    const icon_allow = '../icons/logo_js_allowed.svg';
    const icon_block = '../icons/logo_js_blocked.svg';
    class TabUpdatedHandler {
        constructor(factory) {
            this.factory = factory;
        }
        async handle(id, changeInfo) {
            if (changeInfo.url == null) {
                return;
            }
            return this.setup(id, changeInfo.url);
        }
        async setup(id, url) {
            const host = this.factory.create(new URL(url).hostname);
            let icon = '';
            let title = '';
            if (await host.block()) {
                icon = icon_block; // currently blocked
                title = 'Enable JavaScript'; // user may unblock
            }
            else {
                icon = icon_allow; // currently allowed
                title = 'Disable JavaScript'; // user may block
            }
            const t1 = browser.pageAction.setIcon({ tabId: id, path: icon });
            const t2 = browser.pageAction.setTitle({ tabId: id, title: title });
            const t3 = browser.pageAction.show(id);
            await t1;
            await t2;
            await t3;
        }
    }
    App.TabUpdatedHandler = TabUpdatedHandler;
})(App || (App = {}));
/// <reference path="../host.ts" />
var App;
(function (App) {
    class HeadersReceivedHandler {
        constructor(factory) {
            this.factory = factory;
        }
        /**
         * Add a no-script CSP header to a web request.
         * See https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onHeadersReceived#details
         * @param details Details of the request.
         */
        async handle(details) {
            this.trace(details);
            const host = this.factory.create(new URL(this.isIframe(details) ? details.documentUrl : details.url).hostname);
            const headers = details.responseHeaders;
            const addCSP = await host.block();
            if (addCSP) {
                const index = headers.findIndex(element => element.name === 'Content-Security-Policy');
                if (index > -1) {
                    console.log(`#${details.requestId} | updating existing CSP value '${headers[index].value}'`);
                    // Modify existing CSP
                    headers[index].value = `script-src 'none';`;
                }
                else {
                    // Add new CSP
                    // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src#Sources
                    var csp = {
                        name: 'Content-Security-Policy',
                        value: "script-src 'none';"
                    };
                    headers.push(csp);
                }
                this.traceBlocked(details);
            }
            return { responseHeaders: headers };
        }
        isIframe(details) {
            return details.type === 'sub_frame';
        }
        trace(details) {
            const hostname = new URL(details.url).hostname;
            let msg = `#${details.requestId} | checking '${hostname}'`;
            if (this.isIframe(details)) {
                const parentHostname = new URL(details.documentUrl).hostname;
                msg += ` (iframe belonging to '${parentHostname}')`;
            }
            console.log(msg);
        }
        traceBlocked(details) {
            const hostname = new URL(details.url).hostname;
            if (this.isIframe(details)) {
                console.log(`#${details.requestId} | blocking scripts on '${hostname}' (iframe)`);
            }
            else {
                console.log(`#${details.requestId} | blocking scripts on '${hostname}'`);
            }
        }
    }
    App.HeadersReceivedHandler = HeadersReceivedHandler;
})(App || (App = {}));
/// <reference path="./handlers/pageActionClickedHandler.ts" />
/// <reference path="./handlers/tabUpdatedHandler.ts" />
/// <reference path="./handlers/headersReceivedHandler.ts" />
var App;
(function (App) {
    class EventRegistry {
        constructor(pageActionClicked, tabUpdated, headersReceived) {
            this.listenerPageActionClicked = [(tab) => pageActionClicked.handle(tab)];
            const filter = {
                properties: ['status']
            };
            this.listenerTabUpdated = [(id, changeInfo) => tabUpdated.handle(id, changeInfo), filter];
            // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onHeadersReceived#Parameters
            const requestFilter = {
                urls: ['<all_urls>'],
                types: ['main_frame', 'sub_frame']
            };
            const extraInfoSpec = ['blocking', 'responseHeaders'];
            this.listenerHeadersReceived = [(details) => headersReceived.handle(details), requestFilter, extraInfoSpec];
        }
        subscribe() {
            // listen for clicks on the extensions icon
            browser.pageAction.onClicked.addListener(...this.listenerPageActionClicked);
            browser.tabs.onUpdated.addListener(...this.listenerTabUpdated);
            browser.webRequest.onHeadersReceived.addListener(...this.listenerHeadersReceived);
        }
        unsubscribe() {
            browser.tabs.onUpdated.removeListener(...this.listenerTabUpdated);
            browser.pageAction.onClicked.removeListener(...this.listenerPageActionClicked);
            browser.webRequest.onHeadersReceived.removeListener(...this.listenerHeadersReceived);
        }
    }
    App.EventRegistry = EventRegistry;
})(App || (App = {}));
/// <reference path="settings.ts" />
/// <reference path="storage.ts" />
/// <reference path="host.ts" />
/// <reference path="events.ts" />
/// <reference path="handlers/pageActionClickedHandler.ts" />
/// <reference path="handlers/tabUpdatedHandler.ts" />
/// <reference path="handlers/headersReceivedHandler.ts" />
var App;
(function (App) {
    class Initiator {
        async init() {
            const storage = new App.Storage();
            const loader = new App.SettingsLoader(storage);
            const settings = await loader.init();
            console.log('using settings: ', settings);
            const factory = new App.HostFactory(settings, storage);
            const h1 = new App.PageActionClickedHandler(storage, factory);
            const h2 = new App.TabUpdatedHandler(factory);
            const h3 = new App.HeadersReceivedHandler(factory);
            this.registry = new App.EventRegistry(h1, h2, h3);
            this.registry.subscribe();
            const tabs = await browser.tabs.query({});
            for (const tab of tabs) {
                await h2.setup(tab.id, tab.url);
            }
        }
        async handle(changes, area) {
            if (area === 'local' && changes.settings != null && changes.settings.newValue != null) {
                if (this.registry != null) {
                    this.registry.unsubscribe();
                }
                await this.init();
            }
        }
    }
    App.Initiator = Initiator;
})(App || (App = {}));
/// <reference path="initiator.ts" />
const initiator = new App.Initiator();
initiator.init().then(() => {
    // listen for storage changes concerning options changes
    browser.storage.onChanged.addListener((changes, area) => initiator.handle(changes, area));
}, err => console.log(err));
