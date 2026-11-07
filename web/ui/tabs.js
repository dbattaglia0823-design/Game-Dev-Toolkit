/** Keyboard-accessible tab controller using WAI-ARIA tab/list relationships. */
export class TabsController {
  constructor(root, { activeIndex = 0, onChange } = {}) {
    if (!root) throw new TypeError('TabsController requires a root element');
    this.root = root;
    this.tabs = [...root.querySelectorAll('[role="tab"]')];
    this.panels = [...root.querySelectorAll('[role="tabpanel"]')];
    if (!this.tabs.length || this.tabs.length !== this.panels.length) {
      throw new Error('Tabs require an equal, nonzero number of tabs and panels');
    }
    this.onChange = onChange;
    this.handleClick = (event) => {
      const tab = event.target?.closest?.('[role="tab"]');
      const index = this.tabs.indexOf(tab);
      if (index !== -1) this.select(index, true);
    };
    this.handleKeydown = (event) => {
      const index = this.tabs.indexOf(event.target);
      if (index < 0) return;
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      let next;
      if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = this.tabs.length - 1;
      else if (Object.hasOwn(keys, event.key)) next = (index + keys[event.key] + this.tabs.length) % this.tabs.length;
      else return;
      event.preventDefault();
      this.select(next, true);
      this.tabs[next].focus();
    };
    root.addEventListener('click', this.handleClick);
    root.addEventListener('keydown', this.handleKeydown);
    this.select(activeIndex, false);
  }
  select(index, notify = true) {
    if (!Number.isInteger(index) || index < 0 || index >= this.tabs.length) throw new RangeError('Invalid tab index');
    this.activeIndex = index;
    this.tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      this.panels[i].hidden = !selected;
    });
    if (notify) this.onChange?.(index);
  }
  destroy() {
    this.root.removeEventListener('click', this.handleClick);
    this.root.removeEventListener('keydown', this.handleKeydown);
  }
}
