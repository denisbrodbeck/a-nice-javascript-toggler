/// <reference path="storage.ts" />

namespace App {
  export enum Mode {
    Allow,
    Block
  }

  export interface Settings {
    mode: Mode;
  }

  function isValid(obj: any): obj is Settings {
    return obj != null && typeof obj.mode === 'number';
  }

  export class SettingsLoader {
    private storage: Storage;

    constructor(storage: Storage) {
      this.storage = storage;
    }

    /**
     * Load current settings from storage.
     * @throws Will throw an error if the stored {Settings} object is null or invalid.
     */
    async load(): Promise<Settings> {
      const obj = await this.storage.get('settings');
      if (isValid(obj) === false) {
        throw new Error("invalid 'Settings' object: " + JSON.stringify(obj));
      }
      return obj as Settings;
    }

    /**
     * Load current settings from storage.
     * Save and return default settings in case none are found.
     */
    async init(): Promise<Settings> {
      try {
        return await this.load();
      } catch (error) {
        console.log('failed to load {Settings} object: ', error);
      }
      const settings = { mode: Mode.Allow };
      await this.storage.save('settings', settings);
      return settings;
    }
  }
}
