const http = require('http');
const fs = require('fs');
const path = require('path');

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const PORT                = process.env.PORT || 3000;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || 'YOUR_WEBHOOK_URL_HERE';
const DELIVERY_FEE        = 150;
// ─────────────────────────────────────────────────────────────────────────────

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── POST /order ─────────────────────────────────────────────────────────────
  if (req.method === 'POST' && req.url === '/order') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      let order;
      try { order = JSON.parse(body); }
      catch { respond(res, 400, { error: 'Invalid JSON' }); return; }

      const { customerName, orderType, address, notes, items } = order;

      if (!customerName || !items || items.length === 0) {
        respond(res, 400, { error: 'Missing required fields' }); return;
      }

      const isDelivery = orderType === 'Delivery';
      const subtotal   = items.reduce((s, i) => s + i.price * i.qty, 0);
      const total      = isDelivery ? subtotal + DELIVERY_FEE : subtotal;

      const orderLines = items.map(i =>
        i.qty > 1
          ? `**${i.name}** ×${i.qty} — $${(i.price * i.qty).toLocaleString()}`
          : `**${i.name}** — $${i.price.toLocaleString()}`
      ).join('\n');

      const now = new Date();
      const timestamp = now.toLocaleString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true,
        month: 'short', day: 'numeric'
      });

      const totalLine = isDelivery
        ? `**$${total.toLocaleString()} GTA$** (incl. $${DELIVERY_FEE} delivery fee)`
        : `**$${total.toLocaleString()} GTA$**`;

      const embed = {
        title: '🫖 New Order — The Little Teapot',
        color: 0x5C3D2E,
        fields: [
          { name: '👤 Customer',   value: customerName, inline: true },
          { name: '📦 Order Type', value: orderType,    inline: true },
          ...(address ? [{ name: '📍 Address', value: address, inline: false }] : []),
          { name: '🛒 Items',      value: orderLines,   inline: false },
          { name: '💰 Total',      value: totalLine,    inline: false },
          ...(notes ? [{ name: '📝 Notes', value: notes, inline: false }] : []),
        ],
        footer: { text: `Placed at ${timestamp}` },
      };

      let webhookUrl = DISCORD_WEBHOOK_URL;

      try {
        const dcRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: '@here New order received!', embeds: [embed] }),
        });

        if (dcRes.ok || dcRes.status === 204) {
          console.log(`[${timestamp}] Order from ${customerName} — $${total.toLocaleString()} GTA$`);
          respond(res, 200, { success: true, total, isDelivery, deliveryFee: DELIVERY_FEE });
        } else {
          const err = await dcRes.text();
          console.error('Discord error:', dcRes.status, err);
          respond(res, 502, { error: `Discord rejected the request (${dcRes.status})` });
        }
      } catch (err) {
        console.error('Fetch error:', err.message);
        respond(res, 500, { error: 'Could not reach Discord' });
      }
    });
    return;
  }

  // ── Static file serving ─────────────────────────────────────────────────────
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
});

function respond(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

server.listen(PORT, () => {
  console.log(`🫖 The Little Teapot server running at http://localhost:${PORT}`);
  console.log(`   Webhook: ${DISCORD_WEBHOOK_URL !== 'YOUR_WEBHOOK_URL_HERE' ? '✓ configured' : '✗ missing — set DISCORD_WEBHOOK_URL'}`);
});
