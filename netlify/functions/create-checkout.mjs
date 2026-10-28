import { getStore } from '@netlify/blobs';
import { CATALOG, MAX_QTY, AREAS, DAYS, windowsFor, capacity, HOLD_MINUTES, readHolds, liveHolds } from '../lib/catalog.mjs';

const bad = (error, status = 400) => Response.json({ error }, { status });
const clip = (s, n = 450) => String(s || '').trim().slice(0, n);
const WP_TYPE = 'application/vnd.worldpay.payment_pages-v1.hal+json';
export const worldpayBase = () => (process.env.WORLDPAY_ENV === 'live' ? 'https://access.worldpay.com' : 'https://try.access.worldpay.com');

export default async (req) => {
  if (req.method !== 'POST') return bad('Method not allowed', 405);
  let body; try { body = await req.json(); } catch { return bad('Invalid request.'); }
  const { items = [], area, day, window: slot, customer = {} } = body;
  if (!Array.isArray(items) || !items.length) return bad('Your order is empty.');

  // 1. Price every line from the catalogue.
  const lines = []; const feasts = {}; let gfQty = 0;
  for (const it of items) {
    const p = CATALOG[it?.id];
    if (!p) return bad('One of the items is no longer available. Please refresh the page.');
    const qty = parseInt(it.qty, 10);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return bad('Please check the quantities in your order.');
    if (p.feast) {
      if (feasts[p.feast] || qty !== 1) return bad('Please choose one table size per feast.');
      feasts[p.feast] = p;
    }
    if (p.perHeadOf) gfQty = qty;
    lines.push({ id: it.id, p, qty });
  }
  if (gfQty && (!feasts.veg || gfQty !== feasts.veg.guests)) return bad('The gluten-free option needs a Wellington table size.');

  // 2. Delivery area, day and hour.
  if (area === 'elsewhere') return bad('Outside Kensington, Notting Hill and St John\'s Wood we arrange delivery by email: justin@nottinggrill.com');
  if (!AREAS[area]) return bad('Please choose a delivery area.');
  const win = windowsFor(day, area).find((w) => w.label === slot);
  if (!DAYS[day] || !win) return bad('Please choose a delivery day and hour.');
  for (const f of ['name', 'email', 'phone', 'address', 'postcode']) if (!clip(customer[f])) return bad('Please complete your details.');
  if (!/^\S+@\S+\.\S+$/.test(clip(customer.email))) return bad('Please check your email address.');

  const paid = getStore({ name: 'thanksgiving-slots', consistency: 'strong' }), holdsStore = getStore({ name: 'thanksgiving-holds', consistency: 'strong' });
  const holds = await readHolds(holdsStore, win.key);
  const taken = (Number(await paid.get(win.key)) || 0) + liveHolds(holds);
  if (taken >= capacity()) return bad('That delivery hour has just been taken. Please choose another.', 409);

  // 3. Worldpay Hosted Payment Page.
  const total = lines.reduce((a, l) => a + l.p.price * l.qty, 0);
  const guests = Object.values(feasts).reduce((a, f) => a + f.guests, 0);
  const summary = lines.map((l) => (l.p.feast ? l.p.name : `${l.qty}x ${l.p.name}`)).join('; ');
  const ref = `NG-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
  const meta = {
    delivery_day: DAYS[day].label, delivery_window: slot, slot_key: win.key, area: AREAS[area],
    name: clip(customer.name, 120), email: clip(customer.email, 200), phone: clip(customer.phone, 40), address: clip(customer.address), postcode: clip(customer.postcode, 12),
    guests: String(guests), notes: clip(customer.notes), order: summary.slice(0, 480),
  };
  const origin = new URL(req.url).origin;
  const expiresAt = Date.now() + HOLD_MINUTES * 60 * 1000;
  const back = (state) => `${origin}/thanksgiving/?pay=${state}&ref=${ref}`;
  const [first, ...rest] = meta.name.split(/\s+/);
  let url;
  try {
    const auth = Buffer.from(`${process.env.WORLDPAY_USERNAME}:${process.env.WORLDPAY_PASSWORD}`).toString('base64');
    const r = await fetch(`${worldpayBase()}/payment_pages`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': WP_TYPE, Accept: WP_TYPE },
      body: JSON.stringify({
        transactionReference: ref,
        merchant: { entity: process.env.WORLDPAY_ENTITY },
        narrative: { line1: 'Notting Grill' },
        value: { currency: 'GBP', amount: total },
        description: `Thanksgiving · ${meta.delivery_day} ${slot} · ${meta.area}`.slice(0, 128),
        riskData: {
          account: { type: 'guestUser', email: meta.email },
          transaction: { firstName: first.slice(0, 22), lastName: (rest.join(' ') || first).slice(0, 22), phoneNumber: meta.phone, preOrderDate: day },
        },
        resultURLs: { successURL: back('done'), pendingURL: back('pending'), failureURL: back('failed'), errorURL: back('failed'), cancelURL: back('cancelled'), expiryURL: back('expired') },
        expiry: String(HOLD_MINUTES * 60),
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.url) throw new Error(`${r.status} ${JSON.stringify(j).slice(0, 300)}`);
    url = j.url;
  } catch (e) {
    console.error('Worldpay checkout error', e?.message);
    return bad('Checkout could not start. Please try again in a moment.', 502);
  }

  // Keep the order details until Worldpay confirms payment (its webhook only carries the reference and amount).
  await getStore({ name: 'thanksgiving-pending', consistency: 'strong' }).set(ref, JSON.stringify({ ...meta, ref, total, at: new Date().toISOString() }));
  // Hold the slot while the customer pays; the webhook turns it into a paid booking or releases it.
  holds[ref] = expiresAt;
  for (const [id, exp] of Object.entries(holds)) if (exp <= Date.now()) delete holds[id];
  await holdsStore.set(win.key, JSON.stringify(holds));
  return Response.json({ url });
};
