import { getStore } from '@netlify/blobs';
import { capacity, readHolds, liveHolds } from '../lib/catalog.mjs';

// { capacity, taken: { '2026-11-25_09': 2, ... } } = paid orders + checkouts still open.
export default async () => {
  const taken = {};
  const paid = getStore({ name: 'thanksgiving-slots', consistency: 'strong' });
  for (const b of (await paid.list()).blobs) taken[b.key] = Number(await paid.get(b.key)) || 0;
  const holdsStore = getStore({ name: 'thanksgiving-holds', consistency: 'strong' });
  for (const b of (await holdsStore.list()).blobs) {
    const n = liveHolds(await readHolds(holdsStore, b.key));
    if (n) taken[b.key] = (taken[b.key] || 0) + n;
  }
  return Response.json({ capacity: capacity(), taken }, { headers: { 'Cache-Control': 'no-store' } });
};
