# 🛡️ Email Spam Filtering Guide

## Overview

The spam filtering system automatically detects and filters out spam emails and promotional messages before they become tickets. This keeps your ticket system clean and focused on legitimate support requests.

**What Gets Filtered:**
- ✅ **Spam emails** - Phishing, scams, malicious content
- ✅ **Promotional emails** - Marketing, newsletters, ads, deals
- ✅ **Automated messages** - Auto-replies, notifications (optional)

**What Gets Through:**
- ✅ **Legitimate support emails** - Real customer inquiries
- ✅ **Replies to existing tickets** - Always allowed
- ✅ **Emails from registered users** - Trusted senders

---

## How It Works

The spam classifier uses multiple detection methods:

1. **Keyword Analysis** - Checks for spam and promotion keywords in subject and body
2. **Pattern Matching** - Detects common spam patterns (all caps, excessive links, etc.)
3. **Header Analysis** - Checks email headers (List-Unsubscribe, spam scores)
4. **Sender Analysis** - Identifies suspicious sender patterns
5. **Content Analysis** - Analyzes email structure and content

---

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Enable/disable spam filtering (default: true)
EMAIL_SPAM_FILTER_ENABLED=true

# Filter promotional emails in addition to spam (default: true)
EMAIL_FILTER_PROMOTIONS=true

# Log filtered emails to database for review (default: false)
EMAIL_LOG_FILTERED=false
```

### Default Settings

- **Spam Filtering**: ✅ Enabled by default
- **Promotion Filtering**: ✅ Enabled by default
- **Log Filtered Emails**: ❌ Disabled by default

---

## What Gets Filtered

### Spam Indicators

Emails are classified as spam if they contain:

- **Spam Keywords**: "winner", "congratulations", "free money", "viagra", "pharmacy", etc.
- **Spam Patterns**: All caps subjects, excessive links, suspicious sender addresses
- **Common Scams**: Nigerian prince, lottery, inheritance, debt relief scams

### Promotion Indicators

Emails are classified as promotions if they contain:

- **Promotion Keywords**: "sale", "discount", "special offer", "coupon", "newsletter"
- **Marketing Headers**: List-Unsubscribe header (indicates marketing email)
- **Promotional Content**: Multiple promotion keywords, unsubscribe links

---

## Registered Users Exception

**Important:** Emails from registered users are **never filtered**, even if they match spam patterns. This ensures legitimate customers can always reach you.

To be considered a registered user:
- Email address must exist in the `users` table
- User must have an account in your system

---

## Replies Always Allowed

**Replies to existing tickets are always allowed**, regardless of spam classification. This ensures ongoing conversations aren't interrupted.

---

## Monitoring Filtered Emails

### Option 1: Server Logs

Check your server logs to see filtered emails:

```
INFO: Filtered spam email from spammer@example.com: Spam keywords in subject (2 matches), Suspicious sender pattern
INFO: Filtered promotion email from marketing@company.com: Has List-Unsubscribe header (marketing email), Multiple promotion keywords in body (5 matches)
```

### Option 2: Database Logging (Optional)

Enable database logging to review filtered emails:

1. Set `EMAIL_LOG_FILTERED=true` in `.env`
2. Filtered emails will be saved to `email_messages` table with `status='filtered'`
3. Query filtered emails:
   ```sql
   SELECT * FROM email_messages WHERE status = 'filtered' ORDER BY created_at DESC;
   ```

---

## Customization

### Adding Custom Keywords

Edit `spam_classifier.py` to add custom keywords:

```python
# In SpamClassifier.__init__()
self.spam_keywords = [
    # ... existing keywords ...
    'your-custom-spam-keyword',
]

self.promotion_keywords = [
    # ... existing keywords ...
    'your-custom-promotion-keyword',
]
```

### Adjusting Sensitivity

Modify the scoring thresholds in `spam_classifier.py`:

```python
# In classify() method
is_spam = spam_score >= 0.5  # Lower = more sensitive
is_promotion = promotion_score >= 0.5  # Lower = more sensitive
```

---

## Testing

### Test Spam Detection

Send a test email with spam keywords:

**Subject:** "Congratulations! You Won $1000!"
**Body:** "Click here to claim your prize! Limited time offer!"

This should be filtered as spam.

### Test Promotion Detection

Send a test email with promotion keywords:

**Subject:** "Special Sale - 50% Off Everything!"
**Body:** "Don't miss our exclusive deal! Use code SAVE50. Unsubscribe here."

This should be filtered as promotion.

### Test Legitimate Email

Send a normal support email:

**Subject:** "Need help with my account"
**Body:** "I'm having trouble logging in. Can you help?"

This should **not** be filtered and should create a ticket.

---

## Troubleshooting

### "Legitimate emails are being filtered"

**Solutions:**
1. **Add sender to whitelist**: Register the sender as a user in your system
2. **Disable promotion filtering**: Set `EMAIL_FILTER_PROMOTIONS=false`
3. **Adjust sensitivity**: Lower the spam/promotion score thresholds
4. **Check logs**: Review why emails were filtered

### "Spam emails are getting through"

**Solutions:**
1. **Review keywords**: Add more spam keywords to the classifier
2. **Increase sensitivity**: Lower the spam score threshold
3. **Check registered users**: Ensure spam senders aren't registered users
4. **Enable logging**: Set `EMAIL_LOG_FILTERED=true` to review what's getting through

### "Want to see what's being filtered"

**Enable logging:**
1. Set `EMAIL_LOG_FILTERED=true`
2. Check `email_messages` table for `status='filtered'`
3. Review filtered emails to understand patterns

---

## Best Practices

1. **Monitor Initially**: Enable `EMAIL_LOG_FILTERED=true` for the first week to review filtering accuracy
2. **Adjust as Needed**: Fine-tune keywords and thresholds based on your email patterns
3. **Whitelist Important Senders**: Register important senders as users to ensure they're never filtered
4. **Review Logs Regularly**: Check server logs periodically to ensure filtering is working correctly
5. **Test Periodically**: Send test emails to verify filtering behavior

---

## Database Migration

Run the migration to add support for filtered emails:

```bash
# The migration adds 'filtered' as a valid status for email_messages
# File: migrations/013_email_spam_filtering.sql
```

---

## API Response

When an email is filtered via webhook, the API returns:

```json
{
  "success": true,
  "message": "Email filtered as spam/promotion",
  "filtered": true,
  "category": "spam"  // or "promotion"
}
```

---

## Statistics

You can query filtering statistics:

```sql
-- Count filtered emails by category (if logging enabled)
SELECT 
  COUNT(*) as total_filtered,
  COUNT(CASE WHEN subject LIKE '%spam%' THEN 1 END) as spam_count,
  COUNT(CASE WHEN subject LIKE '%promo%' THEN 1 END) as promo_count
FROM email_messages 
WHERE status = 'filtered';
```

---

## Advanced: Machine Learning (Future)

The current implementation uses rule-based classification. For production use with high email volume, consider:

1. **Training a ML model** on your email data
2. **Using external APIs** (Google Spam API, etc.)
3. **Implementing Bayesian filtering** for better accuracy

The current classifier provides a solid foundation and can be extended with ML models as needed.

---

## Summary

✅ **Spam filtering is enabled by default**  
✅ **Promotions are filtered by default**  
✅ **Registered users are never filtered**  
✅ **Replies are always allowed**  
✅ **Configurable via environment variables**  
✅ **Optional database logging for review**

---

*Need help? Check server logs for detailed filtering reasons and adjust keywords/thresholds as needed.*

