/// <reference path="storage.ts" />
/// <reference path="settings.ts" />

namespace App {
  export class Host {
    readonly name: string;
    private storage: Storage;
    private settings: Settings;

    constructor(hostname: string, settings: Settings, storage: Storage) {
      this.name = hostname;
      this.settings = settings;
      this.storage = storage;
    }

    async block(): Promise<boolean> {
      const exists = await this.storage.has(this.name);
      if (this.settings.mode === Mode.Block && exists === false) {
        return true;
      }
      if (this.settings.mode === Mode.Allow && exists) {
        return true;
      }
      return false;
    }

    async exists(): Promise<boolean> {
      return this.storage.has(this.name);
    }
  }

  export class HostFactory {
    private storage: Storage;
    private settings: Settings;

    constructor(settings: Settings, storage: Storage) {
      this.settings = settings;
      this.storage = storage;
    }

    create(hostname: string): Host {
      return new Host(hostname.toLowerCase(), this.settings, this.storage);
    }
  }
}
