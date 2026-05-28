# TechMail — Full-Stack SMTP Email Client

A fully functional dark-themed SMTP email client.  
**Python Flask** handles the real email sending; **HTML/CSS/JS** is the frontend UI.

---

## Project Structure

```
techmail/
├── app.py                  ← Flask server + SMTP logic
├── requirements.txt        ← Python dependencies
├── templates/
│   └── index.html          ← Main UI (served by Flask)
├── static/
│   ├── css/style.css       ← All styles
│   └── js/app.js           ← Frontend logic (calls /api/*)
└── README.md
```

---

## Quick Start

### 1. Clone & install dependencies

```bash
git clone https://github.com/YOUR_USERNAME/techmail.git
cd techmail
pip install -r requirements.txt
```

### 2. Run the server

```bash
python app.py
```

Open your browser at **http://localhost:5000**

---

## Using the App

1. Click **⚙️ SMTP Providers** (or the cog icon in the rail).
2. Pick a provider chip (Gmail / Outlook / Yahoo) or enter custom settings.
3. Enter your email and password, then click **Test Connection** to verify.
4. Click **Save & Connect** — the badge turns green.
5. Compose a message and hit **Send Email**.

---

## SMTP Provider Settings

| Provider | Host | Port |
|----------|------|------|
| Gmail    | smtp.gmail.com | 587 |
| Outlook  | smtp-mail.outlook.com | 587 |
| Yahoo    | smtp.mail.yahoo.com | 587 |
| Custom   | your-smtp-server | 587 / 465 |

### Gmail — App Password (required)

Google blocks plain passwords for third-party apps.  
You must create an **App Password**:

1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Select app → **Mail**, device → **Other**
3. Copy the 16-character password and paste it into TechMail

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET  | `/` | Serve the UI |
| POST | `/api/smtp/test` | Test SMTP credentials |
| POST | `/api/send` | Send an email |
| GET  | `/api/sent` | List sent emails (session) |
| GET  | `/api/drafts` | List drafts |
| POST | `/api/drafts` | Save a draft |
| DELETE | `/api/drafts/<idx>` | Delete a draft |

---

## Features

- ✅ Real SMTP sending (Gmail, Outlook, Yahoo, custom)
- ✅ TLS (port 587) and SSL (port 465) support
- ✅ CC / BCC support
- ✅ Plain Text and HTML email body
- ✅ Priority headers (High / Normal / Low)
- ✅ Test Connection button
- ✅ Save & load Drafts
- ✅ Sent folder
- ✅ Welcome & Follow-up email templates

---

## License

MIT
