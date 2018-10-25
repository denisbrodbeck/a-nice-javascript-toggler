/// <reference path="initiator.ts" />

declare let browser: any; // declare external WebExtensions browser object

const initiator = new App.Initiator();
initiator.init().then(
  () => {
    // listen for storage changes concerning options changes
    browser.storage.onChanged.addListener((changes: any, area: string) => initiator.handle(changes, area));
  },
  err => console.log(err)
);
