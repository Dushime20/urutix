import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type BrokerLoad, type LoadContract } from '../../services/brokerApi';
import ContractAcceptanceModal from '../../components/broker/ContractAcceptanceModal';
import FilterSelect from '../../components/common/FilterSelect';
import {
  Package,
  MapPin,
  DollarSign,
  Eye,
  Loader2,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  Grid,
  Table,
  Search
} from 'lucide-react';
import { FaLayerGroup as FaLayerGroupIcon, FaBox as FaBoxIcon } from 'react-icons/fa';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import { generateBrokerContract, type BrokerContractData } from '../../templates/brokerContract';
import { cn } from '../../utils/cn';
import { getStatusColor, getStatusDisplayName } from '../../pages/dashboard/cargos/list/utils';

const BrokerLoadsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loads, setLoads] = useState<BrokerLoad[]>([]);
  const [contracts, setContracts] = useState<Map<string, LoadContract>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<LoadContract | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);

  // Filters and view mode
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cargoTypeFilter, setCargoTypeFilter] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  useEffect(() => {
    if (user && user.role === 'BROKER') {
      loadBrokerLoads();
    }
  }, [user]);

  const loadBrokerLoads = async () => {
    try {
      setLoading(true);
      console.log('Loading broker loads for user:', user!.id, 'email:', user!.email);

      const [loadsResponse, contractsResponse] = await Promise.all([
        brokerAPI.getBrokerLoads(user!.id),
        brokerAPI.getContracts()
      ]);

      console.log('Loads response:', loadsResponse);
      console.log('Loads data:', loadsResponse.data);

      // Handle different response formats
      let loadsData: BrokerLoad[] = [];
      if (Array.isArray(loadsResponse.data)) {
        loadsData = loadsResponse.data;
      } else if (Array.isArray(loadsResponse)) {
        loadsData = loadsResponse;
      } else if (loadsResponse.data && Array.isArray(loadsResponse.data)) {
        loadsData = loadsResponse.data;
      }

      console.log('Processed loads:', loadsData.length, loadsData);
      setLoads(loadsData);

      // Fetch contracts and map them by loadId
      const contractsData = contractsResponse.data || contractsResponse || [];
      const contractsMap = new Map<string, LoadContract>();
      if (Array.isArray(contractsData)) {
        contractsData.forEach((contract: LoadContract) => {
          if (contract.loadId) {
            contractsMap.set(contract.loadId, contract);
          }
        });
      }
      setContracts(contractsMap);

      if (loadsData.length === 0) {
        console.warn('No loads found for broker. This might be expected if no loads have been assigned yet.');
      }
    } catch (err: any) {
      console.error('Failed to load broker loads:', err);
      console.error('Error response:', err.response);
      toast.error(err.response?.data?.message || 'Failed to load loads');
    } finally {
      setLoading(false);
    }
  };

  // Filter loads
  const filteredLoads = useMemo(() => {
    return loads.filter(load => {
      const matchesSearch =
        load.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        load.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        load.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !statusFilter || load.status === statusFilter;

      const matchesCargoType = !cargoTypeFilter || load.cargoType === cargoTypeFilter;

      return matchesSearch && matchesStatus && matchesCargoType;
    });
  }, [loads, searchTerm, statusFilter, cargoTypeFilter]);

  const handleAcceptContract = async (contractId: string) => {
    try {
      await brokerAPI.acceptContract(contractId);
      toast.success('Contract accepted successfully!');
      setShowContractModal(false);
      setSelectedContract(null);
      loadBrokerLoads(); // Reload to refresh contract status
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to accept contract');
    }
  };

  const handleViewContract = (loadId: string) => {
    const contract = contracts.get(loadId);
    if (contract) {
      setSelectedContract(contract);
      setShowContractModal(true);
    } else {
      toast.error('Contract not found for this load');
    }
  };

  const handleDownloadContract = async (loadId: string) => {
    const contract = contracts.get(loadId);
    if (!contract) {
      toast.error('Contract not found for this load');
      return;
    }

    // Find load from already loaded data
    const loadData = loads.find(l => l.id === loadId);
    if (!loadData) {
      toast.error('Load data not found. Please refresh the page.');
      return;
    }

    try {
      console.log('Starting PDF download for contract:', contract.id);
      console.log('Using load data:', loadData);

      // Fetch full contract details with relations
      let fullContract;
      try {
        const contractResponse = await brokerAPI.getContract(contract.id);
        fullContract = contractResponse.data || contractResponse;
        console.log('Contract fetched:', fullContract);
      } catch (err: any) {
        console.error('Failed to fetch contract:', err);
        toast.error(`Failed to fetch contract: ${err.response?.data?.message || err.message}`);
        return;
      }

      // Use contract data if available, otherwise use load data
      const loadInfo = fullContract.load || loadData;

      // Prepare contract data for PDF
      const cargoOwnerName = fullContract.cargoOwner?.profile?.firstName && fullContract.cargoOwner?.profile?.lastName
        ? `${fullContract.cargoOwner.profile.firstName} ${fullContract.cargoOwner.profile.lastName}`
        : fullContract.cargoOwner?.email || 'Cargo Owner';

      const cargoOwnerCompany = fullContract.cargoOwner?.profile?.companyName || 'N/A';
      const cargoOwnerEmail = fullContract.cargoOwner?.email || 'N/A';
      const cargoOwnerPhone = fullContract.cargoOwner?.phone || fullContract.cargoOwner?.profile?.phone || 'N/A';

      const brokerName = (user as any)?.profile?.firstName && (user as any)?.profile?.lastName
        ? `${(user as any).profile.firstName} ${(user as any).profile.lastName}`
        : user?.email || 'Broker';
      const brokerCompany = (user as any)?.profile?.companyName || 'N/A';
      const brokerEmail = user?.email || 'N/A';
      const brokerPhone = (user as any)?.phone || (user as any)?.profile?.phone || 'N/A';

      // Get locations from load data or contract
      const pickupLocation = loadInfo.locations?.find((loc: any) => loc.type === 'PICKUP')?.locationData?.address
        || loadInfo.pickupLocation
        || loadData.pickupLocation
        || 'N/A';
      const deliveryLocation = loadInfo.locations?.find((loc: any) => loc.type === 'DELIVERY')?.locationData?.address
        || loadInfo.deliveryLocation
        || loadData.deliveryLocation
        || 'N/A';

      // Validate required fields
      if (!fullContract.agreedRate && !loadData.loadValue) {
        toast.error('Missing rate information for contract');
        return;
      }

      if (!fullContract.commissionRate) {
        toast.error('Missing commission rate information');
        return;
      }

      const contractData: BrokerContractData = {
        cargoOwner: {
          name: cargoOwnerName,
          company: cargoOwnerCompany,
          address: 'N/A',
          phone: cargoOwnerPhone,
          email: cargoOwnerEmail
        },
        broker: {
          name: brokerName,
          company: brokerCompany,
          address: 'N/A',
          phone: brokerPhone,
          email: brokerEmail
        },
        load: {
          id: loadData.id || contract.loadId || contract.id,
          title: loadData.title || loadInfo.title || 'Load',
          description: loadData.description || loadInfo.description || 'Transportation service',
          transportationFee: fullContract.agreedRate || loadData.loadValue || loadInfo.loadValue || 0,
          currency: fullContract.currencyCode || loadData.currencyCode || loadInfo.currencyCode || 'KES',
          weight: loadData.weight || loadInfo.weight,
          cargoType: loadData.cargoType || loadInfo.cargoType || 'GENERAL',
          pickupLocation,
          deliveryLocation,
          pickupDate: fullContract.pickupDate
            ? new Date(fullContract.pickupDate).toISOString().split('T')[0]
            : loadData.pickupDate
              ? new Date(loadData.pickupDate).toISOString().split('T')[0]
              : loadInfo.pickupDate
                ? new Date(loadInfo.pickupDate).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0],
          deliveryDate: fullContract.deliveryDate
            ? new Date(fullContract.deliveryDate).toISOString().split('T')[0]
            : loadData.deliveryDate
              ? new Date(loadData.deliveryDate).toISOString().split('T')[0]
              : loadInfo.deliveryDate
                ? new Date(loadInfo.deliveryDate).toISOString().split('T')[0]
                : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        commission: {
          rate: fullContract.commissionRate || 0,
          amount: fullContract.commissionAmount || ((fullContract.agreedRate || loadData.loadValue || 0) * (fullContract.commissionRate || 0) / 100),
          paymentTerms: fullContract.paymentTerms || 'Net 30 days',
          paymentMethod: 'Bank Transfer'
        },
        contract: {
          id: fullContract.id || contract.id,
          date: fullContract.createdAt
            ? new Date(fullContract.createdAt).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          effectiveDate: fullContract.pickupDate
            ? new Date(fullContract.pickupDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          jurisdiction: 'Kenya'
        }
      };

      // Generate contract text
      let contractText;
      try {
        contractText = generateBrokerContract(contractData);
        console.log('Contract text generated successfully');
      } catch (err: any) {
        console.error('Failed to generate contract text:', err);
        toast.error(`Failed to generate contract text: ${err.message}`);
        return;
      }

      // Create PDF
      let pdf;
      try {
        pdf = new jsPDF();
        console.log('PDF instance created');
      } catch (err: any) {
        console.error('Failed to create PDF instance:', err);
        toast.error(`Failed to create PDF: ${err.message}`);
        return;
      }
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = 30;

      // Helper function to add text with word wrap
      const addText = (text: string, fontSize: number, isBold: boolean = false, align: 'left' | 'center' | 'right' = 'left') => {
        try {
          if (!text || typeof text !== 'string') {
            console.warn('Invalid text provided to addText:', text);
            return;
          }
          pdf.setFontSize(fontSize);
          pdf.setFont('helvetica', isBold ? 'bold' : 'normal');

          const lines = pdf.splitTextToSize(text, maxWidth);
          lines.forEach((line: string) => {
            if (yPosition > pageHeight - 30) {
              pdf.addPage();
              yPosition = 20;
            }
            pdf.text(line, align === 'center' ? pageWidth / 2 : align === 'right' ? pageWidth - margin : margin, yPosition, { align });
            yPosition += fontSize * 0.4;
          });
        } catch (err: any) {
          console.error('Error in addText:', err, 'text:', text);
          throw err;
        }
      };

      try {
        // Header
        addText('BROKER SERVICE AGREEMENT', 20, true, 'center');
        yPosition += 10;

        // Contract ID and Date
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Contract ID: ${contractData.contract.id}`, margin, yPosition);
        pdf.text(`Date: ${contractData.contract.date}`, pageWidth - margin, yPosition, { align: 'right' });
        yPosition += 15;

        // Parties Section
        addText('PARTIES:', 14, true);
        yPosition += 5;

        addText('1. CARGO OWNER ("Principal"):', 11, true);
        yPosition += 3;
        addText(`Name: ${contractData.cargoOwner.name}`, 10);
        addText(`Company: ${contractData.cargoOwner.company}`, 10);
        addText(`Phone: ${contractData.cargoOwner.phone}`, 10);
        addText(`Email: ${contractData.cargoOwner.email}`, 10);
        yPosition += 5;

        addText('2. BROKER ("Agent"):', 11, true);
        yPosition += 3;
        addText(`Name: ${contractData.broker.name}`, 10);
        addText(`Company: ${contractData.broker.company}`, 10);
        addText(`Phone: ${contractData.broker.phone}`, 10);
        addText(`Email: ${contractData.broker.email}`, 10);
        yPosition += 10;

        // Load Details
        addText('LOAD DETAILS:', 14, true);
        yPosition += 5;
        addText(`Load ID: ${contractData.load.id}`, 10);
        addText(`Description: ${contractData.load.title}`, 10);
        addText(`Cargo Type: ${contractData.load.cargoType}`, 10);
        if (contractData.load.weight) {
          addText(`Weight: ${contractData.load.weight} kg`, 10);
        }
        addText(`Transportation Fee: ${contractData.load.currency} ${contractData.load.transportationFee.toLocaleString()}`, 10);
        addText(`Route: ${contractData.load.pickupLocation} → ${contractData.load.deliveryLocation}`, 10);
        addText(`Pickup Date: ${contractData.load.pickupDate}`, 10);
        addText(`Delivery Date: ${contractData.load.deliveryDate}`, 10);
        yPosition += 10;

        // Commission Agreement
        addText('COMMISSION AGREEMENT:', 14, true);
        yPosition += 5;
        addText(`Commission Rate: ${contractData.commission.rate}%`, 10);
        addText(`Commission Amount: ${contractData.load.currency} ${contractData.commission.amount.toLocaleString()}`, 10);
        addText(`Payment Terms: ${contractData.commission.paymentTerms}`, 10);
        addText(`Payment Method: ${contractData.commission.paymentMethod}`, 10);
        yPosition += 10;

        // Terms and Conditions
        addText('TERMS AND CONDITIONS:', 14, true);
        yPosition += 5;

        const terms = contractText.split('\n').filter(line => line.trim());
        terms.forEach((line: string) => {
          if (line.trim().startsWith('TERMS AND CONDITIONS')) return;
          if (line.trim().startsWith('SIGNATURES')) return;
          if (line.trim().startsWith('This contract')) return;

          if (line.trim().match(/^\d+\./)) {
            addText(line.trim(), 11, true);
          } else if (line.trim().match(/^\d+\.\d+/)) {
            addText(line.trim(), 10, true);
          } else {
            addText(line.trim(), 10);
          }
        });

        // Save PDF
        try {
          const fileName = `Broker_Contract_${contractData.contract.id}.pdf`;
          pdf.save(fileName);
          console.log('PDF saved successfully:', fileName);
          toast.success('Contract PDF downloaded successfully');
        } catch (pdfErr: any) {
          console.error('Failed to save PDF:', pdfErr);
          toast.error(`Failed to save PDF: ${pdfErr.message}`);
        }
      } catch (pdfGenErr: any) {
        console.error('Error during PDF generation:', pdfGenErr);
        toast.error(`Error generating PDF: ${pdfGenErr.message}`);
        return;
      }
    } catch (err: any) {
      console.error('Failed to download contract:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        response: err.response?.data
      });
      toast.error(`Failed to download contract PDF: ${err.message || 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Loads</h1>
            <p className="text-gray-600 mt-1">
              View and manage loads assigned to you
            </p>
          </div>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="rounded-2xl bg-gradient-to-r from-gray-50 via-white to-gray-50 p-6 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.35)]">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_repeat(3,1fr)] xl:grid-cols-[2fr_repeat(4,1fr)]">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search loads by title, description or ID…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-transparent bg-white/80 py-3 pl-11 pr-4 text-sm text-gray-700 shadow-inner transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <FilterSelect
            label="Status"
            icon={<FaLayerGroupIcon className="text-gray-500" />}
            value={statusFilter}
            placeholder="All Status"
            options={[
              { value: '', label: 'All Status' },
              { value: 'CREATED', label: 'Created' },
              { value: 'PUBLISHED', label: 'Published' },
              { value: 'ASSIGNED', label: 'Assigned' },
              { value: 'IN_TRANSIT', label: 'In Transit' },
              { value: 'DELIVERED', label: 'Delivered' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
            onChange={setStatusFilter}
          />

          <FilterSelect
            label="Cargo Type"
            icon={<FaBoxIcon className="text-gray-500" />}
            value={cargoTypeFilter}
            placeholder="All Types"
            options={[
              { value: '', label: 'All Types' },
              { value: 'GENERAL', label: 'General' },
              { value: 'FRAGILE', label: 'Fragile' },
              { value: 'HAZARDOUS', label: 'Hazardous' },
              { value: 'REFRIGERATED', label: 'Refrigerated' },
              { value: 'LIQUID', label: 'Liquid' },
              { value: 'OVERSIZED', label: 'Oversized' },
              { value: 'VALUABLE', label: 'Valuable' },
            ]}
            onChange={setCargoTypeFilter}
          />

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('card')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                viewMode === 'card'
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                viewMode === 'table'
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loads Display */}
      {filteredLoads.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No loads found</p>
          <p className="text-sm text-gray-500 mb-6">
            {loads.length === 0
              ? 'Wait for cargo owners to assign loads to you to start earning commissions'
              : 'Try adjusting your filters to see more results'}
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLoads.map((load) => (
                <div
                  key={load.id}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200 cursor-pointer"
                  onClick={() => navigate(`/dashboard/broker/loads/${load.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{load.title}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium text-gray-900">
                          {load.currencyCode} {load.loadValue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full",
                      getStatusColor(load.status)
                    )}>
                      {getStatusDisplayName(load.status)}
                    </span>
                  </div>

                  {load.brokerCommissionRate && (
                    <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg mb-4">
                      <div>
                        <p className="text-xs text-gray-600">Commission Rate</p>
                        <p className="text-sm font-semibold text-primary-700">
                          {load.brokerCommissionRate}%
                        </p>
                      </div>
                      {load.brokerCommissionAmount && (
                        <div className="text-right">
                          <p className="text-xs text-gray-600">Potential Commission</p>
                          <p className="text-sm font-semibold text-primary-700">
                            {load.currencyCode} {load.brokerCommissionAmount.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Contract Status */}
                  {(() => {
                    const contract = contracts.get(load.id);
                    if (contract) {
                      return (
                        <div className={cn(
                          "p-3 rounded-lg mb-4 border",
                          contract.status === 'PENDING_BROKER_ACCEPTANCE'
                            ? 'bg-yellow-50 border-yellow-200'
                            : contract.status === 'ACTIVE'
                              ? 'bg-green-50 border-green-200'
                              : 'bg-gray-50 border-gray-200'
                        )}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {contract.status === 'PENDING_BROKER_ACCEPTANCE' ? (
                                <AlertCircle className="w-4 h-4 text-yellow-600" />
                              ) : contract.status === 'ACTIVE' ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <FileText className="w-4 h-4 text-gray-600" />
                              )}
                              <div>
                                <p className="text-xs font-medium text-gray-700">Contract Status</p>
                                <p className={cn(
                                  "text-sm font-semibold",
                                  contract.status === 'PENDING_BROKER_ACCEPTANCE'
                                    ? 'text-yellow-700'
                                    : contract.status === 'ACTIVE'
                                      ? 'text-green-700'
                                      : 'text-gray-700'
                                )}>
                                  {contract.status.replace('_', ' ')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {contract.status === 'PENDING_BROKER_ACCEPTANCE' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewContract(load.id);
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                                >
                                  Review & Accept
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewContract(load.id);
                                }}
                                className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                                title="View Contract"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadContract(load.id);
                                }}
                                className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-xs text-gray-500">
                      Created {new Date(load.createdAt).toLocaleDateString()}
                    </span>
                    <button className="text-primary-600 hover:text-primary-700 flex items-center space-x-1 text-sm">
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Load</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLoads.map((load) => {
                      const contract = contracts.get(load.id);
                      return (
                        <tr key={load.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: '#345E85' }}>
                                <Package className="h-5 w-5 text-white" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{load.title || 'Untitled'}</div>
                                <div className="text-xs text-gray-500">{load.cargoType || 'GENERAL'}</div>
                                <div className="text-xs text-gray-400">ID: {load.id.slice(0, 8)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              <div className="flex items-center mb-1">
                                <MapPin className="text-green-500 mr-2 w-4 h-4" />
                                <span className="text-xs">{load.pickupLocation || 'N/A'}</span>
                              </div>
                              <div className="flex items-center">
                                <MapPin className="text-red-500 mr-2 w-4 h-4" />
                                <span className="text-xs">{load.deliveryLocation || 'N/A'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {load.brokerCommissionRate ? (
                              <div className="text-sm text-gray-900">
                                <div className="font-medium">{load.brokerCommissionRate}%</div>
                                {load.brokerCommissionAmount && (
                                  <div className="text-xs text-gray-500">
                                    {load.currencyCode} {load.brokerCommissionAmount.toLocaleString()}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {contract ? (
                              <div className="flex items-center space-x-2">
                                {contract.status === 'PENDING_BROKER_ACCEPTANCE' ? (
                                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                                ) : contract.status === 'ACTIVE' ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <FileText className="w-4 h-4 text-gray-600" />
                                )}
                                <span className={cn(
                                  "text-xs font-medium",
                                  contract.status === 'PENDING_BROKER_ACCEPTANCE'
                                    ? 'text-yellow-700'
                                    : contract.status === 'ACTIVE'
                                      ? 'text-green-700'
                                      : 'text-gray-700'
                                )}>
                                  {contract.status.replace('_', ' ')}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">No contract</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={cn(
                              "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full",
                              getStatusColor(load.status)
                            )}>
                              {getStatusDisplayName(load.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                              {load.currencyCode} {load.loadValue.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              {contract && contract.status === 'PENDING_BROKER_ACCEPTANCE' && (
                                <button
                                  onClick={() => handleViewContract(load.id)}
                                  className="text-yellow-600 hover:text-yellow-900 transition-colors px-2 py-1 text-xs font-medium bg-yellow-50 rounded"
                                  title="Review & Accept"
                                >
                                  Accept
                                </button>
                              )}
                              <button
                                onClick={() => navigate(`/dashboard/broker/loads/${load.id}`)}
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {contract && (
                                <button
                                  onClick={() => handleViewContract(load.id)}
                                  className="text-gray-600 hover:text-gray-900 transition-colors"
                                  title="View Contract"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                              )}
                              {contract && (
                                <button
                                  onClick={() => handleDownloadContract(load.id)}
                                  className="text-green-600 hover:text-green-900 transition-colors"
                                  title="Download PDF"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Contract Acceptance Modal */}
      {showContractModal && selectedContract && (
        <ContractAcceptanceModal
          isOpen={showContractModal}
          onClose={() => {
            setShowContractModal(false);
            setSelectedContract(null);
          }}
          contractId={selectedContract.id}
          onContractAccepted={handleAcceptContract}
        />
      )}
    </div>
  );
};

export default BrokerLoadsPage;
