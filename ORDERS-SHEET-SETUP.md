# Thanksgiving orders → Google Sheet + email

Every paid order is added as a row to one Google Sheet on your Drive, and Justin and Phil each get an email with the order details and a link to the sheet. About 10 minutes to set up.

## 1. Create the sheet
1. Google Drive → New → Google Sheets. Name it **Notting Grill — Thanksgiving Orders**.
2. Share it with justin@nottinggrill.com and phil@nottinggrill.com (Editor).
3. Extensions → Apps Script. Delete what's there, paste the code below, then change `SECRET` to a long random phrase of your own. Save.

```js
var SECRET = 'change-me-to-a-long-random-phrase';
var RECIPIENTS = 'justin@nottinggrill.com,phil@nottinggrill.com';
var HEAD = ['Paid at','Delivery day','Hour','Area','Name','Email','Phone','Address','Postcode','Guests','Order','Notes','Total','Payment ref','Status'];

function doPost(e) {
  var d = {};
  try { d = JSON.parse(e.postData.contents); } catch (err) { return out('bad'); }
  if (d.secret !== SECRET) return out('forbidden');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Orders') || setup();
  var refs = sh.getRange(2, 14, Math.max(sh.getLastRow() - 1, 1), 1).getValues().map(function (r) { return r[0]; });
  if (refs.indexOf(d.session) === -1) {   // never add the same order twice
    var row = [new Date(d.at), d.delivery_day, d.delivery_window, d.area, d.name, d.email, d.phone, d.address,
               (d.postcode || '').toUpperCase(), Number(d.guests) || '', d.order, d.notes || '', (d.total || 0) / 100, d.session, 'Paid'];
    sh.appendRow(row);
    sh.getRange(sh.getLastRow(), 1).setNumberFormat('ddd d mmm yyyy, HH:mm');
    sh.getRange(sh.getLastRow(), 13).setNumberFormat('£#,##0.00');
    var cells = HEAD.slice(1, 13).map(function (h, i) {
      var v = row[i + 1]; if (i === 11) v = '£' + Number(v).toFixed(2);
      return '<tr><td style="padding:5px 14px 5px 0;color:#8a7f77;font:12px monospace;text-transform:uppercase">' + h +
             '</td><td style="padding:5px 0;font:15px Arial;color:#181210">' + (v === '' ? '—' : v) + '</td></tr>';
    }).join('');
    MailApp.sendEmail({ to: d.email, name: 'Notting Grill', replyTo: 'justin@nottinggrill.com',
        subject: 'Your Notting Grill Thanksgiving order',
        htmlBody: '<p style="font:15px Arial">Hi ' + d.name + ',</p><p style="font:15px Arial">Thank you, your order is booked for ' + d.delivery_day + ', ' + d.delivery_window + '.</p><p style="font:15px Arial">' + d.order + '</p><p style="font:15px Arial">Total paid: £' + ((d.total || 0) / 100).toFixed(2) + '<br>Reference: ' + d.session + '</p><p style="font:15px Arial">Justin &amp; the Notting Grill team</p>' });
    MailApp.sendEmail({
      to: RECIPIENTS, replyTo: d.email,
      subject: 'Thanksgiving order: ' + d.name + ', ' + d.delivery_day + ' ' + d.delivery_window + ' (' + d.area + ')',
      htmlBody: '<h2 style="font-family:Arial">New Thanksgiving order</h2><table>' + cells + '</table>' +
                '<p style="margin-top:20px"><a href="' + ss.getUrl() + '" style="background:#FF8300;color:#181210;padding:12px 20px;text-decoration:none;font:bold 14px Arial">Open the orders sheet</a></p>'
    });
  }
  return out('ok');
}

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Orders') || ss.getSheets()[0];
  sh.setName('Orders');
  sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD]).setBackground('#FF8300').setFontColor('#181210').setFontWeight('bold');
  sh.setFrozenRows(1);
  [150,170,110,120,160,220,130,260,90,60,320,240,80,200,90].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  sh.getRange(2, 15, 999, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Paid','Confirmed','Out for delivery','Delivered','Refunded']).build());
  return sh;
}
function out(t) { return ContentService.createTextOutput(t); }
```

## 2. Authorise
Pick **setup** in the function dropdown → Run → allow the permissions (Sheets + send email as you). The header row appears.

## 3. Deploy
Deploy → New deployment → type **Web app** · Execute as **Me** · Who has access **Anyone** → Deploy. Copy the Web App URL (ends in `/exec`).

## 4. Connect Netlify
Netlify → Site settings → Environment variables:
- `ORDERS_SHEET_URL` = the `/exec` URL
- `ORDERS_SHEET_SECRET` = the same phrase you put in `SECRET`

Redeploy. Place a test order with a Worldpay Try test card: a row should appear and both of you should get the email.

If you edit the script later: Deploy → Manage deployments → edit → New version, so the URL stays the same.
