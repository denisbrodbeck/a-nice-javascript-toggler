/// <reference path="./handlers/pageActionClickedHandler.ts" />
/// <reference path="./handlers/tabUpdatedHandler.ts" />
/// <reference path="./handlers/headersReceivedHandler.ts" />

namespace App {
  declare let browser: any; // import WebExtensions browser object

  export class EventRegistry {
    private readonly listenerPageActionClicked: [any];
    private readonly listenerTabUpdated: [any, any];
    private readonly listenerHeadersReceived: [any, any, any];

    constructor(
      pageActionClicked: PageActionClickedHandler,
      tabUpdated: TabUpdatedHandler,
      headersReceived: HeadersReceivedHandler
    ) {
      this.listenerPageActionClicked = [(tab: any) => pageActionClicked.handle(tab)];

      const filter = {
        properties: ['status']
      };
      this.listenerTabUpdated = [(id: number, changeInfo: any) => tabUpdated.handle(id, changeInfo), filter];

      // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onHeadersReceived#Parameters
      const requestFilter = {
        urls: ['<all_urls>'], // See https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns#%3Call_urls%3E
        types: ['main_frame', 'sub_frame']
      };
      const extraInfoSpec = ['blocking', 'responseHeaders'];
      this.listenerHeadersReceived = [(details: any) => headersReceived.handle(details), requestFilter, extraInfoSpec];
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
}
