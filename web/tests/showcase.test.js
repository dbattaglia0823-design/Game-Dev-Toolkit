import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, filterAndSortItems, nextUpgrade } from '../showcase/demo-data.js';

test('inventory filtering does not mutate source', () => {
  const original = ITEMS.map(item => item.id);
  const weapons = filterAndSortItems(ITEMS, {category: 'weapon', sort: 'name'});
  assert.deepEqual(weapons.map(item => item.id), ['blade', 'rifle']);
  assert.deepEqual(ITEMS.map(item => item.id), original);
});
test('inventory sorts rarity descending with predictable tie break', () => {
  const sorted = filterAndSortItems(ITEMS, {sort: 'rarity'});
  assert.deepEqual(sorted.map(item => item.rarity), [4,3,3,2,2,1]);
  assert.throws(() => filterAndSortItems(ITEMS, {sort: 'unknown'}), RangeError);
  assert.throws(() => filterAndSortItems(null), TypeError);
});
test('upgrade purchase spends credits and increments exactly once', () => {
  const state = {level: 1,maxLevel: 3,cost: 100};
  assert.deepEqual(nextUpgrade(state,150), {allowed:true,reason:'purchased',level:2,credits:50});
  assert.deepEqual(state, {level:1,maxLevel:3,cost:100});
});
test('upgrades disallow insufficient credits and maxed levels', () => {
  assert.equal(nextUpgrade({level:0,maxLevel:2,cost:100},99).reason,'credits');
  assert.equal(nextUpgrade({level:2,maxLevel:2,cost:100},200).reason,'maxed');
  assert.throws(() => nextUpgrade({level:-1,maxLevel:2,cost:100},200), RangeError);
});
