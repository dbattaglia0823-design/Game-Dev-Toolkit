/** Accessible reusable modal controller for a native HTML <dialog>. */
export class DialogController {
  constructor(dialog, { onClose } = {}) {
    if (!dialog || typeof dialog.showModal !== 'function' || typeof dialog.close !== 'function') {
      throw new TypeError('DialogController requires a native HTML dialog element');
    }
    this.dialog = dialog;
    this.onClose = onClose;
    this.handleClick = (event) => {
      if (event.target?.closest?.('[data-gdt-close]')) this.close();
    };
    this.handleClose = () => this.onClose?.(this.dialog.returnValue);
    this.dialog.addEventListener('click', this.handleClick);
    this.dialog.addEventListener('close', this.handleClose);
  }
  open() {
    if (!this.dialog.open) this.dialog.showModal();
  }
  close(value = '') {
    if (this.dialog.open) this.dialog.close(value);
  }
  destroy() {
    this.dialog.removeEventListener('click', this.handleClick);
    this.dialog.removeEventListener('close', this.handleClose);
  }
}
