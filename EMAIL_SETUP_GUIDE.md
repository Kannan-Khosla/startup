# 📧 Email Account Setup Guide

## Problem
You're getting this error when trying to send emails:
```
HTTP 400: No email account configured. Please set up an email account first.
```

## Solution
You need to configure at least one email account before you can send emails. You can do this via the **Admin Portal** or via the **API**.

---

## 🎯 Option 1: Setup via Admin Portal (Recommended)

### Steps:
1. **Login as Admin** to your application
2. **Navigate to Admin Portal** → Click on **"Email Accounts"** in the navigation
3. **Click "+ Add Email Account"** button
4. **Fill in the form** with your email provider details (see examples below)
5. **Check "Default"** checkbox to set it as the default account
6. **Click "Create Account"**
7. **Test the connection** by clicking the "Test" button

---

## 📝 Email Provider Configuration Examples

### Gmail (SMTP)

**Settings:**
- **Email Address**: `your-email@gmail.com`
- **Display Name**: `Your Name` (optional)
- **Provider**: `SMTP`
- **SMTP Host**: `smtp.gmail.com`
- **SMTP Port**: `587`
- **SMTP Username**: `your-email@gmail.com`
- **SMTP Password**: `your-app-password` ⚠️ (See note below)
- **Active**: ✅ Checked
- **Default**: ✅ Checked

**⚠️ Important for Gmail:**
- You need to use an **App Password**, not your regular Gmail password
- Enable 2-Factor Authentication on your Google account
- Generate an App Password: [Google App Passwords](https://myaccount.google.com/apppasswords)
- Use the 16-character app password (no spaces)

---

### Outlook/Office 365 (SMTP)

**Settings:**
- **Email Address**: `your-email@outlook.com` or `your-email@yourcompany.com`
- **Display Name**: `Your Name` (optional)
- **Provider**: `SMTP`
- **SMTP Host**: `smtp.office365.com`
- **SMTP Port**: `587`
- **SMTP Username**: `your-email@outlook.com`
- **SMTP Password**: `your-password`
- **Active**: ✅ Checked
- **Default**: ✅ Checked

---

### SendGrid (API)

**Settings:**
- **Email Address**: `your-email@yourdomain.com`
- **Display Name**: `Your Name` (optional)
- **Provider**: `SendGrid`
- **API Key**: `your-sendgrid-api-key`
- **Active**: ✅ Checked
- **Default**: ✅ Checked

**To get SendGrid API Key:**
1. Sign up at [SendGrid](https://sendgrid.com)
2. Go to Settings → API Keys
3. Create a new API Key with "Mail Send" permissions
4. Copy the API key (you'll only see it once!)

---

### AWS SES (API)

**Settings:**
- **Email Address**: `your-email@yourdomain.com`
- **Display Name**: `Your Name` (optional)
- **Provider**: `SES`
- **API Key**: `your-aws-access-key-id`
- **Credentials**: JSON with AWS credentials
  ```json
  {
    "access_key_id": "your-access-key",
    "secret_access_key": "your-secret-key",
    "region": "us-east-1"
  }
  ```
- **Active**: ✅ Checked
- **Default**: ✅ Checked

---

## 🔧 Option 2: Setup via API

If you prefer to use the API directly, here's a curl example:

### Example: Gmail SMTP Setup

```bash
curl -X POST "http://localhost:8000/admin/email-accounts" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@gmail.com",
    "display_name": "Your Name",
    "provider": "smtp",
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "smtp_username": "your-email@gmail.com",
    "smtp_password": "your-app-password",
    "is_active": true,
    "is_default": true
  }'
```

### Example: SendGrid Setup

```bash
curl -X POST "http://localhost:8000/admin/email-accounts" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@yourdomain.com",
    "display_name": "Your Name",
    "provider": "sendgrid",
    "api_key": "your-sendgrid-api-key",
    "is_active": true,
    "is_default": true
  }'
```

---

## ✅ Verify Setup

### Test Connection via UI:
1. Go to **Email Accounts** page
2. Click **"Test"** button next to your email account
3. You should see: "Connection test successful"

### Test Connection via API:
```bash
curl -X POST "http://localhost:8000/admin/email-accounts/{account_id}/test" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 🚀 After Setup

Once you've configured an email account:

1. ✅ **Set as Default**: Make sure at least one account is marked as "Default"
2. ✅ **Test Connection**: Verify the connection works
3. ✅ **Send Email**: You can now send emails from tickets!

---

## 🔍 Troubleshooting

### "Connection test failed"
- **Gmail**: Make sure you're using an App Password, not your regular password
- **SMTP**: Verify host, port, username, and password are correct
- **Firewall**: Check if port 587 or 465 is blocked
- **2FA**: Some providers require 2FA to be enabled

### "No email account configured" (still getting error)
- Make sure you've created at least one email account
- Make sure the account is marked as **"Default"**
- Make sure the account is **"Active"**
- Refresh the page and try again

### "Failed to send email"
- Check the email account is active and default
- Verify the connection test passes
- Check server logs for detailed error messages
- For Gmail, ensure "Less secure app access" is enabled (or use App Password)

---

## 📚 Additional Resources

- **Gmail App Passwords**: https://support.google.com/accounts/answer/185833
- **SendGrid Setup**: https://docs.sendgrid.com/for-developers/sending-email/api-getting-started
- **AWS SES Setup**: https://docs.aws.amazon.com/ses/latest/dg/send-email.html

---

## 💡 Quick Checklist

- [ ] Login as Admin
- [ ] Navigate to Email Accounts
- [ ] Add email account with correct settings
- [ ] Mark as "Default"
- [ ] Mark as "Active"
- [ ] Test connection
- [ ] Try sending an email from a ticket

---

*Need help? Check the server logs for detailed error messages.*



