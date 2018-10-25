/// <reference path="../host.ts" />

namespace App {
  type HttpHeaders = (
    | { name: string; binaryValue: number[]; value?: string }
    | { name: string; value: string; binaryValue?: number[] })[];

  export class HeadersReceivedHandler {
    private readonly factory: HostFactory;

    constructor(factory: HostFactory) {
      this.factory = factory;
    }

    /**
     * Add a no-script CSP header to a web request.
     * See https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onHeadersReceived#details
     * @param details Details of the request.
     */
    async handle(details: any) {
      this.trace(details);
      const host = this.factory.create(new URL(this.isIframe(details) ? details.documentUrl : details.url).hostname);
      const headers = details.responseHeaders as HttpHeaders;
      const addCSP = await host.block();
      if (addCSP) {
        const index = headers.findIndex(element => element.name === 'Content-Security-Policy');
        if (index > -1) {
          console.log(`#${details.requestId} | updating existing CSP value '${headers[index].value}'`);
          // Modify existing CSP
          headers[index].value = `script-src 'none';`;
        } else {
          // Add new CSP
          // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src#Sources
          var csp = {
            name: 'Content-Security-Policy',
            value: "script-src 'none';"
          };
          headers.push(csp);
        }
        this.traceBlocked(details);
      }
      return { responseHeaders: headers };
    }

    protected isIframe(details: any): boolean {
      return details.type === 'sub_frame';
    }

    protected trace(details: any) {
      const hostname = new URL(details.url).hostname;
      let msg = `#${details.requestId} | checking '${hostname}'`;
      if (this.isIframe(details)) {
        const parentHostname = new URL(details.documentUrl).hostname;
        msg += ` (iframe belonging to '${parentHostname}')`;
      }
      console.log(msg);
    }

    
    protected traceBlocked(details: any) {
      const hostname = new URL(details.url).hostname;
      if (this.isIframe(details)) {
        console.log(`#${details.requestId} | blocking scripts on '${hostname}' (iframe)`);
      } else {
        console.log(`#${details.requestId} | blocking scripts on '${hostname}'`);
      }
    }
  }
}
