import test from 'node:test';
import assert from 'node:assert/strict';
import { GameMenuController } from '../ui/game-menu-controller.js';

test('main menu to play, pause, settings and back', () => {
  const changes = [];
  const menu = new GameMenuController({onChange: (next, prev) => changes.push([prev,next])});
  assert.equal(menu.transition('resume'), false);
  assert.equal(menu.transition('settings'), true);
  assert.equal(menu.state, 'settings');
  assert.equal(menu.transition('back'), true);
  assert.equal(menu.state, 'main');
  assert.equal(menu.transition('start'), true);
  assert.equal(menu.transition('escape'), true);
  assert.equal(menu.state, 'paused');
  assert.equal(menu.transition('settings'), true);
  assert.equal(menu.transition('escape'), true);
  assert.equal(menu.state, 'paused');
  assert.equal(menu.transition('resume'), true);
  assert.equal(menu.state, 'playing');
  assert.equal(changes.length, 7);
});

test('finish and retry from game-over, preserving allowed transitions', () => {
  const menu = new GameMenuController();
  assert.equal(menu.transition('finish'), false);
  menu.transition('start');
  assert.equal(menu.transition('finish'), true);
  assert.equal(menu.state, 'gameover');
  assert.equal(menu.transition('pause'), false);
  assert.equal(menu.transition('start'), true);
  assert.equal(menu.state, 'playing');
  assert.equal(menu.transition('main'), true);
  assert.equal(menu.state, 'main');
  assert.equal(menu.transition('unknown'), false);
});

test('invalid transitions do not emit changes', () => {
  let emitted = 0;
  const menu = new GameMenuController({onChange: () => emitted++});
  assert.equal(menu.transition('escape'), false);
  assert.equal(menu.transition('main'), false);
  assert.equal(menu.transition('back'), false);
  assert.equal(emitted, 0);
  assert.throws(() => new GameMenuController({onChange: true}), TypeError);
});
