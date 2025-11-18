import React, { useState, useMemo } from "react";
import {
  FaBox,
  FaTruck,
  FaMapMarkerAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaRoute,
  FaDollarSign,
  FaSearch,
  FaFilter,
  FaPlus,
  FaEye,
  FaChartLine,
  FaSave,
  FaCheck,
  FaRocket,
  FaLayerGroup,
} from "react-icons/fa";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import FilterSelect from "@/components/common/FilterSelect";

interface CargoAnalyticsProps {
  tenantId?: string;
}

const CargoAnalytics: React.FC<CargoAnalyticsProps> = ({ tenantId }) => {
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
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'created': return 'text-blue-600 bg-blue-100';
      case 'published': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in-transit': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FaSave className="w-4 h-4" />;
      case 'created': return <FaCheck className="w-4 h-4" />;
      case 'published': return <FaRocket className="w-4 h-4" />;
      case 'completed': return <FaCheckCircle className="w-4 h-4" />;
      case 'in-transit': return <FaTruck className="w-4 h-4" />;
      case 'pending': return <FaClock className="w-4 h-4" />;
      case 'cancelled': return <FaExclamationTriangle className="w-4 h-4" />;
      default: return <FaClock className="w-4 h-4" />;
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
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      }
    ]
  };

  const revenueData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Revenue (RWF)',
        data: cargoData.trends.revenue,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
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
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(16, 185, 129, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(251, 191, 36)',
          'rgb(239, 68, 68)',
          'rgb(168, 85, 247)',
          'rgb(16, 185, 129)',
        ],
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { 
          font: { size: 12 },
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 8,
        padding: 12
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { 
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          font: { size: 11 },
          color: '#6B7280'
        }
      },
      x: {
        grid: { 
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          font: { size: 11 },
          color: '#6B7280'
        }
      }
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Loads</p>
              <p className="text-3xl font-bold text-gray-900">{cargoData.summary.totalLoads.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <FaBox className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Completed</p>
              <p className="text-3xl font-bold text-gray-900">{cargoData.summary.completedLoads.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <FaCheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(cargoData.summary.totalRevenue)}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <FaDollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">On-Time Rate</p>
              <p className="text-3xl font-bold text-gray-900">{cargoData.summary.onTimeDelivery}%</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-xl">
              <FaRoute className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Shipment Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Shipment Trend</h3>
            <FilterSelect
              value={timeRange}
              onChange={(value) => setTimeRange(value || "7d")}
              placeholder="Select range"
              options={[
                { value: "7d", label: "7 Days" },
                { value: "30d", label: "30 Days" },
                { value: "90d", label: "90 Days" },
              ]}
              icon={<FaFilter className="text-blue-500" />}
              className="w-40"
            />
          </div>
          <div className="h-72">
            <Line data={shipmentTrendData} options={chartOptions} />
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Weekly Revenue Trend</h3>
          <div className="h-72">
            <Line data={revenueData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Cargo Type Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Revenue by Cargo Type</h3>
          <div className="text-sm text-gray-500">Total: {formatCurrency(cargoData.cargoTypes.reduce((sum, item) => sum + item.revenue, 0))}</div>
        </div>
        <div className="h-80">
          <Bar data={cargoTypeData} options={chartOptions} />
        </div>
      </div>

      {/* Loads Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Cargo Loads</h3>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm">
              <FaPlus className="w-4 h-4 mr-2" />
              New Load
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search loads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <FilterSelect
              label="Status"
              value={selectedFilter}
              onChange={setSelectedFilter}
              placeholder="All Status"
              options={[
                { value: "pending", label: "Pending" },
                { value: "in-transit", label: "In Transit" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
              icon={<FaLayerGroup className="text-purple-500" />}
              className="sm:min-w-[180px]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Load ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver/Truck</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLoads.map((load) => (
                <tr key={load.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{load.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{load.cargoType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaMapMarkerAlt className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm text-gray-900">{load.origin}</div>
                        <div className="text-sm text-gray-500">→ {load.destination}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(load.status)}`}>
                      {getStatusIcon(load.status)}
                      <span className="ml-1.5 capitalize">{load.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {load.weight}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatFullCurrency(load.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{load.driver}</div>
                      <div className="text-sm text-gray-500">{load.truck}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      <FaEye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CargoAnalytics;
