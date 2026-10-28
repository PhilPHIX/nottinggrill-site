import { getStore } from '@netlify/blobs';
import { readHolds } from '../lib/catalog.mjs';

// Worldpay → Netlify. Turn on events in the Worldpay dashboard: authorized, sentForSettlement, refused, cancelled, error, expired.
// Webhook URL: https://nottinggrill.com/.netlify/functions/worldpay-webhook?token=<WORLDPAY_WEBHOOK_TOKEN>
// Worldpay doesn't sign webhooks, so we check the secret token in the URL and Worldpay's published sending IPs.
export const WORLDPAY_IPS = new Set(['34.246.73.11', '52.215.22.123', '52.31.61.0', '18.130.125.132', '35.176.91.145', '52.56.235.128', '18.185.7.67', '18.185.134.117',
  '18.185.158.215', '52.48.6.187', '34.243.65.63', '3.255.13.18', '3.251.36.74', '63.32.208.6', '52.19.45.138', '3.11.50.124', '3.11.213.43', '3.14.190.43', '3.121.172.32',
  '3.125.11.252', '3.126.98.120', '3.139.153.185', '3.139.255.63', '13.200.51.10', '13.200.56.25', '13.232.151.127', '34.236.63.10', '34.253.172.98', '35.170.209.108',
  '35.177.246.6', '52.4.68.25', '52.51.12.88', '108.129.30.203']);
const PAID = new Set(['authorized', 'sentForSettlement']);
const FAILED = new Set(['refused', 'cancelled', 'error', 'expired']);

export default async (req, context) => {
  const token = new URL(req.url).searchParams.get('token');
  if (!process.env.WORLDPAY_WEBHOOK_TOKEN || token !== process.env.WORLDPAY_WEBHOOK_TOKEN) return new Response('forbidden', { status: 403 });
  const ip = context?.ip || req.headers.get('x-nf-client-connection-ip') || '';
  if (process.env.WORLDPAY_CHECK_IP !== 'off' && !WORLDPAY_IPS.has(ip)) return new Response('forbidden', { status: 403 });

  let evt; try { evt = await req.json(); } catch { return new Response('ok'); }
  const d = evt?.eventDetails || {}, ref = d.transactionReference, type = d.type;
  if (!ref || !type) return new Response('ok');
  const pending = await getStore({ name: 'thanksgiving-pending', consistency: 'strong' }).get(ref);
  if (!pending) return new Response('ok'); // not one of ours
  const p = JSON.parse(pending), key = p.slot_key;
  const orders = getStore({ name: 'thanksgiving-orders', consistency: 'strong' });
  const release = async () => {
    const store = getStore({ name: 'thanksgiving-holds', consistency: 'strong' }), holds = await readHolds(store, key);
    if (holds[ref]) { delete holds[ref]; await store.set(key, JSON.stringify(holds)); }
  };

  if (PAID.has(type)) {
    if (d.amount && Number(d.amount.value) !== p.total) console.error('Amount mismatch', ref, d.amount, p.total);
    const saved = await orders.get(ref);
    let rec;
    if (saved) rec = JSON.parse(saved); // authorized and sentForSettlement both arrive, and Worldpay retries: count each order once
    else {
      rec = { ...p, session: ref, at: new Date().toISOString() };
      await orders.set(ref, JSON.stringify(rec));
      const slots = getStore({ name: 'thanksgiving-slots', consistency: 'strong' });
      await slots.set(key, String((Number(await slots.get(key)) || 0) + 1));
    }
    // Copy to the Google Sheet (and email Justin + Phil). If it fails we answer 500 and Worldpay retries.
    if (process.env.ORDERS_SHEET_URL && !rec.sheeted) {
      let ok = false;
      try {
        const r = await fetch(process.env.ORDERS_SHEET_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ secret: process.env.ORDERS_SHEET_SECRET || '', ...rec }) });
        ok = r.ok && (await r.text()).trim() === 'ok';
      } catch (e) { console.error('Sheet push failed', e?.message); }
      if (!ok) return new Response('sheet not updated', { status: 500 });
      rec.sheeted = true; await orders.set(ref, JSON.stringify(rec));
    }
    await release();
  } else if (FAILED.has(type) && !(await orders.get(ref))) await release();
  return new Response('ok');
};
