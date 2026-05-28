// app.js

// ===== REPLACE with your EmailJS values =====
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID_HERE";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID_HERE";
const EMAILJS_PUBLIC_KEY  = "YOUR_PUBLIC_KEY_HERE";
// ===========================================

const sentEmails = [];
const draftEmails = [];

document.addEventListener("DOMContentLoaded", () => {
  // Compose elements
  const form             = document.getElementById("compose-form");
  const toInput          = document.getElementById("to");
  const ccInput          = document.getElementById("cc");
  const bccInput         = document.getElementById("bcc");
  const subjectInput     = document.getElementById("subject");
  const contentTypeInput = document.getElementById("content-type");
  const priorityInput    = document.getElementById("priority");
  const messageInput     = document.getElementById("message");

  const errorBanner      = document.getElementById("error-banner");
  const statusBanner     = document.getElementById("status-banner");
  const connectionStatus = document.getElementById("connection-status");
  const saveDraftBtn     = document.getElementById("save-draft");

  // Sent / Draft lists
  const sentList   = document.getElementById("sent-list");
  const draftList  = document.getElementById("draft-list");
  const sentCount  = document.getElementById("sent-count");
  const draftCount = document.getElementById("draft-count");

  // Nav
  const navItems    = document.querySelectorAll(".nav-item");
  const views       = document.querySelectorAll(".view");
  const composeBtn  = document.getElementById("compose-btn");

  // Show connected
  connectionStatus.textContent = "● Connected via EmailJS";
  connectionStatus.classList.add("connected");

  // ===== View switching =====
  function showView(name) {
    views.forEach(v => {
      v.classList.toggle("view-active", v.id === `view-${name}`);
    });
    navItems.forEach(li => {
      li.classList.toggle("active", li.dataset.view === name);
    });
  }

  navItems.forEach(li => {
    li.addEventListener("click", () => {
      const view = li.dataset.view;
      if (view) showView(view);
    });
  });

  composeBtn.addEventListener("click", () => {
    showView("compose");
  });

  // ===== Render Sent / Drafts =====
  function renderSent() {
    sentList.innerHTML = "";
    sentEmails.forEach(mail => {
      const li = document.createElement("li");
      li.className = "mail-item";
      li.innerHTML = `
        <div class="mail-main">
          <div class="mail-line">
            <span class="mail-to">${mail.to}</span>
            <span class="mail-date">${mail.time}</span>
          </div>
          <div class="mail-subject">${mail.subject || "(no subject)"}</div>
        </div>
      `;
      sentList.appendChild(li);
    });
    sentCount.textContent = sentEmails.length;
  }

  function renderDrafts() {
    draftList.innerHTML = "";
    draftEmails.forEach(mail => {
      const li = document.createElement("li");
      li.className = "mail-item";
      li.innerHTML = `
        <div class="mail-main">
          <div class="mail-line">
            <span class="mail-to">${mail.to || "(no recipient)"}</span>
            <span class="mail-date">${mail.time}</span>
          </div>
          <div class="mail-subject">${mail.subject || "(no subject)"}</div>
        </div>
      `;
      li.addEventListener("click", () => {
        // Load draft back into compose form
        toInput.value          = mail.to;
        ccInput.value          = mail.cc;
        bccInput.value         = mail.bcc;
        subjectInput.value     = mail.subject;
        messageInput.value     = mail.message;
        contentTypeInput.value = mail.contentType;
        priorityInput.value    = mail.priority;
        showView("compose");
      });
      draftList.appendChild(li);
    });
    draftCount.textContent = draftEmails.length;
  }

  // ===== Save Draft =====
  saveDraftBtn.addEventListener("click", () => {
    const draft = {
      to: toInput.value.trim(),
      cc: ccInput.value.trim(),
      bcc: bccInput.value.trim(),
      subject: subjectInput.value.trim(),
      message: messageInput.value.trim(),
      contentType: contentTypeInput.value,
      priority: priorityInput.value,
      time: new Date().toLocaleString()
    };
    draftEmails.unshift(draft);
    renderDrafts();

    statusBanner.style.display = "block";
    statusBanner.className = "banner info";
    statusBanner.textContent = "Draft saved.";
  });

  // ===== Send Email via EmailJS =====
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!toInput.value || !subjectInput.value || !messageInput.value) {
      errorBanner.style.display = "block";
      statusBanner.style.display = "none";
      return;
    }
    errorBanner.style.display = "none";

    statusBanner.style.display = "block";
    statusBanner.className = "banner info";
    statusBanner.textContent = "Sending...";

    const templateParams = {
      // These names must match your EmailJS template variables
      to_email: toInput.value,
      cc_email: ccInput.value || "",
      bcc_email: bccInput.value || "",
      subject: subjectInput.value,
      message: messageInput.value,
      content_type: contentTypeInput.value,
      priority: priorityInput.value
    };

    emailjs
      .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY)
      .then(
        (response) => {
          statusBanner.className = "banner success";
          statusBanner.textContent = "Email sent successfully!";
          console.log("SUCCESS", response.status, response.text);

          const sent = {
            to: toInput.value.trim(),
            subject: subjectInput.value.trim(),
            message: messageInput.value.trim(),
            time: new Date().toLocaleString()
          };
          sentEmails.unshift(sent);
          renderSent();
        },
        (error) => {
          statusBanner.className = "banner error";
          statusBanner.textContent =
            "Failed to send email. Open browser console for details.";
          console.error("FAILED", error);
        }
      );
  });

  // ===== Templates =====
  document.getElementById("welcome-template").addEventListener("click", () => {
    subjectInput.value = "Welcome to TechMail!";
    messageInput.value =
      "Hi,\n\nThank you for trying the TechMail SMTP client demo.\n\nRegards,\nTechMail Team";
  });

  document.getElementById("followup-template").addEventListener("click", () => {
    subjectInput.value = "Following up on our last email";
    messageInput.value =
      "Hi,\n\nJust following up on my previous message.\n\nBest regards,\nTechMail User";
  });

  // Initial view
  showView("compose");
});