/** One-at-a-time toast notifications. Text only; avoids HTML injection. */
export class ToastManager {
  constructor(container, {duration = 1800} = {}) {
    if (!container) throw new Error('Toast container required');
    this.container = container;
    this.container.setAttribute('role', 'status');
    this.container.setAttribute('aria-live', 'polite');
    this.duration = duration;
    this.timer = null;
  }
  show(message, duration = this.duration) {
    this.dismiss();
    this.container.textContent = String(message);
    this.container.hidden = false;
    if (duration > 0) this.timer = setTimeout(() => this.dismiss(), duration);
  }
  dismiss() {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    this.container.hidden = true;
    this.container.textContent = '';
  }
  destroy() { this.dismiss(); }
}
