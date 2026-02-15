# Email Templates - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Seed the Templates
```bash
cd backend
node seed-email-templates.js
```

Expected output:
```
🌱 Starting email templates seed...
🗑️  Cleared existing templates
✅ Created: Welcome to Urutix - Get Started (ID: 1)
✅ Created: New Load Match Available (ID: 2)
✅ Created: Payment Received Confirmation (ID: 3)
✅ Created: Delivery Completed Successfully (ID: 4)
✅ Created: Monthly Performance Summary (ID: 5)
✅ Created: Document Expiring Soon - Action Required (ID: 6)
✅ Created: Subscription Renewal Reminder (ID: 7)
✅ Created: New Feature Launch Announcement (ID: 8)

🎉 Successfully seeded 8 email templates!
```

### Step 2: Access Templates in Admin Panel
1. Start your backend (if not running):
   ```bash
   npm run build && npm run start:prod
   ```

2. Login as Super Admin:
   - Email: `superadmin@urutix.com`
   - Password: `SuperAdmin@123`

3. Navigate to: **Admin → Bulk Email → Templates Tab**

### Step 3: Send Test Emails
1. Click on any template to preview
2. Click "Use Template" to compose email
3. Select recipients or use filters
4. Send test email to yourself first
5. Review and send to target audience

## 📧 Available Templates

| # | Template Name | Category | Use Case |
|---|---------------|----------|----------|
| 1 | Welcome to Urutix | Onboarding | New user registration |
| 2 | New Load Match | Notification | AI finds matching load |
| 3 | Payment Confirmation | Transaction | Payment received |
| 4 | Delivery Completed | Delivery | Successful delivery |
| 5 | Monthly Performance | Report | Monthly analytics |
| 6 | Document Expiry Alert | Alert | Compliance reminder |
| 7 | Subscription Renewal | Subscription | Billing reminder |
| 8 | New Feature Launch | Announcement | Product updates |

## 🎨 Template Variables

All templates support these variables:
- `{{tenantName}}` - Company/user name
- `{{email}}` - User email address
- `{{tenantId}}` - User ID

Template-specific variables:
- `{{loadId}}` - Load reference
- `{{transactionId}}` - Transaction reference
- `{{deliveryId}}` - Delivery reference
- `{{documentType}}` - Document name
- `{{days}}` - Days count
- `{{month}}` - Month name

## 💡 Usage Examples

### Example 1: Send Welcome Email to New Users
```javascript
// In your registration controller
await bulkEmailService.sendCustomBulkEmail(
  adminUserId,
  'system@urutix.com',
  'Welcome to Urutix - Get Started',
  welcomeEmailHtml,
  welcomeEmailText,
  { tenantIds: [newTenant.id] }
);
```

### Example 2: Send Load Match Notifications
```javascript
// When AI finds a match
await bulkEmailService.sendBulkEmailToTenants(
  systemUserId,
  'notifications@urutix.com',
  loadMatchTemplateId,
  { 
    tenantType: 'FLEET_OWNER',
    status: 'ACTIVE'
  }
);
```

### Example 3: Monthly Performance Reports
```javascript
// Cron job - 1st of every month
await bulkEmailService.sendBulkEmailToTenants(
  systemUserId,
  'reports@urutix.com',
  performanceReportTemplateId,
  { 
    tenantType: 'FLEET_OWNER',
    hasActiveSubscription: true
  }
);
```

## 🔧 Customization

### Edit a Template
1. Go to Admin → Bulk Email → Templates
2. Click "Edit" on any template
3. Modify subject, body, or variables
4. Save changes
5. Test before sending

### Create New Template
1. Click "Create Template"
2. Fill in:
   - Name
   - Subject (with variables)
   - Category
   - HTML Body
   - Text Body (fallback)
3. Mark as Active
4. Save and test

## 📊 Monitor Performance

### View Email Logs
1. Go to Admin → Bulk Email → History Tab
2. See all sent emails with:
   - Send date/time
   - Recipients count
   - Success/failure status
   - Template used

### Track Metrics
- Open rates (if tracking enabled)
- Click-through rates
- Bounce rates
- Unsubscribe rates

## ⚠️ Important Notes

1. **SMTP Configuration Required**
   - Ensure SMTP settings in `.env` are correct
   - Test email sending before bulk operations

2. **Rate Limiting**
   - Respect email provider limits
   - Use batch sending for large lists
   - Monitor delivery rates

3. **Compliance**
   - Include unsubscribe links
   - Honor opt-out requests
   - Follow GDPR/CAN-SPAM rules

4. **Testing**
   - Always send test emails first
   - Check rendering in multiple clients
   - Verify all variables are replaced

## 🎯 Best Practices

### Subject Lines
- Keep under 50 characters
- Use emojis sparingly (1-2 max)
- Include urgency when appropriate
- Personalize with variables

### Email Content
- Mobile-first design
- Clear call-to-action
- Scannable content (bullets, short paragraphs)
- Professional tone
- Brand consistency

### Sending Strategy
- **Transactional**: Send immediately
- **Marketing**: Tuesday-Thursday, 10 AM
- **Reports**: 1st of month, 9 AM
- **Alerts**: As soon as triggered

## 🚨 Troubleshooting

### Templates Not Showing
```bash
# Check if templates exist
psql -U postgres -d urutix -c "SELECT COUNT(*) FROM email_templates;"

# Re-run seed if needed
node seed-email-templates.js
```

### Emails Not Sending
1. Check SMTP configuration in `.env`
2. Verify email service is running
3. Check logs for errors
4. Test with a simple email first

### Variables Not Replacing
- Ensure variable names match exactly
- Check template syntax: `{{variableName}}`
- Verify data is passed to email service

## 📚 Additional Resources

- **Full Strategy**: See `EMAIL_TEMPLATES_STRATEGY.md`
- **API Documentation**: Check Swagger docs at `/api`
- **Support**: Contact support@urutix.com

---

**Quick Reference**:
- Seed Script: `node seed-email-templates.js`
- Admin Panel: `/admin/bulk-email`
- Templates Count: 8 professional templates
- Categories: 8 strategic categories
- Status: ✅ Ready to use
