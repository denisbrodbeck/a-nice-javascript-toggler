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
/// <reference path="settings.ts" />
/// <reference path="storage.ts" />
var App;
(function (App) {
    class FormHandler {
        constructor(settings, storage) {
            this.settings = settings;
            this.storage = storage;
        }
        /**
         * Setup the options before displaying options ui.
         */
        async restore() {
            const elem = document.getElementById('select');
            if (elem != null) {
                elem.value = this.settings.mode == App.Mode.Allow ? 'allow' : 'block';
            }
        }
        /**
         * Save options for the extension.
         * @param ev Event from form element.
         */
        async save(ev) {
            ev.preventDefault();
            const elem = document.getElementById('select');
            if (elem == null) {
                throw new Error('missing dom element "select"');
            }
            let mode;
            const value = elem.value;
            switch (value) {
                case 'allow':
                    mode = App.Mode.Allow;
                    break;
                case 'block':
                    mode = App.Mode.Block;
                    break;
                default:
                    throw new Error('got unexpected select option: ' + elem.value);
            }
            if (this.settings.mode !== mode) {
                this.settings.mode = mode;
                const clear = this.storage.clear();
                const save = this.storage.save('settings', this.settings);
                await clear;
                await save;
                console.log('saved new settings: ', this.settings);
            }
        }
    }
    App.FormHandler = FormHandler;
    async function initOptionsPage() {
        const storage = new App.Storage();
        const loader = new App.SettingsLoader(storage);
        const settings = await loader.init();
        const handler = new FormHandler(settings, storage);
        const elemForm = document.getElementById('form-options');
        if (elemForm != null) {
            elemForm.addEventListener('submit', ev => handler.save(ev));
        }
        await handler.restore();
    }
    App.initOptionsPage = initOptionsPage;
})(App || (App = {}));
document.addEventListener('DOMContentLoaded', () => App.initOptionsPage());
