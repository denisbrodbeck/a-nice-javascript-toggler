# A nice JavaScript Toggler

![Logo](icons/logo_128.png)

This is a WebExtension for Firefox which allows you to enable or disable JavaScript on any website with one click.

## Main Features

* Supports Firefox v60 and higher
* Adds small icon to page action are allowing to disable JavaScript on the current page
* By default all JavaScript is allowed (configurable)
* Has Options dialog to configure default behavior

## Notes for developers

* Blocks JavaScript by adding a `Content-Security-Policy: script-src 'none';` header to incoming web requests
* Blocks JavaScript on a website **and** on any included `iframe's`
* Programmed in Typescript 3 using namespaces
* Compiles all files down to a single JavaScript file (because `module import` is not fully implemented for extensions — see [here](https://discourse.mozilla.org/t/webextension-import-a-module-in-a-script/17381) and its related [ticket 1342012](https://bugzilla.mozilla.org/show_bug.cgi?id=1342012))
* Icon uses [Photon Design System](https://design.firefox.com/) — Color 'Blue 40 ([#45a1ff](https://design.firefox.com/photon/visuals/color.html#blue))' with transparency 0.6
* The icon does not adapt to color changes from dark and light [themes](https://design.firefox.com/photon/visuals/color.html#themes) — because that's another thing which is not fully implemented by Firefox (browserAction supports light/dark themes, but pageAction does not)

## License

The MIT License (MIT) — [Denis Brodbeck](https://github.com/denisbrodbeck). Please have a look at the [LICENSE.md](LICENSE.md) for more details.
