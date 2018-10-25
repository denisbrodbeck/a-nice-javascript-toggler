/// <reference path="settings.ts" />
/// <reference path="storage.ts" />

namespace App {
  export class FormHandler {
    private settings: Settings;
    private storage: Storage;

    constructor(settings: Settings, storage: Storage) {
      this.settings = settings;
      this.storage = storage;
    }

    /**
     * Setup the options before displaying options ui.
     */
    async restore() {
      const elem = <HTMLSelectElement>document.getElementById('select');
      if (elem != null) {
        elem.value = this.settings.mode == Mode.Allow ? 'allow' : 'block';
      }
    }

    /**
     * Save options for the extension.
     * @param ev Event from form element.
     */
    async save(ev: Event) {
      ev.preventDefault();
      const elem = <HTMLSelectElement>document.getElementById('select');
      if (elem == null) {
        throw new Error('missing dom element "select"');
      }
      let mode: Mode;
      const value = elem.value;
      switch (value) {
        case 'allow':
          mode = Mode.Allow;
          break;
        case 'block':
          mode = Mode.Block;
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

  export async function initOptionsPage() {
    const storage = new Storage();
    const loader = new SettingsLoader(storage);
    const settings = await loader.init();
    const handler = new FormHandler(settings, storage);
    const elemForm = <HTMLFormElement>document.getElementById('form-options');
    if (elemForm != null) {
      elemForm.addEventListener('submit', ev => handler.save(ev));
    }
    await handler.restore();
  }
}

document.addEventListener('DOMContentLoaded', () => App.initOptionsPage());
