import { GameMenuController } from '../ui/game-menu-controller.js';
import { ConfigStore } from '../core/config-store.js';

const $ = selector => document.querySelector(selector);
const settings = new ConfigStore({
  key: 'gdt.menu-demo.settings.v1',
  defaults: { sound: true, volume: 70, reduceMotion: false }
});
let score = 0;
let interval = null;
const labels = { main: 'MAIN MENU', playing: 'PLAYING', paused: 'PAUSED', settings: 'SETTINGS', gameover: 'GAME OVER' };
const controller = new GameMenuController({onChange: (state, previous, action) => {
  if (action === 'start') { score = 0; updateScore(); }
  if (state === 'gameover') $('#final-score').textContent = String(score);
  render(state);
}});
function updateScore() { $('#score').textContent = String(score); }
function render(state) {
  for (const section of document.querySelectorAll('[data-screen]')) section.hidden = section.dataset.screen !== state;
  $('#state').textContent = labels[state];
  if (interval !== null) { clearInterval(interval); interval = null; }
  if (state === 'playing') interval = setInterval(() => { score += 10; updateScore(); }, 500);
  const target = document.querySelector('[data-screen="' + state + '"] button');
  target?.focus({preventScroll: true});
}
document.addEventListener('click', event => {
  const button = event.target.closest?.('[data-action]');
  if (button) controller.transition(button.dataset.action);
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || event.repeat) return;
  if (controller.transition('escape')) event.preventDefault();
});
$('#sound').checked = settings.get('sound');
$('#volume').value = String(settings.get('volume'));
$('#motion').checked = settings.get('reduceMotion');
$('#volume-value').textContent = settings.get('volume') + '%';
document.body.classList.toggle('reduce-motion', settings.get('reduceMotion'));
$('#sound').addEventListener('change', e => settings.set('sound', e.target.checked));
$('#volume').addEventListener('input', e => {
  const value = Number(e.target.value);
  settings.set('volume', value);
  $('#volume-value').textContent = value + '%';
});
$('#motion').addEventListener('change', e => {
  settings.set('reduceMotion', e.target.checked);
  document.body.classList.toggle('reduce-motion', e.target.checked);
});
render(controller.state);
