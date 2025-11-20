import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaTruck,
  FaUser,
  FaDollarSign,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaSync,
  FaSearch,
  FaFilter,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaBox,
  FaFileInvoice,
  FaEye
} from 'react-icons/fa';
import { fleetApi, type FleetItem, type Driver } from '../services/fleetApi';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { ReceiptModal, type Receipt } from '../components/FleetDashboard/ReceiptModal';

interface InTransitTruck {
  id: string;
  truckId: string;
  plateNumber: string;
  make: string;
  model: string;
  driver: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  cargo: {
    title: string;
    origin: string;
    destination: string;
    cargoOwner: string;
  };
  price: number;
  currency: string;
  paymentStatus: 'paid' | 'unpaid';
  startDate: string;
  receiptId?: string;
}

// Dummy data generators
const generateDummyDriver = (index: number) => {
  const firstNames = ['James', 'John', 'Michael', 'David', 'Robert', 'William', 'Richard', 'Joseph', 'Thomas', 'Charles'];
  const lastNames = ['Mwangi', 'Kamau', 'Ochieng', 'Onyango', 'Kipchoge', 'Wanjala', 'Kiprotich', 'Omondi', 'Kipruto', 'Waweru'];
  return {
    id: `driver-${index}`,
    firstName: firstNames[index % firstNames.length],
    lastName: lastNames[index % lastNames.length],
    phone: `+2547${Math.floor(Math.random() * 90000000 + 10000000)}`,
  };
};

const generateDummyCargo = (index: number) => {
  const cargoTypes = [
    { title: 'Electronics Shipment', origin: 'Nairobi', destination: 'Mombasa' },
    { title: 'Agricultural Products', origin: 'Kisumu', destination: 'Nairobi' },
    { title: 'Construction Materials', origin: 'Nakuru', destination: 'Eldoret' },
    { title: 'Food & Beverages', origin: 'Mombasa', destination: 'Nairobi' },
    { title: 'Textiles & Clothing', origin: 'Nairobi', destination: 'Kisumu' },
    { title: 'Machinery & Equipment', origin: 'Eldoret', destination: 'Nakuru' },
    { title: 'Pharmaceuticals', origin: 'Nairobi', destination: 'Mombasa' },
    { title: 'Furniture & Home Goods', origin: 'Kisumu', destination: 'Nairobi' },
  ];
  const owners = ['ABC Logistics Ltd', 'XYZ Transport Co', 'Global Shipping Inc', 'Kenya Cargo Services', 'East Africa Freight'];
  const cargo = cargoTypes[index % cargoTypes.length];
  return {
    title: cargo.title,
    origin: cargo.origin,
    destination: cargo.destination,
    cargoOwner: owners[index % owners.length],
  };
};

const generateDummyPrice = () => {
  const prices = [5000, 7500, 10000, 12000, 15000, 18000, 20000, 25000];
  return {
    amount: prices[Math.floor(Math.random() * prices.length)],
    currency: 'KES',
  };
};

const FleetPaymentManagement: React.FC = () => {
  const [trucks, setTrucks] = useState<InTransitTruck[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const { user } = useAuth();

  const loadTrucks = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all trucks
      const allTrucks = await fleetApi.getTrucks();
      
      // Filter for trucks with status "inTransit" (case-insensitive)
      const inTransitTrucks = allTrucks.filter((truck: FleetItem) => 
        truck.status?.toLowerCase() === 'intransit' || 
        truck.status?.toLowerCase() === 'in_transit' ||
        truck.status?.toLowerCase() === 'in-transit'
      );

      // Create enriched data with dummy information
      const enrichedTrucks: InTransitTruck[] = inTransitTrucks.map((truck: FleetItem, index: number) => {
        const driver = generateDummyDriver(index);
        const cargo = generateDummyCargo(index);
        const price = generateDummyPrice();
        
        return {
          id: `transit-${truck.id}`,
          truckId: truck.id,
          plateNumber: truck.plateNumber,
          make: truck.make,
          model: truck.model,
          driver,
          cargo,
          price: price.amount,
          currency: price.currency,
          paymentStatus: Math.random() > 0.5 ? 'paid' : 'unpaid' as 'paid' | 'unpaid',
          startDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
      });

      setTrucks(enrichedTrucks);
    } catch (error: any) {
      console.error('Error loading trucks:', error);
      toast.error('Failed to load trucks');
      setTrucks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrucks();
  }, [loadTrucks]);

  const generateReceiptNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `RCP-${timestamp}-${random}`;
  };

  const generateReceipt = (truck: InTransitTruck): Receipt => {
    const receiptNumber = generateReceiptNumber();
    const paymentDate = new Date().toISOString();
    
    return {
      id: `receipt-${truck.id}`,
      receiptNumber,
      tripId: truck.id,
      truckId: truck.truckId,
      plateNumber: truck.plateNumber,
      make: truck.make,
      model: truck.model,
      driver: {
        firstName: truck.driver.firstName,
        lastName: truck.driver.lastName,
        phone: truck.driver.phone,
      },
      cargo: {
        title: truck.cargo.title,
        origin: truck.cargo.origin,
        destination: truck.cargo.destination,
        cargoOwner: truck.cargo.cargoOwner,
      },
      amount: truck.price,
      currency: truck.currency,
      paymentDate,
      tripStartDate: truck.startDate,
      generatedAt: paymentDate,
      truckOwner: {
        name: user?.profile?.firstName && user?.profile?.lastName 
          ? `${user.profile.firstName} ${user.profile.lastName}`
          : user?.email || 'Truck Owner',
        company: user?.profile?.companyName || undefined,
        email: user?.email || undefined,
        phone: user?.profile?.phone || undefined,
      },
      status: 'pending', // Will be sent to cargo owner
    };
  };

  const sendReceiptToCargoOwner = async (receipt: Receipt) => {
    try {
      // Simulate API call to send receipt to cargo owner
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, this would:
      // 1. Store receipt in database
      // 2. Send notification/email to cargo owner with receipt
      // 3. Update receipt status to 'sent'
      
      const updatedReceipt = { ...receipt, status: 'sent' as const };
      setReceipts(prev => {
        const existing = prev.find(r => r.id === receipt.id);
        if (existing) {
          return prev.map(r => r.id === receipt.id ? updatedReceipt : r);
        }
        return [...prev, updatedReceipt];
      });
      
      return updatedReceipt;
    } catch (error) {
      console.error('Error sending receipt to cargo owner:', error);
      throw error;
    }
  };

  const handleUpdatePaymentStatus = async (truckId: string, newStatus: 'paid' | 'unpaid') => {
    setUpdatingStatus(truckId);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const truck = trucks.find(t => t.id === truckId);
      if (!truck) return;
      
      // Update local state
      setTrucks(prevTrucks =>
        prevTrucks.map(t =>
          t.id === truckId ? { ...t, paymentStatus: newStatus } : t
        )
      );
      
      // If marking as paid, generate and store receipt
      if (newStatus === 'paid' && truck.paymentStatus !== 'paid') {
        const receipt = generateReceipt(truck);
        setReceipts(prev => [...prev, receipt]);
        
        // Update truck with receipt ID
        setTrucks(prevTrucks =>
          prevTrucks.map(t =>
            t.id === truckId ? { ...t, receiptId: receipt.id } : t
          )
        );
        
        // Send receipt to cargo owner
        try {
          await sendReceiptToCargoOwner(receipt);
          toast.success('Payment marked as paid and receipt sent to cargo owner');
        } catch (error) {
          toast.success('Payment marked as paid. Receipt generated but failed to send to cargo owner.');
        }
      } else {
        toast.success(`Payment status updated to ${newStatus}`);
      }
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleViewReceipt = (truck: InTransitTruck) => {
    const receipt = receipts.find(r => r.tripId === truck.id || r.id === truck.receiptId);
    if (receipt) {
      setSelectedReceipt(receipt);
      setShowReceiptModal(true);
    } else {
      toast.error('Receipt not found for this trip');
    }
  };

  const filteredTrucks = trucks.filter(truck => {
    const matchesSearch = 
      !searchTerm ||
      truck.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.driver?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.driver?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.cargo?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.cargo?.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.cargo?.destination?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' ||
      truck.paymentStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2">Payment Management</h1>
            <p className="text-sm text-gray-600">View and manage payments for trucks in transit</p>
          </div>
          <button
            onClick={loadTrucks}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSync className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by truck plate, driver name, cargo, or route..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-400 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'paid' | 'unpaid')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trips Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <FaSpinner className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : filteredTrucks.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FaTruck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Trucks in Transit</h3>
          <p className="text-sm text-gray-600">
            {searchTerm || statusFilter !== 'all'
              ? 'No trucks match your search criteria.'
              : 'There are currently no trucks with "inTransit" status.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="custom-table w-full">
              <thead>
                <tr>
                  <th>Truck</th>
                  <th>Driver</th>
                  <th>Cargo</th>
                  <th>Route</th>
                  <th>Price</th>
                  <th>Payment Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrucks.map((truck) => (
                  <tr key={truck.id}>
                    <td>
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        <FaTruck className="w-4 h-4 text-primary-600" />
                        {truck.plateNumber}
                      </div>
                      <div className="text-xs text-gray-500">
                        {truck.make} {truck.model}
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        <FaUser className="w-4 h-4 text-blue-600" />
                        {truck.driver.firstName} {truck.driver.lastName}
                      </div>
                      {truck.driver.phone && (
                        <div className="text-xs text-gray-500">{truck.driver.phone}</div>
                      )}
                    </td>
                    <td>
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        <FaBox className="w-4 h-4 text-green-600" />
                        {truck.cargo.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Owner: {truck.cargo.cargoOwner}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <FaMapMarkerAlt className="w-3 h-3 text-gray-400" />
                        {truck.cargo.origin} → {truck.cargo.destination}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Started: {formatDate(truck.startDate)}
                      </div>
                    </td>
                    <td>
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        <FaDollarSign className="w-4 h-4 text-green-600" />
                        {formatCurrency(truck.price, truck.currency)}
                      </div>
                    </td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        truck.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {truck.paymentStatus === 'paid' ? (
                          <span className="flex items-center gap-1">
                            <FaCheckCircle className="w-3 h-3" />
                            Paid
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <FaTimesCircle className="w-3 h-3" />
                            Unpaid
                          </span>
                        )}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {truck.paymentStatus === 'paid' && receipts.find(r => r.tripId === truck.id || r.id === truck.receiptId) && (
                          <div className="relative group">
                            <button
                              onClick={() => handleViewReceipt(truck)}
                              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
                              title="View Receipt"
                            >
                              <FaFileInvoice className="w-4 h-4" />
                              <span className="text-sm">Receipt</span>
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-md shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              View Receipt
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                            </div>
                          </div>
                        )}
                        <select
                          value={truck.paymentStatus}
                          onChange={(e) => handleUpdatePaymentStatus(truck.id, e.target.value as 'paid' | 'unpaid')}
                          disabled={updatingStatus === truck.id}
                          className={`px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                            updatingStatus === truck.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        >
                          <option value="unpaid">Unpaid</option>
                          <option value="paid">Paid</option>
                        </select>
                        {updatingStatus === truck.id && (
                          <FaSpinner className="w-4 h-4 text-primary-600 animate-spin" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {!loading && filteredTrucks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <FaTruck className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Trucks</p>
                <p className="text-2xl font-bold text-gray-900">{filteredTrucks.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <FaCheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Paid</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredTrucks.filter(t => t.paymentStatus === 'paid').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <FaDollarSign className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    filteredTrucks.reduce((sum, truck) => sum + truck.price, 0),
                    filteredTrucks[0]?.currency || 'KES'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        receipt={selectedReceipt}
        isOpen={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setSelectedReceipt(null);
        }}
        onDownload={() => {
          // TODO: Implement PDF download
          toast.success('Receipt download functionality coming soon');
        }}
        onPrint={() => {
          window.print();
        }}
      />
    </div>
  );
};

export default FleetPaymentManagement;
