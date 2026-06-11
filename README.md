# teapot-orders

# 🫖 The Little Teapot — Order Site

GTA5 RP café ordering website. Orders post to a Discord webhook as rich embeds.

## Setup

### 1. Add your webhook URL
Open `server.js` and fill in the two config values near the top:

```js
const DISCORD_WEBHOOK_URL = 'YOUR_WEBHOOK_URL_HERE';  // paste your webhook
const DISCORD_THREAD_ID   = '';  // optional: forum post / thread ID
```

**To get a webhook URL:**
- Go to your Discord server → the channel or forum you want orders in
- Channel Settings → Integrations → Webhooks → New Webhook → Copy URL

**To post into a forum thread:**
- Create (or open) the forum post you want orders to go into
- Right-click the thread → Copy Thread ID (needs Developer Mode on in Discord settings)
- Paste that ID into `DISCORD_THREAD_ID`

### 2. Run the server
Requires Node.js 18+.

```bash
node server.js
```

The site will be live at **http://localhost:3000**

### 3. Deploy (optional)
To make it publicly accessible, host it on any VPS or service:
- **Railway / Render / Fly.io** — free tiers available, just point to `server.js`
- **VPS (DigitalOcean, etc.)** — run with `pm2 start server.js` to keep it alive

No npm packages needed — uses only Node built-ins + the native `fetch` (Node 18+).

## Files
```
teapot/
├── server.js    ← backend: holds webhook URL, handles /order requests
├── index.html   ← frontend: the menu & ordering UI
├── package.json
└── README.md
```

## How it works
1. Customer builds their order on the website and hits "Place Order"
2. The browser sends the order as JSON to `POST /order` on the Node server
3. The server (privately) forwards it to Discord as a rich embed
4. Customer sees a success message; the webhook URL is never exposed
