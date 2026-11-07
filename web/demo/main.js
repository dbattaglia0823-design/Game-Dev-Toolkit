import { ConfigStore } from '../core/config-store.js';
import { SaveStore } from '../core/save-store.js';
import { ToastManager } from '../ui/toast-manager.js';
const config = new ConfigStore({defaults: {sound: true}});
const saves = new SaveStore({key: 'gdt.demo.save', version: 1});
const toast = new ToastManager(document.querySelector('#toast'));
let score = 0;
const status = document.querySelector('#status');
function render() { status.textContent = `Score: ${score} · Sound: ${config.get('sound') ? 'on' : 'off'}`; }
document.querySelector('#score').addEventListener('click', () => { score += 10; render(); toast.show('+10 points'); });
document.querySelector('#save').addEventListener('click', () => toast.show(saves.save({score}) ? 'Saved' : 'Storage unavailable'));
document.querySelector('#load').addEventListener('click', () => { score = saves.load({score: 0}).score ?? 0; render(); toast.show('Loaded'); });
document.querySelector('#sound').addEventListener('click', () => { config.set('sound', !config.get('sound')); render(); toast.show('Setting updated'); });
render();
