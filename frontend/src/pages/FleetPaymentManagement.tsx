import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FaSearch, FaFilter, FaTruck, FaBox, FaDollarSign, FaCheckCircle, FaFileInvoice, FaSpinner } from 'react-icons/fa';
import { fleetApi, type FleetItem } from '../services/fleetApi';
import { ReceiptModal, type Receipt } from '../components/FleetDashboard/ReceiptModal';
import { useAuth } from '../contexts/AuthContext';

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
          id: `transit - ${truck.id} `,
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
    return `RCP - ${timestamp} -${random} `;
  };

  const generateReceipt = (truck: InTransitTruck): Receipt => {
    const receiptNumber = generateReceiptNumber();
    const paymentDate = new Date().toISOString();

    return {
      id: `receipt - ${truck.id} `,
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
        name: (user as any)?.profile?.firstName && (user as any)?.profile?.lastName
          ? `${(user as any).profile.firstName} ${(user as any).profile.lastName} `
          : user?.email || 'Truck Owner',
        company: (user as any)?.profile?.companyName || undefined,
        email: user?.email || undefined,
        phone: (user as any)?.profile?.phone || undefined,
      },
      status: 'pending', // Will be sent to cargo owner
    };
  };





  const handleViewReceipt = (truck: InTransitTruck) => {
    if (!truck.receiptId) return;

    // Find receipt
    const receipt = receipts.find(r => r.id === truck.receiptId);
    if (receipt) {
      setSelectedReceipt(receipt);
    } else {
      // Fallback - generate one on the fly
      const newReceipt = generateReceipt(truck);
      setSelectedReceipt(newReceipt);
    }
    setShowReceiptModal(true);
  };

  // Helper for formatting currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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



  return (
    <div className="flex flex-col min-h-screen w-full bg-[#f8fafc] text-[#0f172a] font-sans">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* Premium Header */}
        <div className="flex flex-wrap justify-between items-end gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl sm:text-4xl font-black text-[#0f172a] uppercase tracking-tight">Payment <span className="text-blue-600">Command</span></h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Financial Operations & Transaction History</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-[1.5rem] border border-slate-100 p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="w-full relative group">
              <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors w-4 h-4" />
              <input
                type="text"
                placeholder="SEARCH TRANSACTIONS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-300"
              />
            </div>
            <div className="flex items-center gap-2 w-full">
              <div className="flex-1 flex items-center gap-2">
                <FaFilter className="text-slate-300 w-4 h-4 flex-shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'paid' | 'unpaid')}
                  className="w-full md:w-auto px-6 py-3 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer hover:bg-slate-50 transition-all"
                >
                  <option value="all">Status: ALL</option>
                  <option value="paid">Status: PAID</option>
                  <option value="unpaid">Status: PENDING</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Trips Table/Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FaSpinner className="w-10 h-10 text-blue-600 animate-spin" />
          </div>
        ) : filteredTrucks.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-slate-100 dashed border-2 p-12 text-center shadow-none flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mb-6">
              <FaTruck className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-[#0f172a] uppercase tracking-tight mb-2">No Data Detected</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {searchTerm || statusFilter !== 'all'
                ? 'Adjust filters to locate records.'
                : 'No active transit records found.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Asset Identity</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operator</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Manifest</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Vector</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Yield</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Protocol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredTrucks.map((truck) => (
                      <tr key={truck.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="font-black text-[#0f172a] flex items-center gap-3 uppercase italic tracking-tight">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                              <FaTruck className="w-3 h-3" />
                            </div>
                            {truck.plateNumber}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 pl-11 mt-1 uppercase tracking-wider">
                            {truck.make} {truck.model}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#0f172a] text-sm">{truck.driver.firstName} {truck.driver.lastName}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {truck.driver.phone || 'NO PHONE'}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#0f172a] text-sm">{truck.cargo.title}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <FaBox className="w-2.5 h-2.5" />
                              {truck.cargo.cargoOwner}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span className="truncate max-w-[120px]" title={truck.cargo.origin}>{truck.cargo.origin}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              <span className="truncate max-w-[120px]" title={truck.cargo.destination}>{truck.cargo.destination}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="font-black text-[#0f172a] text-base tracking-tight">
                            {formatCurrency(truck.price, truck.currency)}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center">
                            {truck.paymentStatus === 'paid' ? (
                              <span className="px-3 py-1.5 rounded-xl text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1.5 uppercase tracking-wider">
                                <FaCheckCircle className="w-3 h-3" /> Settled
                              </span>
                            ) : (
                              <span className="px-3 py-1.5 rounded-xl text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1.5 uppercase tracking-wider">
                                <FaDollarSign className="w-3 h-3" /> Pending
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                            {truck.paymentStatus === 'paid' ? (
                              <button
                                onClick={() => handleViewReceipt(truck)}
                                className="text-slate-400 hover:text-blue-600 transition-colors p-2 rounded-xl hover:bg-blue-50 group border border-transparent hover:border-blue-100"
                                title="View Receipt"
                              >
                                <FaFileInvoice className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                className="text-slate-200 cursor-not-allowed p-2"
                                title="Pending Settlement"
                              >
                                <FaFileInvoice className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredTrucks.map((truck) => (
                <div key={truck.id} className="bg-white rounded-[1.5rem] border border-slate-100 p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <FaTruck />
                      </div>
                      <div>
                        <h3 className="font-black text-[#0f172a] uppercase tracking-tight">{truck.plateNumber}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{truck.driver.firstName} {truck.driver.lastName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[#0f172a]">
                        {formatCurrency(truck.price, truck.currency)}
                      </p>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${truck.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {truck.paymentStatus === 'paid' ? 'SETTLED' : 'PENDING'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center gap-1 mt-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                        <div className="w-0.5 h-6 bg-slate-100"></div>
                        <div className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-200"></div>
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Origin</p>
                          <p className="text-xs font-bold text-[#0f172a] uppercase">{truck.cargo.origin}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Target</p>
                          <p className="text-xs font-bold text-[#0f172a] uppercase">{truck.cargo.destination}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-50 gap-2">
                    {truck.paymentStatus === 'paid' && (
                      <button
                        onClick={() => handleViewReceipt(truck)}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors"
                      >
                        Receipt
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Receipt Modal */}
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          receipt={selectedReceipt}
          onDownload={() => {
            toast.success('Downloading receipt...');
            window.print();
          }}
        />
      </main>
    </div >
  );
};


export default FleetPaymentManagement;
