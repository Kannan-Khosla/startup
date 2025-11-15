# ⚡ Email Polling Quick Start

## 5-Minute Setup

### Step 1: Add Email Account
1. **Admin Portal** → **Email Accounts** → **"+ Add Email Account"**
2. Fill in:
   - Email: `support@yourcompany.com`
   - Provider: `SMTP`
   - SMTP Host: `smtp.gmail.com` (Gmail) or `smtp.office365.com` (Outlook)
   - SMTP Port: `587`
   - Username: Your email
   - Password: Your password (Gmail: use App Password)
   - ✅ **Enable Polling** checkbox
   - ✅ Active
   - ✅ Default

### Step 2: Test & Enable
1. Click **"Test SMTP"** ✅
2. Click **"Test IMAP"** ✅
3. If not enabled, click **"Enable Polling"**

**Done!** Emails now auto-create tickets every minute.

---

## Gmail Setup

### Get App Password:
1. [Google Account](https://myaccount.google.com/) → Security
2. Enable **2-Step Verification**
3. **App passwords** → Generate → Copy 16-char password
4. Use this password (not your regular password)

### Settings:
- SMTP Host: `smtp.gmail.com`
- SMTP Port: `587`
- Password: **App Password** (16 characters)
- IMAP Host: Leave blank (auto-detected)
- IMAP Port: `993`

---

## Outlook Setup

### Settings:
- SMTP Host: `smtp.office365.com`
- SMTP Port: `587`
- Password: Your email password
- IMAP Host: Leave blank (auto-detected)
- IMAP Port: `993`

---

## Verify It Works

✅ **"Polling Enabled"** badge appears  
✅ **"Last polled: [recent time]"** shows  
✅ Send test email → Check Tickets page in 1-2 minutes

---

## Troubleshooting

**IMAP test fails?**
- Gmail: Use App Password, not regular password
- Check IMAP is enabled in email settings
- Verify credentials are correct

**Polling not working?**
- Account must be **Active** ✅
- Polling must be **Enabled** ✅
- Check "Last polled" timestamp is updating
- Test IMAP connection

---

## Full Guide

For detailed instructions, see: [Email Polling Setup Guide](./EMAIL_POLLING_SETUP.md)

