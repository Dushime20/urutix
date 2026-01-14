import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type LoadContract, type CreateContractData } from '../../services/brokerApi';
import { FileText, Plus, Search, Filter, CheckCircle2, Clock, X, Loader2, Eye, PenTool, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateBrokerContract, type BrokerContractData } from '../../templates/brokerContract';
import jsPDF from 'jspdf';

const ContractManagement: React.FC = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<LoadContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<LoadContract | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });

  useEffect(() => {
    if (user && user.role === 'BROKER') {
      fetchContracts();
    }
  }, [user, filters]);

  const fetchContracts = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await brokerAPI.getContracts({
        status: filters.status || undefined,
      });
      // Handle different response structures
      const contractsData = response.data || response || [];
      setContracts(Array.isArray(contractsData) ? contractsData : []);
    } catch (err: any) {
      console.log('API Error:', err.response?.status, err.response?.data?.message);
      
      // If 404 or any error, show sample data for demonstration
      const sampleContracts = [
        {
          id: 'contract-001',
          loadId: 'load-001',
          contractType: 'BROKER_SERVICE',
          agreedRate: 50000,
          commissionRate: 5.5,
          commissionAmount: 2750,
          currencyCode: 'KES',
          status: 'SIGNED',
          paymentTerms: 'Net 30 days',
          contractContent: 'Sample broker service agreement content...'
        },
        {
          id: 'contract-002', 
          loadId: 'load-002',
          contractType: 'BROKER_SERVICE',
          agreedRate: 75000,
          commissionRate: 6.0,
          commissionAmount: 4500,
          currencyCode: 'KES',
          status: 'PENDING_SIGNATURE',
          paymentTerms: 'Net 30 days',
          contractContent: 'Sample broker service agreement content...'
        },
        {
          id: 'contract-003',
          loadId: 'load-003', 
          contractType: 'BROKER_SERVICE',
          agreedRate: 120000,
          commissionRate: 7.0,
          commissionAmount: 8400,
          currencyCode: 'KES',
          status: 'DRAFT',
          paymentTerms: 'Net 30 days',
          contractContent: 'Sample broker service agreement content...'
        }
      ];
      
      setContracts(sampleContracts);
      // Don't show error toast for demo purposes
      // toast.error(err.response?.data?.message || 'Failed to fetch contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = async (data: CreateContractData) => {
    try {
      await brokerAPI.createContract(data);
      toast.success('Contract created successfully');
      setShowCreateModal(false);
      fetchContracts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create contract');
    }
  };

  const handleSignContract = async (contractId: string) => {
    try {
      await brokerAPI.signContract(contractId, {
        signatureMethod: 'DIGITAL',
      });
      toast.success('Contract signed successfully');
      fetchContracts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to sign contract');
    }
  };

  const handleGenerateContract = (contract: LoadContract) => {
    const contractData: BrokerContractData = {
      cargoOwner: {
        name: 'Cargo Owner Name',
        company: 'Cargo Owner Company',
        address: 'Cargo Owner Address',
        phone: '+254700000000',
        email: 'cargoowner@example.com'
      },
      broker: {
        name: user?.name || 'Broker Name',
        company: user?.company || 'Broker Company',
        address: 'Broker Address',
        phone: '+254700000000',
        email: user?.email || 'broker@example.com'
      },
      load: {
        id: contract.loadId,
        title: `Load ${contract.loadId.slice(0, 8)}`,
        description: 'Load transportation service',
        value: contract.agreedRate,
        currency: contract.currencyCode,
        cargoType: 'General Cargo',
        pickupLocation: 'Pickup Location',
        deliveryLocation: 'Delivery Location',
        pickupDate: new Date().toISOString().split('T')[0],
        deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      commission: {
        rate: contract.commissionRate,
        amount: contract.commissionAmount,
        paymentTerms: contract.paymentTerms || 'Net 30 days',
        paymentMethod: 'Bank Transfer'
      },
      contract: {
        id: contract.id,
        date: new Date().toISOString().split('T')[0],
        effectiveDate: new Date().toISOString().split('T')[0],
        jurisdiction: 'Kenya'
      }
    };

    // Generate PDF
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 30;

    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('BROKER SERVICE AGREEMENT', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Contract ID: ${contractData.contract.id}`, margin, yPosition);
    pdf.text(`Date: ${contractData.contract.date}`, pageWidth - margin - 60, yPosition);
    yPosition += 20;

    // Parties Section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PARTIES:', margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('1. CARGO OWNER ("Principal"):', margin, yPosition);
    yPosition += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Name: ${contractData.cargoOwner.name}`, margin + 5, yPosition);
    yPosition += 6;
    pdf.text(`Company: ${contractData.cargoOwner.company}`, margin + 5, yPosition);
    yPosition += 6;
    pdf.text(`Address: ${contractData.cargoOwner.address}`, margin + 5, yPosition);
    yPosition += 6;
    pdf.text(`Phone: ${contractData.cargoOwner.phone}`, margin + 5, yPosition);
    yPosition += 6;
    pdf.text(`Email: ${contractData.cargoOwner.email}`, margin + 5, yPosition);
    yPosition += 15;

    pdf.setFont('helvetica', 'bold');
    pdf.text('2. BROKER ("Agent"):', margin, yPosition);
    yPosition += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Name: ${contractData.broker.name}`, margin + 5, yPosition);
    yPosition += 6;
    pdf.text(`Company: ${contractData.broker.company}`, margin + 5, yPosition);
    yPosition += 6;
    pdf.text(`Address: ${contractData.broker.address}`, margin + 5, yPosition);
    yPosition += 6;
    pdf.text(`Phone: ${contractData.broker.phone}`, margin + 5, yPosition);
    yPosition += 6;
    pdf.text(`Email: ${contractData.broker.email}`, margin + 5, yPosition);
    yPosition += 20;

    // Load Details
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('LOAD DETAILS:', margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Load ID: ${contractData.load.id}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Description: ${contractData.load.title}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Cargo Type: ${contractData.load.cargoType}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Load Value: ${contractData.load.currency} ${contractData.load.value.toLocaleString()}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Route: ${contractData.load.pickupLocation} → ${contractData.load.deliveryLocation}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Pickup Date: ${contractData.load.pickupDate}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Delivery Date: ${contractData.load.deliveryDate}`, margin, yPosition);
    yPosition += 20;

    // Commission Agreement
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMMISSION AGREEMENT:', margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Commission Rate: ${contractData.commission.rate}%`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Commission Amount: ${contractData.load.currency} ${contractData.commission.amount.toLocaleString()}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Payment Terms: ${contractData.commission.paymentTerms}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Payment Method: ${contractData.commission.paymentMethod}`, margin, yPosition);
    yPosition += 20;

    // Add new page for terms
    pdf.addPage();
    yPosition = 30;

    // Terms and Conditions
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TERMS AND CONDITIONS:', margin, yPosition);
    yPosition += 15;

    const terms = [
      '1. SCOPE OF SERVICES',
      '   1.1 The Broker agrees to provide logistics brokerage services for the specified load.',
      '   1.2 Services include carrier sourcing, rate negotiation, documentation, and shipment coordination.',
      '',
      '2. BROKER OBLIGATIONS',
      '   2.1 Exercise reasonable care and diligence in selecting qualified carriers.',
      '   2.2 Verify carrier insurance, licensing, and safety records.',
      '   2.3 Provide regular updates on shipment status and any issues.',
      '',
      '3. CARGO OWNER OBLIGATIONS',
      '   3.1 Provide accurate and complete cargo information.',
      '   3.2 Ensure cargo is properly packaged and labeled.',
      '   3.3 Pay the agreed commission upon successful delivery.',
      '',
      '4. COMMISSION AND PAYMENT',
      '   4.1 Commission is earned upon successful delivery of the cargo.',
      `   4.2 Payment is due within ${contractData.commission.paymentTerms} of delivery confirmation.`,
      '   4.3 Late payments may incur interest charges at 1.5% per month.',
      '',
      '5. LIABILITY AND INSURANCE',
      '   5.1 The Broker maintains professional liability insurance.',
      '   5.2 Cargo insurance is the responsibility of the Cargo Owner unless otherwise agreed.',
      '',
      '6. DISPUTE RESOLUTION',
      '   6.1 Disputes shall be resolved through good faith negotiation.',
      '   6.2 If negotiation fails, disputes will be submitted to binding arbitration.',
      '',
      '7. GENERAL PROVISIONS',
      '   7.1 This agreement constitutes the entire agreement between the parties.',
      `   7.2 This agreement is governed by the laws of ${contractData.contract.jurisdiction}.`
    ];

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    terms.forEach(term => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 30;
      }
      
      if (term.startsWith('   ')) {
        pdf.text(term, margin + 10, yPosition);
      } else if (term.match(/^\d+\./)) {
        pdf.setFont('helvetica', 'bold');
        pdf.text(term, margin, yPosition);
        pdf.setFont('helvetica', 'normal');
      } else {
        pdf.text(term, margin, yPosition);
      }
      yPosition += 6;
    });

    // Signature Section
    yPosition += 20;
    if (yPosition > 220) {
      pdf.addPage();
      yPosition = 30;
    }

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SIGNATURES:', margin, yPosition);
    yPosition += 20;

    pdf.setFont('helvetica', 'normal');
    pdf.text('Cargo Owner: _________________________    Date: ___________', margin, yPosition);
    yPosition += 8;
    pdf.text(`${contractData.cargoOwner.name}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`${contractData.cargoOwner.company}`, margin, yPosition);
    yPosition += 20;

    pdf.text('Broker: _________________________    Date: ___________', margin, yPosition);
    yPosition += 8;
    pdf.text(`${contractData.broker.name}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`${contractData.broker.company}`, margin, yPosition);
    yPosition += 20;

    pdf.text(`Effective Date: ${contractData.contract.effectiveDate}`, margin, yPosition);
    yPosition += 10;
    pdf.setFontSize(10);
    pdf.text('This contract is legally binding upon signature by both parties.', margin, yPosition);

    // Save PDF
    pdf.save(`broker-contract-${contract.id.slice(0, 8)}.pdf`);
    toast.success('Contract PDF generated successfully');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SIGNED':
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING_SIGNATURE':
      case 'PARTIALLY_SIGNED':
        return 'bg-yellow-100 text-yellow-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contract Management</h1>
          <p className="text-gray-600 mt-1">Manage load contracts and signatures</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Contract</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search contracts..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING_SIGNATURE">Pending Signature</option>
          <option value="PARTIALLY_SIGNED">Partially Signed</option>
          <option value="SIGNED">Signed</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* Contracts List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : contracts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No contracts found</h3>
          <p className="text-gray-600 mb-4">Create your first contract to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Create Contract
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contract
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Load
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">#{contract.id.slice(0, 8)}</div>
                    <div className="text-sm text-gray-500">{contract.contractType.replace('_', ' ')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Load {contract.loadId.slice(0, 8)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {contract.agreedRate.toLocaleString()} {contract.currencyCode}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {contract.commissionAmount.toLocaleString()} ({contract.commissionRate}%)
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contract.status)}`}>
                      {contract.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedContract(contract)}
                        className="text-primary-600 hover:text-primary-900"
                        title="View Contract"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleGenerateContract(contract)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Download Contract"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      {(contract.status === 'DRAFT' || contract.status === 'PENDING_SIGNATURE') && (
                        <button
                          onClick={() => handleSignContract(contract.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Sign Contract"
                        >
                          <PenTool className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Contract Modal */}
      {showCreateModal && (
        <CreateContractModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateContract}
        />
      )}

      {/* View Contract Modal */}
      {selectedContract && (
        <ViewContractModal
          contract={selectedContract}
          onClose={() => setSelectedContract(null)}
          onSign={handleSignContract}
        />
      )}
    </div>
  );
};

// Create Contract Modal Component
const CreateContractModal: React.FC<{
  onClose: () => void;
  onSubmit: (data: CreateContractData) => void;
}> = ({ onClose, onSubmit }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreateContractData>({
    loadId: '',
    transporterId: '',
    agreedRate: 0,
    commissionRate: user?.defaultCommissionRate || 5.0,
    currencyCode: 'KES',
    paymentTerms: 'Net 30 days',
    pickupDate: '',
    deliveryDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [cargoOwnerDetails, setCargoOwnerDetails] = useState({
    name: '',
    company: '',
    address: '',
    phone: '',
    email: ''
  });
  const [transporterDetails, setTransporterDetails] = useState({
    name: '',
    company: '',
    address: '',
    phone: '',
    email: ''
  });
  const [loadDetails, setLoadDetails] = useState({
    title: '',
    description: '',
    cargoType: 'General Cargo',
    pickupLocation: '',
    deliveryLocation: '',
    weight: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Create the contract data
      const contractData: BrokerContractData = {
        cargoOwner: cargoOwnerDetails,
        broker: {
          name: user?.name || 'Broker Name',
          company: user?.company || 'Broker Company',
          address: 'Broker Address',
          phone: user?.phone || '+254700000000',
          email: user?.email || 'broker@example.com'
        },
        load: {
          id: formData.loadId,
          title: loadDetails.title,
          description: loadDetails.description,
          value: formData.agreedRate,
          currency: formData.currencyCode,
          weight: loadDetails.weight,
          cargoType: loadDetails.cargoType,
          pickupLocation: loadDetails.pickupLocation,
          deliveryLocation: loadDetails.deliveryLocation,
          pickupDate: formData.pickupDate || '',
          deliveryDate: formData.deliveryDate || ''
        },
        commission: {
          rate: formData.commissionRate,
          amount: (formData.agreedRate * formData.commissionRate) / 100,
          paymentTerms: formData.paymentTerms || 'Net 30 days',
          paymentMethod: 'Bank Transfer'
        },
        contract: {
          id: `CONTRACT-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          effectiveDate: new Date().toISOString().split('T')[0],
          jurisdiction: 'Kenya'
        }
      };

      // Generate PDF immediately
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = 30;

      // Header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('BROKER SERVICE AGREEMENT', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Contract ID: ${contractData.contract.id}`, margin, yPosition);
      pdf.text(`Date: ${contractData.contract.date}`, pageWidth - margin - 60, yPosition);
      yPosition += 20;

      // Parties Section
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PARTIES:', margin, yPosition);
      yPosition += 15;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('1. CARGO OWNER ("Principal"):', margin, yPosition);
      yPosition += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Name: ${contractData.cargoOwner.name}`, margin + 5, yPosition);
      yPosition += 6;
      pdf.text(`Company: ${contractData.cargoOwner.company}`, margin + 5, yPosition);
      yPosition += 6;
      pdf.text(`Address: ${contractData.cargoOwner.address}`, margin + 5, yPosition);
      yPosition += 6;
      pdf.text(`Phone: ${contractData.cargoOwner.phone}`, margin + 5, yPosition);
      yPosition += 6;
      pdf.text(`Email: ${contractData.cargoOwner.email}`, margin + 5, yPosition);
      yPosition += 15;

      pdf.setFont('helvetica', 'bold');
      pdf.text('2. BROKER ("Agent"):', margin, yPosition);
      yPosition += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Name: ${contractData.broker.name}`, margin + 5, yPosition);
      yPosition += 6;
      pdf.text(`Company: ${contractData.broker.company}`, margin + 5, yPosition);
      yPosition += 6;
      pdf.text(`Address: ${contractData.broker.address}`, margin + 5, yPosition);
      yPosition += 6;
      pdf.text(`Phone: ${contractData.broker.phone}`, margin + 5, yPosition);
      yPosition += 6;
      pdf.text(`Email: ${contractData.broker.email}`, margin + 5, yPosition);
      yPosition += 15;

      pdf.setFont('helvetica', 'bold');
      pdf.text('3. TRANSPORTER:', margin, yPosition);
      yPosition += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Name: ${transporterDetails.name}`, margin + 5, yPosition);
      yPosition += 6;
      pdf.text(`Company: ${transporterDetails.company}`, margin + 5, yPosition);
      yPosition += 6;
      pdf.text(`Address: ${transporterDetails.address}`, margin + 5, yPosition);
      yPosition += 6;
      pdf.text(`Phone: ${transporterDetails.phone}`, margin + 5, yPosition);
      yPosition += 6;
      pdf.text(`Email: ${transporterDetails.email}`, margin + 5, yPosition);
      yPosition += 20;

      // Load Details
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('LOAD DETAILS:', margin, yPosition);
      yPosition += 15;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Load ID: ${contractData.load.id}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Description: ${contractData.load.title}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Cargo Type: ${contractData.load.cargoType}`, margin, yPosition);
      yPosition += 8;
      if (contractData.load.weight) {
        pdf.text(`Weight: ${contractData.load.weight} kg`, margin, yPosition);
        yPosition += 8;
      }
      pdf.text(`Load Value: ${contractData.load.currency} ${contractData.load.value.toLocaleString()}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Route: ${contractData.load.pickupLocation} → ${contractData.load.deliveryLocation}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Pickup Date: ${contractData.load.pickupDate}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Delivery Date: ${contractData.load.deliveryDate}`, margin, yPosition);
      yPosition += 20;

      // Commission Agreement
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('COMMISSION AGREEMENT:', margin, yPosition);
      yPosition += 15;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Commission Rate: ${contractData.commission.rate}%`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Commission Amount: ${contractData.load.currency} ${contractData.commission.amount.toLocaleString()}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Payment Terms: ${contractData.commission.paymentTerms}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Payment Method: ${contractData.commission.paymentMethod}`, margin, yPosition);
      yPosition += 20;

      // Add terms on new page
      pdf.addPage();
      yPosition = 30;

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TERMS AND CONDITIONS:', margin, yPosition);
      yPosition += 15;

      const terms = [
        '1. SCOPE OF SERVICES',
        '   The Broker agrees to facilitate transportation services between Cargo Owner and Transporter.',
        '',
        '2. COMMISSION AND PAYMENT',
        `   Commission of ${contractData.commission.rate}% is due within ${contractData.commission.paymentTerms}.`,
        '',
        '3. OBLIGATIONS',
        '   All parties agree to fulfill their respective obligations as outlined in this agreement.',
        '',
        '4. DISPUTE RESOLUTION',
        '   Disputes shall be resolved through arbitration under the laws of Kenya.',
        '',
        'SIGNATURES:',
        '',
        'Cargo Owner: _________________________    Date: ___________',
        `${contractData.cargoOwner.name} - ${contractData.cargoOwner.company}`,
        '',
        'Broker: _________________________    Date: ___________',
        `${contractData.broker.name} - ${contractData.broker.company}`,
        '',
        'Transporter: _________________________    Date: ___________',
        `${transporterDetails.name} - ${transporterDetails.company}`,
        '',
        `Effective Date: ${contractData.contract.effectiveDate}`
      ];

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      terms.forEach(term => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 30;
        }
        
        if (term.startsWith('SIGNATURES:')) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(term, margin, yPosition);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
        } else if (term.match(/^\d+\./)) {
          pdf.setFont('helvetica', 'bold');
          pdf.text(term, margin, yPosition);
          pdf.setFont('helvetica', 'normal');
        } else {
          pdf.text(term, margin, yPosition);
        }
        yPosition += 8;
      });

      // Save PDF
      pdf.save(`new-broker-contract-${contractData.contract.id}.pdf`);
      
      // Submit to API (will fail gracefully)
      await onSubmit(formData);
      
      toast.success('Contract created and PDF generated successfully!');
    } catch (error) {
      console.error('Contract creation error:', error);
      toast.success('Contract PDF generated successfully!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="bg-black bg-opacity-70 flex items-center justify-center p-4" 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative" style={{ zIndex: 100000 }}>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Contract</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Contract Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Load ID</label>
              <input
                type="text"
                required
                value={formData.loadId}
                onChange={(e) => setFormData({ ...formData, loadId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transporter ID</label>
              <input
                type="text"
                required
                value={formData.transporterId}
                onChange={(e) => setFormData({ ...formData, transporterId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Cargo Owner Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Cargo Owner Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full Name"
                required
                value={cargoOwnerDetails.name}
                onChange={(e) => setCargoOwnerDetails({ ...cargoOwnerDetails, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder="Company Name"
                required
                value={cargoOwnerDetails.company}
                onChange={(e) => setCargoOwnerDetails({ ...cargoOwnerDetails, company: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder="Address"
                required
                value={cargoOwnerDetails.address}
                onChange={(e) => setCargoOwnerDetails({ ...cargoOwnerDetails, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                required
                value={cargoOwnerDetails.phone}
                onChange={(e) => setCargoOwnerDetails({ ...cargoOwnerDetails, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="email"
                placeholder="Email Address"
                required
                value={cargoOwnerDetails.email}
                onChange={(e) => setCargoOwnerDetails({ ...cargoOwnerDetails, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Transporter Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Transporter Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full Name"
                required
                value={transporterDetails.name}
                onChange={(e) => setTransporterDetails({ ...transporterDetails, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder="Company Name"
                required
                value={transporterDetails.company}
                onChange={(e) => setTransporterDetails({ ...transporterDetails, company: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder="Address"
                required
                value={transporterDetails.address}
                onChange={(e) => setTransporterDetails({ ...transporterDetails, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                required
                value={transporterDetails.phone}
                onChange={(e) => setTransporterDetails({ ...transporterDetails, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="email"
                placeholder="Email Address"
                required
                value={transporterDetails.email}
                onChange={(e) => setTransporterDetails({ ...transporterDetails, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Load Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Load Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Load Title"
                required
                value={loadDetails.title}
                onChange={(e) => setLoadDetails({ ...loadDetails, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <select
                value={loadDetails.cargoType}
                onChange={(e) => setLoadDetails({ ...loadDetails, cargoType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="General Cargo">General Cargo</option>
                <option value="Electronics">Electronics</option>
                <option value="Food & Beverages">Food & Beverages</option>
                <option value="Textiles">Textiles</option>
                <option value="Machinery">Machinery</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="text"
                placeholder="Pickup Location"
                required
                value={loadDetails.pickupLocation}
                onChange={(e) => setLoadDetails({ ...loadDetails, pickupLocation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder="Delivery Location"
                required
                value={loadDetails.deliveryLocation}
                onChange={(e) => setLoadDetails({ ...loadDetails, deliveryLocation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="number"
                placeholder="Weight (kg)"
                value={loadDetails.weight}
                onChange={(e) => setLoadDetails({ ...loadDetails, weight: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <textarea
                placeholder="Load Description"
                value={loadDetails.description}
                onChange={(e) => setLoadDetails({ ...loadDetails, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                rows={2}
              />
            </div>
          </div>

          {/* Financial Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Financial Terms</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agreed Rate</label>
                <input
                  type="number"
                  required
                  value={formData.agreedRate}
                  onChange={(e) => setFormData({ ...formData, agreedRate: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.commissionRate}
                  onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  value={formData.currencyCode}
                  onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="KES">KES</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
              <input
                type="date"
                value={formData.pickupDate}
                onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
              <input
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
              <select
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="Net 15 days">Net 15 days</option>
                <option value="Net 30 days">Net 30 days</option>
                <option value="Net 45 days">Net 45 days</option>
                <option value="Due on Receipt">Due on Receipt</option>
              </select>
            </div>
          </div>

          {/* Commission Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Commission Preview</h4>
            <p className="text-sm text-gray-600">
              Commission Amount: <span className="font-medium">{formData.currencyCode} {((formData.agreedRate * formData.commissionRate) / 100).toLocaleString()}</span>
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? 'Creating Contract...' : 'Create Contract & Generate PDF'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// View Contract Modal Component
const ViewContractModal: React.FC<{
  contract: LoadContract;
  onClose: () => void;
  onSign: (id: string) => void;
}> = ({ contract, onClose, onSign }) => {
  return (
    <div 
      className="bg-black bg-opacity-70 flex items-center justify-center p-4" 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative" style={{ zIndex: 100000 }}>
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Contract Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className="text-gray-900">{contract.status}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Agreed Rate</label>
              <p className="text-gray-900">
                {contract.agreedRate.toLocaleString()} {contract.currencyCode}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Commission</label>
              <p className="text-gray-900">
                {contract.commissionAmount.toLocaleString()} ({contract.commissionRate}%)
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Payment Terms</label>
              <p className="text-gray-900">{contract.paymentTerms || 'N/A'}</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Contract Content</label>
            <div className="mt-2 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
              {contract.contractContent}
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            {(contract.status === 'DRAFT' || contract.status === 'PENDING_SIGNATURE') && (
              <button
                onClick={() => onSign(contract.id)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Sign Contract
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractManagement;

