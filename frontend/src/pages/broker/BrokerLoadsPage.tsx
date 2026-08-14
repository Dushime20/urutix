import { DashboardSkeleton } from '../../components/common/LoadingSkeletons';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type BrokerLoad, type LoadContract, getPickupAddress, getDeliveryAddress, getPickupDate, getDeliveryDate, getPickupCoords, getDeliveryCoords } from '../../services/brokerApi';
import LocationLabel from '../../components/common/LocationLabel';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import ContractAcceptanceModal from '../../components/broker/ContractAcceptanceModal';
import receiverService, { type Receiver } from '../../services/receiverService';
import {
  Package,
  Search,
  ArrowRight,
  AlertCircle,
  Download,
  Eye,
  X,
  Loader2,
  Users,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import { generateBrokerContract, type BrokerContractData } from '@/templates/brokerContract';
import {
  StandardDataTable,
  StatusBadge,
  type Column,
  type TableAction,
} from '../../components/EnliteUI/Tables';

const BrokerLoadsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { compact: fmtMoney } = useCurrencyFormat();
  const [loads, setLoads] = useState<BrokerLoad[]>([]);
  const [contracts, setContracts] = useState<Map<string, LoadContract>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<LoadContract | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showAssignReceiverModal, setShowAssignReceiverModal] = useState(false);
  const [selectedLoadForReceiver, setSelectedLoadForReceiver] = useState<string | null>(null);
  const [receivers, setReceivers] = useState<Receiver[]>([]);
  const [receiversLoading, setReceiversLoading] = useState(false);
  const [receiverSearchTerm, setReceiverSearchTerm] = useState('');
  const [assigningReceiver, setAssigningReceiver] = useState(false);

  useEffect(() => {
    if (user && user.role === 'BROKER') {
      loadBrokerLoads();
    }
  }, [user]);

  const loadBrokerLoads = async () => {
    try {
      setLoading(true);
      const [loadsResponse, contractsResponse] = await Promise.all([
        brokerAPI.getBrokerLoads(user!.id),
        brokerAPI.getContracts()
      ]);

      let loadsData: BrokerLoad[] = [];
      if (Array.isArray(loadsResponse.data)) {
        loadsData = loadsResponse.data;
      } else if (Array.isArray(loadsResponse)) {
        loadsData = loadsResponse;
      } else if (loadsResponse.data && Array.isArray(loadsResponse.data)) {
        loadsData = loadsResponse.data;
      }
      setLoads(loadsData);

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
    } catch (err: any) {
      console.error('Failed to load broker loads:', err);
      toast.error(err.response?.data?.message || 'Failed to load loads');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptContract = async (contractId: string) => {
    try {
      await brokerAPI.acceptContract(contractId);
      toast.success('Contract accepted successfully!');
      setShowContractModal(false);
      setSelectedContract(null);
      loadBrokerLoads();
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
    if (!contract) return;
    const loadData = loads.find(l => l.id === loadId);
    if (!loadData) return;

    try {
      const contractResponse = await brokerAPI.getContract(contract.id);
      const fullContract = contractResponse.data || contractResponse;
      const loadInfo = fullContract.load || loadData;

      const cargoOwnerName = fullContract.cargoOwner?.profile?.firstName && fullContract.cargoOwner?.profile?.lastName
        ? `${fullContract.cargoOwner.profile.firstName} ${fullContract.cargoOwner.profile.lastName}`
        : fullContract.cargoOwner?.email || 'Cargo Owner';

      const brokerName = (user as any)?.profile?.firstName && (user as any)?.profile?.lastName
        ? `${(user as any).profile.firstName} ${(user as any).profile.lastName}`
        : user?.email || 'Broker';

      const contractData: BrokerContractData = {
        cargoOwner: {
          name: cargoOwnerName,
          company: fullContract.cargoOwner?.profile?.companyName || 'N/A',
          address: 'N/A',
          phone: fullContract.cargoOwner?.phone || 'N/A',
          email: fullContract.cargoOwner?.email || 'N/A'
        },
        broker: {
          name: brokerName,
          company: (user as any)?.profile?.companyName || 'N/A',
          address: 'N/A',
          phone: (user as any)?.phone || 'N/A',
          email: user?.email || 'N/A'
        },
        load: {
          id: loadData.id,
          title: loadData.title || loadInfo.title || 'Load',
          description: loadData.description || loadInfo.description || 'Transportation service',
          transportationFee: fullContract.agreedRate || loadData.loadValue || 0,
          currency: fullContract.currencyCode || loadData.currencyCode || 'KES',
          weight: loadData.weight || loadInfo.weight,
          cargoType: loadData.cargoType || loadInfo.cargoType || 'GENERAL',
          pickupLocation: getPickupAddress(loadData) || 'N/A',
          deliveryLocation: getDeliveryAddress(loadData) || 'N/A',
          pickupDate: new Date(fullContract.pickupDate || getPickupDate(loadData) || Date.now()).toISOString().split('T')[0],
          deliveryDate: new Date(fullContract.deliveryDate || getDeliveryDate(loadData) || Date.now()).toISOString().split('T')[0],
        },
        commission: {
          rate: fullContract.commissionRate || 0,
          amount: fullContract.commissionAmount || 0,
          paymentTerms: fullContract.paymentTerms || 'Net 30 days',
          paymentMethod: 'Bank Transfer'
        },
        contract: {
          id: fullContract.id,
          date: new Date(fullContract.createdAt || Date.now()).toISOString().split('T')[0],
          effectiveDate: new Date(fullContract.pickupDate || Date.now()).toISOString().split('T')[0],
          jurisdiction: 'Kenya'
        }
      };

      const pdf = new jsPDF();
      const contractText = generateBrokerContract(contractData);
      pdf.setFontSize(10);
      const lines = pdf.splitTextToSize(contractText, 170);
      pdf.text(lines, 20, 30);
      pdf.save(`Contract_${fullContract.id}.pdf`);
      toast.success('Contract downloaded');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to generate PDF');
    }
  };

  const handleOpenAssignReceiverModal = async (loadId: string) => {
    setSelectedLoadForReceiver(loadId);
    setShowAssignReceiverModal(true);
    await loadReceivers();
  };

  const handleCloseAssignReceiverModal = () => {
    setShowAssignReceiverModal(false);
    setSelectedLoadForReceiver(null);
    setReceiverSearchTerm('');
  };

  const loadReceivers = async () => {
    try {
      setReceiversLoading(true);
      const data = await receiverService.getReceivers();
      setReceivers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading receivers:', error);
      toast.error('Failed to load receivers');
    } finally {
      setReceiversLoading(false);
    }
  };

  const handleAssignExistingReceiver = async (receiverId: string) => {
    if (!selectedLoadForReceiver) return;
    
    try {
      setAssigningReceiver(true);
      await receiverService.assignCargoToReceiver(selectedLoadForReceiver, receiverId);
      toast.success('Receiver assigned successfully');
      handleCloseAssignReceiverModal();
      loadBrokerLoads(); // Refresh loads to show updated receiver assignment
    } catch (error: any) {
      console.error('Error assigning receiver:', error);
      toast.error(error.response?.data?.message || 'Failed to assign receiver');
    } finally {
      setAssigningReceiver(false);
    }
  };

  const handleUnassignReceiver = async (loadId: string) => {
    if (!window.confirm('Are you sure you want to unassign the receiver from this load?')) return;
    
    try {
      await receiverService.unassignCargoFromReceiver(loadId);
      toast.success('Receiver unassigned successfully');
      loadBrokerLoads(); // Refresh loads
    } catch (error: any) {
      console.error('Error unassigning receiver:', error);
      toast.error(error.response?.data?.message || 'Failed to unassign receiver');
    }
  };

  const filteredReceivers = useMemo(() => {
    return receivers.filter(receiver => {
      const searchLower = receiverSearchTerm.toLowerCase();
      const name = `${receiver.profile?.firstName || ''} ${receiver.profile?.lastName || ''}`.toLowerCase();
      const email = receiver.email.toLowerCase();
      return name.includes(searchLower) || email.includes(searchLower);
    });
  }, [receivers, receiverSearchTerm]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-9 md:px-10 lg:px-12 xl:px-14 animate-fade-in pb-24">
      <StandardDataTable<BrokerLoad>
        title="Loads"
        icon={<Package size={18} />}
        columns={[
          {
            key: 'title',
            label: 'Load',
            sortable: true,
            alwaysVisible: true,
            render: (_: any, load: BrokerLoad) => {
              const contract = contracts.get(load.id);
              const pending = contract?.status === 'PENDING_BROKER_ACCEPTANCE';
              return (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-300 shadow-sm">
                    <Package size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{load.title}</p>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">#{load.id.slice(0, 8)}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge status={load.status} label={load.status.replace(/_/g, ' ')} />
                      {pending && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                          <AlertCircle size={12} /> Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            },
          },
          {
            key: 'pickupLocation',
            label: 'Route',
            render: (_: any, load: BrokerLoad) => (
              <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                <LocationLabel
                  address={getPickupAddress(load)}
                  lat={getPickupCoords(load)?.lat}
                  lng={getPickupCoords(load)?.lng}
                  fallback="N/A"
                  className="truncate max-w-[140px]"
                />
                <ArrowRight size={12} className="shrink-0 text-slate-400" />
                <LocationLabel
                  address={getDeliveryAddress(load)}
                  lat={getDeliveryCoords(load)?.lat}
                  lng={getDeliveryCoords(load)?.lng}
                  fallback="N/A"
                  className="truncate max-w-[140px]"
                />
              </div>
            ),
          },
          {
            key: 'loadValue',
            label: 'Rate',
            sortable: true,
            align: 'right',
            render: (_: any, load: BrokerLoad) => (
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{fmtMoney(load.loadValue ?? 0)}</p>
                {load.brokerCommissionRate ? (
                  <p className="text-xs font-medium text-primary-500">Comm: {load.brokerCommissionRate}%</p>
                ) : null}
              </div>
            ),
          },
        ] as Column<BrokerLoad>[]}
        data={loads}
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/dashboard/broker/loads/${row.id}`)}
        searchable
        searchPlaceholder="Search load ID, title, or status..."
        searchKeys={['title', 'description', 'id', 'status', 'cargoType']}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'ASSIGNED', label: 'Assigned' },
              { value: 'IN_TRANSIT', label: 'In Transit' },
              { value: 'COMPLETED', label: 'Delivered' },
            ],
          },
        ]}
        pagination
        pageSize={10}
        columnVisibility
        stickyHeader
        striped
        hoverable
        emptyMessage="No loads found"
        onRefresh={loadBrokerLoads}
        rowActions={[
          {
            key: 'review',
            label: 'Review contract',
            icon: <AlertCircle size={14} />,
            variant: 'warning',
            hidden: (row) => contracts.get(row.id)?.status !== 'PENDING_BROKER_ACCEPTANCE',
            onClick: (row) => handleViewContract(row.id),
          },
          {
            key: 'assign',
            label: 'Assign receiver',
            icon: <Users size={14} />,
            onClick: (row) => handleOpenAssignReceiverModal(row.id),
          },
          {
            key: 'download',
            label: 'Download contract',
            icon: <Download size={14} />,
            onClick: (row) => handleDownloadContract(row.id),
          },
          {
            key: 'view',
            label: 'View details',
            icon: <Eye size={14} />,
            onClick: (row) => navigate(`/dashboard/broker/loads/${row.id}`),
          },
        ] as TableAction<BrokerLoad>[]}
        ariaLabel="Broker loads table"
      />

      {showContractModal && selectedContract && (
        <ContractAcceptanceModal
          isOpen={showContractModal}
          onClose={() => { setShowContractModal(false); setSelectedContract(null); }}
          contractId={selectedContract.id}
          onContractAccepted={handleAcceptContract}
        />
      )}

      {/* Assign Existing Receiver Modal */}
      {showAssignReceiverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  <Users size={20} className="text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Assign Receiver</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Load #{selectedLoadForReceiver?.slice(0, 8)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseAssignReceiverModal}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search receivers..."
                  value={receiverSearchTerm}
                  onChange={(e) => setReceiverSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Receivers List */}
            <div className="overflow-y-auto flex-1 p-4">
              {receiversLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                </div>
              ) : filteredReceivers.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-medium">No receivers found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Available Receivers</h3>
                  
                  {filteredReceivers.map((receiver) => (
                    <div 
                      key={receiver.id}
                      className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/30 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-all">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white text-sm">
                            {receiver.profile?.firstName ? `${receiver.profile.firstName} ${receiver.profile.lastName}` : receiver.email}
                          </div>
                          {receiver.profile?.firstName && (
                            <div className="text-xs text-slate-500 dark:text-slate-400">{receiver.email}</div>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleAssignExistingReceiver(receiver.id)}
                        disabled={assigningReceiver}
                        className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {assigningReceiver ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <CheckCircle size={14} />
                        )}
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
              <button
                onClick={handleCloseAssignReceiverModal}
                className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokerLoadsPage;
