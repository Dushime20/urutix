const mongoose = require('mongoose');

const insurancePolicySchema = new mongoose.Schema({
  policyNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  truckId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Truck',
    required: true
  },
  insuranceCompany: {
    type: String,
    required: true,
    trim: true
  },
  policyType: {
    type: String,
    required: true,
    enum: ['liability', 'collision', 'comprehensive', 'cargo', 'uninsured_motorist', 'roadside', 'medical']
  },
  coverageAmount: {
    type: Number,
    required: true,
    min: 0
  },
  premium: {
    type: Number,
    required: true,
    min: 0
  },
  deductible: {
    type: Number,
    required: true,
    min: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'pending', 'expired', 'cancelled', 'suspended'],
    default: 'pending'
  },
  coverageTypes: [{
    type: String,
    enum: ['liability', 'collision', 'comprehensive', 'cargo', 'uninsured_motorist', 'roadside', 'medical']
  }],
  autoRenew: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  },
  documents: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  agent: {
    name: String,
    email: String,
    phone: String
  },
  paymentMethod: {
    type: String,
    enum: ['monthly', 'quarterly', 'annually', 'lump_sum'],
    default: 'monthly'
  },
  lastPaymentDate: Date,
  nextPaymentDate: Date,
  claimsCount: {
    type: Number,
    default: 0
  },
  totalClaimsAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
insurancePolicySchema.index({ truckId: 1, status: 1 });
insurancePolicySchema.index({ policyNumber: 1 });
insurancePolicySchema.index({ endDate: 1 });
insurancePolicySchema.index({ insuranceCompany: 1 });

// Virtual for days until expiration
insurancePolicySchema.virtual('daysUntilExpiration').get(function() {
  if (!this.endDate) return null;
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for policy status based on dates
insurancePolicySchema.virtual('calculatedStatus').get(function() {
  if (this.status === 'cancelled' || this.status === 'suspended') {
    return this.status;
  }
  
  const now = new Date();
  if (this.endDate < now) {
    return 'expired';
  }
  
  if (this.startDate > now) {
    return 'pending';
  }
  
  return 'active';
});

// Pre-save middleware to generate policy number if not provided
insurancePolicySchema.pre('save', async function(next) {
  if (!this.policyNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({ 
      startDate: { $gte: new Date(year, 0, 1) }
    });
    this.policyNumber = `INS-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

// Method to check if policy is expiring soon
insurancePolicySchema.methods.isExpiringSoon = function(days = 30) {
  if (!this.endDate) return false;
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= days && diffDays >= 0;
};

// Method to calculate renewal premium estimate
insurancePolicySchema.methods.calculateRenewalPremium = function() {
  // Base premium calculation logic
  let basePremium = this.premium;
  
  // Adjust based on claims history
  if (this.claimsCount > 0) {
    const claimsRatio = this.totalClaimsAmount / this.coverageAmount;
    if (claimsRatio > 0.1) { // More than 10% of coverage used
      basePremium *= 1.2; // 20% increase
    }
  }
  
  // Adjust based on policy age
  const policyAge = (new Date() - new Date(this.startDate)) / (1000 * 60 * 60 * 24 * 365);
  if (policyAge > 3) { // Policy older than 3 years
    basePremium *= 1.1; // 10% increase
  }
  
  return Math.round(basePremium * 100) / 100; // Round to 2 decimal places
};

module.exports = mongoose.model('InsurancePolicy', insurancePolicySchema);
