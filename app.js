// ===== EmailJS Configuration =====
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";

// Arrays
let sentEmails = JSON.parse(localStorage.getItem("sentEmails")) || [];
let draftEmails = JSON.parse(localStorage.getItem("draftEmails")) || [];

document.addEventListener("DOMContentLoaded", () => {

  // ===== Form Elements =====
  const form = document.getElementById("compose-form");

  const toInput = document.getElementById("to");
  const ccInput = document.getElementById("cc");
  const bccInput = document.getElementById("bcc");

  const subjectInput = document.getElementById("subject");
  const messageInput = document.getElementById("message");

  const errorBanner = document.getElementById("error-banner");
  const statusBanner = document.getElementById("status-banner");

  const connectionStatus = document.getElementById("connection-status");

  const saveDraftBtn = document.getElementById("save-draft");

  // ===== Mail Lists =====
  const sentList = document.getElementById("sent-list");
  const draftList = document.getElementById("draft-list");

  const sentCount = document.getElementById("sent-count");
  const draftCount = document.getElementById("draft-count");

  // ===== Navigation =====
  const navItems = document.querySelectorAll(".nav-item");
  const views = document.querySelectorAll(".view");

  const composeBtn = document.getElementById("compose-btn");

  // ===== Connected Status =====
  connectionStatus.textContent = "● Connected via EmailJS";
  connectionStatus.classList.add("connected");

  // ===== View Switching =====
  function showView(name) {
    views.forEach(view => {
      view.classList.toggle(
        "view-active",
        view.id === `view-${name}`
      );
    });

    navItems.forEach(item => {
      item.classList.toggle(
        "active",
        item.dataset.view === name
      );
    });
  }

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const view = item.dataset.view;

      if (view) {
        showView(view);
      }
    });
  });

  composeBtn.addEventListener("click", () => {
    showView("compose");
  });

  // ===== Render Sent Emails =====
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

          <div class="mail-subject">
            ${mail.subject || "(No Subject)"}
          </div>
        </div>
      `;

      sentList.appendChild(li);

    });

    sentCount.textContent = sentEmails.length;
  }

  // ===== Render Drafts =====
  function renderDrafts() {

    draftList.innerHTML = "";

    draftEmails.forEach((mail, index) => {

      const li = document.createElement("li");

      li.className = "mail-item";

      li.innerHTML = `
        <div class="mail-main">
          <div class="mail-line">
            <span class="mail-to">
              ${mail.to || "(No Recipient)"}
            </span>

            <span class="mail-date">
              ${mail.time}
            </span>
          </div>

          <div class="mail-subject">
            ${mail.subject || "(No Subject)"}
          </div>
        </div>
      `;

      // Load draft back into form
      li.addEventListener("click", () => {

        toInput.value = mail.to;
        ccInput.value = mail.cc;
        bccInput.value = mail.bcc;

        subjectInput.value = mail.subject;
        messageInput.value = mail.message;

        // remove from drafts after opening
        draftEmails.splice(index, 1);

        localStorage.setItem(
          "draftEmails",
          JSON.stringify(draftEmails)
        );

        renderDrafts();

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

      time: new Date().toLocaleString()

    };

    draftEmails.unshift(draft);

    localStorage.setItem(
      "draftEmails",
      JSON.stringify(draftEmails)
    );

    renderDrafts();

    statusBanner.style.display = "block";
    statusBanner.className = "banner info";

    statusBanner.textContent = "Draft saved successfully.";

  });

  // ===== Send Email =====
  form.addEventListener("submit", function (e) {

    e.preventDefault();

    // Validation
    if (
      !toInput.value.trim() ||
      !subjectInput.value.trim() ||
      !messageInput.value.trim()
    ) {

      errorBanner.style.display = "block";

      statusBanner.style.display = "none";

      return;
    }

    errorBanner.style.display = "none";

    statusBanner.style.display = "block";

    statusBanner.className = "banner info";

    statusBanner.textContent = "Sending email...";

    // ===== EmailJS Template Params =====
    const templateParams = {

      to_email: toInput.value.trim(),

      cc_email: ccInput.value.trim(),

      bcc_email: bccInput.value.trim(),

      subject: subjectInput.value.trim(),

      message: messageInput.value.trim()

    };

    // ===== Send =====
    emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    )

    .then((response) => {

      console.log("SUCCESS", response);

      statusBanner.className = "banner success";

      statusBanner.textContent =
        "Email sent successfully.";

      // Save sent email
      const sent = {

        to: toInput.value.trim(),

        subject: subjectInput.value.trim(),

        message: messageInput.value.trim(),

        time: new Date().toLocaleString()

      };

      sentEmails.unshift(sent);

      localStorage.setItem(
        "sentEmails",
        JSON.stringify(sentEmails)
      );

      renderSent();

      // Clear form
      form.reset();

    })

    .catch((error) => {

      console.error("FAILED", error);

      statusBanner.className = "banner error";

      statusBanner.textContent =
        "Failed to send email.";

    });

  });

  // ===== Welcome Template =====
  document
    .getElementById("welcome-template")
    .addEventListener("click", () => {

      subjectInput.value = "Welcome to TechMail!";

      messageInput.value =
`Hi,

Thank you for trying TechMail.

Regards,
TechMail Team`;

    });

  // ===== Initial Load =====
  renderSent();

  renderDrafts();

  showView("compose");

});
