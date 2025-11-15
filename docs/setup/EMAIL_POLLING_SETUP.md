# 📬 Email Auto-Ticket Creation Setup Guide

## What is Email Polling?

Email polling automatically checks your support email inbox and creates tickets from incoming emails. When someone sends an email to your support address, it automatically becomes a ticket in your system - no manual work required!

**Key Features:**
- ✅ Automatic ticket creation from emails
- ✅ Links replies to existing tickets
- ✅ Auto-detects Gmail and Outlook settings
- ✅ Polls every 1 minute (configurable)
- ✅ Supports all major email providers

---

## 🎯 Quick Start (5 Minutes)

### Step 1: Set Up Your Email Account

1. **Login as Admin** to your application
2. Navigate to **Admin Portal** → **Email Accounts**
3. Click **"+ Add Email Account"**
4. Fill in your email details:
   - **Email Address**: Your support email (e.g., `support@yourcompany.com`)
   - **Provider**: Select `SMTP`
   - **SMTP Host**: `smtp.gmail.com` (for Gmail) or `smtp.office365.com` (for Outlook)
   - **SMTP Port**: `587`
   - **SMTP Username**: Your email address
   - **SMTP Password**: Your email password or app password
   - **Active**: ✅ Checked
   - **Default**: ✅ Checked

5. Click **"Create Account"**

### Step 2: Enable Email Polling

1. Find your email account in the list
2. Click **"Test IMAP"** to verify IMAP connection works
3. Click **"Enable Polling"** button
4. You should see a **"Polling Enabled"** badge appear

**That's it!** Your system will now automatically create tickets from emails sent to your support address.

---

## 📋 Detailed Setup Instructions

### Prerequisites

Before setting up email polling, make sure:

- ✅ You have an email account configured (see [Email Setup Guide](./EMAIL_SETUP_GUIDE.md))
- ✅ Your email account is marked as **"Active"**
- ✅ You have IMAP access enabled on your email account
- ✅ You know your email password (or app password for Gmail)

---

## 🔧 Step-by-Step Setup

### For Gmail Users

#### 1. Enable IMAP in Gmail

1. Go to [Gmail Settings](https://mail.google.com/mail/u/0/#settings/general)
2. Click **"See all settings"**
3. Go to **"Forwarding and POP/IMAP"** tab
4. Enable **"Enable IMAP"**
5. Click **"Save Changes"**

#### 2. Create an App Password (Required for Gmail)

Gmail requires an App Password for IMAP access:

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click **"Security"** in the left sidebar
3. Enable **"2-Step Verification"** if not already enabled
4. Go to **"App passwords"** (under 2-Step Verification)
5. Select **"Mail"** as the app and **"Other"** as the device
6. Enter a name like "Support System"
7. Click **"Generate"**
8. Copy the 16-character password (no spaces)

#### 3. Configure Email Account

1. Go to **Admin Portal** → **Email Accounts**
2. Click **"+ Add Email Account"** or edit existing account
3. Fill in:
   - **Email**: `your-email@gmail.com`
   - **Provider**: `SMTP`
   - **SMTP Host**: `smtp.gmail.com`
   - **SMTP Port**: `587`
   - **SMTP Username**: `your-email@gmail.com`
   - **SMTP Password**: `your-16-char-app-password` (the app password from step 2)
   - **IMAP Host**: Leave blank (auto-detected)
   - **IMAP Port**: `993` (or leave blank for auto-detection)
   - **Enable Polling**: ✅ Check this box
   - **Active**: ✅ Checked
   - **Default**: ✅ Checked

4. Click **"Create Account"** or **"Update Account"**

#### 4. Test and Enable

1. Click **"Test SMTP"** - Should show "Connection test successful"
2. Click **"Test IMAP"** - Should show "IMAP connection successful"
3. If polling wasn't enabled in the form, click **"Enable Polling"**
4. You should see **"Polling Enabled"** badge

---

### For Outlook/Office 365 Users

#### 1. Enable IMAP in Outlook

1. Go to [Outlook Settings](https://outlook.live.com/mail/0/options/mail/accounts)
2. Click **"Sync email"** or **"Manage connected accounts"**
3. Ensure IMAP is enabled (usually enabled by default)

#### 2. Configure Email Account

1. Go to **Admin Portal** → **Email Accounts**
2. Click **"+ Add Email Account"** or edit existing account
3. Fill in:
   - **Email**: `your-email@outlook.com` or `your-email@yourcompany.com`
   - **Provider**: `SMTP`
   - **SMTP Host**: `smtp.office365.com`
   - **SMTP Port**: `587`
   - **SMTP Username**: Your email address
   - **SMTP Password**: Your email password
   - **IMAP Host**: Leave blank (auto-detected as `outlook.office365.com`)
   - **IMAP Port**: `993` (or leave blank)
   - **Enable Polling**: ✅ Check this box
   - **Active**: ✅ Checked
   - **Default**: ✅ Checked

4. Click **"Create Account"** or **"Update Account"**

#### 3. Test and Enable

1. Click **"Test SMTP"** - Should show "Connection test successful"
2. Click **"Test IMAP"** - Should show "IMAP connection successful"
3. If polling wasn't enabled in the form, click **"Enable Polling"**
4. You should see **"Polling Enabled"** badge

---

### For Custom SMTP Servers

If you're using a custom email server (not Gmail or Outlook):

1. Go to **Admin Portal** → **Email Accounts**
2. Click **"+ Add Email Account"** or edit existing account
3. Fill in:
   - **Email**: Your email address
   - **Provider**: `SMTP`
   - **SMTP Host**: Your SMTP server (e.g., `mail.yourcompany.com`)
   - **SMTP Port**: Usually `587` or `465`
   - **SMTP Username**: Your email address
   - **SMTP Password**: Your email password
   - **IMAP Host**: Your IMAP server (e.g., `imap.yourcompany.com`)
   - **IMAP Port**: Usually `993` (SSL) or `143` (non-SSL)
   - **Enable Polling**: ✅ Check this box
   - **Active**: ✅ Checked
   - **Default**: ✅ Checked

4. Click **"Create Account"** or **"Update Account"**
5. Test both SMTP and IMAP connections
6. Enable polling if not already enabled

---

## ✅ Verifying It Works

### Check Polling Status

1. Go to **Email Accounts** page
2. Find your account
3. You should see:
   - ✅ **"Polling Enabled"** badge (purple)
   - ✅ **"Active"** badge (green)
   - ✅ **"Last polled: [timestamp]"** showing recent time

### Test with a Real Email

1. Send an email to your support address from an external email
2. Wait 1-2 minutes (polling runs every minute)
3. Go to **Tickets** page
4. You should see a new ticket created from that email!

### What Happens When an Email Arrives?

1. **New Email** → Creates a new ticket
2. **Reply to Existing Email** → Adds message to existing ticket
3. **Email from Registered User** → Links ticket to user account
4. **Email from New Sender** → Creates ticket with sender email

---

## 🎛️ Managing Email Polling

### Enable Polling for an Account

1. Go to **Email Accounts** page
2. Find the account you want to enable
3. Click **"Enable Polling"** button (green)
4. Wait for confirmation message

### Disable Polling for an Account

1. Go to **Email Accounts** page
2. Find the account with polling enabled
3. Click **"Disable Polling"** button (red)
4. Wait for confirmation message

**Note:** Disabling polling stops automatic ticket creation but doesn't affect sending emails.

### View Polling Status

Each account shows:
- **"Polling Enabled"** badge when active
- **"Last polled: [timestamp]"** showing when it last checked for emails
- **"Test IMAP"** button to verify connection

---

## ⚙️ Configuration Options

### Polling Interval

By default, the system polls every **60 seconds (1 minute)**.

To change this, set the environment variable:
```bash
EMAIL_POLLING_INTERVAL=60  # seconds
```

### Disable Polling Globally

To disable polling for all accounts (useful for maintenance):
```bash
EMAIL_POLLING_ENABLED=false
```

---

## 🔍 Troubleshooting

### "IMAP connection test failed"

**Common causes and solutions:**

1. **Gmail:**
   - ✅ Make sure you're using an **App Password**, not your regular password
   - ✅ Verify 2-Step Verification is enabled
   - ✅ Check that IMAP is enabled in Gmail settings
   - ✅ Ensure you copied the full 16-character app password (no spaces)

2. **Outlook:**
   - ✅ Verify your password is correct
   - ✅ Check if your organization requires MFA (may need app password)
   - ✅ Ensure IMAP is enabled in Outlook settings

3. **Custom Server:**
   - ✅ Verify IMAP host and port are correct
   - ✅ Check firewall rules allow IMAP connections
   - ✅ Ensure SSL/TLS is properly configured
   - ✅ Verify credentials are correct

### "Polling Enabled but no tickets created"

**Check these:**

1. ✅ **Account is Active**: Make sure the account shows "Active" badge
2. ✅ **Polling is Enabled**: Should see "Polling Enabled" badge
3. ✅ **Last Polled Time**: Check if it's updating (should be recent)
4. ✅ **Email Arrived**: Verify email actually arrived in inbox
5. ✅ **Check Logs**: Look at server logs for error messages

### "Last polled: Never" or old timestamp

**Possible issues:**

1. ✅ **Polling Disabled**: Check if polling is enabled
2. ✅ **Account Inactive**: Make sure account is marked as "Active"
3. ✅ **IMAP Connection Failed**: Test IMAP connection
4. ✅ **Server Error**: Check server logs for errors
5. ✅ **Polling Globally Disabled**: Check `EMAIL_POLLING_ENABLED` setting

### Emails Creating Duplicate Tickets

**This shouldn't happen**, but if it does:

- ✅ The system uses email `Message-ID` to prevent duplicates
- ✅ Check if emails are being forwarded multiple times
- ✅ Verify the same email isn't being sent to multiple addresses

### Replies Not Linking to Original Ticket

**Check:**

1. ✅ Original email must have been processed by the system
2. ✅ Reply must include proper `In-Reply-To` header (most email clients do this automatically)
3. ✅ Check if the original email's Message-ID exists in the system

---

## 💡 Best Practices

### Security

1. **Use App Passwords**: For Gmail, always use App Passwords, never your main password
2. **Strong Passwords**: Use strong, unique passwords for email accounts
3. **Limit Access**: Only enable polling on accounts that need it
4. **Monitor Activity**: Regularly check "Last polled" timestamps

### Performance

1. **One Account Per Support Address**: Don't enable polling on multiple accounts for the same inbox
2. **Regular Cleanup**: Archive or delete old emails from inbox to improve performance
3. **Monitor Polling**: Check that polling is working regularly

### Organization

1. **Clear Subject Lines**: Encourage users to use descriptive subject lines
2. **Reply Format**: Train users to reply directly (don't start new emails)
3. **Email Filters**: Set up email filters to organize incoming emails

---

## 📊 Monitoring Polling Activity

### Check Polling Status

1. Go to **Email Accounts** page
2. Look for accounts with **"Polling Enabled"** badge
3. Check **"Last polled"** timestamp - should be recent (within last few minutes)

### View Created Tickets

1. Go to **Tickets** page
2. Filter by **Source: Email** to see tickets created from emails
3. Check ticket details to see the original email content

### Server Logs

Check server logs for polling activity:
```
INFO: Email polling: 5 emails processed, 3 tickets created
INFO: Polled account support@company.com: 2 emails processed, 2 tickets created
```

---

## 🚨 Common Issues & Solutions

### Issue: "Cannot enable polling for inactive account"

**Solution:** 
- Make sure the account is marked as **"Active"** first
- Then enable polling

### Issue: "IMAP test works but polling doesn't"

**Solution:**
- Check server logs for detailed errors
- Verify the account is both "Active" AND "Polling Enabled"
- Ensure `EMAIL_POLLING_ENABLED=true` in environment variables

### Issue: "Polling stopped working"

**Solution:**
1. Check if account is still "Active"
2. Test IMAP connection again
3. Check server logs for errors
4. Try disabling and re-enabling polling
5. Verify `EMAIL_POLLING_ENABLED` is still `true`

---

## 📚 Additional Resources

- [Email Account Setup Guide](./EMAIL_SETUP_GUIDE.md) - Basic email setup
- [Email Account Troubleshooting](../troubleshooting/EMAIL_ACCOUNT_TROUBLESHOOTING.md) - Common email issues
- [Gmail App Password Guide](./GMAIL_APP_PASSWORD_FIX.md) - Gmail-specific help

---

## ✅ Quick Checklist

Before enabling polling, make sure:

- [ ] Email account is configured
- [ ] Account is marked as "Active"
- [ ] Account is marked as "Default" (if it's your main support email)
- [ ] SMTP connection test passes
- [ ] IMAP connection test passes
- [ ] Polling is enabled (checkbox checked or "Enable Polling" clicked)
- [ ] "Polling Enabled" badge appears
- [ ] "Last polled" timestamp is updating

---

## 🎉 You're All Set!

Once polling is enabled:

- ✅ Emails to your support address automatically become tickets
- ✅ Replies automatically link to original tickets
- ✅ System polls every minute for new emails
- ✅ You can monitor status in the Email Accounts page

**Need help?** Check the troubleshooting section above or review server logs for detailed error messages.

---

*Last updated: 2024*

