// ===================================================
// ✅ STEP 1: Fill in your EmailJS credentials below
//    Sign up free at https://www.emailjs.com
//    Dashboard → Email Services → Add Service  → copy Service ID
//    Dashboard → Email Templates → Create Template → copy Template ID
//    Dashboard → Account → Public Key
// ===================================================
const EMAILJS_SERVICE_ID  = "service_uamjaln";
const EMAILJS_TEMPLATE_ID = "template_jrvelis";
const EMAILJS_PUBLIC_KEY  = "_BOAjL4FnOVyXVgCO";

// ===================================================
// ✅ STEP 2: In your EmailJS template, map these
//    variables to the right fields:
//      {{to_email}}  → To address
//      {{cc_email}}  → CC  (optional)
//      {{bcc_email}} → BCC (optional)
//      {{subject}}   → Subject
//      {{message}}   → Message body
// ===================================================

// ---- Safe localStorage helpers (won't crash in private/sandboxed tabs) ----
function lsGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { /* silently ignore */ }
}

// In-memory arrays (always reliable, localStorage is bonus persistence)
let sentEmails  = lsGet("sentEmails",  []);
let draftEmails = lsGet("draftEmails", []);

document.addEventListener("DOMContentLoaded", () => {

  // ---- Form elements ----
  const form          = document.getElementById("compose-form");
  const toInput       = document.getElementById("to");
  const ccInput       = document.getElementById("cc");
  const bccInput      = document.getElementById("bcc");
  const subjectInput  = document.getElementById("subject");
  const messageInput  = document.getElementById("message");
  const errorBanner   = document.getElementById("error-banner");
  const statusBanner  = document.getElementById("status-banner");
  const connectionStatus = document.getElementById("connection-status");
  const saveDraftBtn  = document.getElementById("save-draft");

  // ---- Mail lists ----
  const sentList   = document.getElementById("sent-list");
  const draftList  = document.getElementById("draft-list");
  const sentCount  = document.getElementById("sent-count");
  const draftCount = document.getElementById("draft-count");

  // ---- Navigation ----
  const navItems   = document.querySelectorAll(".nav-item");
  const views      = document.querySelectorAll(".view");
  const composeBtn = document.getElementById("compose-btn");

  // ---- Check credentials on load ----
  const credsMissing =
    EMAILJS_SERVICE_ID  === "YOUR_SERVICE_ID"  ||
    EMAILJS_TEMPLATE_ID === "YOUR_TEMPLATE_ID" ||
    EMAILJS_PUBLIC_KEY  === "YOUR_PUBLIC_KEY";

  if (credsMissing) {
    connectionStatus.textContent = "⚠ EmailJS not configured";
    connectionStatus.className   = "status-dot disconnected";
  } else {
    // Init EmailJS with the key from app.js (overrides the one in index.html)
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    connectionStatus.textContent = "● Connected via EmailJS";
    connectionStatus.className   = "status-dot connected";
  }

  // ---- View switching ----
  function showView(name) {
    views.forEach(view => {
      view.classList.toggle("view-active", view.id === `view-${name}`);
    });
    navItems.forEach(item => {
      item.classList.toggle("active", item.dataset.view === name);
    });
  }

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      if (item.dataset.view) showView(item.dataset.view);
    });
  });

  composeBtn.addEventListener("click", () => showView("compose"));

  // ---- Banner helpers ----
  function showBanner(type, text) {
    errorBanner.style.display  = type === "error-required" ? "block" : "none";
    statusBanner.style.display = type !== "error-required" ? "block" : "none";
    if (type !== "error-required") {
      statusBanner.className   = `banner ${type}`;
      statusBanner.textContent = text;
    }
  }

  function hideBanners() {
    errorBanner.style.display  = "none";
    statusBanner.style.display = "none";
  }

  // ---- Render sent list ----
  function renderSent() {
    sentList.innerHTML = "";

    if (sentEmails.length === 0) {
      sentList.innerHTML = '<li class="empty-state">No sent emails yet.</li>';
    } else {
      sentEmails.forEach(mail => {
        const li = document.createElement("li");
        li.className = "mail-item";
        li.innerHTML = `
          <div class="mail-main">
            <div class="mail-line">
              <span class="mail-to">${escHtml(mail.to)}</span>
              <span class="mail-date">${escHtml(mail.time)}</span>
            </div>
            <div class="mail-subject">${escHtml(mail.subject || "(No Subject)")}</div>
          </div>`;
        sentList.appendChild(li);
      });
    }

    sentCount.textContent = sentEmails.length;
  }

  // ---- Render drafts list ----
  function renderDrafts() {
    draftList.innerHTML = "";

    if (draftEmails.length === 0) {
      draftList.innerHTML = '<li class="empty-state">No drafts saved yet.</li>';
    } else {
      draftEmails.forEach((mail, index) => {
        const li = document.createElement("li");
        li.className = "mail-item";
        li.innerHTML = `
          <div class="mail-main">
            <div class="mail-line">
              <span class="mail-to">${escHtml(mail.to || "(No Recipient)")}</span>
              <span class="mail-date">${escHtml(mail.time)}</span>
            </div>
            <div class="mail-subject">${escHtml(mail.subject || "(No Subject)")}</div>
          </div>`;

        // Click a draft → load it back into the compose form
        li.addEventListener("click", () => {
          toInput.value      = mail.to      || "";
          ccInput.value      = mail.cc      || "";
          bccInput.value     = mail.bcc     || "";
          subjectInput.value = mail.subject || "";
          messageInput.value = mail.message || "";

          draftEmails.splice(index, 1);
          lsSet("draftEmails", draftEmails);
          renderDrafts();
          hideBanners();
          showView("compose");
        });

        draftList.appendChild(li);
      });
    }

    draftCount.textContent = draftEmails.length;
  }

  // ---- Save draft ----
  saveDraftBtn.addEventListener("click", () => {
    const draft = {
      to:      toInput.value.trim(),
      cc:      ccInput.value.trim(),
      bcc:     bccInput.value.trim(),
      subject: subjectInput.value.trim(),
      message: messageInput.value.trim(),
      time:    new Date().toLocaleString()
    };

    draftEmails.unshift(draft);
    lsSet("draftEmails", draftEmails);
    renderDrafts();
    showBanner("info", "✔ Draft saved.");
  });

  // ---- Send email ----
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const to      = toInput.value.trim();
    const subject = subjectInput.value.trim();
    const message = messageInput.value.trim();

    // Basic validation
    if (!to || !subject || !message) {
      showBanner("error-required");
      return;
    }

    // Block send if credentials not set
    if (credsMissing) {
      showBanner("error",
        "⚠ EmailJS is not configured. Open app.js and fill in your Service ID, Template ID, and Public Key.");
      return;
    }

    showBanner("info", "⏳ Sending…");

    const templateParams = {
      to_email:  to,
      cc_email:  ccInput.value.trim(),
      bcc_email: bccInput.value.trim(),
      subject:   subject,
      message:   message
    };

    emailjs
      .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY)
      .then(() => {
        showBanner("success", "✔ Email sent successfully!");

        const sent = { to, subject, message, time: new Date().toLocaleString() };
        sentEmails.unshift(sent);
        lsSet("sentEmails", sentEmails);
        renderSent();

        form.reset();
      })
      .catch(err => {
        console.error("EmailJS error:", err);
        showBanner("error",
          `✖ Failed to send. Check your EmailJS credentials and template variable names. (${err.text || err})`);
      });
  });

  // ---- Welcome template ----
  document.getElementById("welcome-template").addEventListener("click", () => {
    subjectInput.value = "Welcome to TechMail!";
    messageInput.value =
`Hi,

Thank you for trying TechMail.

Regards,
TechMail Team`;
    hideBanners();
  });

  // ---- Escape HTML (prevent XSS in rendered lists) ----
  function escHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ---- Initial render ----
  renderSent();
  renderDrafts();
  showView("compose");
});
