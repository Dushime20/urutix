const express = require('express');
const router = express.Router();
const insuranceController = require('../controllers/insuranceController');
const { authenticateToken } = require('../middleware/auth');
const InsurancePolicy = require('../models/InsurancePolicy');
const InsuranceClaim = require('../models/InsuranceClaim');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ===== INSURANCE POLICIES ROUTES =====

// Get all policies with filters and pagination
router.get('/policies', insuranceController.getPolicies);

// Get single policy by ID
router.get('/policies/:id', insuranceController.getPolicyById);

// Create new policy
router.post('/policies', insuranceController.createPolicy);

// Update existing policy
router.put('/policies/:id', insuranceController.updatePolicy);

// Delete policy
router.delete('/policies/:id', insuranceController.deletePolicy);

// ===== INSURANCE CLAIMS ROUTES =====

// Get all claims with filters and pagination
router.get('/claims', insuranceController.getClaims);

// Get single claim by ID
router.get('/claims/:id', insuranceController.getClaimById);

// Create new claim
router.post('/claims', insuranceController.createClaim);

// Update existing claim
router.put('/claims/:id', insuranceController.updateClaim);

// Delete claim
router.delete('/claims/:id', insuranceController.deleteClaim);

// ===== INSURANCE RENEWALS ROUTES =====

// Get all renewals with filters and pagination
router.get('/renewals', insuranceController.getRenewals);

// Get single renewal by ID
router.get('/renewals/:id', insuranceController.getRenewalById);

// Create new renewal
router.post('/renewals', insuranceController.createRenewal);

// Update existing renewal
router.put('/renewals/:id', insuranceController.updateRenewal);

// Delete renewal
router.delete('/renewals/:id', insuranceController.deleteRenewal);

// ===== ANALYTICS & DASHBOARD ROUTES =====

// Get dashboard statistics
router.get('/dashboard/stats', insuranceController.getDashboardStats);

// Get urgent alerts
router.get('/alerts/urgent', insuranceController.getUrgentAlerts);

// ===== BULK OPERATIONS ROUTES =====

// Bulk update policy status
router.patch('/policies/bulk/status', async (req, res) => {
  try {
    const { policyIds, status } = req.body;
    
    if (!policyIds || !Array.isArray(policyIds) || !status) {
      return res.status(400).json({
        success: false,
        message: 'Policy IDs array and status are required'
      });
    }
    
    const result = await InsurancePolicy.updateMany(
      { _id: { $in: policyIds } },
      { $set: { status } }
    );
    
    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} policies to ${status}`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Error bulk updating policy status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update policy status',
      error: error.message
    });
  }
});

// Bulk delete policies
router.delete('/policies/bulk', async (req, res) => {
  try {
    const { policyIds } = req.body;
    
    if (!policyIds || !Array.isArray(policyIds)) {
      return res.status(400).json({
        success: false,
        message: 'Policy IDs array is required'
      });
    }
    
    // Check if any policies have active claims
    const policiesWithClaims = await InsuranceClaim.countDocuments({
      policyId: { $in: policyIds },
      status: { $in: ['pending', 'investigating', 'approved'] }
    });
    
    if (policiesWithClaims > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some policies have active claims and cannot be deleted'
      });
    }
    
    const result = await InsurancePolicy.deleteMany({ _id: { $in: policyIds } });
    
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} policies`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error('Error bulk deleting policies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk delete policies',
      error: error.message
    });
  }
});

// Bulk update claim status
router.patch('/claims/bulk/status', async (req, res) => {
  try {
    const { claimIds, status } = req.body;
    
    if (!claimIds || !Array.isArray(claimIds) || !status) {
      return res.status(400).json({
        success: false,
        message: 'Claim IDs array and status are required'
      });
    }
    
    const result = await InsuranceClaim.updateMany(
      { _id: { $in: claimIds } },
      { $set: { status } }
    );
    
    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} claims to ${status}`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Error bulk updating claim status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update claim status',
      error: error.message
    });
  }
});

// Bulk assign adjuster to claims
router.patch('/claims/bulk/assign-adjuster', async (req, res) => {
  try {
    const { claimIds, adjuster } = req.body;
    
    if (!claimIds || !Array.isArray(claimIds) || !adjuster) {
      return res.status(400).json({
        success: false,
        message: 'Claim IDs array and adjuster data are required'
      });
    }
    
    const result = await InsuranceClaim.updateMany(
      { _id: { $in: claimIds } },
      { $set: { adjuster } }
    );
    
    res.json({
      success: true,
      message: `Assigned adjuster to ${result.modifiedCount} claims`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Error bulk assigning adjuster:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk assign adjuster',
      error: error.message
    });
  }
});

// ===== EXPORT ROUTES =====

// Export policies data
router.get('/export/policies', async (req, res) => {
  try {
    const { format = 'csv', filters } = req.query;
    
    // Build query based on filters
    const query = {};
    if (filters) {
      const filterObj = JSON.parse(filters);
      Object.assign(query, filterObj);
    }
    
    const policies = await InsurancePolicy.find(query)
      .populate('truckId', 'plateNumber make model year')
      .sort({ createdAt: -1 });
    
    let data;
    let contentType;
    let filename;
    
    switch (format.toLowerCase()) {
      case 'csv':
        data = policies.map(policy => ({
          'Policy Number': policy.policyNumber,
          'Truck Plate': policy.truckId?.plateNumber || 'N/A',
          'Insurance Company': policy.insuranceCompany,
          'Coverage Amount': policy.coverageAmount,
          'Premium': policy.premium,
          'Start Date': policy.startDate,
          'End Date': policy.endDate,
          'Status': policy.status
        }));
        
        const csv = convertToCSV(data);
        contentType = 'text/csv';
        filename = `insurance-policies-${new Date().toISOString().split('T')[0]}.csv`;
        break;
        
      case 'json':
        data = JSON.stringify(policies, null, 2);
        contentType = 'application/json';
        filename = `insurance-policies-${new Date().toISOString().split('T')[0]}.json`;
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Unsupported export format. Use csv or json.'
        });
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(data);
    
  } catch (error) {
    console.error('Error exporting policies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export policies',
      error: error.message
    });
  }
});

// Export claims data
router.get('/export/claims', async (req, res) => {
  try {
    const { format = 'csv', filters } = req.query;
    
    // Build query based on filters
    const query = {};
    if (filters) {
      const filterObj = JSON.parse(filters);
      Object.assign(query, filterObj);
    }
    
    const claims = await InsuranceClaim.find(query)
      .populate('policyId', 'policyNumber insuranceCompany')
      .populate('truckId', 'plateNumber make model')
      .sort({ reportedDate: -1 });
    
    let data;
    let contentType;
    let filename;
    
    switch (format.toLowerCase()) {
      case 'csv':
        data = claims.map(claim => ({
          'Claim Number': claim.claimNumber,
          'Policy Number': claim.policyId?.policyNumber || 'N/A',
          'Truck Plate': claim.truckId?.plateNumber || 'N/A',
          'Claim Type': claim.claimType,
          'Description': claim.description,
          'Incident Date': claim.incidentDate,
          'Estimated Amount': claim.estimatedAmount,
          'Approved Amount': claim.approvedAmount,
          'Status': claim.status
        }));
        
        const csv = convertToCSV(data);
        contentType = 'text/csv';
        filename = `insurance-claims-${new Date().toISOString().split('T')[0]}.csv`;
        break;
        
      case 'json':
        data = JSON.stringify(claims, null, 2);
        contentType = 'application/json';
        filename = `insurance-claims-${new Date().toISOString().split('T')[0]}.json`;
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Unsupported export format. Use csv or json.'
        });
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(data);
    
  } catch (error) {
    console.error('Error exporting claims:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export claims',
      error: error.message
    });
  }
});

// ===== UTILITY FUNCTIONS =====

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

module.exports = router;
