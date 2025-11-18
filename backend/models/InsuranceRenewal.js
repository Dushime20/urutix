const mongoose = require('mongoose');

const insuranceRenewalSchema = new mongoose.Schema({
  renewalNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  policyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InsurancePolicy',
    required: true
  },
  truckId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Truck',
    required: true
  },
  currentPolicyEndDate: {
    type: Date,
    required: true
  },
  renewalDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'urgent', 'completed', 'expired', 'cancelled'],
    default: 'pending'
  },
  currentPremium: {
    type: Number,
    required: true,
    min: 0
  },
  estimatedPremium: {
    type: Number,
    min: 0
  },
  finalPremium: {
    type: Number,
    min: 0
  },
  autoRenew: {
    type: Boolean,
    default: false
  },
  coverageChanges: [{
    type: String,
    description: String,
    impact: String // 'increase', 'decrease', 'new', 'removed'
  }],
  renewalTerms: {
    duration: {
      type: Number,
      required: true,
      min: 1,
      max: 12 // months
    },
    paymentFrequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'annually', 'lump_sum'],
      default: 'monthly'
    },
    gracePeriod: {
      type: Number,
      default: 30 // days
    }
  },
  agent: {
    name: String,
    email: String,
    phone: String,
    notes: String
  },
  customerResponse: {
    responded: Boolean,
    responseDate: Date,
    decision: {
      type: String,
      enum: ['accept', 'decline', 'modify', 'pending']
    },
    notes: String,
    requestedChanges: [String]
  },
  documents: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: String
  }],
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push', 'mail']
    },
    sentDate: Date,
    recipient: String,
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read', 'failed']
    }
  }],
  timeline: [{
    action: String,
    description: String,
    date: Date,
    performedBy: String,
    notes: String
  }],
  notes: [{
    content: String,
    author: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    isInternal: Boolean
  }],
  riskAssessment: {
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    factors: [{
      factor: String,
      weight: Number,
      score: Number
    }],
    recommendations: [String]
  },
  competitorQuotes: [{
    company: String,
    premium: Number,
    coverage: String,
    notes: String,
    quoteDate: Date
  }],
  finalDecision: {
    decision: {
      type: String,
      enum: ['renewed', 'switched', 'cancelled', 'pending']
    },
    decisionDate: Date,
    reason: String,
    newPolicyId: mongoose.Schema.Types.ObjectId
  }
}, {
  timestamps: true
});

// Indexes for better query performance
insuranceRenewalSchema.index({ policyId: 1, status: 1 });
insuranceRenewalSchema.index({ truckId: 1 });
insuranceRenewalSchema.index({ renewalNumber: 1 });
insuranceRenewalSchema.index({ currentPolicyEndDate: 1 });
insuranceRenewalSchema.index({ renewalDate: 1 });

// Virtual for days until renewal
insuranceRenewalSchema.virtual('daysUntilRenewal').get(function() {
  const now = new Date();
  const renewal = new Date(this.renewalDate);
  const diffTime = renewal.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for days until policy expires
insuranceRenewalSchema.virtual('daysUntilExpiration').get(function() {
  const now = new Date();
  const end = new Date(this.currentPolicyEndDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for premium change percentage
insuranceRenewalSchema.virtual('premiumChangePercentage').get(function() {
  if (!this.estimatedPremium || !this.currentPremium) return null;
  const change = this.estimatedPremium - this.currentPremium;
  return Math.round((change / this.currentPremium) * 100);
});

// Pre-save middleware to generate renewal number if not provided
insuranceRenewalSchema.pre('save', async function(next) {
  if (!this.renewalNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({ 
      createdAt: { $gte: new Date(year, 0, 1) }
    });
    this.renewalNumber = `REN-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

// Method to check if renewal is urgent
insuranceRenewalSchema.methods.isUrgent = function(days = 30) {
  return this.daysUntilRenewal <= days && this.daysUntilRenewal >= 0;
};

// Method to add timeline entry
insuranceRenewalSchema.methods.addTimelineEntry = function(action, description, performedBy, notes = '') {
  this.timeline.push({
    action,
    description,
    performedBy,
    notes,
    date: new Date()
  });
  return this.save();
};

// Method to add note
insuranceRenewalSchema.methods.addNote = function(content, author, isInternal = false) {
  this.notes.push({
    content,
    author,
    isInternal,
    timestamp: new Date()
  });
  return this.save();
};

// Method to send reminder
insuranceRenewalSchema.methods.sendReminder = function(type, recipient) {
  this.reminders.push({
    type,
    recipient,
    sentDate: new Date(),
    status: 'sent'
  });
  this.addTimelineEntry('Reminder Sent', `${type} reminder sent to ${recipient}`, 'System');
  return this.save();
};

// Method to update status
insuranceRenewalSchema.methods.updateStatus = function(newStatus, notes = '') {
  this.status = newStatus;
  if (notes) {
    this.addNote(`Status changed to ${newStatus}: ${notes}`, 'System', true);
  }
  this.addTimelineEntry('Status Update', `Status changed to ${newStatus}`, 'System');
  return this.save();
};

// Method to record customer response
insuranceRenewalSchema.methods.recordCustomerResponse = function(decision, notes = '', requestedChanges = []) {
  this.customerResponse = {
    responded: true,
    responseDate: new Date(),
    decision,
    notes,
    requestedChanges
  };
  this.addTimelineEntry('Customer Response', `Customer ${decision} renewal`, 'Customer');
  return this.save();
};

// Method to calculate risk score
insuranceRenewalSchema.methods.calculateRiskScore = function() {
  let totalScore = 0;
  let totalWeight = 0;
  
  if (this.riskAssessment.factors) {
    this.riskAssessment.factors.forEach(factor => {
      totalScore += factor.score * factor.weight;
      totalWeight += factor.weight;
    });
  }
  
  if (totalWeight > 0) {
    this.riskAssessment.score = Math.round(totalScore / totalWeight);
  }
  
  return this.riskAssessment.score;
};

// Static method to get renewals statistics
insuranceRenewalSchema.statics.getRenewalsStatistics = async function(filters = {}) {
  const matchStage = {};
  
  if (filters.dateRange) {
    matchStage.renewalDate = {
      $gte: new Date(filters.dateRange.start),
      $lte: new Date(filters.dateRange.end)
    };
  }
  
  if (filters.status) {
    matchStage.status = filters.status;
  }

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRenewals: { $sum: 1 },
        urgentRenewals: {
          $sum: {
            $cond: [
              { $lte: [{ $subtract: ['$renewalDate', new Date()] }, 30 * 24 * 60 * 60 * 1000] },
              1,
              0
            ]
          }
        },
        totalCurrentPremium: { $sum: '$currentPremium' },
        totalEstimatedPremium: { $sum: '$estimatedPremium' },
        averagePremiumChange: {
          $avg: {
            $subtract: ['$estimatedPremium', '$currentPremium']
          }
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalRenewals: 0,
    urgentRenewals: 0,
    totalCurrentPremium: 0,
    totalEstimatedPremium: 0,
    averagePremiumChange: 0
  };
};

// Static method to find urgent renewals
insuranceRenewalSchema.statics.findUrgentRenewals = function(days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + days);
  
  return this.find({
    renewalDate: { $lte: cutoffDate },
    status: { $in: ['pending', 'urgent'] }
  }).populate('policyId truckId');
};

module.exports = mongoose.model('InsuranceRenewal', insuranceRenewalSchema);
