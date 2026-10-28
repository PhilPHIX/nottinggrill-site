// Points '@netlify/blobs' at tests/stubs.mjs.
const stub = new URL('./stubs.mjs', import.meta.url).href;
export async function resolve(spec, ctx, next) {
  if (spec === '@netlify/blobs') return { url: stub, shortCircuit: true };
  return next(spec, ctx);
}
