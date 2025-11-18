const InsurancePolicy = require('../models/InsurancePolicy');
const InsuranceClaim = require('../models/InsuranceClaim');
const InsuranceRenewal = require('../models/InsuranceRenewal');
const Truck = require('../models/Truck');

// ===== INSURANCE POLICY CONTROLLER =====

const insuranceController = {
  // Get all insurance policies with filters
  async getPolicies(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search, 
        status, 
        truckId, 
        insuranceCompany,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const query = {};
      
      // Search filter
      if (search) {
        query.$or = [
          { policyNumber: { $regex: search, $options: 'i' } },
          { insuranceCompany: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Status filter
      if (status) {
        query.status = status;
      }
      
      // Truck filter
      if (truckId) {
        query.truckId = truckId;
      }
      
      // Insurance company filter
      if (insuranceCompany) {
        query.insuranceCompany = { $regex: insuranceCompany, $options: 'i' };
      }
      
      // Date range filter
      if (startDate || endDate) {
        query.startDate = {};
        if (startDate) query.startDate.$gte = new Date(startDate);
        if (endDate) query.startDate.$lte = new Date(endDate);
      }

      // Sorting
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;
      
      const policies = await InsurancePolicy.find(query)
        .populate('truckId', 'plateNumber make model year')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await InsurancePolicy.countDocuments(query);
      
      res.json({
        success: true,
        data: {
          policies,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching policies:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch policies',
        error: error.message
      });
    }
  },

  // Get single policy by ID
  async getPolicyById(req, res) {
    try {
      const { id } = req.params;
      
      const policy = await InsurancePolicy.findById(id)
        .populate('truckId', 'plateNumber make model year')
        .populate('documents');
      
      if (!policy) {
        return res.status(404).json({
          success: false,
          message: 'Insurance policy not found'
        });
      }
      
      res.json({
        success: true,
        data: { policy }
      });
    } catch (error) {
      console.error('Error fetching policy:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch policy',
        error: error.message
      });
    }
  },

  // Create new insurance policy
  async createPolicy(req, res) {
    try {
      const policyData = req.body;
      
      // Validate truck exists
      const truck = await Truck.findById(policyData.truckId);
      if (!truck) {
        return res.status(400).json({
          success: false,
          message: 'Truck not found'
        });
      }
      
      // Check for overlapping policies
      const overlappingPolicy = await InsurancePolicy.findOne({
        truckId: policyData.truckId,
        status: { $in: ['active', 'pending'] },
        $or: [
          {
            startDate: { $lte: policyData.endDate },
            endDate: { $gte: policyData.startDate }
          }
        ]
      });
      
      if (overlappingPolicy) {
        return res.status(400).json({
          success: false,
          message: 'Policy dates overlap with existing active policy'
        });
      }
      
      const policy = new InsurancePolicy(policyData);
      await policy.save();
      
      // Populate truck info for response
      await policy.populate('truckId', 'plateNumber make model year');
      
      res.status(201).json({
        success: true,
        message: 'Insurance policy created successfully',
        data: { policy }
      });
    } catch (error) {
      console.error('Error creating policy:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create policy',
        error: error.message
      });
    }
  },

  // Update insurance policy
  async updatePolicy(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const policy = await InsurancePolicy.findById(id);
      if (!policy) {
        return res.status(404).json({
          success: false,
          message: 'Insurance policy not found'
        });
      }
      
      // Check for overlapping policies if dates are being updated
      if (updateData.startDate || updateData.endDate) {
        const startDate = updateData.startDate || policy.startDate;
        const endDate = updateData.endDate || policy.endDate;
        
        const overlappingPolicy = await InsurancePolicy.findOne({
          _id: { $ne: id },
          truckId: policy.truckId,
          status: { $in: ['active', 'pending'] },
          $or: [
            {
              startDate: { $lte: endDate },
              endDate: { $gte: startDate }
            }
          ]
        });
        
        if (overlappingPolicy) {
          return res.status(400).json({
            success: false,
            message: 'Policy dates overlap with existing active policy'
          });
        }
      }
      
      Object.assign(policy, updateData);
      await policy.save();
      
      await policy.populate('truckId', 'plateNumber make model year');
      
      res.json({
        success: true,
        message: 'Insurance policy updated successfully',
        data: { policy }
      });
    } catch (error) {
      console.error('Error updating policy:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update policy',
        error: error.message
      });
    }
  },

  // Delete insurance policy
  async deletePolicy(req, res) {
    try {
      const { id } = req.params;
      
      const policy = await InsurancePolicy.findById(id);
      if (!policy) {
        return res.status(404).json({
          success: false,
          message: 'Insurance policy not found'
        });
      }
      
      // Check if policy has active claims
      const activeClaims = await InsuranceClaim.countDocuments({
        policyId: id,
        status: { $in: ['pending', 'investigating', 'approved'] }
      });
      
      if (activeClaims > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete policy with active claims'
        });
      }
      
      await InsurancePolicy.findByIdAndDelete(id);
      
      res.json({
        success: true,
        message: 'Insurance policy deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting policy:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete policy',
        error: error.message
      });
    }
  },

  // ===== INSURANCE CLAIMS CONTROLLER =====

  // Get all claims with filters
  async getClaims(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search, 
        status, 
        claimType, 
        policyId,
        truckId,
        startDate,
        endDate,
        sortBy = 'reportedDate',
        sortOrder = 'desc'
      } = req.query;

      const query = {};
      
      // Search filter
      if (search) {
        query.$or = [
          { claimNumber: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Status filter
      if (status) {
        query.status = status;
      }
      
      // Claim type filter
      if (claimType) {
        query.claimType = claimType;
      }
      
      // Policy filter
      if (policyId) {
        query.policyId = policyId;
      }
      
      // Truck filter
      if (truckId) {
        query.truckId = truckId;
      }
      
      // Date range filter
      if (startDate || endDate) {
        query.incidentDate = {};
        if (startDate) query.incidentDate.$gte = new Date(startDate);
        if (endDate) query.incidentDate.$lte = new Date(endDate);
      }

      // Sorting
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;
      
      const claims = await InsuranceClaim.find(query)
        .populate('policyId', 'policyNumber insuranceCompany')
        .populate('truckId', 'plateNumber make model')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await InsuranceClaim.countDocuments(query);
      
      res.json({
        success: true,
        data: {
          claims,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching claims:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch claims',
        error: error.message
      });
    }
  },

  // Get single claim by ID
  async getClaimById(req, res) {
    try {
      const { id } = req.params;
      
      const claim = await InsuranceClaim.findById(id)
        .populate('policyId', 'policyNumber insuranceCompany coverageAmount')
        .populate('truckId', 'plateNumber make model year');
      
      if (!claim) {
        return res.status(404).json({
          success: false,
          message: 'Insurance claim not found'
        });
      }
      
      res.json({
        success: true,
        data: { claim }
      });
    } catch (error) {
      console.error('Error fetching claim:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch claim',
        error: error.message
      });
    }
  },

  // Create new claim
  async createClaim(req, res) {
    try {
      const claimData = req.body;
      
      // Validate policy exists
      const policy = await InsurancePolicy.findById(claimData.policyId);
      if (!policy) {
        return res.status(400).json({
          success: false,
          message: 'Insurance policy not found'
        });
      }
      
      // Validate truck exists
      const truck = await Truck.findById(claimData.truckId);
      if (!truck) {
        return res.status(400).json({
          success: false,
          message: 'Truck not found'
        });
      }
      
      // Check if policy is active
      if (policy.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Cannot create claim for inactive policy'
        });
      }
      
      const claim = new InsuranceClaim(claimData);
      await claim.save();
      
      // Update policy claims count and total amount
      await InsurancePolicy.findByIdAndUpdate(claimData.policyId, {
        $inc: { 
          claimsCount: 1,
          totalClaimsAmount: claimData.estimatedAmount
        }
      });
      
      // Populate related data for response
      await claim.populate('policyId', 'policyNumber insuranceCompany');
      await claim.populate('truckId', 'plateNumber make model');
      
      res.status(201).json({
        success: true,
        message: 'Insurance claim created successfully',
        data: { claim }
      });
    } catch (error) {
      console.error('Error creating claim:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create claim',
        error: error.message
      });
    }
  },

  // Update claim
  async updateClaim(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const claim = await InsuranceClaim.findById(id);
      if (!claim) {
        return res.status(404).json({
          success: false,
          message: 'Insurance claim not found'
        });
      }
      
      // If approved amount is being updated, update policy total
      if (updateData.approvedAmount !== undefined && 
          updateData.approvedAmount !== claim.approvedAmount) {
        const difference = updateData.approvedAmount - (claim.approvedAmount || 0);
        await InsurancePolicy.findByIdAndUpdate(claim.policyId, {
          $inc: { totalClaimsAmount: difference }
        });
      }
      
      Object.assign(claim, updateData);
      await claim.save();
      
      await claim.populate('policyId', 'policyNumber insuranceCompany');
      await claim.populate('truckId', 'plateNumber make model');
      
      res.json({
        success: true,
        message: 'Insurance claim updated successfully',
        data: { claim }
      });
    } catch (error) {
      console.error('Error updating claim:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update claim',
        error: error.message
      });
    }
  },

  // Delete claim
  async deleteClaim(req, res) {
    try {
      const { id } = req.params;
      
      const claim = await InsuranceClaim.findById(id);
      if (!claim) {
        return res.status(404).json({
          success: false,
          message: 'Insurance claim not found'
        });
      }
      
      // Check if claim can be deleted
      if (claim.status === 'approved' || claim.status === 'closed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete approved or closed claims'
        });
      }
      
      // Update policy claims count and total amount
      await InsurancePolicy.findByIdAndUpdate(claim.policyId, {
        $inc: { 
          claimsCount: -1,
          totalClaimsAmount: -(claim.estimatedAmount || 0)
        }
      });
      
      await InsuranceClaim.findByIdAndDelete(id);
      
      res.json({
        success: true,
        message: 'Insurance claim deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting claim:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete claim',
        error: error.message
      });
    }
  },

  // ===== INSURANCE RENEWALS CONTROLLER =====

  // Get all renewals with filters
  async getRenewals(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search, 
        status, 
        policyId,
        truckId,
        startDate,
        endDate,
        sortBy = 'renewalDate',
        sortOrder = 'asc'
      } = req.query;

      const query = {};
      
      // Search filter
      if (search) {
        query.$or = [
          { renewalNumber: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Status filter
      if (status) {
        query.status = status;
      }
      
      // Policy filter
      if (policyId) {
        query.policyId = policyId;
      }
      
      // Truck filter
      if (truckId) {
        query.truckId = truckId;
      }
      
      // Date range filter
      if (startDate || endDate) {
        query.renewalDate = {};
        if (startDate) query.renewalDate.$gte = new Date(startDate);
        if (endDate) query.renewalDate.$lte = new Date(endDate);
      }

      // Sorting
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;
      
      const renewals = await InsuranceRenewal.find(query)
        .populate('policyId', 'policyNumber insuranceCompany')
        .populate('truckId', 'plateNumber make model')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await InsuranceRenewal.countDocuments(query);
      
      res.json({
        success: true,
        data: {
          renewals,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching renewals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch renewals',
        error: error.message
      });
    }
  },

  // Get single renewal by ID
  async getRenewalById(req, res) {
    try {
      const { id } = req.params;
      
      const renewal = await InsuranceRenewal.findById(id)
        .populate('policyId', 'policyNumber insuranceCompany coverageAmount')
        .populate('truckId', 'plateNumber make model year');
      
      if (!renewal) {
        return res.status(404).json({
          success: false,
          message: 'Insurance renewal not found'
        });
      }
      
      res.json({
        success: true,
        data: { renewal }
      });
    } catch (error) {
      console.error('Error fetching renewal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch renewal',
        error: error.message
      });
    }
  },

  // Create new renewal
  async createRenewal(req, res) {
    try {
      const renewalData = req.body;
      
      // Validate policy exists
      const policy = await InsurancePolicy.findById(renewalData.policyId);
      if (!policy) {
        return res.status(400).json({
          success: false,
          message: 'Insurance policy not found'
        });
      }
      
      // Validate truck exists
      const truck = await Truck.findById(renewalData.truckId);
      if (!truck) {
        return res.status(400).json({
          success: false,
          message: 'Truck not found'
        });
      }
      
      // Check if renewal already exists for this policy
      const existingRenewal = await InsuranceRenewal.findOne({
        policyId: renewalData.policyId,
        status: { $in: ['pending', 'urgent'] }
      });
      
      if (existingRenewal) {
        return res.status(400).json({
          success: false,
          message: 'Renewal already exists for this policy'
        });
      }
      
      const renewal = new InsuranceRenewal(renewalData);
      await renewal.save();
      
      // Populate related data for response
      await renewal.populate('policyId', 'policyNumber insuranceCompany');
      await renewal.populate('truckId', 'plateNumber make model');
      
      res.status(201).json({
        success: true,
        message: 'Insurance renewal created successfully',
        data: { renewal }
      });
    } catch (error) {
      console.error('Error creating renewal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create renewal',
        error: error.message
      });
    }
  },

  // Update renewal
  async updateRenewal(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const renewal = await InsuranceRenewal.findById(id);
      if (!renewal) {
        return res.status(404).json({
          success: false,
          message: 'Insurance renewal not found'
        });
      }
      
      Object.assign(renewal, updateData);
      await renewal.save();
      
      await renewal.populate('policyId', 'policyNumber insuranceCompany');
      await renewal.populate('truckId', 'plateNumber make model');
      
      res.json({
        success: true,
        message: 'Insurance renewal updated successfully',
        data: { renewal }
      });
    } catch (error) {
      console.error('Error updating renewal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update renewal',
        error: error.message
      });
    }
  },

  // Delete renewal
  async deleteRenewal(req, res) {
    try {
      const { id } = req.params;
      
      const renewal = await InsuranceRenewal.findById(id);
      if (!renewal) {
        return res.status(404).json({
          success: false,
          message: 'Insurance renewal not found'
        });
      }
      
      // Check if renewal can be deleted
      if (renewal.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete completed renewal'
        });
      }
      
      await InsuranceRenewal.findByIdAndDelete(id);
      
      res.json({
        success: true,
        message: 'Insurance renewal deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting renewal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete renewal',
        error: error.message
      });
    }
  },

  // ===== ANALYTICS & DASHBOARD =====

  // Get insurance dashboard statistics
  async getDashboardStats(req, res) {
    try {
      const { dateRange } = req.query;
      
      let dateFilter = {};
      if (dateRange) {
        const [start, end] = dateRange.split(',');
        dateFilter = {
          createdAt: {
            $gte: new Date(start),
            $lte: new Date(end)
          }
        };
      }
      
      // Get policy statistics
      const policyStats = await InsurancePolicy.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalPolicies: { $sum: 1 },
            activePolicies: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            totalCoverage: { $sum: '$coverageAmount' },
            totalPremium: { $sum: '$premium' },
            expiringSoon: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ['$endDate', new Date()] },
                      { $lte: ['$endDate', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)] }
                    ]
              },
              1,
              0
            ]
          }
        }
      }]);
      
      // Get claims statistics
      const claimsStats = await InsuranceClaim.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalClaims: { $sum: 1 },
            pendingClaims: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            totalEstimatedAmount: { $sum: '$estimatedAmount' },
            totalApprovedAmount: { $sum: '$approvedAmount' },
            totalPaidAmount: { $sum: '$paidAmount' }
          }
        }
      }]);
      
      // Get renewal statistics
      const renewalStats = await InsuranceRenewal.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalRenewals: { $sum: 1 },
            urgentRenewals: {
              $sum: { $cond: [{ $eq: ['$status', 'urgent'] }, 1, 0] }
            },
            totalCurrentPremium: { $sum: '$currentPremium' },
            totalEstimatedPremium: { $sum: '$estimatedPremium' }
          }
        }
      }]);
      
      const stats = {
        policies: policyStats[0] || {
          totalPolicies: 0,
          activePolicies: 0,
          totalCoverage: 0,
          totalPremium: 0,
          expiringSoon: 0
        },
        claims: claimsStats[0] || {
          totalClaims: 0,
          pendingClaims: 0,
          totalEstimatedAmount: 0,
          totalApprovedAmount: 0,
          totalPaidAmount: 0
        },
        renewals: renewalStats[0] || {
          totalRenewals: 0,
          urgentRenewals: 0,
          totalCurrentPremium: 0,
          totalEstimatedPremium: 0
        }
      };
      
      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard statistics',
        error: error.message
      });
    }
  },

  // Get urgent alerts
  async getUrgentAlerts(req, res) {
    try {
      const alerts = [];
      
      // Get policies expiring soon
      const expiringPolicies = await InsurancePolicy.find({
        endDate: { 
          $gte: new Date(),
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        status: 'active'
      }).populate('truckId', 'plateNumber');
      
      expiringPolicies.forEach(policy => {
        alerts.push({
          type: 'policy_expiring',
          priority: 'high',
          message: `Policy ${policy.policyNumber} expires in ${policy.daysUntilExpiration} days`,
          itemId: policy._id,
          itemType: 'policy',
          date: policy.endDate
        });
      });
      
      // Get urgent renewals
      const urgentRenewals = await InsuranceRenewal.find({
        status: 'urgent'
      }).populate('policyId truckId');
      
      urgentRenewals.forEach(renewal => {
        alerts.push({
          type: 'renewal_urgent',
          priority: 'high',
          message: `Renewal ${renewal.renewalNumber} requires immediate attention`,
          itemId: renewal._id,
          itemType: 'renewal',
          date: renewal.renewalDate
        });
      });
      
      // Get high-priority claims
      const highPriorityClaims = await InsuranceClaim.find({
        priority: 'urgent',
        status: { $in: ['pending', 'investigating'] }
      }).populate('policyId truckId');
      
      highPriorityClaims.forEach(claim => {
        alerts.push({
          type: 'claim_urgent',
          priority: 'high',
          message: `Claim ${claim.claimNumber} requires immediate attention`,
          itemId: claim._id,
          itemType: 'claim',
          date: claim.incidentDate
        });
      });
      
      // Sort alerts by priority and date
      alerts.sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (b.priority === 'high' && a.priority !== 'high') return 1;
        return new Date(a.date) - new Date(b.date);
      });
      
      res.json({
        success: true,
        data: { alerts: alerts.slice(0, 10) } // Return top 10 alerts
      });
    } catch (error) {
      console.error('Error fetching urgent alerts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch urgent alerts',
        error: error.message
      });
    }
  }
};

module.exports = insuranceController;
