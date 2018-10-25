namespace App {
  declare let browser: any;

  /**
   * Enables the extension to store and retrieve data.
   */
  export class Storage {
    /**
     * Get data belonging to a given key.
     * @param key An identifier.
     */
    async get(key: string): Promise<object | null> {
      const item = await browser.storage.local.get(key);
      if (item[key] != null) {
        return item[key];
      }
      return null;
    }

    /**
     * Check if the given key exists in storage area.
     * @param key An identifier.
     */
    async has(key: string): Promise<boolean> {
      const item = await browser.storage.local.get(key);
      return item[key] != null;
    }

    /**
     * Remove one item from storage area.
     * @param key An identifier.
     */
    async remove(key: string): Promise<void> {
      return browser.storage.local.remove(key);
    }

    /**
     * Save or updates one item in storage area.
     * @param key An identifier
     * @param val The data.
     */
    async save(key: string, val: any): Promise<void> {
      return browser.storage.local.set({ [key]: val });
    }

    /**
     * Clear all items from storage area.
     */
    async clear(): Promise<void> {
      return browser.storage.local.clear();
    }
  }
}
