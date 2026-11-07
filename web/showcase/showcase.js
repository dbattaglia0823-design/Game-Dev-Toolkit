import { TabsController } from '../ui/tabs.js';
import { DialogController } from '../ui/dialog.js';
import { ToastManager } from '../ui/toast-manager.js';
import { ITEMS, RARITIES, filterAndSortItems, nextUpgrade } from './demo-data.js';

const $ = selector => document.querySelector(selector);
const toast = new ToastManager($('#toast'));
const tabs = new TabsController($('#showcase-tabs'));
const dialog = new DialogController($('#confirm-dialog'));
const accents = { orange: '#fb8c35', blue: '#56a8ff', green: '#49d6a1' };
const upgrades = [
  { name: 'Engine', description: 'Increases performance in a mock upgrade flow.', level: 1, maxLevel: 5, cost: 100 },
  { name: 'Armor', description: 'A reusable card style with level progression.', level: 0, maxLevel: 4, cost: 150 },
  { name: 'Handling', description: 'Demonstrates disabled and maxed-out states.', level: 3, maxLevel: 3, cost: 200 }
];
let credits = 500;
let selectedItem = null;
let health = 80;
let score = 1250;

function setAccent(value) {
  const color = accents[value];
  if (!color) return;
  document.documentElement.style.setProperty('--gdt-accent', color);
  $('#accent').value = value;
}
function renderInventory() {
  const selected = selectedItem;
  const visible = filterAndSortItems(ITEMS, { category: $('#category').value, sort: $('#sort').value });
  const grid = $('#inventory-grid');
  grid.replaceChildren();
  for (const item of visible) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'inventory-tile';
    button.setAttribute('aria-pressed', String(item.id === selected));
    const symbol = document.createElement('span');
    symbol.className = 'item-symbol';
    symbol.textContent = item.symbol;
    const name = document.createElement('span');
    name.className = 'item-title';
    name.textContent = item.name;
    const rarity = document.createElement('span');
    rarity.className = 'rarity';
    rarity.textContent = RARITIES[item.rarity];
    button.append(symbol, name, rarity);
    button.addEventListener('click', () => { selectedItem = item.id; renderInventory(); renderInspector(); });
    grid.append(button);
  }
  $('#item-count').textContent = `${visible.length} of ${ITEMS.length} items`;
}
function renderInspector() {
  const item = ITEMS.find(item => item.id === selectedItem);
  $('#item-name').textContent = item?.name || 'Choose an item';
  $('#item-desc').textContent = item?.description || 'Select an item to preview its information.';
  $('#item-category').textContent = item?.type || '—';
  $('#item-rarity').textContent = item ? RARITIES[item.rarity] : '—';
  $('#item-use').disabled = !item;
}
function renderUpgrades() {
  $('#credits').textContent = `Credits: ${credits}`;
  const grid = $('#upgrade-grid');
  grid.replaceChildren();
  for (const [index, upgrade] of upgrades.entries()) {
    const card = document.createElement('article');
    card.className = 'gdt-surface upgrade-card';
    const title = document.createElement('h3');
    title.textContent = upgrade.name;
    const desc = document.createElement('p');
    desc.className = 'gdt-muted';
    desc.textContent = upgrade.description;
    const info = document.createElement('div');
    info.className = 'stat-label';
    const label = document.createElement('span');
    label.textContent = `Level ${upgrade.level} / ${upgrade.maxLevel}`;
    const cost = document.createElement('strong');
    cost.textContent = upgrade.level === upgrade.maxLevel ? 'MAX' : `${upgrade.cost} credits`;
    info.append(label, cost);
    const bar = document.createElement('div');
    bar.className = 'gdt-progress';
    const fill = document.createElement('span');
    fill.style.width = `${100 * upgrade.level / upgrade.maxLevel}%`;
    bar.append(fill);
    const action = document.createElement('button');
    action.className = 'gdt-btn gdt-btn--primary';
    action.disabled = upgrade.level === upgrade.maxLevel || credits < upgrade.cost;
    action.textContent = upgrade.level === upgrade.maxLevel ? 'Max level' : credits < upgrade.cost ? 'Not enough credits' : 'Upgrade';
    action.addEventListener('click', () => {
      const outcome = nextUpgrade(upgrade, credits);
      if (!outcome.allowed) { toast.show(outcome.reason === 'maxed' ? 'Already at maximum level' : 'Not enough credits'); return; }
      upgrades[index].level = outcome.level;
      credits = outcome.credits;
      toast.show(`${upgrade.name} upgraded`);
      renderUpgrades();
    });
    card.append(title, desc, info, bar, action);
    grid.append(card);
  }
}
function renderHUD() {
  $('#hud-health').style.width = `${health}%`;
  $('#hud-score').textContent = score.toLocaleString('en-US');
}
$('#accent').addEventListener('change', event => setAccent(event.target.value));
$('#reset').addEventListener('click', () => {
  credits = 500; health = 80; score = 1250; selectedItem = null;
  upgrades[0].level = 1; upgrades[1].level = 0; upgrades[2].level = 3;
  $('#category').value = 'all'; $('#sort').value = 'name'; setAccent('orange');
  renderInventory(); renderInspector(); renderUpgrades(); renderHUD(); tabs.select(0);
  toast.show('Demo reset');
});
document.querySelectorAll('[data-toast]').forEach(button => button.addEventListener('click', () => toast.show(button.dataset.toast)));
$('#open-dialog').addEventListener('click', () => dialog.open());
$('#category').addEventListener('change', renderInventory);
$('#sort').addEventListener('change', renderInventory);
$('#item-use').addEventListener('click', () => {
  const item = ITEMS.find(item => item.id === selectedItem);
  if (item) toast.show(`Previewed ${item.name}`);
});
$('#hud-damage').addEventListener('click', () => { health = Math.max(0, health - 15); renderHUD(); });
$('#hud-heal').addEventListener('click', () => { health = Math.min(100, health + 15); renderHUD(); });
$('#hud-points').addEventListener('click', () => { score += 250; renderHUD(); });
renderInventory();
renderInspector();
renderUpgrades();
renderHUD();
