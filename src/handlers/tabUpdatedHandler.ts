/// <reference path="../host.ts" />

namespace App {
  declare let browser: any;
  const icon_allow = '../icons/logo_js_allowed.svg';
  const icon_block = '../icons/logo_js_blocked.svg';

  export class TabUpdatedHandler {
    private readonly factory: HostFactory;

    constructor(factory: HostFactory) {
      this.factory = factory;
    }

    async handle(id: number, changeInfo: any) {
      if (changeInfo.url == null) {
        return;
      }
      return this.setup(id, changeInfo.url);
    }

    async setup(id: number, url:string) {
      const host = this.factory.create(new URL(url).hostname);
      let icon = '';
      let title = '';
      if (await host.block()) {
        icon = icon_block; // currently blocked
        title = 'Enable JavaScript'; // user may unblock
      } else {
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
}
