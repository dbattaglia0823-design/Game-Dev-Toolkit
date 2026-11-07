import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const origin=process.env.GDT_TEST_ORIGIN || 'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true});
try{
 for(const viewport of [{width:2560,height:1440},{width:390,height:844}]){
  const page=await browser.newPage({viewport});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin+'/validator/index.html');
  await page.locator('#preset').selectOption('inventory');
  await page.locator('#validate').click();
  assert.match(await page.locator('#status').innerText(),/Structurally valid/);
  await page.locator('#handlers').fill('inventory.select\ninventory.equip\ninventory.search\ninventory.sort');
  await page.locator('#data').fill(JSON.stringify({inventory:{items:[],search:'',selected:{name:'Sword',description:'Item'}}}));
  await page.locator('#validate').click();
  assert.match(await page.locator('#status').innerText(),/validation passed|integration warnings/i);
  await page.goto(origin+'/layout-kit/example/index.html');
  const buttons=page.locator('[data-node-id="item_grid"] button');
  assert.equal(await buttons.count(),3);
  await buttons.first().click();
  assert.match(await page.locator('#last-event').innerText(),/inventory.select/);
  await page.locator('#screen').selectOption('settings');
  await page.locator('[data-node-id="music_toggle"] input').uncheck();
  assert.match(await page.locator('#last-event').innerText(),/settings.music_changed/);
  await page.goto(origin+'/layout-kit/behaviors-demo/index.html');
  assert.equal(await page.locator('[data-node-id="item_grid"] button').count(),6);
  await page.locator('[data-node-id="item_grid"] button').filter({hasText:'Travel shield'}).click();
  assert.match(await page.locator('#state').innerText(),/item-02/);
  await page.locator('[data-node-id="search_items"]').fill('shield');
  await page.locator('[data-node-id="search_items"]').dispatchEvent('change');
  assert.equal(await page.locator('[data-node-id="item_grid"] button').count(),1);
  await page.locator('[data-node-id="equip"]').click();
  assert.match(await page.locator('#events').innerText(),/inventory.equip/);
  await page.locator('[data-screen="equipment"]').click();
  assert.match(await page.locator('#state').innerText(),/Travel shield/);
  await page.locator('[data-screen="shop"]').click();
  await page.locator('[data-node-id="buy"]').click();
  assert.match(await page.locator('#state').innerText(),/shop.purchase/);
  await page.locator('[data-node-id="confirm_cancel"]').click();
  assert.doesNotMatch(await page.locator('#state').innerText(),/"pendingAction": "shop.purchase"/);
  await page.goto(origin+'/builder/index.html');
  await page.locator('#template').selectOption('inventory');
  assert.match(await page.locator('#count').innerText(),/9 controls/);
  await page.locator('#preview').click();
  await page.locator('[data-node-id="equip"]').click();
  assert.match(await page.locator('#event-output').innerText(),/inventory.equip/);
  assert.deepEqual(errors,[], 'Unexpected browser JavaScript errors at viewport '+viewport.width);
  await page.close();
 }
 console.log('Browser smoke tests passed at desktop 1440p and mobile viewport.');
} finally {await browser.close();}
