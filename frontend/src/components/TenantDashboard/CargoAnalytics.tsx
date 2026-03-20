import React, { useState, useMemo } from "react";
import {
  Box, Truck, MapPin as FaMapMarkerAlt, Clock, CheckCircle,
  AlertTriangle, Route, DollarSign, Search, Filter,
  Plus, Eye, Save as FaSave, Check as FaCheck,
  Rocket as FaRocket, Layers as FaLayerGroup
} from 'lucide-react';
import { Line, Bar } from "react-chartjs-2";
import { TranslatedText } from "../translated-text";
import { useTranslation } from "../../hooks/useTranslation";
import FilterSelect from "@/components/common/FilterSelect";

interface CargoAnalyticsProps {
  tenantId?: string;
}

const CargoAnalytics: React.FC<CargoAnalyticsProps> = () => {
  const { tSync } = useTranslation();
  const [selectedFilter, setSelectedFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [timeRange, setTimeRange] = useState("7d");

  // Mock cargo data - in real app, this would come from API
  const cargoData = useMemo(() => ({
    summary: {
      totalLoads: 1247,
      activeLoads: 47,
      completedLoads: 1189,
      pendingLoads: 11,
      totalRevenue: 12500000,
      averageDeliveryTime: 2.3,
      onTimeDelivery: 94.2,
    },
    trends: {
      weekly: [45, 67, 52, 89, 76, 98, 84],
      monthly: [234, 267, 289, 312, 298, 345, 378, 356, 389, 412, 398, 445],
      revenue: [1250000, 1890000, 1500000, 2500000, 2200000, 3000000, 2800000],
    },
    loads: [
      {
        id: 'L-2024-001',
        cargoType: 'Electronics',
        origin: 'Kigali',
        destination: 'Huye',
        status: 'completed',
        weight: '2.5 tons',
        value: 450000,
        driver: 'John Doe',
        truck: 'T-001',
        pickupDate: '2024-01-20',
        deliveryDate: '2024-01-22',
        revenue: 125000
      },
      {
        id: 'L-2024-002',
        cargoType: 'Agricultural',
        origin: 'Musanze',
        destination: 'Kigali',
        status: 'in-transit',
        weight: '5.0 tons',
        value: 320000,
        driver: 'Jane Smith',
        truck: 'T-002',
        pickupDate: '2024-01-23',
        deliveryDate: '2024-01-25',
        revenue: 180000
      },
      {
        id: 'L-2024-003',
        cargoType: 'Construction',
        origin: 'Huye',
        destination: 'Musanze',
        status: 'pending',
        weight: '8.0 tons',
        value: 680000,
        driver: 'Mike Johnson',
        truck: 'T-003',
        pickupDate: '2024-01-26',
        deliveryDate: '2024-01-28',
        revenue: 220000
      },
      {
        id: 'L-2024-004',
        cargoType: 'Textiles',
        origin: 'Kigali',
        destination: 'Rubavu',
        status: 'completed',
        weight: '1.5 tons',
        value: 280000,
        driver: 'Sarah Wilson',
        truck: 'T-004',
        pickupDate: '2024-01-18',
        deliveryDate: '2024-01-19',
        revenue: 95000
      },
      {
        id: 'L-2024-005',
        cargoType: 'Machinery',
        origin: 'Rubavu',
        destination: 'Kigali',
        status: 'in-transit',
        weight: '12.0 tons',
        value: 1200000,
        driver: 'David Brown',
        truck: 'T-005',
        pickupDate: '2024-01-24',
        deliveryDate: '2024-01-27',
        revenue: 350000
      },
    ],
    cargoTypes: [
      { type: 'Electronics', count: 234, revenue: 3200000 },
      { type: 'Agricultural', count: 456, revenue: 2800000 },
      { type: 'Construction', count: 189, revenue: 2100000 },
      { type: 'Textiles', count: 167, revenue: 1800000 },
      { type: 'Machinery', count: 89, revenue: 1500000 },
      { type: 'Other', count: 112, revenue: 1100000 },
    ]
  }), []);

  const filteredLoads = useMemo(() => {
    let filtered = cargoData.loads;

    if (selectedFilter) {
      filtered = filtered.filter(load => load.status === selectedFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(load =>
        load.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        load.cargoType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        load.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        load.destination.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [cargoData.loads, selectedFilter, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-slate-500 bg-slate-50 border-slate-100';
      case 'created': return 'text-primary-600 bg-primary-50 border-primary-100';
      case 'published': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'completed': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'in-transit': return 'text-sky-600 bg-sky-50 border-sky-100';
      case 'pending': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'cancelled': return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100 dark:bg-slate-900/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FaSave className="w-3 h-3" />;
      case 'created': return <FaCheck className="w-3 h-3" />;
      case 'published': return <FaRocket className="w-3 h-3" />;
      case 'completed': return <CheckCircle className="w-3 h-3" />;
      case 'in-transit': return <Truck className="w-3 h-3" />;
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'cancelled': return <AlertTriangle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `RF ${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `RF ${(amount / 1000).toFixed(1)}K`;
    } else {
      return `RF ${amount.toLocaleString()}`;
    }
  };

  const formatFullCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const shipmentTrendData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Shipments',
        data: cargoData.trends.weekly,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 4,
      }
    ]
  };

  const revenueData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Revenue (RWF)',
        data: cargoData.trends.revenue,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#10b981',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 4,
      }
    ]
  };

  const cargoTypeData = {
    labels: cargoData.cargoTypes.map(item => item.type),
    datasets: [
      {
        label: 'Revenue by Cargo Type',
        data: cargoData.cargoTypes.map(item => item.revenue),
        backgroundColor: [
          '#2D5173', // Navy
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(20, 184, 166, 0.8)',
        ],
        hoverOffset: 4,
        borderWidth: 0,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { font: { size: 10, weight: 'bold' as any }, usePointStyle: true, padding: 20 }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
        ticks: { font: { size: 10 }, color: '#94a3b8' }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: '#94a3b8' }
      }
    }
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredLoads.length / itemsPerPage);
  
  const paginatedLoads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLoads.slice(start, start + itemsPerPage);
  }, [filteredLoads, currentPage]);

  return (
    <div className="space-y-10">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: tSync('Total Shipments'), value: cargoData.summary.totalLoads.toLocaleString(), icon: Box, color: 'indigo' },
          { label: tSync('Success Rate'), value: `${cargoData.summary.onTimeDelivery}%`, icon: Route, color: 'amber' },
          { label: tSync('Delivered'), value: cargoData.summary.completedLoads.toLocaleString(), icon: CheckCircle, color: 'emerald' },
          { label: tSync('Earnings'), value: formatCurrency(cargoData.summary.totalRevenue), icon: DollarSign, color: 'primary' }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 shadow-sm p-6 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-tight">{stat.value}</p>
              </div>
              <div className={`p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl`}>
                <stat.icon className={`w-6 h-6 text-primary-600 dark:text-primary-400`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Shipment Trend */}
        <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1"><TranslatedText text="Volume Analysis" /></h3>
              <h4 className="text-xl font-black text-slate-800 dark:text-white tracking-tight"><TranslatedText text="Shipment Trend" /></h4>
            </div>
            <FilterSelect
              value={timeRange}
              onChange={(value) => setTimeRange(value || "7d")}
              placeholder={tSync("Select range")}
              options={[
                { value: "7d", label: tSync("7 Days") },
                { value: "30d", label: tSync("30 Days") },
                { value: "90d", label: tSync("90 Days") },
              ]}
              icon={<Filter className="w-3.5 h-3.5 text-primary-500" />}
              className="w-36"
            />
          </div>
          <div className="h-72">
            <Line data={shipmentTrendData} options={chartOptions} />
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 shadow-sm p-8">
          <div className="mb-8">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1"><TranslatedText text="Financial Performance" /></h3>
            <h4 className="text-xl font-black text-slate-800 dark:text-white tracking-tight"><TranslatedText text="Earnings Trend" /></h4>
          </div>
          <div className="h-72">
            <Line data={revenueData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Cargo Type Distribution */}
      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 shadow-sm p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1"><TranslatedText text="Cargo Breakdown" /></h3>
            <h4 className="text-xl font-black text-slate-800 dark:text-white tracking-tight"><TranslatedText text="Revenue by Category" /></h4>
          </div>
          <div className="px-4 py-1.5 bg-gray-50 dark:bg-slate-800 rounded-full border border-gray-100 dark:border-slate-700">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <TranslatedText text="Total" />: {formatCurrency(cargoData.cargoTypes.reduce((sum, item) => sum + item.revenue, 0))}
            </span>
          </div>
        </div>
        <div className="h-80">
          <Bar data={cargoTypeData} options={chartOptions} />
        </div>
      </div>

      {/* Loads Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-50 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-800/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 italic"><TranslatedText text="Logistics Core" /></h3>
              <h4 className="text-xl font-black text-slate-800 dark:text-white tracking-tight"><TranslatedText text="Cargo Loads" /></h4>
            </div>
            <button className="bg-primary-600 text-white px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-100 dark:shadow-slate-950/20 flex items-center text-sm font-black uppercase tracking-widest">
              <Plus className="w-4 h-4 mr-2" />
              <TranslatedText text="New Shipment" />
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="px-8 py-5 border-b border-gray-50 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 dark:text-slate-600 w-4 h-4" />
                <input
                  type="text"
                  placeholder={tSync("Query loads...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-none rounded-xl focus:ring-2 focus:ring-primary-500/20 text-sm font-medium"
                />
              </div>
            </div>
            <FilterSelect
              label={tSync("Status")}
              value={selectedFilter}
              onChange={setSelectedFilter}
              placeholder={tSync("Global Filter")}
              options={[
                { value: "pending", label: tSync("Pending") },
                { value: "in-transit", label: tSync("In Transit") },
                { value: "completed", label: tSync("Completed") },
                { value: "cancelled", label: tSync("Cancelled") },
              ]}
              icon={<FaLayerGroup className="w-3.5 h-3.5 text-primary-500" />}
              className="sm:min-w-[180px]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-50 dark:divide-slate-800">
            <thead className="bg-gray-50/50 dark:bg-slate-800/10">
              <tr>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Shipment ID" /></th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Category" /></th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Route" /></th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Status" /></th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Weight" /></th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Income" /></th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Truck/Driver" /></th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right"><TranslatedText text="Actions" /></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-50 dark:divide-slate-800">
              {paginatedLoads.map((load) => (
                <tr key={load.id} className="hover:bg-primary-50/10 dark:hover:bg-primary-900/10 transition-colors">
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100">{load.id}</span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{tSync(load.cargoType)}</span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaMapMarkerAlt className="w-3.5 h-3.5 text-primary-400 mr-2.5" />
                      <div>
                        <div className="text-[13px] font-black text-slate-800 dark:text-slate-200">{tSync(load.origin)}</div>
                        <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">→ {tSync(load.destination)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(load.status)} dark:bg-slate-900/50`}>
                      {getStatusIcon(load.status)}
                      <span className="ml-1.5">{tSync(load.status)}</span>
                    </span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                    {load.weight}
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-sm font-black text-slate-800 dark:text-slate-100">
                    {formatFullCurrency(load.revenue)}
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{load.driver}</span>
                      <span className="text-[11px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">{load.truck}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-right">
                    <button className="p-2 text-slate-400 dark:text-slate-600 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-800 rounded-lg transition-all">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-8 py-4 bg-gray-50/30 dark:bg-slate-800/20 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">
              <TranslatedText text="Showing page" /> {currentPage} <TranslatedText text="of" /> {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 disabled:opacity-50 transition-all hover:bg-primary-50 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400 shadow-sm"
              >
                <TranslatedText text="Prev" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 disabled:opacity-50 transition-all hover:bg-primary-50 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400 shadow-sm"
              >
                <TranslatedText text="Next" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CargoAnalytics;
