/// <reference path="settings.ts" />
/// <reference path="storage.ts" />
/// <reference path="host.ts" />
/// <reference path="events.ts" />
/// <reference path="handlers/pageActionClickedHandler.ts" />
/// <reference path="handlers/tabUpdatedHandler.ts" />
/// <reference path="handlers/headersReceivedHandler.ts" />

namespace App {
  declare let browser: any; // import WebExtensions browser object

  export class Initiator {
    private registry: EventRegistry | undefined;

    async init() {
      const storage = new Storage();
      const loader = new SettingsLoader(storage);
      const settings = await loader.init();
      console.log('using settings: ', settings);
      const factory = new HostFactory(settings, storage);

      const h1 = new PageActionClickedHandler(storage, factory);
      const h2 = new TabUpdatedHandler(factory);
      const h3 = new HeadersReceivedHandler(factory);

      this.registry = new EventRegistry(h1, h2, h3);
      this.registry.subscribe();

      // after installation of the extension the pageAction icon is missing
      // on all opened tabs (because we update the icon only on navigation changes).
      // query all opened tabs and add the icon.
      const tabs = await browser.tabs.query({});
      for (const tab of tabs) {
        await h2.setup(tab.id as number, tab.url as string);
      }
    }

    async handle(changes: any, area: string) {
      if (area === 'local' && changes.settings != null && changes.settings.newValue != null) {
        if (this.registry != null) {
          this.registry.unsubscribe();
        }
        await this.init();
      }
    }
  }
}
