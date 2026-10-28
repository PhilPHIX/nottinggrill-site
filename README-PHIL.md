# nottinggrill.com + Thanksgiving shop: deploy pack

For Phil (PHIX) and Justin. This folder is the whole site: the current homepage, unchanged apart from three Thanksgiving additions, plus the new `/thanksgiving/` order page with Worldpay checkout (Worldpay eCommerce, Hosted Payment Pages). Drop it on Netlify and it runs.

## What's in the folder

```
public/                 everything visitors see (Netlify publishes only this folder)
  index.html            homepage (live site, unbundled; 3 small additions, see below)
  assets/ng/            the homepage's own images + fonts (same files, original IDs as names)
                        + ng.css / ng-fonts.css / ng.js shared with the Thanksgiving page
  thanksgiving/         the order page + its photos
netlify/functions/      create-checkout · availability · worldpay-webhook
netlify/lib/catalog.mjs prices, delivery areas and hours (single source of truth on the server)
tests/                  `npm test`: checks prices, delivery hours, the 4-per-hour limit and the webhook
netlify.toml, package.json
```

### Homepage changes
1. Nav: orange "Thanksgiving" link between Ethos and Contact.
2. Orange band after the hero ("thanksgiving, from our kitchen."), section id `thanksgiving`, styles in `<style id="ng-thanksgiving">`.
3. Footer → Explore: "Thanksgiving" link.
4. Icon characters replaced with plain text (iPhones show some of them as emoji): the ▶ on "Watch on YouTube", the ↓ under "Scroll", the → after "YOUR BRAND HERE", the ▼ on "Why we focus on food" (now "Read"/"Close") and the 🔥 in the newsletter thank-you message. Keep these out of future edits too.

## The offer (as agreed with Justin)
| Feast | Table | Price |
|---|---|---|
| Turkey | 8 / 10 / 12 / 14 (bird 4.5–5.5 / 5.5–7 / 7–8 / 8–10 kg) | £600 / £700 / £800 / £900 |
| Turkey | 16+ | by email |
| Veggie Wellington | 6 / 8 / 10 | £400 / £500 / £600 |
| Veggie Wellington | 12+ | by email |
| Gluten-free Wellington | +£5 a head (follows the table size) | |

All pies £29 (serve 8). Ham £60 (serves 6–8). Roast potatoes £20 per kg and mash £28 per kg (each kg serves 4–5). Platters £20 / £30. No volume discount (built into the pricing).

**Delivery**, 25–28 Nov, one-hour slots, **max 4 deliveries per hour**:
- Kensington 09:00–12:00
- Notting Hill 12:00–15:00 (Thu, Sat) / 12:00–16:00 (Wed, Fri)
- St John's Wood 15:00–18:00 (Thu, Sat) / 16:00–19:00 (Wed, Fri)
- Anywhere else: "please reach out and we'll see how we can help", with an email link to justin@nottinggrill.com (no online checkout).

A slot is held for 31 minutes while someone is paying, so two people can't buy the last place in the same hour.

## Deploy on Netlify (about 20 minutes)
1. Deploy the folder **with its functions**. Netlify's drag-and-drop only publishes static files, so use one of these:
   - **Git (recommended):** push this folder to a GitHub repo → Netlify → Add new site → Import from Git. Leave the build command empty; `netlify.toml` sets the publish folder and functions.
   - **CLI:** in this folder run `npm install`, then `npx netlify-cli deploy --prod` and link it to the site when asked.
2. **Worldpay dashboard** (dashboard.worldpay.com) → Developer Tools: copy your **API username**, **API password** and **entity** (starts `PO…`). Use the **Try** (test) credentials first.
3. **Netlify → Site settings → Environment variables:**
   - `WORLDPAY_USERNAME`, `WORLDPAY_PASSWORD`, `WORLDPAY_ENTITY`: from step 2
   - `WORLDPAY_ENV` = `try` for testing, `live` when going live
   - `WORLDPAY_WEBHOOK_TOKEN`: make up a long random phrase (letters and numbers only)
   - `SLOT_CAPACITY` = `4` (optional; 4 is the default)
   - `ORDERS_SHEET_URL` and `ORDERS_SHEET_SECRET`: the Google Sheet link-up, see `ORDERS-SHEET-SETUP.md`
4. **Worldpay dashboard → Webhooks/Events:** add the URL
   `https://nottinggrill.com/.netlify/functions/worldpay-webhook?token=YOUR_WORLDPAY_WEBHOOK_TOKEN`
   and turn on the events **authorized, sentForSettlement, refused, cancelled, error, expired**. Do this for Try and again for Live.
5. **Apple Pay / Google Pay:** in the Worldpay dashboard, add `nottinggrill.com` as your domain for wallets (Payment Page settings). Optional: style the payment page in Payment Page Designer.
6. Redeploy, point the domain at the Netlify site.
7. **Test:** order on /thanksgiving/ and pay with one of Worldpay's Try test cards (listed in the Worldpay docs under Hosted Payment Pages → Testing). Check: the payment appears in the Worldpay dashboard, a row lands in the Google Sheet, Justin and Phil get the email, and the hour shows one fewer place.
8. **Go live:** complete Worldpay's go-live check, swap in the Live credentials, set `WORLDPAY_ENV` = `live`, add the webhook on Live, redeploy, and do one small real order.

Security: Worldpay doesn't sign its webhooks, so the function only accepts calls with your secret token **and** from Worldpay's published IP addresses (list in `worldpay-webhook.mjs`). If Worldpay ever changes those IPs, update the list (or set `WORLDPAY_CHECK_IP` = `off` temporarily; the token still protects it).

## Where orders show up
- **Google Sheet** "Notting Grill — Thanksgiving Orders": one row per paid order with name, email, phone, address, postcode, delivery day, hour, area, guests, order, notes, total and a Status column. Justin and Phil get an email per order with a link to the sheet. Setup in `ORDERS-SHEET-SETUP.md`.
- **Worldpay dashboard**: every payment, searchable by the order reference (`NG-…`), which is also in the sheet ("Payment ref" column).
- A backup of each paid order is kept in Netlify Blobs (store `thanksgiving-orders`).
- The customer gets a confirmation email from the Google Sheet script (order, delivery slot, total, reference).

## Changing prices, sizes or hours
Change them in **both** places, then redeploy:
- `netlify/lib/catalog.mjs` (what Worldpay charges and what the server accepts)
- `public/thanksgiving/index.html`: the `FEASTS`, `PIES`, `EXTRAS`, `PLATTERS` lists and `hoursFor` near the end of the file (what customers see)

Run `npm install && npm test` before redeploying; it fails if the server rules break.

## Still to swap
- The turkey and Wellington photos are free-licence Pexels photos (the Wellington is the one Justin picked), lightly graded to match the rest. Swap `public/thanksgiving/img/turkey.jpg` and `veg.jpg` for Justin's own shots any time (1200 × 750).
- Allergens: the page lists "gluten, dairy & eggs" for all three pies (taken from the ingredients: wheat flour, butter, eggs). Justin, please confirm, and add any others (for example nuts in a shared kitchen) before going live.

Contacts: justin@nottinggrill.com (food & orders) · phil@nottinggrill.com (site)
