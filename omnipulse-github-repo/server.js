/**
 * OmniPulse Full-Stack Webhook Backend (Render / Vercel / Node.js)
 * Explicitly serves index.html or omnichannel_ticket_tracker.html on GET /
 * so "Cannot GET /" never occurs.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'omnipulse_secret_verify_token_2026';

const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use(express.static(process.cwd()));

// Helper to find the HTML file regardless of whether it is named index.html or omnichannel_ticket_tracker.html
function resolveHtmlFile() {
  const candidates = [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'omnichannel_ticket_tracker.html'),
    path.join(process.cwd(), 'index.html'),
    path.join(process.cwd(), 'omnichannel_ticket_tracker.html'),
    path.join(__dirname, 'omnipulse-github-repo', 'index.html'),
    path.join(process.cwd(), 'omnipulse-github-repo', 'index.html')
  ];
  for (const file of candidates) {
    if (fs.existsSync(file)) return file;
  }
  return null;
}

// Explicit Root Route so "Cannot GET /" never happens
app.get('/', (req, res) => {
  const htmlPath = resolveHtmlFile();
  if (htmlPath) {
    return res.sendFile(htmlPath);
  }
  res.status(200).send(`
    <body style="font-family:sans-serif;background:#0f172a;color:#f8fafc;padding:40px;">
      <h2>OmniPulse Webhook Server is Running! ✅</h2>
      <p>Your Node.js server (<code>server.js</code>) is online, but <code>index.html</code> was not found in the same folder.</p>
      <p><strong>Fix:</strong> Upload <code>index.html</code> to the root of your GitHub repository (the exact same folder where <code>server.js</code> is located) and redeploy.</p>
    </body>
  `);
});

const clients = new Set();

app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  clients.add(res);
  req.on('close', () => clients.delete(res));
});

async function saveAndBroadcastTicket(payload) {
  const ticketId = `TKT-${Math.floor(1060 + Math.random() * 9000)}`;
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (supabase) {
    try {
      await supabase.from('tickets').insert({
        id: ticketId,
        channel: payload.channel,
        sub_type: payload.subType || 'Cloud Webhook',
        customer_name: payload.customerName,
        handle: payload.handle,
        avatar_bg: payload.channel === 'whatsapp' ? 'bg-emerald-600' : 'bg-pink-600',
        initials: (payload.customerName || 'CU').slice(0, 2).toUpperCase(),
        status: 'New',
        priority: payload.priority || 'High',
        unread_count: 1,
        messages: [{ sender: 'customer', text: payload.text, time: nowStr }]
      });
    } catch (err) {
      console.error('Supabase insert error:', err.message);
    }
  }

  const sseData = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    client.write(sseData);
  }
}

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  const body = req.body;
  if (body.object === 'whatsapp_business_account') {
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value || {};
        const contact = (value.contacts && value.contacts[0]) || {};
        const message = (value.messages && value.messages[0]) || null;
        if (message) {
          await saveAndBroadcastTicket({
            channel: 'whatsapp',
            subType: 'WA Business Cloud API',
            customerName: (contact.profile && contact.profile.name) || 'WhatsApp Customer',
            handle: `+${message.from}`,
            priority: 'High',
            text: (message.text && message.text.body) || '[Media Attachment]'
          });
        }
      }
    }
    return res.sendStatus(200);
  }

  if (body.object === 'instagram') {
    for (const entry of body.entry || []) {
      for (const messaging of entry.messaging || []) {
        if (messaging.message && !messaging.message.is_echo) {
          await saveAndBroadcastTicket({
            channel: 'instagram',
            subType: 'IG Direct Webhook',
            customerName: `IG User ${messaging.sender.id.slice(-4)}`,
            handle: `@ig_${messaging.sender.id.slice(-6)}`,
            priority: 'High',
            text: messaging.message.text || '[Instagram Story Mention / Media]'
          });
        }
      }
    }
    return res.sendStatus(200);
  }
  return res.sendStatus(404);
});

app.post('/webhook/simulate', async (req, res) => {
  const { channel = 'whatsapp', customerName = 'Test Customer', handle = '+62812000011', text = 'Incoming webhook test!' } = req.body || {};
  await saveAndBroadcastTicket({ channel, customerName, handle, priority: 'Urgent', text });
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`OmniPulse Full-Stack Server listening on port ${PORT}`);
});
