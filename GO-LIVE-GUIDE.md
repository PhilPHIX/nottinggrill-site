# Putting the new Notting Grill site live: step by step

This guide assumes you've never done this before. Allow about an hour the first time. Each step says what you should see when it has worked.

You need:
- The folder **nottinggrill-site-with-thanksgiving** (download it from the chat and unzip it)
- A **GitHub** account (free): github.com
- Your **Netlify** login
- Your **Worldpay test credentials** (entity, username, password)
- The **Google Sheet** set up from `ORDERS-SHEET-SETUP.md` (do that first, so you have its link and secret)

---

## Part 1: Install two free programs (once only)

### 1a. Node.js (runs the tests)
1. Go to **nodejs.org** and click the big **LTS** download button.
2. Open the downloaded file and click Next / Continue until it finishes. Keep all the default options.

### 1b. GitHub Desktop (uploads the folder to GitHub)
1. Go to **desktop.github.com** and download it.
2. Install it, open it and sign in with your GitHub account.

---

## Part 2: Run the tests (about 5 minutes)

The tests check prices, delivery hours, the 4-per-hour limit and the Worldpay connection on your own computer. They don't take any payments or touch the live site.

### Open a Terminal window in the folder
- **Mac:** open **Finder** and find the folder **nottinggrill-site-with-thanksgiving**. Right-click it and choose **Services → New Terminal at Folder**. (If you don't see that option, open the **Terminal** app, type `cd ` with a space after it, drag the folder into the window and press **Enter**.)
- **Windows:** open the folder in File Explorer. Click the address bar at the top, type `cmd` and press **Enter**.

A window with a blinking cursor opens. That's the Terminal.

### Type these two commands
Type each line exactly, then press **Enter**. Wait for each one to finish before typing the next.

```
npm install
```
This downloads what the site needs and takes 10–60 seconds. Some yellow "warn" lines are normal.

```
npm test
```

**It has worked** when you see a list of ticks ending in:
```
  ✓ area delivery hours ...
  ✓ Worldpay payment page for £1188, priced server-side ...
  ✓ rejects 8 invalid orders
  ✓ limit of 4 deliveries per hour ...
  ✓ webhook: forged token + unknown IP refused ...
  ✓ freed slot can be booked again

6 checks passed
```

**If you see red text or "AssertionError"**, don't deploy yet. Copy everything in the window and send it to me in the chat.

You can close the Terminal now.

---

## Part 3: Put the folder on GitHub (about 5 minutes)

Netlify reads your site from GitHub. Each time you change something later, you'll push it from here and Netlify updates the site automatically.

1. Open **GitHub Desktop**.
2. Click **File → Add local repository…**, then **Choose…**, and select the **nottinggrill-site-with-thanksgiving** folder.
3. It will say "This directory does not appear to be a Git repository". Click **create a repository** there.
   - Name: `nottinggrill-site`
   - Leave everything else as it is, then click **Create repository**.
4. Click **Publish repository** (top right).
   - **Keep "Keep this code private" ticked.**
   - Click **Publish repository**.

**It has worked** when the top bar says "Fetch origin" and you can see **nottinggrill-site** on github.com under your account.

> The `.gitignore` file in the folder already stops the large `node_modules` folder from uploading. If GitHub Desktop lists thousands of changed files anyway, check that `.gitignore` is still in the folder.

---

## Part 4: Connect Netlify to GitHub (about 10 minutes)

### 4a. Decide: new site, or replace the current one?
- **The current nottinggrill.com is already on Netlify (recommended):** open that site in Netlify, go to **Site configuration → Build & deploy → Link repository** (it may say **Link site to Git**), choose GitHub, then **nottinggrill-site**. The domain stays connected.
- **Or start fresh:** Netlify → **Add new site → Import an existing project → GitHub → nottinggrill-site**. You'll connect the domain in Part 7.

### 4b. Build settings
Netlify shows a settings page. Fill it in like this:
- **Branch to deploy:** `main`
- **Build command:** leave it **empty**
- **Publish directory:** `public`
- **Functions directory:** `netlify/functions`

Click **Deploy**. Leave it for now: checkout won't work until Part 5 is done.

> ⚠️ Don't use Netlify's "drag and drop a folder" upload. It leaves out the payment functions, so checkout won't work.

---

## Part 5: Add your private keys to Netlify (about 5 minutes)

These are kept by Netlify, never in the website files.

1. In Netlify, open the site and go to **Site configuration → Environment variables → Add a variable → Add a single variable**.
2. Add each of these, one at a time (Key on the left, Value on the right):

| Key | Value |
|---|---|
| `WORLDPAY_ENTITY` | `PO4101611143` |
| `WORLDPAY_USERNAME` | your Worldpay test username |
| `WORLDPAY_PASSWORD` | your Worldpay test password |
| `WORLDPAY_ENV` | `try` |
| `WORLDPAY_WEBHOOK_TOKEN` | make up a long random phrase, letters and numbers only (e.g. `NGturkey2026xQ7pLm4Vz9`). Write it down, you'll need it in Part 6 |
| `ORDERS_SHEET_URL` | the `/exec` link from the Google Sheet setup |
| `ORDERS_SHEET_SECRET` | the same phrase you put in the sheet script's `SECRET` |

3. Go to **Deploys → Trigger deploy → Deploy site**. Wait for the green **Published** label.

---

## Part 6: Tell Worldpay where to send payment updates (about 5 minutes)

1. Log in to **dashboard.worldpay.com** and make sure you're looking at the **test** (Try) environment.
2. Find **Webhooks** or **Events** (usually under Developer Tools or Settings) and add a new one.
3. URL (replace the last part with your token from Part 5):
   ```
   https://nottinggrill.com/.netlify/functions/worldpay-webhook?token=YOUR_TOKEN_HERE
   ```
   If the domain isn't connected yet, use the Netlify address instead, e.g. `https://nottinggrill-site.netlify.app/.netlify/functions/worldpay-webhook?token=...`
4. Tick these events: **authorized, sentForSettlement, refused, cancelled, error, expired**. Save.
5. For Apple Pay and Google Pay, add `nottinggrill.com` as your website domain in the payment page / wallet settings.

---

## Part 7: Connect the domain (skip this if you used an existing site in 4a)

Netlify → **Domain management → Add a domain** → type `nottinggrill.com` and follow the instructions it gives you. You'll copy a couple of settings into wherever the domain is registered. It can take up to a few hours to switch over.

---

## Part 8: Place a test order (about 5 minutes)

1. Go to **nottinggrill.com/thanksgiving/**.
2. Pick a table size, a delivery area, a day and an hour, fill in your details and click **Pay securely**.
3. Worldpay's payment page opens. Use a **test card** from Worldpay's docs (Hosted Payment Pages → Testing). No real money is taken in test mode.
4. Check four things:
   - ✅ You come back to the site and see **"Your table is booked."**
   - ✅ The payment shows in the **Worldpay test dashboard**
   - ✅ A new row appears in the **Google Sheet**
   - ✅ Justin and Phil each get the order email, and the customer email address you used gets a confirmation

If any of these don't happen, wait two minutes and check again. If it still hasn't happened, see "If something goes wrong" below.

---

## Part 9: Go live

Once Worldpay approves you for live payments:
1. In Netlify → Environment variables, change `WORLDPAY_USERNAME` and `WORLDPAY_PASSWORD` to the **live** ones, and change `WORLDPAY_ENV` to `live`.
2. In the Worldpay **live** dashboard, repeat Part 6 (same URL, same events).
3. Netlify → **Deploys → Trigger deploy**.
4. Place one small real order to confirm, then refund it from the Worldpay dashboard.

**Don't send the live credentials by email or chat.** Type them straight into Netlify.

---

## Making changes later
1. Edit the files in the folder (for example prices in `netlify/lib/catalog.mjs` **and** `public/thanksgiving/index.html`).
2. Open Terminal in the folder and run `npm test`. Only continue if it says **checks passed**.
3. In GitHub Desktop, type a short note bottom left (e.g. "Change pie price"), click **Commit to main**, then **Push origin**.
4. Netlify updates the site by itself within a minute or two.

---

## If something goes wrong

| What you see | What to do |
|---|---|
| `npm: command not found` / `'npm' is not recognized` | Node.js isn't installed or the Terminal was open before you installed it. Close the Terminal, reopen it and try again. |
| "Checkout could not start" on the site | A Worldpay key is missing or mistyped. Check the three `WORLDPAY_` values in Netlify, then **Trigger deploy** again. |
| Payment works but no row in the sheet | Check `ORDERS_SHEET_URL` and `ORDERS_SHEET_SECRET` in Netlify, and that the sheet script was deployed as "Anyone". Worldpay retries automatically, so the order will appear once it's fixed. |
| Payment works but the hour still shows the same number of places | The Worldpay webhook isn't reaching the site. Check the URL and token in Part 6 match exactly. |
| Anything else | In Netlify go to **Logs → Functions**, open `create-checkout` or `worldpay-webhook`, copy the red lines and send them to Phil. |

Contacts: justin@nottinggrill.com (food & orders) · phil@nottinggrill.com (site)
