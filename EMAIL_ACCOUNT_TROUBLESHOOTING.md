# 🔧 Email Account Troubleshooting Guide

## Problem: "No email account configured" Error

If you're getting this error even though you've created an email account, it's likely because:

1. **The account is not marked as "Active"** ✅
2. **The account is not marked as "Default"** ✅

---

## ✅ Quick Fix

### Step 1: Go to Admin Portal
1. Login as **Admin**
2. Navigate to **Admin Portal** → **Email Accounts**

### Step 2: Edit Your Email Account
1. Find your email account in the list
2. Click **"Edit"** button
3. Make sure **BOTH** checkboxes are checked:
   - ✅ **Active** (must be checked)
   - ✅ **Default** (must be checked)
4. Click **"Update Account"**

### Step 3: Verify
- You should see a **"Default"** badge on your account
- You should see an **"Active"** badge on your account
- Try sending an email again

---

## 🔍 How to Check Your Account Status

In the Email Accounts page, look for these badges:

- **🟢 "Active"** badge = Account is active
- **🟠 "Default"** badge = Account is set as default
- **⚪ No badge** = Account is inactive or not default

---

## 📋 Common Issues

### Issue 1: Account Created but Not Active
**Symptom:** Account exists but you can't send emails

**Solution:**
- Edit the account
- Check the **"Active"** checkbox
- Save

### Issue 2: Account Active but Not Default
**Symptom:** Multiple accounts, none marked as default

**Solution:**
- Edit one of your active accounts
- Check the **"Default"** checkbox
- Save (this will automatically unset other defaults)

### Issue 3: Account Not Showing in List
**Symptom:** You created an account but it doesn't appear

**Possible Causes:**
- Database connection issue
- Account creation failed silently
- Browser cache issue

**Solution:**
- Refresh the page
- Check browser console for errors
- Try creating the account again

---

## 🎯 Best Practices

1. **Always mark your primary email account as both "Active" and "Default"**
2. **Only have ONE default account at a time**
3. **Test the connection** after creating/editing an account
4. **Keep at least one account active** at all times

---

## 🚨 Still Not Working?

If you've checked all the above and it's still not working:

1. **Check the server logs** for detailed error messages
2. **Verify the account in the database:**
   - Go to your Supabase dashboard
   - Check the `email_accounts` table
   - Verify `is_active = true` and `is_default = true`

3. **Try creating a new account** with a different email to test

---

## 💡 What Changed?

The system now has **improved error messages** that will tell you exactly what's wrong:
- "No email account configured" → No accounts exist
- "No active email account found" → Accounts exist but none are active
- "Please mark at least one account as 'Active' and 'Default'" → Accounts exist but not properly configured

The system also has a **fallback mechanism**: if no account is marked as "default", it will try to use any active account.

---

*Last updated: After implementing improved error handling and fallback logic*

