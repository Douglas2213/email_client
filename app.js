/**
 * TechMail — SMTP Email Client
 * static/js/app.js
 *
 * All API calls hit the Flask backend at /api/*
 */

'use strict';

/* ─── SMTP config (saved in memory after "Save & Connect") ──────── */
let smtpConfig = null;

/* ─────────────────────────────────────────────────────────────────
   NAVIGATION
──────────────────────────────────────────────────────────────────── */
function showView(name, el) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  el.classList.add('active');
  if (name === 'sent')   loadSent();
  if (name === 'drafts') loadDrafts();
}

/* ─────────────────────────────────────────────────────────────────
   SMTP MODAL
──────────────────────────────────────────────────────────────────── */
const PROVIDERS = {
  gmail:   { host: 'smtp.gmail.com',          port: 587 },
  outlook: { host: 'smtp-mail.outlook.com',   port: 587 },
  yahoo:   { host: 'smtp.mail.yahoo.com',     port: 587 },
  custom:  { host: '',                        port: 587 },
};

function openSmtp() {
  document.getElementById('smtpModal').classList.add('open');
  clearTestResult();
}
function closeSmtp() {
  document.getElementById('smtpModal').classList.remove('open');
}
function fillProvider(name) {
  const p = PROVIDERS[name];
  document.getElementById('smtpHost').value = p.host;
  document.getElementById('smtpPort').value = p.port;
  if (name !== 'custom') document.getElementById('smtpHost').readOnly = true;
  else                   document.getElementById('smtpHost').readOnly = false;
  clearTestResult();
}

async function testSmtp() {
  const payload = getSmtpFields();
  if (!payload) return;

  setTestResult('🔌 Testing connection…', '');
  try {
    const res  = await fetch('/api/smtp/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.ok) setTestResult('✔ ' + data.message, 'ok');
    else         setTestResult('✗ ' + data.error,   'err');
  } catch (e) {
    setTestResult('✗ Could not reach the server. Is Flask running?', 'err');
  }
}

function saveSmtp() {
  const payload = getSmtpFields();
  if (!payload) return;
  smtpConfig = payload;

  const badge = document.getElementById('connBadge');
  badge.className = 'conn-badge connected';
  badge.innerHTML = `<div class="conn-dot"></div><span>${payload.username}</span>`;
  closeSmtp();
}

function getSmtpFields() {
  const host     = document.getElementById('smtpHost').value.trim();
  const port     = document.getElementById('smtpPort').value.trim();
  const username = document.getElementById('smtpUser').value.trim();
  const password = document.getElementById('smtpPass').value.trim();
  const from     = document.getElementById('smtpFrom').value.trim();

  if (!host || !port || !username || !password) {
    setTestResult('✗ Please fill in Host, Port, Username and Password.', 'err');
    return null;
  }
  return { host, port: Number(port), username, password, from };
}

function setTestResult(msg, type) {
  const el = document.getElementById('testResult');
  el.textContent = msg;
  el.className   = 'test-result' + (type ? ' ' + type : '');
}
function clearTestResult() {
  document.getElementById('testResult').className = 'test-result hidden';
}

/* ─────────────────────────────────────────────────────────────────
   COMPOSE / SEND
──────────────────────────────────────────────────────────────────── */
async function sendEmail() {
  const to      = document.getElementById('toField').value.trim();
  const subject = document.getElementById('subjectField').value.trim();
  const body    = document.getElementById('bodyField').value.trim();

  if (!to || !subject || !body) {
    showNotif('error', '⚠️ Please fill in the To address, Subject, and Message.');
    return;
  }
  if (!smtpConfig) {
    showNotif('error', '⚠️ No SMTP server configured. Open SMTP Providers first.');
    return;
  }

  const btn   = document.getElementById('sendBtn');
  const label = document.getElementById('sendLabel');
  btn.disabled     = true;
  label.innerHTML  = '<span class="spinner"></span> Sending…';

  const payload = {
    smtpHost: smtpConfig.host,
    smtpPort: smtpConfig.port,
    smtpUser: smtpConfig.username,
    smtpPass: smtpConfig.password,
    smtpFrom: smtpConfig.from,
    to,
    cc:          document.getElementById('ccField').value.trim(),
    bcc:         document.getElementById('bccField').value.trim(),
    subject,
    body,
    contentType: document.getElementById('contentType').value,
    priority:    document.getElementById('priority').value,
  };

  try {
    const res  = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (data.ok) {
      showNotif('success', '✅ ' + data.message);
      clearForm(true);
      // refresh sent badge
      loadSentCount();
    } else {
      showNotif('error', '✗ ' + data.error);
    }
  } catch (e) {
    showNotif('error', '✗ Network error — is the Flask server running?');
  } finally {
    btn.disabled    = false;
    label.innerHTML = '📨 Send Email';
  }
}

/* ─────────────────────────────────────────────────────────────────
   CLEAR / TEMPLATES
──────────────────────────────────────────────────────────────────── */
function clearForm(keepNotif = false) {
  ['toField','ccField','bccField','subjectField','bodyField']
    .forEach(id => { document.getElementById(id).value = ''; });
  if (!keepNotif) hideNotif();
}

function applyTemplate(type) {
  hideNotif();
  if (type === 'welcome') {
    document.getElementById('subjectField').value = 'Welcome to our platform! 🎉';
    document.getElementById('bodyField').value =
`Hi there,

Welcome aboard! We're thrilled to have you with us.

Here are a few things to get you started:
  • Explore your dashboard
  • Complete your profile
  • Check out our getting-started guide

If you have any questions, don't hesitate to reach out.

Best regards,
The Team`;
  } else {
    document.getElementById('subjectField').value = 'Following up on our conversation';
    document.getElementById('bodyField').value =
`Hi,

I wanted to follow up on our previous conversation.

Could you let me know if you've had a chance to review what we discussed?
I'm happy to answer any questions or provide additional information.

Looking forward to hearing from you.

Best,`;
  }
}

/* ─────────────────────────────────────────────────────────────────
   DRAFTS
──────────────────────────────────────────────────────────────────── */
async function saveDraft() {
  const to      = document.getElementById('toField').value.trim();
  const subject = document.getElementById('subjectField').value.trim();
  const body    = document.getElementById('bodyField').value.trim();

  if (!to && !subject && !body) {
    showNotif('error', '⚠️ Nothing to save — compose fields are empty.');
    return;
  }

  try {
    const res  = await fetch('/api/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, body }),
    });
    const data = await res.json();
    document.getElementById('draftBadge').textContent = data.count;
    showNotif('info', '✔ Draft saved successfully.');
  } catch (e) {
    showNotif('error', '✗ Could not save draft.');
  }
}

async function loadDrafts() {
  const list  = document.getElementById('draftList');
  const empty = document.getElementById('draftsEmpty');
  list.innerHTML = '';

  try {
    const res    = await fetch('/api/drafts');
    const drafts = await res.json();

    document.getElementById('draftBadge').textContent = drafts.length;

    if (!drafts.length) { empty.style.display = 'flex'; return; }
    empty.style.display = 'none';

    drafts.forEach((d, i) => {
      const div = document.createElement('div');
      div.className = 'email-item';
      div.innerHTML = `
        <div>
          <div class="email-to">To: ${esc(d.to || '(no recipient)')}</div>
          <div class="email-subj">${esc(d.subject || '(no subject)')}</div>
          <div class="email-preview">${esc((d.body || '').slice(0, 90))}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
          <button class="btn btn-danger" style="padding:3px 8px;font-size:11px" onclick="deleteDraft(${i}, event)">✕</button>
        </div>`;
      div.addEventListener('click', () => loadDraftIntoCompose(d, i));
      list.appendChild(div);
    });
  } catch (e) {
    empty.style.display = 'flex';
    empty.querySelector('.empty-text').textContent = 'Could not load drafts.';
  }
}

async function deleteDraft(idx, event) {
  event.stopPropagation();
  await fetch(`/api/drafts/${idx}`, { method: 'DELETE' });
  loadDrafts();
}

async function loadDraftIntoCompose(draft, idx) {
  document.getElementById('toField').value      = draft.to      || '';
  document.getElementById('subjectField').value = draft.subject || '';
  document.getElementById('bodyField').value    = draft.body    || '';
  await fetch(`/api/drafts/${idx}`, { method: 'DELETE' });
  showView('compose', document.querySelectorAll('.nav-item')[0]);
}

/* ─────────────────────────────────────────────────────────────────
   SENT
──────────────────────────────────────────────────────────────────── */
async function loadSent() {
  const list  = document.getElementById('sentList');
  const empty = document.getElementById('sentEmpty');
  list.innerHTML = '';

  try {
    const res   = await fetch('/api/sent');
    const sent  = await res.json();

    document.getElementById('sentBadge').textContent = sent.length;

    if (!sent.length) { empty.style.display = 'flex'; return; }
    empty.style.display = 'none';

    sent.forEach(e => {
      const div = document.createElement('div');
      div.className = 'email-item';
      div.innerHTML = `
        <div>
          <div class="email-to">To: ${esc(e.to)}</div>
          <div class="email-subj">${esc(e.subject)}</div>
          <div class="email-preview">${esc((e.body || '').slice(0, 90))}…</div>
        </div>
        <div>
          <div class="email-status"><span class="status-dot"></span></div>
        </div>`;
      list.appendChild(div);
    });
  } catch (e) {
    empty.style.display = 'flex';
  }
}

async function loadSentCount() {
  try {
    const res  = await fetch('/api/sent');
    const sent = await res.json();
    document.getElementById('sentBadge').textContent = sent.length;
  } catch (_) {}
}

/* ─────────────────────────────────────────────────────────────────
   NOTIFICATION BAR
──────────────────────────────────────────────────────────────────── */
function showNotif(type, msg) {
  const bar = document.getElementById('notifBar');
  bar.textContent = msg;
  bar.className   = `notif-bar ${type}`;
  if (type === 'info' || type === 'success') {
    setTimeout(hideNotif, 3000);
  }
}
function hideNotif() {
  document.getElementById('notifBar').className = 'notif-bar hidden';
}

/* ─────────────────────────────────────────────────────────────────
   UTILS
──────────────────────────────────────────────────────────────────── */
function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ─────────────────────────────────────────────────────────────────
   INIT
──────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  hideNotif();
  loadSentCount();
});
