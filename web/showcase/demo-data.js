/** Demo-only data and pure UI helpers. Do not treat these as gameplay inventory rules. */
export const ITEMS = Object.freeze([
  { id: 'blade', name: 'Carbon Blade', type: 'weapon', rarity: 3, symbol: '✦', description: 'Lightweight melee weapon with a reinforced edge.' },
  { id: 'shield', name: 'Impact Vest', type: 'armor', rarity: 2, symbol: '▣', description: 'Protective equipment for close-range encounters.' },
  { id: 'rifle', name: 'Pulse Carbine', type: 'weapon', rarity: 4, symbol: '⌁', description: 'Experimental ranged weapon prototype.' },
  { id: 'ore', name: 'Alloy Fragments', type: 'material', rarity: 1, symbol: '◆', description: 'Common crafting resource.' },
  { id: 'helmet', name: 'Visor Helmet', type: 'armor', rarity: 3, symbol: '⬡', description: 'Armored helmet with an integrated visor.' },
  { id: 'cell', name: 'Energy Cells', type: 'material', rarity: 2, symbol: '◈', description: 'Power source for advanced equipment.' }
]);
export const RARITIES = Object.freeze(['', 'Common', 'Rare', 'Epic', 'Legendary']);
export function filterAndSortItems(items, { category = 'all', sort = 'name' } = {}) {
  if (!Array.isArray(items)) throw new TypeError('items must be an array');
  const visible = items.filter(item => category === 'all' || item.type === category);
  if (sort === 'rarity') return visible.sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name));
  if (sort === 'name') return visible.sort((a, b) => a.name.localeCompare(b.name));
  throw new RangeError('Unknown item sort');
}
export function nextUpgrade({level, maxLevel, cost}, credits) {
  if (!Number.isInteger(level) || !Number.isInteger(maxLevel) || level < 0 || maxLevel <= 0 || level > maxLevel || !Number.isFinite(cost) || cost < 0 || !Number.isFinite(credits) || credits < 0) throw new RangeError('Invalid upgrade state');
  if (level === maxLevel) return { allowed: false, reason: 'maxed', level, credits };
  if (credits < cost) return { allowed: false, reason: 'credits', level, credits };
  return { allowed: true, reason: 'purchased', level: level + 1, credits: credits - cost };
}
