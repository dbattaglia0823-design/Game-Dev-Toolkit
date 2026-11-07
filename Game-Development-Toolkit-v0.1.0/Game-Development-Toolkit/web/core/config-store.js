/** Small typed settings wrapper. Never store secrets in browser storage. */
export class ConfigStore {
  constructor({key = 'gdt.settings.v1', defaults = {}, storage = globalThis.localStorage} = {}) {
    this.key = key;
    this.defaults = structuredClone(defaults);
    this.storage = storage;
    this.values = structuredClone(defaults);
    this.load();
  }
  load() {
    try {
      const raw = this.storage?.getItem(this.key);
      if (raw !== null && raw !== undefined) {
        const data = JSON.parse(raw);
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          for (const [name, defaultValue] of Object.entries(this.defaults)) {
            if (typeof data[name] === typeof defaultValue && (typeof defaultValue !== 'number' || Number.isFinite(data[name]))) this.values[name] = data[name];
          }
        }
      }
    } catch { /* invalid or unavailable storage: keep defaults */ }
    return this.getAll();
  }
  get(name) { return this.values[name]; }
  getAll() { return structuredClone(this.values); }
  set(name, value) {
    if (!Object.hasOwn(this.defaults, name)) throw new Error(`Unknown setting: ${name}`);
    if (typeof value !== typeof this.defaults[name] || (typeof value === 'number' && !Number.isFinite(value))) throw new TypeError(`Invalid value for ${name}`);
    this.values[name] = value;
    try { this.storage?.setItem(this.key, JSON.stringify(this.values)); } catch { /* memory-only mode */ }
    return value;
  }
  reset() {
    this.values = structuredClone(this.defaults);
    try { this.storage?.setItem(this.key, JSON.stringify(this.values)); } catch { /* memory-only mode */ }
  }
}
