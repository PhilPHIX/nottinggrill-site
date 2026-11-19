// Run: npm test   (no Worldpay keys or deploy needed; Worldpay, the Google Sheet and Netlify Blobs are stubbed)
import { register } from 'node:module';
import assert from 'node:assert/strict';
register('./loader.mjs', import.meta.url);

Object.assign(process.env, { WORLDPAY_USERNAME: 'user', WORLDPAY_PASSWORD: 'pass', WORLDPAY_ENTITY: 'PO123', WORLDPAY_WEBHOOK_TOKEN: 'tok', ORDERS_SHEET_URL: 'https://sheet.test/exec', MAILING_LIST_URL: 'https://list.test/exec' });
const { __worldpay, __stores } = await import('./stubs.mjs');
const checkout = (await import('../netlify/functions/create-checkout.mjs')).default;
const availability = (await import('../netlify/functions/availability.mjs')).default;
const webhook = (await import('../netlify/functions/worldpay-webhook.mjs')).default;
const { windowsFor } = await import('../netlify/lib/catalog.mjs');

const customer = { name: 'Test Guest', email: 'guest@example.com', phone: '07000 000000', address: '1 Test Street', postcode: 'W11 1AA' };
const post = (body) => checkout(new Request('https://nottinggrill.com/.netlify/functions/create-checkout', { method: 'POST', body: JSON.stringify(body) }));
const order = (extra = {}) => ({ items: [{ id: 'turkey-10', qty: 1 }, { id: 'veg-6', qty: 1 }, { id: 'wellington-gf', qty: 6 }, { id: 'pie-pecan', qty: 2 }],
  area: 'kensington', day: '2026-11-26', window: '09:00–10:00', customer, ...extra });
let pass = 0; const ok = (name) => { pass++; console.log('  ✓', name); };

// Delivery hours per area
assert.deepEqual(windowsFor('2026-11-26', 'kensington').map((w) => w.label), ['09:00–10:00', '10:00–11:00', '11:00–12:00']);
assert.equal(windowsFor('2026-11-26', 'notting-hill').at(-1).label, '14:00–15:00');
assert.equal(windowsFor('2026-11-25', 'notting-hill').at(-1).label, '15:00–16:00');
assert.equal(windowsFor('2026-11-26', 'st-johns-wood')[0].label, '15:00–16:00');
assert.equal(windowsFor('2026-11-27', 'st-johns-wood').at(-1).label, '18:00–19:00');
ok('area delivery hours (Kensington 9–12, Notting Hill 12–15/16, St John\'s Wood 15/16–18/19)');

// Prices come from the server; request matches Worldpay's Hosted Payment Pages format
let r = await post(order()); assert.equal(r.status, 200);
assert.match((await r.json()).url, /^https:\/\/payments\.worldpay\.test\//);
const wp = __worldpay.requests.at(-1);
const total = 66000 + 42000 + 6 * 500 + 2 * 2900 + 1500; // incl. £15 Kensington delivery
assert.equal(wp.url, 'https://try.access.worldpay.com/payment_pages');
assert.equal(wp.headers.Authorization, 'Basic ' + Buffer.from('user:pass').toString('base64'));
assert.equal(wp.headers.Accept, 'application/vnd.worldpay.payment_pages-v1.hal+json');
assert.deepEqual(wp.body.value, { currency: 'GBP', amount: total });
assert.equal(wp.body.merchant.entity, 'PO123');
assert.ok(wp.body.narrative.line1.length <= 24 && wp.body.transactionReference.length <= 64);
const pend = JSON.parse(await __stores.get('thanksgiving-pending').get(wp.body.transactionReference));
assert.equal(pend.guests, '16'); assert.equal(pend.slot_key, '2026-11-26_09'); assert.equal(pend.total, total);
ok(`Worldpay payment page for £${total / 100}, priced server-side, order details kept until paid`);

// Rejections
const rejects = [
  [{ items: [{ id: 'turkey-10', qty: 1 }, { id: 'turkey-8', qty: 1 }] }, 'two turkey sizes'],
  [{ items: [{ id: 'wellington-gf', qty: 6 }] }, 'gluten-free without a Wellington'],
  [{ items: [{ id: 'veg-8', qty: 1 }, { id: 'wellington-gf', qty: 6 }] }, 'gluten-free count not matching the table'],
  [{ items: [{ id: 'turkey-16', qty: 1 }] }, 'unknown size'],
  [{ area: 'kensington', window: '13:00–14:00' }, 'Kensington outside its hours'],
  [{ area: 'elsewhere' }, 'area outside delivery zones'],
  [{ items: [{ id: 'pie-apple', qty: 0 }] }, 'zero quantity'],
  [{ customer: { ...customer, email: 'nope' } }, 'bad email'],
];
for (const [patch, name] of rejects) { r = await post(order(patch)); assert.equal(r.status, 400, name); }
ok(`rejects ${rejects.length} invalid orders`);


// 4 per hour: 1 hold already, 3 more fit, the 5th is refused
for (let i = 0; i < 3; i++) assert.equal((await post(order())).status, 200);
r = await post(order()); assert.equal(r.status, 409);
let a = await (await availability()).json(); assert.equal(a.capacity, 4); assert.equal(a.taken['2026-11-26_09'], 4);
ok('limit of 4 deliveries per hour (open checkouts hold the slot)');

// Webhook: wrong token / unknown IP refused; authorized + sentForSettlement → booked once; refused → hold released
const WP_IP = '34.246.73.11';
const hook = (type, ref, { tok = 'tok', ip = WP_IP } = {}) => webhook(
  new Request(`https://nottinggrill.com/.netlify/functions/worldpay-webhook?token=${tok}`, { method: 'POST', body: JSON.stringify({ eventId: 'e', eventDetails: { classification: 'payment', transactionReference: ref, type, amount: { value: total, currencyCode: 'GBP' } } }) }),
  { ip });
const [w1, w2] = __worldpay.requests.slice(-4).map((x) => x.body.transactionReference);
assert.equal((await hook('authorized', w1, { tok: 'forged' })).status, 403);
assert.equal((await hook('authorized', w1, { ip: '1.2.3.4' })).status, 403);
assert.equal((await hook('authorized', w1)).status, 200);
await hook('sentForSettlement', w1); await hook('sentForSettlement', w1);
await hook('refused', w2);
a = await (await availability()).json(); assert.equal(a.taken['2026-11-26_09'], 3);
assert.equal(await __stores.get('thanksgiving-slots').get('2026-11-26_09'), '1');
assert.equal(__stores.get('thanksgiving-orders').size, 1);
assert.equal(__worldpay.sheet.length, 1); assert.equal(__worldpay.sheet[0].name, 'Test Guest'); assert.equal(__worldpay.sheet[0].email, 'guest@example.com');
ok('webhook: forged token + unknown IP refused, paid order counted once and sent to the sheet once, refused payment frees the slot');
assert.equal((await post(order())).status, 200);
ok('freed slot can be booked again');

// New sizes: 2–4 tables, gluten-free follows 4 heads; old Wellington for 10 is gone
r = await post(order({ items: [{ id: 'turkey-4', qty: 1 }, { id: 'veg-4', qty: 1 }, { id: 'wellington-gf', qty: 4 }], window: '10:00–11:00' })); assert.equal(r.status, 200);
assert.equal(__worldpay.requests.at(-1).body.value.amount, 35000 + 32000 + 2000 + 1500);
assert.equal((await post(order({ items: [{ id: 'veg-10', qty: 1 }] }))).status, 400);
ok('2–4 tables priced (£350 turkey, £320 Wellington, GF +£20); Wellington for 10 withdrawn');

// ---------- Christmas ----------
process.env.NG_TEST_NOW = '2026-12-01T12:00:00Z';
const { xmasWindowsFor } = await import('../netlify/lib/catalog.mjs');
assert.deepEqual(xmasWindowsFor('2026-12-23', 'central').map((w) => w.label), ['09:00–12:00', '12:00–15:00', '15:00–18:00']);
assert.deepEqual(xmasWindowsFor('2026-12-24', 'england').map((w) => w.label), ['Courier, during the day']);
assert.deepEqual(xmasWindowsFor('2026-12-22', 'central'), []);
ok('Christmas windows: London 3-hour windows and England courier on 23 & 24 Dec only');

const xorder = (extra = {}) => ({ season: 'christmas', items: [{ id: 'xmas-turkey-12', qty: 1 }, { id: 'xmas-veg-6', qty: 1 }, { id: 'xmas-wellington-gf', qty: 6 }, { id: 'xmas-pudding', qty: 1 }],
  area: 'kensington', day: '2026-12-23', window: '09:00–12:00', customer, ...extra });
r = await post(xorder()); assert.equal(r.status, 200);
let xwp = __worldpay.requests.at(-1);
const xtotal = 76000 + 42000 + 6 * 500 + 4500 + 1500;
assert.deepEqual(xwp.body.value, { currency: 'GBP', amount: xtotal });
assert.match(xwp.body.resultURLs.successURL, /\/christmas\/\?pay=done/);
let xp = JSON.parse(await __stores.get('thanksgiving-pending').get(xwp.body.transactionReference));
assert.equal(xp.season, 'christmas'); assert.equal(xp.slot_key, '2026-12-23_w09'); assert.match(xp.order, /Delivery, Kensington/);
ok(`Christmas order £${xtotal / 100} incl. £15 Kensington delivery, returns to /christmas/`);

r = await post(xorder({ area: 'england', day: '2026-12-24', window: 'Courier, during the day' })); assert.equal(r.status, 200);
xwp = __worldpay.requests.at(-1); assert.equal(xwp.body.value.amount, xtotal - 1500 + 4500);
ok('England courier charged £45');

const xrejects = [
  [{ items: [{ id: 'turkey-8', qty: 1 }] }, 'Thanksgiving item in a Christmas order'],
  [{ day: '2026-12-21' }, 'delivery day no longer offered'],
  [{ window: '10:00–11:00' }, 'not a Christmas window'],
  [{ area: 'st-johns-wood' }, 'unknown Christmas zone'],
  [{ items: [{ id: 'xmas-veg-8', qty: 1 }, { id: 'xmas-wellington-gf', qty: 6 }] }, 'gluten-free count not matching'],
];
for (const [patch, name] of xrejects) { r = await post(xorder(patch)); assert.equal(r.status, 400, name); }
r = await post({ ...order(), items: [{ id: 'xmas-turkey-8', qty: 1 }] }); assert.equal(r.status, 400, 'Christmas item in a Thanksgiving order');
ok(`rejects ${xrejects.length + 1} invalid Christmas orders`);

process.env.XMAS_WINDOW_CAPACITY = '3';
for (let i = 0; i < 2; i++) assert.equal((await post(xorder())).status, 200);
assert.equal((await post(xorder())).status, 409);
a = await (await availability()).json(); assert.equal(a.xmas.window, 3); assert.equal(a.taken['2026-12-23_w09'], 3);
ok('Christmas window limit (XMAS_WINDOW_CAPACITY)');

// Mailing list: a paid Christmas order with "Keep me posted" ticked joins the list once; unticked does not
assert.equal(__worldpay.list.length, 0, 'Thanksgiving test order had no opt-in');
const listHook = (ref, amount) => webhook(new Request('https://nottinggrill.com/.netlify/functions/worldpay-webhook?token=tok', { method: 'POST',
  body: JSON.stringify({ eventDetails: { transactionReference: ref, type: 'authorized', amount: { value: amount, currencyCode: 'GBP' } } }) }), { ip: WP_IP });
process.env.XMAS_WINDOW_CAPACITY = '20';
await post(xorder({ window: '15:00–18:00', customer: { ...customer, news: true } })); const optIn = __worldpay.requests.at(-1).body;
await post(xorder({ window: '15:00–18:00', customer: { ...customer, email: 'quiet@example.com', news: false } })); const optOut = __worldpay.requests.at(-1).body;
await listHook(optIn.transactionReference, optIn.value.amount); await listHook(optIn.transactionReference, optIn.value.amount);
await listHook(optOut.transactionReference, optOut.value.amount);
assert.equal(__worldpay.list.length, 1); assert.deepEqual([__worldpay.list[0].email, __worldpay.list[0].name, __worldpay.list[0].source], ['guest@example.com', 'Test Guest', 'Christmas order']);
ok('paid order with "Keep me posted" ticked joins the mailing list once (name, email, source); unticked does not');

process.env.NG_TEST_NOW = '2026-12-19T09:00:00Z';
assert.equal((await post(xorder({ window: '12:00–15:00' }))).status, 400);
ok('Christmas orders close after 18 December');
console.log(`\n${pass} checks passed`);
