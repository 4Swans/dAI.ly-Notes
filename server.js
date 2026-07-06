/* ============================================================
   dAI.ly Notes — server.js
   Node.js proxy server for Dify Workflow / Chat API
   ============================================================ */
'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');

loadEnv(path.join(__dirname, '.env'));

const PORT          = Number(process.env.PORT || 5173);
const DIFY_BASE_URL = (process.env.DIFY_BASE_URL || 'https://api.dify.ai/v1').replace(/\/$/, '');
const DIFY_API_KEY  = process.env.DIFY_API_KEY || '';
const DIFY_MODE     = (process.env.DIFY_MODE || 'workflow').toLowerCase();
const DIFY_USER     = process.env.DIFY_USER  || 'daily-notes-user';
const DIFY_TIMEOUT  = Number(process.env.DIFY_TIMEOUT_MS || 30000);
const publicDir     = __dirname;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
};

/* ── Logging ─────────────────────────────────────────────────── */
function log(level, msg, extra = '') {
  const ts  = new Date().toISOString();
  const tag = level === 'error' ? '✗' : level === 'warn' ? '⚠' : '→';
  console.log(`[${ts}] ${tag} ${msg}${extra ? ' ' + extra : ''}`);
}

/* ── Server ──────────────────────────────────────────────────── */
const server = http.createServer(async (req, res) => {
  // CORS headers for local development
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    if (req.method === 'GET'  && req.url === '/api/health') {
      await handleHealth(req, res);
      return;
    }
    if (req.method === 'POST' && req.url === '/api/agent') {
      await handleAgent(req, res);
      return;
    }
    if (req.method === 'GET') {
      serveStatic(req, res);
      return;
    }
    sendJson(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    log('error', 'Unhandled server error:', error.message);
    sendJson(res, 500, { error: error.message || 'Internal server error' });
  }
});

server.listen(PORT, () => {
  log('info', `dAI.ly Notes running at http://localhost:${PORT}`);
  log('info', `Dify mode: ${DIFY_MODE} | base: ${DIFY_BASE_URL}`);
  log('info', `API key configured: ${DIFY_API_KEY ? 'yes' : 'NO — fill DIFY_API_KEY in .env'}`);
});

/* ── Health Check ────────────────────────────────────────────── */
async function handleHealth(req, res) {
  sendJson(res, 200, {
    status:          'ok',
    difyConfigured:  !!DIFY_API_KEY,
    difyMode:        DIFY_MODE,
    difyBaseUrl:     DIFY_BASE_URL,
    timestamp:       new Date().toISOString(),
  });
}

/* ── Agent Handler ───────────────────────────────────────────── */
async function handleAgent(req, res) {
  const body   = await readJson(req);
  const prompt = String(body.prompt || '').trim();
  if (!prompt) return sendJson(res, 400, { error: 'Prompt is required' });

  if (!DIFY_API_KEY) {
    return sendJson(res, 503, {
      error:  'DIFY_API_KEY is not configured. Copy .env.example to .env and fill your Dify key.',
      result: {
        reply:   'Server belum punya DIFY_API_KEY. Isi file .env agar saya bisa menjalankan workflow Dify.',
        actions: [],
      },
    });
  }

  const context  = body.context || {};
  const endpoint = DIFY_MODE === 'chat' ? '/chat-messages' : '/workflows/run';

  const difyPayload = DIFY_MODE === 'chat'
    ? {
        query:           buildSystemPrompt(prompt, context),
        inputs:          context,
        response_mode:   'blocking',
        user:            DIFY_USER,
        conversation_id: body.conversationId || undefined,
      }
    : {
        inputs: {
          prompt,
          selected_date: context.selectedDate,
          note_title:    context.noteTitle,
          note_body:     context.noteBody,
          notes_json:    JSON.stringify(context.notes || {}),
        },
        response_mode: 'blocking',
        user:          DIFY_USER,
      };

  log('info', `POST ${DIFY_BASE_URL}${endpoint}`, `prompt="${prompt.slice(0, 60)}..."`);

  // AbortController for timeout
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), DIFY_TIMEOUT);

  try {
    const difyResponse = await fetch(`${DIFY_BASE_URL}${endpoint}`, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body:   JSON.stringify(difyPayload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const text = await difyResponse.text();
    const data = parseJson(text) || { raw: text };

    log('info', `Dify responded`, `status=${difyResponse.status}`);

    if (!difyResponse.ok) {
      return sendJson(res, difyResponse.status, {
        error: data.message || data.error || 'Dify API request failed',
        dify:  data,
      });
    }

    sendJson(res, 200, normalizeDifyResponse(data));
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      log('error', 'Dify request timed out');
      return sendJson(res, 504, { error: `Dify request timed out after ${DIFY_TIMEOUT}ms` });
    }
    throw err;
  }
}

/* ── Response Normalization ──────────────────────────────────── */
function normalizeDifyResponse(data) {
  if (DIFY_MODE === 'chat') {
    return {
      answer:         data.answer,
      conversationId: data.conversation_id,
      dify:           data,
    };
  }
  return {
    result: data.data?.outputs || data.outputs || data,
    dify:   data,
  };
}

/* ── Prompt Builder (chat mode) ──────────────────────────────── */
function buildSystemPrompt(prompt, context) {
  return [
    'Kamu adalah agentic AI untuk aplikasi daily notes.',
    'Balas HANYA dalam JSON valid dengan bentuk: {"reply":"pesan singkat ke user","actions":[...]}',
    'Action yang didukung: set_note, append_note, replace_text, move_note, delete_note.',
    `Tanggal aktif: ${context.selectedDate}`,
    `Judul note: ${context.noteTitle || '(kosong)'}`,
    `Isi note saat ini:\n${context.noteBody || '(kosong)'}`,
    `Perintah user: ${prompt}`,
  ].join('\n\n');
}

/* ── Static File Server ──────────────────────────────────────── */
function serveStatic(req, res) {
  const cleanUrl  = decodeURIComponent(req.url.split('?')[0]);
  const requested = cleanUrl === '/' ? '/index.html' : cleanUrl;
  const filePath  = path.normalize(path.join(publicDir, requested));

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const type = mimeTypes[path.extname(filePath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(content);
  });
}

/* ── Helpers ─────────────────────────────────────────────────── */
function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 2_000_000) reject(new Error('Request body too large'));
    });
    req.on('end',   () => resolve(parseJson(raw) || {}));
    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function parseJson(value) {
  try { return JSON.parse(value); } catch { return null; }
}

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const index = trimmed.indexOf('=');
    if (index === -1) return;
    const key   = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  });
}

// Untuk Vercel Serverless Function deployment
module.exports = server;
