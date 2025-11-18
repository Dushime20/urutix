const mongoose = require('mongoose');

const insuranceClaimSchema = new mongoose.Schema({
  claimNumber: {
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
  claimType: {
    type: String,
    required: true,
    enum: ['collision', 'cargo_damage', 'theft', 'weather', 'liability', 'medical', 'roadside', 'other']
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  incidentDate: {
    type: Date,
    required: true
  },
  reportedDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  estimatedAmount: {
    type: Number,
    required: true,
    min: 0
  },
  approvedAmount: {
    type: Number,
    min: 0
  },
  paidAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'investigating', 'approved', 'denied', 'closed', 'under_review'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  adjuster: {
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    email: String,
    phone: String
  },
  notes: [{
    content: String,
    author: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    isInternal: {
      type: Boolean,
      default: false
    }
  }],
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
  location: {
    address: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  witnesses: [{
    name: String,
    contact: String,
    statement: String
  }],
  policeReport: {
    reportNumber: String,
    department: String,
    officer: String,
    date: Date
  },
  repairEstimates: [{
    vendor: String,
    amount: Number,
    description: String,
    date: Date
  }],
  timeline: [{
    action: String,
    description: String,
    date: Date,
    performedBy: String
  }],
  settlement: {
    date: Date,
    method: String,
    reference: String
  },
  appeal: {
    filed: Boolean,
    date: Date,
    reason: String,
    status: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
insuranceClaimSchema.index({ policyId: 1, status: 1 });
insuranceClaimSchema.index({ truckId: 1 });
insuranceClaimSchema.index({ claimNumber: 1 });
insuranceClaimSchema.index({ incidentDate: 1 });
insuranceClaimSchema.index({ adjuster: 1 });

// Virtual for claim age in days
insuranceClaimSchema.virtual('claimAge').get(function() {
  const now = new Date();
  const reported = new Date(this.reportedDate);
  const diffTime = now.getTime() - reported.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for days since incident
insuranceClaimSchema.virtual('daysSinceIncident').get(function() {
  const now = new Date();
  const incident = new Date(this.incidentDate);
  const diffTime = now.getTime() - incident.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to generate claim number if not provided
insuranceClaimSchema.pre('save', async function(next) {
  if (!this.claimNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({ 
      reportedDate: { $gte: new Date(year, 0, 1) }
    });
    this.claimNumber = `CLM-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Method to add note to claim
insuranceClaimSchema.methods.addNote = function(content, author, isInternal = false) {
  this.notes.push({
    content,
    author,
    isInternal,
    timestamp: new Date()
  });
  return this.save();
};

// Method to add timeline entry
insuranceClaimSchema.methods.addTimelineEntry = function(action, description, performedBy) {
  this.timeline.push({
    action,
    description,
    performedBy,
    date: new Date()
  });
  return this.save();
};

// Method to update claim status
insuranceClaimSchema.methods.updateStatus = function(newStatus, notes = '') {
  this.status = newStatus;
  if (notes) {
    this.addNote(`Status changed to ${newStatus}: ${notes}`, 'System', true);
  }
  this.addTimelineEntry('Status Update', `Status changed to ${newStatus}`, 'System');
  return this.save();
};

// Method to assign adjuster
insuranceClaimSchema.methods.assignAdjuster = function(adjusterData) {
  this.adjuster = adjusterData;
  this.addTimelineEntry('Adjuster Assignment', `Assigned to ${adjusterData.name}`, 'System');
  return this.save();
};

// Method to calculate claim processing time
insuranceClaimSchema.methods.getProcessingTime = function() {
  if (this.status === 'closed' || this.status === 'denied') {
    const closedDate = this.updatedAt;
    const reportedDate = this.reportedDate;
    const diffTime = closedDate.getTime() - reportedDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return null;
};

// Static method to get claims statistics
insuranceClaimSchema.statics.getClaimsStatistics = async function(filters = {}) {
  const matchStage = {};
  
  if (filters.dateRange) {
    matchStage.incidentDate = {
      $gte: new Date(filters.dateRange.start),
      $lte: new Date(filters.dateRange.end)
    };
  }
  
  if (filters.status) {
    matchStage.status = filters.status;
  }
  
  if (filters.claimType) {
    matchStage.claimType = filters.claimType;
  }

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalClaims: { $sum: 1 },
        totalEstimatedAmount: { $sum: '$estimatedAmount' },
        totalApprovedAmount: { $sum: '$approvedAmount' },
        totalPaidAmount: { $sum: '$paidAmount' },
        averageProcessingTime: { $avg: '$claimAge' }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalClaims: 0,
    totalEstimatedAmount: 0,
    totalApprovedAmount: 0,
    totalPaidAmount: 0,
    averageProcessingTime: 0
  };
};

module.exports = mongoose.model('InsuranceClaim', insuranceClaimSchema);
