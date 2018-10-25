/// <reference path="../storage.ts" />
/// <reference path="../host.ts" />

namespace App {
  declare let browser: any;

  export class PageActionClickedHandler {
    private readonly storage: Storage;
    private readonly factory: HostFactory;

    constructor(storage: Storage, factory: HostFactory) {
      this.storage = storage;
      this.factory = factory;
    }

    /**
     * Handle clicking on the extension's icon by the user.
     * @param tab The {browser.tabs.Tab} type.
     */
    async handle(tab: any) {
      const host = this.factory.create(new URL(tab.url).hostname);
      if (await host.exists()) {
        await this.storage.remove(host.name);
      } else {
        await this.storage.save(host.name, true);
      }
      await browser.tabs.reload(tab.id, { bypassCache: true });
    }
  }
}
