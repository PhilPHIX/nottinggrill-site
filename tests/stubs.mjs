// In-memory stand-in for Netlify Blobs so the functions can be tested without keys or a deploy.
const stores = new Map();
export const getStore = (arg) => {
  const name = typeof arg === 'string' ? arg : arg.name;
  if (!stores.has(name)) stores.set(name, new Map());
  const m = stores.get(name);
  return {
    get: async (k) => (m.has(k) ? m.get(k) : null),
    set: async (k, v) => { m.set(k, String(v)); },
    list: async () => ({ blobs: [...m.keys()].map((key) => ({ key })) }),
  };
};
export const __stores = stores;

// Fake Worldpay Hosted Payment Pages + Google Sheet endpoints.
export const __worldpay = { requests: [], sheet: [] };
globalThis.fetch = async (url, opts = {}) => {
  const u = String(url);
  if (u.endsWith('/payment_pages')) {
    const body = JSON.parse(opts.body);
    __worldpay.requests.push({ url: u, headers: opts.headers, body });
    return Response.json({ url: `https://payments.worldpay.test/hpp/${body.transactionReference}` });
  }
  if (u.startsWith('https://sheet.test')) { __worldpay.sheet.push(JSON.parse(opts.body)); return new Response('ok'); }
  throw new Error(`unexpected fetch ${u}`);
};
