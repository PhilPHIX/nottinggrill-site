// Single source of truth for prices (pence), delivery areas and hours. The browser never sets a price.
// Keep the copies in public/thanksgiving/index.html (FEASTS, PIES, EXTRAS, PLATTERS, hoursFor) in sync with this file.

export const CATALOG = {
  // Feasts are priced per table. One size per feast per order.
  'turkey-8':   { name: 'Turkey Feast for 8 (4.5–5.5 kg bird)',  price: 60000, feast: 'turkey', guests: 8 },
  'turkey-10':  { name: 'Turkey Feast for 10 (5.5–7 kg bird)', price: 70000, feast: 'turkey', guests: 10 },
  'turkey-12':  { name: 'Turkey Feast for 12 (7–8 kg bird)', price: 80000, feast: 'turkey', guests: 12 },
  'turkey-14':  { name: 'Turkey Feast for 14 (8–10 kg bird)', price: 90000, feast: 'turkey', guests: 14 },
  'veg-6':      { name: 'Veggie Wellington Feast for 6',  price: 40000, feast: 'veg', guests: 6 },
  'veg-8':      { name: 'Veggie Wellington Feast for 8',  price: 50000, feast: 'veg', guests: 8 },
  'veg-10':     { name: 'Veggie Wellington Feast for 10', price: 60000, feast: 'veg', guests: 10 },
  // Gluten-free Wellington: +£5 a head, quantity must equal the Wellington table size.
  'wellington-gf': { name: 'Gluten-free Wellington (per head)', price: 500, perHeadOf: 'veg' },
  'pie-pecan':     { name: 'Pecan pie (serves 8)', price: 2900 },
  'pie-pumpkin':   { name: 'Pumpkin pie (serves 8)', price: 2900 },
  'pie-apple':     { name: 'Apple pie (serves 8)', price: 2900 },
  'ham-1kg':       { name: 'Honey-glazed smoked ham (serves 6–8)', price: 6000 },
  'mash-1kg':      { name: 'Buttery mashed potatoes, 1 kg (serves 4–5)', price: 2800 },
  'roast-goose-1kg': { name: 'Roast potatoes in goose fat, 1 kg (serves 4–5)', price: 2000 },
  'roast-olive-1kg': { name: 'Roast potatoes in olive oil, 1 kg (serves 4–5)', price: 2000 },
  'platter-steel':     { name: 'Oval serving platter 35 cm, steel', price: 2000 },
  'platter-porcelain': { name: 'Oval serving platter 35 cm, porcelain', price: 3000 },
};
export const MAX_QTY = 20;

export const AREAS = { 'kensington': 'Kensington', 'notting-hill': 'Notting Hill', 'st-johns-wood': "St John's Wood" };
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

// A slot is "taken" by paid orders plus checkouts still open (held for up to 31 minutes).
export const HOLD_MINUTES = 31;
export const readHolds = async (store, key) => {
  try { return JSON.parse((await store.get(key)) || '{}'); } catch { return {}; }
};
export const liveHolds = (holds, now = Date.now()) => Object.values(holds).filter((exp) => exp > now).length;
