# 🔐 Gmail Authentication Error Fix

## Error Message
```
(535, b'5.7.8 Username and Password not accepted. For more information, go to
5.7.8  https://support.google.com/mail/?p=BadCredentials')
```

## Problem
Gmail doesn't accept regular passwords for SMTP connections. You need to use an **App Password** instead.

---

## ✅ Solution: Generate Gmail App Password

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **"2-Step Verification"**
3. Follow the prompts to enable 2-Factor Authentication
   - You'll need your phone number
   - Google will send you a verification code

### Step 2: Generate App Password
1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Or navigate: Google Account → Security → 2-Step Verification → App passwords
2. Select **"Mail"** as the app
3. Select **"Other (Custom name)"** as the device
4. Enter a name like: `Support Ticket System`
5. Click **"Generate"**
6. **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)
   - ⚠️ **Important**: You'll only see this password once! Copy it immediately.

### Step 3: Update Email Account
1. Go back to your **Email Accounts** page in the Admin Portal
2. **Edit** your Gmail account
3. In the **"SMTP Password"** field, paste the **16-character App Password**
   - Remove any spaces (it should be: `abcdefghijklmnop`)
4. Click **"Update Account"**
5. Click **"Test"** to verify it works

---

## 📝 Quick Checklist

- [ ] 2-Factor Authentication is enabled on your Google account
- [ ] App Password is generated (16 characters, no spaces)
- [ ] App Password is pasted in the "SMTP Password" field
- [ ] Email account is saved
- [ ] Connection test passes

---

## 🔍 Alternative: If You Can't Use 2FA

If you can't enable 2-Factor Authentication, you have these options:

### Option 1: Use a Different Email Provider
- **Outlook/Office 365**: Often easier to set up
- **SendGrid**: Free tier available, API-based
- **AWS SES**: Good for production

### Option 2: Use Gmail with OAuth (Advanced)
- Requires OAuth 2.0 setup
- More complex but more secure
- Not currently implemented in this system

---

## 🚨 Common Mistakes

❌ **Using your regular Gmail password**  
✅ **Use App Password instead**

❌ **Including spaces in App Password**  
✅ **Remove all spaces (16 characters, no spaces)**

❌ **2FA not enabled**  
✅ **Enable 2-Factor Authentication first**

❌ **Using wrong username**  
✅ **Use full email address: `your-email@gmail.com`**

---

## 📋 Example Configuration

**Correct Gmail SMTP Settings:**
```
Email Address: your-email@gmail.com
Display Name: Your Name
Provider: SMTP
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP Username: your-email@gmail.com
SMTP Password: abcdefghijklmnop  ← App Password (16 chars, no spaces)
Active: ✅
Default: ✅
```

---

## 🔗 Helpful Links

- **Generate App Password**: https://myaccount.google.com/apppasswords
- **Enable 2FA**: https://myaccount.google.com/security
- **Gmail Help**: https://support.google.com/mail/?p=BadCredentials

---

## 💡 Still Not Working?

1. **Double-check the App Password**: Make sure there are no spaces
2. **Verify 2FA is enabled**: App passwords only work with 2FA
3. **Check username**: Must be your full email address
4. **Try port 465**: Some networks block port 587, try 465 with SSL
5. **Check firewall**: Make sure port 587 or 465 is not blocked

---

*After setting up the App Password, your connection test should succeed!*

