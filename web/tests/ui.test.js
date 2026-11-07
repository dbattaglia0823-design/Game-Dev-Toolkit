import test from 'node:test';
import assert from 'node:assert/strict';
import { DialogController } from '../ui/dialog.js';
import { TabsController } from '../ui/tabs.js';

function element() {
  const events = new Map();
  return {
    attributes: {}, hidden: false, tabIndex: 0, focusCount: 0,
    addEventListener(name, fn) { events.set(name, fn); },
    removeEventListener(name) { events.delete(name); },
    dispatch(name, event = {}) { events.get(name)?.(event); },
    setAttribute(name, value) { this.attributes[name] = value; },
    focus() { this.focusCount++; },
    closest(selector) { return selector === '[role="tab"]' ? this : null; }
  };
}
test('tabs update visibility and keyboard navigation', () => {
  const tabs = [element(), element(), element()], panels = [element(), element(), element()];
  const root = element();
  root.querySelectorAll = selector => selector === '[role="tab"]' ? tabs : panels;
  const changes = [];
  const controller = new TabsController(root, {onChange: i => changes.push(i)});
  assert.deepEqual(panels.map(p => p.hidden), [false, true, true]);
  let prevented = false;
  root.dispatch('keydown', {target: tabs[0], key: 'ArrowRight', preventDefault() { prevented = true; }});
  assert.equal(controller.activeIndex, 1);
  assert.equal(prevented, true);
  assert.equal(tabs[1].focusCount, 1);
  assert.deepEqual(panels.map(p => p.hidden), [true, false, true]);
  root.dispatch('click', {target: tabs[2]});
  assert.deepEqual(changes, [1, 2]);
  assert.throws(() => controller.select(4), RangeError);
  controller.destroy();
});
test('dialog avoids duplicate opening and supports close buttons', () => {
  const dialog = element();
  dialog.open = false;
  dialog.returnValue = '';
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = value => { dialog.open = false; dialog.returnValue = value; dialog.dispatch('close'); };
  let closed;
  const controller = new DialogController(dialog, {onClose: value => { closed = value; }});
  controller.open();
  controller.open();
  assert.equal(dialog.open, true);
  dialog.dispatch('click', {target: {closest: selector => selector === '[data-gdt-close]' ? {} : null}});
  assert.equal(dialog.open, false);
  assert.equal(closed, '');
  controller.destroy();
});
