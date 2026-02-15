require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5433,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '123',
  database: process.env.DB_NAME || 'urutix',
});

const emailTemplates = [
  // 1. Welcome Email - New User Onboarding
  {
    name: 'Welcome to Urutix - Get Started',
    subject: 'Welcome to Urutix Smart Logistics Platform! 🚚',
    category: 'onboarding',
    description: 'Welcome email for new users joining the platform',
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .feature-item { padding: 10px 0; border-bottom: 1px solid #eee; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Urutix! 🎉</h1>
      <p>Your Smart Logistics Journey Starts Here</p>
    </div>
    <div class="content">
      <p>Hello <strong>{{tenantName}}</strong>,</p>
      
      <p>We're thrilled to have you join Urutix, the leading smart logistics platform connecting fleet owners, cargo owners, and brokers across Africa.</p>
      
      <div class="features">
        <h3>🚀 What You Can Do:</h3>
        <div class="feature-item">✅ Real-time fleet tracking and management</div>
        <div class="feature-item">✅ Automated load matching and bidding</div>
        <div class="feature-item">✅ Digital documentation and compliance</div>
        <div class="feature-item">✅ Integrated payment and escrow services</div>
        <div class="feature-item">✅ AI-powered route optimization</div>
      </div>
      
      <p><strong>Next Steps:</strong></p>
      <ol>
        <li>Complete your company profile</li>
        <li>Add your first truck or cargo</li>
        <li>Explore the marketplace</li>
        <li>Connect with verified partners</li>
      </ol>
      
      <center>
        <a href="https://urutix.com/dashboard" class="button">Go to Dashboard</a>
      </center>
      
      <p>Need help getting started? Our support team is here 24/7 at <a href="mailto:support@urutix.com">support@urutix.com</a></p>
      
      <p>Best regards,<br><strong>The Urutix Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2026 Urutix Smart Logistics Platform. All rights reserved.</p>
      <p>Kigali, Rwanda | <a href="https://urutix.com">www.urutix.com</a></p>
    </div>
  </div>
</body>
</html>`,
    textBody: 'Welcome to Urutix Smart Logistics Platform! Your account has been created successfully.',
    isActive: true,
  },

  // 2. Load Match Notification
  {
    name: 'New Load Match Available',
    subject: '🎯 Perfect Match Found: New Load Opportunity',
    category: 'notification',
    description: 'Notify fleet owners of matching cargo loads',
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; }
    .load-card { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .urgent { background: #ef4444; color: white; padding: 5px 10px; border-radius: 3px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🎯 New Load Match Found!</h2>
      <p>A cargo load matching your fleet is available</p>
    </div>
    <div class="content">
      <p>Hello <strong>{{tenantName}}</strong>,</p>
      
      <p>Great news! We've found a cargo load that perfectly matches your available trucks.</p>
      
      <div class="load-card">
        <h3>Load Details <span class="urgent">URGENT</span></h3>
        <div class="detail-row">
          <span><strong>Route:</strong></span>
          <span>Kigali → Dar es Salaam</span>
        </div>
        <div class="detail-row">
          <span><strong>Cargo Type:</strong></span>
          <span>Electronics (Fragile)</span>
        </div>
        <div class="detail-row">
          <span><strong>Weight:</strong></span>
          <span>15,000 kg</span>
        </div>
        <div class="detail-row">
          <span><strong>Pickup Date:</strong></span>
          <span>March 20, 2026</span>
        </div>
        <div class="detail-row">
          <span><strong>Estimated Payment:</strong></span>
          <span><strong style="color: #10b981;">$2,500 USD</strong></span>
        </div>
        <div class="detail-row">
          <span><strong>Match Score:</strong></span>
          <span>⭐⭐⭐⭐⭐ 95%</span>
        </div>
      </div>
      
      <p><strong>Why This Match?</strong></p>
      <ul>
        <li>✅ Your truck is available on the pickup date</li>
        <li>✅ Route matches your preferred corridors</li>
        <li>✅ Cargo weight within your capacity</li>
        <li>✅ Verified cargo owner with 4.8★ rating</li>
      </ul>
      
      <center>
        <a href="https://urutix.com/loads/{{loadId}}" class="button">View Load Details & Bid</a>
      </center>
      
      <p><em>⏰ Act fast! 12 other fleet owners have been notified.</em></p>
      
      <p>Best regards,<br><strong>Urutix Matching Engine</strong></p>
    </div>
  </div>
</body>
</html>`,
    textBody: 'New load match found! Check your dashboard for details.',
    isActive: true,
  },

  // 3. Payment Confirmation
  {
    name: 'Payment Received Confirmation',
    subject: '✅ Payment Received - Transaction Confirmed',
    category: 'transaction',
    description: 'Confirm successful payment receipt',
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; }
    .payment-box { background: white; padding: 25px; border-radius: 8px; border: 2px solid #10b981; margin: 20px 0; text-align: center; }
    .amount { font-size: 36px; color: #10b981; font-weight: bold; }
    .detail-table { width: 100%; background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-table tr { border-bottom: 1px solid #eee; }
    .detail-table td { padding: 10px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>✅ Payment Confirmed!</h2>
    </div>
    <div class="content">
      <p>Hello <strong>{{tenantName}}</strong>,</p>
      
      <p>Your payment has been successfully received and processed.</p>
      
      <div class="payment-box">
        <p style="margin: 0; color: #666;">Amount Paid</p>
        <div class="amount">$2,500.00</div>
        <p style="margin: 10px 0 0 0; color: #666;">Transaction ID: TXN-2026-001234</p>
      </div>
      
      <table class="detail-table">
        <tr>
          <td><strong>Payment Method:</strong></td>
          <td>Mobile Money (MTN)</td>
        </tr>
        <tr>
          <td><strong>Date & Time:</strong></td>
          <td>March 15, 2026 at 14:30 EAT</td>
        </tr>
        <tr>
          <td><strong>Load Reference:</strong></td>
          <td>LOAD-2026-5678</td>
        </tr>
        <tr>
          <td><strong>Status:</strong></td>
          <td><span style="color: #10b981; font-weight: bold;">✓ Completed</span></td>
        </tr>
      </table>
      
      <p><strong>What's Next?</strong></p>
      <ul>
        <li>Funds are now in escrow and secure</li>
        <li>Fleet owner will be notified to begin transport</li>
        <li>Track your shipment in real-time</li>
        <li>Funds released upon successful delivery</li>
      </ul>
      
      <center>
        <a href="https://urutix.com/transactions/{{transactionId}}" class="button">View Receipt</a>
      </center>
      
      <p>Questions? Contact us at <a href="mailto:payments@urutix.com">payments@urutix.com</a></p>
      
      <p>Best regards,<br><strong>Urutix Payments Team</strong></p>
    </div>
  </div>
</body>
</html>`,
    textBody: 'Payment received successfully. Transaction ID: TXN-2026-001234',
    isActive: true,
  },

  // 4. Delivery Confirmation
  {
    name: 'Delivery Completed Successfully',
    subject: '🎉 Delivery Completed - Please Confirm Receipt',
    category: 'delivery',
    description: 'Notify cargo owner of successful delivery',
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; }
    .success-icon { font-size: 60px; text-align: center; margin: 20px 0; }
    .timeline { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .timeline-item { padding: 15px; border-left: 3px solid #10b981; margin-left: 20px; position: relative; }
    .timeline-item:before { content: '✓'; position: absolute; left: -13px; background: #10b981; color: white; width: 20px; height: 20px; border-radius: 50%; text-align: center; line-height: 20px; font-size: 12px; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .rating { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🎉 Delivery Completed!</h2>
    </div>
    <div class="content">
      <div class="success-icon">📦✅</div>
      
      <p>Hello <strong>{{tenantName}}</strong>,</p>
      
      <p>Great news! Your cargo has been successfully delivered to the destination.</p>
      
      <div class="timeline">
        <h3>Delivery Timeline</h3>
        <div class="timeline-item">
          <strong>Pickup Completed</strong><br>
          <small>March 20, 2026 - 09:00 AM</small><br>
          <small>Kigali Warehouse, Rwanda</small>
        </div>
        <div class="timeline-item">
          <strong>In Transit</strong><br>
          <small>March 20-22, 2026</small><br>
          <small>1,245 km covered</small>
        </div>
        <div class="timeline-item">
          <strong>Delivered</strong><br>
          <small>March 22, 2026 - 16:30 PM</small><br>
          <small>Dar es Salaam Port, Tanzania</small>
        </div>
      </div>
      
      <p><strong>Delivery Details:</strong></p>
      <ul>
        <li>📍 Final Location: Dar es Salaam Port, Tanzania</li>
        <li>📦 All 15 packages accounted for</li>
        <li>✅ No damage reported</li>
        <li>📸 Delivery photos available</li>
        <li>✍️ Digital signature captured</li>
      </ul>
      
      <div class="rating">
        <h3>Rate Your Experience</h3>
        <p>How was your experience with this delivery?</p>
        <a href="https://urutix.com/rate/{{deliveryId}}" class="button">Leave a Review</a>
      </div>
      
      <center>
        <a href="https://urutix.com/deliveries/{{deliveryId}}" class="button">View Delivery Report</a>
      </center>
      
      <p><em>💰 Payment will be released to the fleet owner within 24 hours of confirmation.</em></p>
      
      <p>Best regards,<br><strong>Urutix Operations Team</strong></p>
    </div>
  </div>
</body>
</html>`,
    textBody: 'Your cargo has been delivered successfully. Please confirm receipt.',
    isActive: true,
  },

  // 5. Monthly Performance Report
  {
    name: 'Monthly Performance Summary',
    subject: '📊 Your Monthly Performance Report - {{month}}',
    category: 'report',
    description: 'Monthly performance analytics for fleet owners',
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .stat-card { background: white; padding: 20px; border-radius: 8px; text-align: center; border-top: 3px solid #667eea; }
    .stat-number { font-size: 32px; font-weight: bold; color: #667eea; }
    .stat-label { color: #666; font-size: 14px; }
    .achievement { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>📊 Monthly Performance Report</h2>
      <p>February 2026 Summary</p>
    </div>
    <div class="content">
      <p>Hello <strong>{{tenantName}}</strong>,</p>
      
      <p>Here's your performance summary for February 2026. Great work! 🎉</p>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">47</div>
          <div class="stat-label">Completed Trips</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">$45,230</div>
          <div class="stat-label">Total Revenue</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">98.5%</div>
          <div class="stat-label">On-Time Delivery</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">4.9★</div>
          <div class="stat-label">Average Rating</div>
        </div>
      </div>
      
      <div class="achievement">
        <h3>🏆 Achievement Unlocked!</h3>
        <p><strong>"Reliability Champion"</strong> - 30+ consecutive on-time deliveries</p>
        <p>You're now eligible for premium load opportunities!</p>
      </div>
      
      <p><strong>Key Highlights:</strong></p>
      <ul>
        <li>📈 Revenue increased by 23% vs last month</li>
        <li>🚚 Fleet utilization: 87% (Industry avg: 65%)</li>
        <li>⭐ 15 new 5-star reviews received</li>
        <li>🎯 Top performer in Kigali-Dar corridor</li>
      </ul>
      
      <p><strong>Opportunities for Growth:</strong></p>
      <ul>
        <li>💡 3 new routes available matching your fleet</li>
        <li>🤝 2 enterprise clients interested in partnerships</li>
        <li>📚 New training: "Advanced Route Optimization"</li>
      </ul>
      
      <center>
        <a href="https://urutix.com/analytics/{{tenantId}}" class="button">View Full Report</a>
      </center>
      
      <p>Keep up the excellent work!</p>
      
      <p>Best regards,<br><strong>Urutix Analytics Team</strong></p>
    </div>
  </div>
</body>
</html>`,
    textBody: 'Your monthly performance report is ready. View it in your dashboard.',
    isActive: true,
  },

  // 6. Document Expiry Alert
  {
    name: 'Document Expiring Soon - Action Required',
    subject: '⚠️ Important: Your {{documentType}} Expires in {{days}} Days',
    category: 'alert',
    description: 'Alert users about expiring documents',
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; }
    .alert-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .doc-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .urgent { color: #ef4444; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>⚠️ Document Expiry Alert</h2>
    </div>
    <div class="content">
      <p>Hello <strong>{{tenantName}}</strong>,</p>
      
      <div class="alert-box">
        <h3 class="urgent">⏰ Action Required!</h3>
        <p>Your <strong>Vehicle Insurance Certificate</strong> will expire in <strong>7 days</strong>.</p>
      </div>
      
      <div class="doc-card">
        <h3>Document Details</h3>
        <p><strong>Document Type:</strong> Vehicle Insurance Certificate</p>
        <p><strong>Vehicle:</strong> Truck KBZ-123A</p>
        <p><strong>Current Expiry:</strong> March 29, 2026</p>
        <p><strong>Status:</strong> <span class="urgent">Expiring Soon</span></p>
      </div>
      
      <p><strong>Why This Matters:</strong></p>
      <ul>
        <li>🚫 Expired documents prevent load assignments</li>
        <li>⚖️ Legal compliance requirement</li>
        <li>💼 Affects your platform verification status</li>
        <li>📉 May impact your reliability score</li>
      </ul>
      
      <p><strong>Next Steps:</strong></p>
      <ol>
        <li>Renew your insurance certificate</li>
        <li>Upload the new document to Urutix</li>
        <li>Our team will verify within 24 hours</li>
      </ol>
      
      <center>
        <a href="https://urutix.com/documents/upload" class="button">Upload New Document</a>
      </center>
      
      <p><em>Need help? Contact our compliance team at <a href="mailto:compliance@urutix.com">compliance@urutix.com</a></em></p>
      
      <p>Best regards,<br><strong>Urutix Compliance Team</strong></p>
    </div>
  </div>
</body>
</html>`,
    textBody: 'Your document is expiring soon. Please upload a renewed version.',
    isActive: true,
  },

  // 7. Subscription Renewal Reminder
  {
    name: 'Subscription Renewal Reminder',
    subject: '🔔 Your Urutix Subscription Renews in {{days}} Days',
    category: 'subscription',
    description: 'Remind users about upcoming subscription renewal',
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; }
    .plan-box { background: white; padding: 25px; border-radius: 8px; border: 2px solid #8b5cf6; margin: 20px 0; }
    .price { font-size: 36px; color: #8b5cf6; font-weight: bold; }
    .features { background: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🔔 Subscription Renewal</h2>
    </div>
    <div class="content">
      <p>Hello <strong>{{tenantName}}</strong>,</p>
      
      <p>Your <strong>Professional Plan</strong> subscription will automatically renew in <strong>5 days</strong>.</p>
      
      <div class="plan-box">
        <h3>Current Plan: Professional</h3>
        <div class="price">$99/month</div>
        <p><strong>Renewal Date:</strong> March 25, 2026</p>
        <p><strong>Payment Method:</strong> Mobile Money (****1234)</p>
      </div>
      
      <div class="features">
        <h3>✨ Your Plan Includes:</h3>
        <ul>
          <li>✅ Unlimited load postings</li>
          <li>✅ Real-time GPS tracking</li>
          <li>✅ Priority customer support</li>
          <li>✅ Advanced analytics dashboard</li>
          <li>✅ API access for integrations</li>
          <li>✅ 5,000 monthly credits included</li>
        </ul>
      </div>
      
      <p><strong>Your Usage This Month:</strong></p>
      <ul>
        <li>📊 47 loads posted</li>
        <li>🚚 3,245 credits used</li>
        <li>💰 $45,230 in transactions</li>
      </ul>
      
      <center>
        <a href="https://urutix.com/subscription/manage" class="button">Manage Subscription</a>
      </center>
      
      <p><em>Want to upgrade? Check out our Enterprise plan for advanced features!</em></p>
      
      <p>Best regards,<br><strong>Urutix Billing Team</strong></p>
    </div>
  </div>
</body>
</html>`,
    textBody: 'Your subscription renews soon. Manage your subscription in your account settings.',
    isActive: true,
  },

  // 8. New Feature Announcement
  {
    name: 'New Feature Launch Announcement',
    subject: '🚀 Introducing: AI-Powered Route Optimization',
    category: 'announcement',
    description: 'Announce new platform features to users',
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; }
    .feature-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #06b6d4; }
    .benefit { background: #ecfeff; padding: 15px; border-radius: 8px; margin: 10px 0; }
    .button { display: inline-block; background: #06b6d4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .badge { background: #10b981; color: white; padding: 5px 10px; border-radius: 3px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 New Feature Alert!</h1>
      <p>AI-Powered Route Optimization is Here</p>
      <span class="badge">NOW AVAILABLE</span>
    </div>
    <div class="content">
      <p>Hello <strong>{{tenantName}}</strong>,</p>
      
      <p>We're excited to announce our latest innovation: <strong>AI-Powered Route Optimization</strong>!</p>
      
      <div class="feature-card">
        <h3>🤖 What's New?</h3>
        <p>Our advanced AI engine now analyzes millions of data points to suggest the most efficient routes for your deliveries, saving you time and fuel costs.</p>
      </div>
      
      <div class="benefit">
        <h4>💰 Save Up to 25% on Fuel Costs</h4>
        <p>Optimized routes mean less distance traveled and lower fuel consumption.</p>
      </div>
      
      <div class="benefit">
        <h4>⏱️ Reduce Delivery Time by 30%</h4>
        <p>AI considers traffic patterns, road conditions, and weather to find the fastest path.</p>
      </div>
      
      <div class="benefit">
        <h4>🌍 Lower Carbon Footprint</h4>
        <p>Efficient routing means fewer emissions and a greener operation.</p>
      </div>
      
      <p><strong>How It Works:</strong></p>
      <ol>
        <li>Enter your pickup and delivery locations</li>
        <li>AI analyzes optimal routes in real-time</li>
        <li>Get instant recommendations with cost savings</li>
        <li>Track performance and savings over time</li>
      </ol>
      
      <center>
        <a href="https://urutix.com/features/route-optimization" class="button">Try It Now</a>
      </center>
      
      <p><em>🎁 Special Launch Offer: First 100 users get 1 month of premium AI features FREE!</em></p>
      
      <p>Best regards,<br><strong>Urutix Product Team</strong></p>
    </div>
  </div>
</body>
</html>`,
    textBody: 'New feature: AI-Powered Route Optimization is now available!',
    isActive: true,
  },
];

// Seed function
async function seedEmailTemplates() {
  const client = await pool.connect();

  try {
    console.log('🌱 Starting email templates seed...\n');

    // Check if email_templates table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'email_templates'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ email_templates table does not exist. Please run migrations first.');
      return;
    }

    // Clear existing templates (optional)
    await client.query('DELETE FROM email_templates WHERE category IN ($1, $2, $3, $4, $5, $6, $7, $8)',
      ['onboarding', 'notification', 'transaction', 'delivery', 'report', 'alert', 'subscription', 'announcement']);
    console.log('🗑️  Cleared existing templates\n');

    // Insert templates
    for (const template of emailTemplates) {
      const result = await client.query(`
        INSERT INTO email_templates (
          name, subject, category, description, html_body, text_body, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id, name
      `, [
        template.name,
        template.subject,
        template.category,
        template.description,
        template.htmlBody,
        template.textBody,
        template.isActive
      ]);

      console.log(`✅ Created: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
    }

    console.log(`\n🎉 Successfully seeded ${emailTemplates.length} email templates!`);
    console.log('\n📊 Templates by Category:');
    console.log('   - Onboarding: 1');
    console.log('   - Notifications: 1');
    console.log('   - Transactions: 1');
    console.log('   - Delivery: 1');
    console.log('   - Reports: 1');
    console.log('   - Alerts: 1');
    console.log('   - Subscription: 1');
    console.log('   - Announcements: 1');

  } catch (error) {
    console.error('❌ Error seeding email templates:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seed
seedEmailTemplates()
  .then(() => {
    console.log('\n✨ Email templates seed completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seed failed:', error);
    process.exit(1);
  });
