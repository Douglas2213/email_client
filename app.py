"""
TechMail — SMTP Email Client
Flask backend: handles SMTP connection and email sending.
"""

import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formataddr
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allow the frontend to talk to this server

# ── in-memory stores (replace with a DB for production) ──
sent_emails = []
draft_emails = []


# ─────────────────────────────────────────
#  PAGES
# ─────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')


# ─────────────────────────────────────────
#  API: TEST CONNECTION
# ─────────────────────────────────────────

@app.route('/api/smtp/test', methods=['POST'])
def test_smtp():
    """Verify SMTP credentials without sending a message."""
    data = request.get_json()

    host     = data.get('host', '').strip()
    port     = int(data.get('port', 587))
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not all([host, port, username, password]):
        return jsonify({'ok': False, 'error': 'Missing required SMTP fields.'}), 400

    try:
        if port == 465:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(host, port, context=context, timeout=10) as server:
                server.login(username, password)
        else:
            with smtplib.SMTP(host, port, timeout=10) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(username, password)

        return jsonify({'ok': True, 'message': f'Connected to {host}:{port}'})

    except smtplib.SMTPAuthenticationError:
        return jsonify({'ok': False, 'error': 'Authentication failed. Check username / password (use an App Password for Gmail).'}), 401
    except smtplib.SMTPConnectError as e:
        return jsonify({'ok': False, 'error': f'Cannot reach {host}:{port} — {e}'}), 502
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


# ─────────────────────────────────────────
#  API: SEND EMAIL
# ─────────────────────────────────────────

@app.route('/api/send', methods=['POST'])
def send_email():
    """Send an email via the supplied SMTP credentials."""
    data = request.get_json()

    # SMTP config
    host     = data.get('smtpHost', '').strip()
    port     = int(data.get('smtpPort', 587))
    username = data.get('smtpUser', '').strip()
    password = data.get('smtpPass', '').strip()
    from_name = data.get('smtpFrom', '').strip() or 'TechMail'

    # Message fields
    to_addr  = data.get('to', '').strip()
    cc_addr  = data.get('cc', '').strip()
    bcc_addr = data.get('bcc', '').strip()
    subject  = data.get('subject', '').strip()
    body     = data.get('body', '').strip()
    content_type = data.get('contentType', 'Plain Text')
    priority     = data.get('priority', 'Normal')

    # Basic validation
    if not all([host, port, username, password, to_addr, subject, body]):
        return jsonify({'ok': False, 'error': 'Missing required fields.'}), 400

    # Build message
    msg = EmailMessage()
    msg['From']    = formataddr((from_name, username))
    msg['To']      = to_addr
    msg['Subject'] = subject

    if cc_addr:
        msg['Cc'] = cc_addr

    # Priority header
    priority_map = {'High': '1 (Highest)', 'Normal': '3 (Normal)', 'Low': '5 (Lowest)'}
    msg['X-Priority'] = priority_map.get(priority, '3 (Normal)')

    if content_type == 'HTML':
        msg.set_content(body)
        msg.add_alternative(body, subtype='html')
    else:
        msg.set_content(body)

    # Collect all recipients (including BCC)
    recipients = [to_addr]
    if cc_addr:
        recipients.append(cc_addr)
    if bcc_addr:
        recipients.append(bcc_addr)

    try:
        if port == 465:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(host, port, context=context, timeout=15) as server:
                server.login(username, password)
                server.sendmail(username, recipients, msg.as_string())
        else:
            with smtplib.SMTP(host, port, timeout=15) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(username, password)
                server.sendmail(username, recipients, msg.as_string())

        # Store in sent log
        entry = {
            'to': to_addr, 'cc': cc_addr, 'bcc': bcc_addr,
            'subject': subject, 'body': body,
            'contentType': content_type, 'priority': priority,
        }
        sent_emails.insert(0, entry)

        return jsonify({'ok': True, 'message': f'Email sent to {to_addr}!'})

    except smtplib.SMTPAuthenticationError:
        return jsonify({'ok': False, 'error': 'Authentication failed. Use an App Password for Gmail.'}), 401
    except smtplib.SMTPRecipientsRefused:
        return jsonify({'ok': False, 'error': f'Recipient address refused: {to_addr}'}), 400
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


# ─────────────────────────────────────────
#  API: DRAFTS
# ─────────────────────────────────────────

@app.route('/api/drafts', methods=['GET'])
def get_drafts():
    return jsonify(draft_emails)


@app.route('/api/drafts', methods=['POST'])
def save_draft():
    draft = request.get_json()
    draft_emails.insert(0, draft)
    return jsonify({'ok': True, 'count': len(draft_emails)})


@app.route('/api/drafts/<int:idx>', methods=['DELETE'])
def delete_draft(idx):
    if 0 <= idx < len(draft_emails):
        draft_emails.pop(idx)
        return jsonify({'ok': True, 'count': len(draft_emails)})
    return jsonify({'ok': False, 'error': 'Index out of range'}), 404


# ─────────────────────────────────────────
#  API: SENT
# ─────────────────────────────────────────

@app.route('/api/sent', methods=['GET'])
def get_sent():
    return jsonify(sent_emails)


# ─────────────────────────────────────────
#  ENTRY POINT
# ─────────────────────────────────────────

if __name__ == '__main__':
    app.run(debug=True, port=5000)
