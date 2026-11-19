// Single source of truth for prices (pence), delivery areas and hours. The browser never sets a price.
// Keep the copies in public/thanksgiving/index.html (FEASTS, PIES, EXTRAS, PLATTERS, hoursFor) in sync with this file.

export const CATALOG = {
  // Feasts are priced per table. One size per feast per order. Prices updated 19 Nov 2026 (same as Christmas).
  // The 2–4 tables count as 4 guests (gluten-free and per-head maths).
  'turkey-4':   { name: 'Turkey Feast for 2–4 (2–3 kg bird)',  price: 35000, feast: 'turkey', guests: 4 },
  'turkey-8':   { name: 'Turkey Feast for 8 (4.5–5.5 kg bird)',  price: 56000, feast: 'turkey', guests: 8 },
  'turkey-10':  { name: 'Turkey Feast for 10 (5.5–7 kg bird)', price: 66000, feast: 'turkey', guests: 10 },
  'turkey-12':  { name: 'Turkey Feast for 12 (7–8 kg bird)', price: 76000, feast: 'turkey', guests: 12 },
  'turkey-14':  { name: 'Turkey Feast for 14 (8–10 kg bird)', price: 86000, feast: 'turkey', guests: 14 },
  'veg-4':      { name: 'Veggie Wellington Feast for 2–4', price: 32000, feast: 'veg', guests: 4 },
  'veg-6':      { name: 'Veggie Wellington Feast for 6',  price: 42000, feast: 'veg', guests: 6 },
  'veg-8':      { name: 'Veggie Wellington Feast for 8',  price: 52000, feast: 'veg', guests: 8 },
  // Gluten-free Wellington: +£5 a head, quantity must equal the Wellington table size.
  'wellington-gf': { name: 'Gluten-free Wellington (per head)', price: 500, perHeadOf: 'veg' },
  'pie-pecan':     { name: 'Pecan pie (serves 8)', price: 2900 },
  'pie-pumpkin':   { name: 'Pumpkin pie (serves 8)', price: 2900 },
  'pie-apple':     { name: 'Apple pie (serves 8)', price: 2900 },
  'ham-1kg':       { name: 'Honey-glazed smoked ham (serves 6–8)', price: 6000 },
  'mash-1kg':      { name: 'Buttery mashed potatoes, 1 kg (serves 4–5)', price: 2800 },
  'roast-goose-1kg': { name: 'Roast potatoes in goose fat, 1 kg (serves 4–5)', price: 2000 },
  'roast-olive-1kg': { name: 'Roast potatoes in olive oil, 1 kg (serves 4–5)', price: 2000 },
  'gravy-turkey':  { name: 'Extra turkey gravy', price: 2500 },
  'cranberry':     { name: 'Extra cranberry sauce', price: 1000 },
  'set-steel':     { name: 'Serving spoon & tongs, stainless steel', price: 3000 },
  'set-gold':      { name: 'Serving spoon & tongs, gold', price: 3000 },
  'gravy-boat':    { name: 'Porcelain gravy boat', price: 3000 },
  'platter-steel':     { name: '35 cm oval dish, stainless steel', price: 2000 },
  'platter-porcelain': { name: '35 cm oval dish, porcelain', price: 3000 },
};
export const MAX_QTY = 20;

export const AREAS = { 'kensington': 'Kensington', 'notting-hill': 'Notting Hill', 'st-johns-wood': "St John's Wood" };
// Thanksgiving delivery, charged once per order (confirmed 19 Nov 2026).
export const AREA_FEES = { 'notting-hill': 1000, 'kensington': 1500, 'st-johns-wood': 2000 };
// Wed & Fri deliveries run to 19:00, Thu & Sat to 18:00.
export const DAYS = {
  '2026-11-25': { label: 'Wed 25 Nov', end: 19 },
  '2026-11-26': { label: 'Thu 26 Nov (Thanksgiving)', end: 18 },
  '2026-11-27': { label: 'Fri 27 Nov', end: 19 },
  '2026-11-28': { label: 'Sat 28 Nov (Deferred Thanksgiving)', end: 18 },
};
// Each area has its own part of the day: Kensington 9–12, Notting Hill 12–15/16, St John's Wood 15/16–18/19.
export const hoursFor = (day, area) => {
  const d = DAYS[day]; if (!d) return null;
  const mid = d.end - 3;
  return { 'kensington': [9, 12], 'notting-hill': [12, mid], 'st-johns-wood': [mid, d.end] }[area] || null;
};
const p2 = (n) => String(n).padStart(2, '0');
export const windowLabel = (h) => `${p2(h)}:00–${p2(h + 1)}:00`;
// Returns [{ label: '09:00–10:00', key: '2026-11-25_09' }, ...] for that day and area.
export const windowsFor = (day, area) => {
  const h = hoursFor(day, area); if (!h) return [];
  return Array.from({ length: h[1] - h[0] }, (_, i) => ({ label: windowLabel(h[0] + i), key: `${day}_${p2(h[0] + i)}` }));
};
export const capacity = () => parseInt(process.env.SLOT_CAPACITY || '4', 10);

// ============================================================
// CHRISTMAS 2026 (from the Corporate Holiday Programme)
// Keep the copies in public/christmas/index.html (FEASTS, PUDDING, PIES, EXTRAS, SAUCES, SERVEWARE, ZONES, DAYS) in sync.
// ============================================================
export const XMAS_ORDER_BY = '2026-12-18T23:59:59Z'; // London is on GMT in December
export const xmasOpen = (now = Date.now()) => {
  const t = process.env.NG_TEST_NOW ? Date.parse(process.env.NG_TEST_NOW) : now;
  return t <= Date.parse(XMAS_ORDER_BY);
};
export const XMAS_CATALOG = {
  'xmas-turkey-4':  { name: 'Christmas Turkey Feast for 2–4 (2–3 kg bird)',   price: 35000, feast: 'turkey', guests: 4 },
  'xmas-turkey-8':  { name: 'Christmas Turkey Feast for 8 (4.5–5.5 kg bird)', price: 56000, feast: 'turkey', guests: 8 },
  'xmas-turkey-10': { name: 'Christmas Turkey Feast for 10 (5.5–7 kg bird)',  price: 66000, feast: 'turkey', guests: 10 },
  'xmas-turkey-12': { name: 'Christmas Turkey Feast for 12 (7–8 kg bird)',    price: 76000, feast: 'turkey', guests: 12 },
  'xmas-turkey-14': { name: 'Christmas Turkey Feast for 14 (8–10 kg bird)',   price: 86000, feast: 'turkey', guests: 14 },
  'xmas-veg-4':     { name: 'Christmas Veggie Wellington Feast for 2–4', price: 32000, feast: 'veg', guests: 4 },
  'xmas-veg-6':     { name: 'Christmas Veggie Wellington Feast for 6',   price: 42000, feast: 'veg', guests: 6 },
  'xmas-veg-8':     { name: 'Christmas Veggie Wellington Feast for 8',   price: 52000, feast: 'veg', guests: 8 },
  'xmas-wellington-gf': { name: 'Gluten-free Wellington (per head)', price: 500, perHeadOf: 'veg' },
  'xmas-giftbox':     { name: 'Christmas gift box (ham, mash, turkey & Chablis gravy, gravy boat)', price: 12500 },
  'xmas-ham':         { name: 'Honey-glazed smoked ham (serves 6–8)', price: 6000 },
  'xmas-pudding':     { name: 'Christmas pudding with brandy cream (serves 8)', price: 4500 },
  'xmas-pie-pecan':   { name: 'Pecan pie (serves 8)', price: 2900 },
  'xmas-pie-apple':   { name: 'Apple pie (serves 8)', price: 2900 },
  'xmas-pie-pumpkin': { name: 'Pumpkin pie (serves 8)', price: 2900 },
  'xmas-roast-goose': { name: 'Roast potatoes in goose fat, 1 kg', price: 2000 },
  'xmas-roast-olive': { name: 'Roast potatoes in olive oil, 1 kg', price: 2000 },
  'xmas-mash':        { name: 'Buttery mashed potatoes, 1 kg', price: 2800 },
  'xmas-bread-sauce': { name: 'Extra bread sauce', price: 2000 },
  'xmas-gravy':       { name: 'Extra turkey gravy', price: 2500 },
  'xmas-cranberry':   { name: 'Extra cranberry sauce', price: 1000 },
  'xmas-set-steel':   { name: 'Serving spoon & tongs, stainless steel', price: 3000 },
  'xmas-set-gold':    { name: 'Serving spoon & tongs, gold', price: 3000 },
  'xmas-gravy-boat':  { name: 'Porcelain gravy boat', price: 3000 },
  'xmas-dish-porcelain': { name: '35 cm oval dish, porcelain', price: 3000 },
  'xmas-dish-steel':     { name: '35 cm oval dish, stainless steel', price: 2000 },
};
// Delivery is charged once per order. London zones book a 3-hour window; England goes by courier (day only).
export const XMAS_ZONES = {
  'notting-hill': { name: 'Notting Hill',      fee: 1000 },
  'kensington':   { name: 'Kensington',        fee: 1500 },
  'central':      { name: 'Central London',    fee: 2000 },
  'greater':      { name: 'Greater London',    fee: 3500 },
  'england':      { name: 'England, next-day', fee: 4500, courier: true },
};
// Delivered 23 or 24 December (earlier by request, arranged by email). England courier both days.
export const XMAS_DAYS = {
  '2026-12-23': { label: 'Wed 23 Dec', courier: true },
  '2026-12-24': { label: 'Thu 24 Dec (Christmas Eve)', courier: true },
};
export const XMAS_WINDOWS = [9, 12, 15]; // 09:00–12:00, 12:00–15:00, 15:00–18:00
export const xmasWindowLabel = (h) => `${p2(h)}:00–${p2(h + 3)}:00`;
export const XMAS_COURIER_LABEL = 'Courier, during the day';
// Returns [{ label, key }] for that day and zone. Courier days have one "window" with its own daily limit.
export const xmasWindowsFor = (day, zone) => {
  const d = XMAS_DAYS[day], z = XMAS_ZONES[zone]; if (!d || !z) return [];
  if (z.courier) return d.courier ? [{ label: XMAS_COURIER_LABEL, key: `${day}_courier` }] : [];
  return XMAS_WINDOWS.map((h) => ({ label: xmasWindowLabel(h), key: `${day}_w${p2(h)}` }));
};
export const xmasCapacity = (key) => parseInt(
  (key.endsWith('_courier') ? process.env.XMAS_COURIER_CAPACITY : process.env.XMAS_WINDOW_CAPACITY) || (key.endsWith('_courier') ? '15' : '12'), 10);
// Corporate volume pricing is quoted by email (10–19 feasts 10% off, 20–39 15%, 40+ 20%); not sold through checkout.

// A slot is "taken" by paid orders plus checkouts still open (held for up to 31 minutes).
export const HOLD_MINUTES = 31;
export const readHolds = async (store, key) => {
  try { return JSON.parse((await store.get(key)) || '{}'); } catch { return {}; }
};
export const liveHolds = (holds, now = Date.now()) => Object.values(holds).filter((exp) => exp > now).length;
