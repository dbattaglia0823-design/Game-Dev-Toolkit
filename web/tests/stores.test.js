import test from 'node:test';
import assert from 'node:assert/strict';
import { ConfigStore } from '../core/config-store.js';
import { SaveStore } from '../core/save-store.js';
const memory = () => {
 const m = new Map();
 return {getItem: k => m.has(k) ? m.get(k) : null, setItem: (k,v) => m.set(k, String(v)), removeItem: k => m.delete(k)};
};
test('settings validate type and persist', () => {
 const storage=memory(); const c=new ConfigStore({storage, defaults:{sound:true,volume:0.5}});
 assert.equal(c.get('sound'),true); c.set('sound',false);
 assert.equal(new ConfigStore({storage,defaults:{sound:true,volume:0.5}}).get('sound'),false);
 assert.throws(()=>c.set('volume','loud'),TypeError);
 assert.throws(()=>c.set('unknown',1));
});
test('settings reject malformed data', () => {
 const storage=memory(); storage.setItem('gdt.settings.v1','{"sound":"yes","volume":4}');
 const c=new ConfigStore({storage,defaults:{sound:true,volume:0.5}});
 assert.equal(c.get('sound'),true); assert.equal(c.get('volume'),4);
});
test('save and fallback to backup when primary corrupted', () => {
 const storage=memory(); const s=new SaveStore({storage,version:1});
 s.save({score:10}); s.save({score:20});
 assert.equal(s.load().score,20);
 storage.setItem('gdt.save','not json'); assert.equal(s.load().score,10);
});
test('migration and future version rejection', () => {
 const storage=memory(); storage.setItem('gdt.save',JSON.stringify({version:1,data:{xp:20}}));
 const s=new SaveStore({storage,version:2,migrate:(data,oldVersion)=>({level:data.xp/10,from:oldVersion})});
 assert.deepEqual(s.load(),{level:2,from:1});
 assert.equal(new SaveStore({storage,version:1}).load().xp,20);
 assert.equal(new SaveStore({storage,version:1,key:'none'}).load('empty'),'empty');
});
