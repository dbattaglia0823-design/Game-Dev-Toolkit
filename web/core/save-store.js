/** Versioned local save with previous-good backup and explicit migration callback. */
export class SaveStore {
  constructor({key = 'gdt.save', version = 1, storage = globalThis.localStorage, migrate = null} = {}) {
    if (!Number.isInteger(version) || version < 1) throw new Error('version must be a positive integer');
    this.key = key;
    this.version = version;
    this.storage = storage;
    this.migrate = migrate;
  }
  save(data) {
    const envelope = JSON.stringify({version: this.version, data});
    if (!this.storage) return false;
    try {
      const previous = this.storage.getItem(this.key);
      if (previous !== null) this.storage.setItem(`${this.key}.bak`, previous);
      this.storage.setItem(this.key, envelope);
      return true;
    } catch { return false; }
  }
  load(fallback = null) {
    for (const name of [this.key, `${this.key}.bak`]) {
      try {
        const raw = this.storage?.getItem(name);
        if (!raw) continue;
        const envelope = JSON.parse(raw);
        if (!envelope || !Number.isInteger(envelope.version) || !Object.hasOwn(envelope, 'data')) continue;
        if (envelope.version === this.version) return envelope.data;
        if (envelope.version < this.version && typeof this.migrate === 'function') return this.migrate(envelope.data, envelope.version, this.version);
      } catch { /* attempt backup */ }
    }
    return fallback;
  }
  clear() {
    try { this.storage?.removeItem(this.key); this.storage?.removeItem(`${this.key}.bak`); return true; } catch { return false; }
  }
}
