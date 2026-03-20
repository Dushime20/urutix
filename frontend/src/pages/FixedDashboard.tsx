import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  Plus,
  Zap,
  Star,
  Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchCargos } from '../services/cargoApi';
import { cargoOwnerAPI } from '../services/cargoOwnerAPI';
import receiverService from '../services/receiverService';
import { formatNumber, formatCurrency } from '../utils/formatNumber';
import { TranslatedText } from '../components/translated-text';

const FixedDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If user is a truck owner (CARRIER), redirect to fleet dashboard
  useEffect(() => {
    if (user && user.role === 'CARRIER') {
      navigate('/dashboard/fleet', { replace: true });
    }
  }, [user, navigate]);

  // Otherwise show cargo owner dashboard (CARGO_RECEIVER sees simplified version)
  return <CargoOwnerDashboard />;
};

const CargoOwnerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cargos, setCargos] = useState<any[]>([]);
  const [dashboardAnalytics, setDashboardAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch cargos and related data on mount
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Different data fetching for CARGO_RECEIVER
        if (user?.role === 'CARGO_RECEIVER') {
          const receiverCargos = await receiverService.getMyCargos();
          const cargosArray = Array.isArray(receiverCargos) ? receiverCargos : [];
          setCargos(cargosArray);
          setLoading(false);
          return;
        }

        // Fetch analytics
        try {
          const analyticsRes = await cargoOwnerAPI.getDashboardAnalytics('all');
          setDashboardAnalytics(analyticsRes.data);
        } catch (e) {
          console.error('Failed to fetch analytics', e);
        }

        // Fetch cargos for cargo owners
        const cargoData = await fetchCargos(1, '', {});
        setCargos(Array.isArray(cargoData) ? cargoData : []);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setCargos([]);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [user]);

  // Calculate cargo statistics
  const stats = useMemo(() => {
    const totalCargos = cargos.length;
    const activeCargos = cargos.filter(c =>
      c.status === 'IN_TRANSIT' || c.status === 'ASSIGNED' || c.status === 'PUBLISHED'
    ).length;
    const pendingCargos = cargos.filter(c =>
      c.status === 'DRAFT' || c.status === 'PENDING' || c.status === 'CREATED'
    ).length;
    const completedCargos = cargos.filter(c =>
      c.status === 'DELIVERED' || c.status === 'COMPLETED'
    ).length;
    const totalValue = dashboardAnalytics?.totalLoadValue ?? cargos.reduce((sum, c) => {
      const value = Number(c.loadValue) || 0;
      return sum + value;
    }, 0);

    const completionRate = totalCargos > 0 ? (completedCargos / totalCargos) * 100 : 0;
    const efficiencyScore = totalCargos > 0 ? Math.min(100, (activeCargos / totalCargos) * 100 + completionRate) : 0;
    const onTimeDeliveryRate = completedCargos > 0 ? 85 : 0;

    const incompleteCargos = cargos.filter(c =>
      c.status === 'DRAFT' || (c.status === 'CREATED' && !c.pickupLocation && !c.deliveryLocation)
    ).length;

    return {
      totalCargos,
      activeCargos,
      pendingCargos,
      completedCargos,
      incompleteCargos,
      totalValue,
      averageValue: totalCargos > 0 ? totalValue / totalCargos : 0,
      completionRate,
      efficiencyScore,
      onTimeDeliveryRate,
    };
  }, [cargos, dashboardAnalytics]);

  // Get recent cargo activity
  const recentCargoActivity = useMemo(() => {
    if (user?.role === 'CARGO_RECEIVER') {
      return cargos
        .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        .slice(0, 5)
        .map((cargo) => {
          const date = new Date(cargo.updatedAt || cargo.createdAt);
          const isCompleted = cargo.inspectionStatus === 'COMPLETED' || cargo.allItemsVerified;
          const status = isCompleted ? 'COMPLETED' : 'PENDING';

          return {
            id: cargo.id,
            name: cargo.title || `Cargo ${cargo.id.slice(0, 8)}`,
            type: cargo.cargoType || 'General',
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            amount: Number(cargo.loadValue) || 0,
            status: status,
            logo: cargo.title?.[0]?.toUpperCase() || 'C',
            statusColor: isCompleted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700',
            fullCargo: cargo,
          };
        });
    }

    return cargos
      .filter(c => c.status === 'CREATED' || c.status === 'DRAFT')
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 5)
      .map((cargo) => {
        const date = new Date(cargo.updatedAt || cargo.createdAt);
        const statusColors: Record<string, string> = {
          'DELIVERED': 'bg-green-100 text-green-700',
          'IN_TRANSIT': 'bg-blue-100 text-blue-700',
          'ASSIGNED': 'bg-purple-100 text-purple-700',
          'PUBLISHED': 'bg-yellow-100 text-yellow-700',
          'CREATED': 'bg-blue-100 text-blue-700',
          'DRAFT': 'bg-gray-100 text-gray-700',
        };
        return {
          id: cargo.id,
          name: cargo.title || `Cargo ${cargo.id.slice(0, 8)}`,
          type: cargo.cargoType || 'General',
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          amount: Number(cargo.loadValue) || 0,
          status: cargo.status || 'DRAFT',
          logo: cargo.title?.[0]?.toUpperCase() || 'C',
          statusColor: statusColors[cargo.status] || 'bg-gray-100 text-gray-700',
          fullCargo: cargo,
        };
      });
  }, [cargos, user]);

  // Handle cargo row click
  const handleCargoRowClick = (cargo: any) => {
    if (user?.role === 'CARGO_RECEIVER') {
      navigate(`/dashboard/cargos/my-cargos?view=${cargo.id}`);
      return;
    }

    if (cargo.status === 'DRAFT') {
      navigate(`/dashboard/cargos/create`, { state: { editCargo: cargo } });
    } else if (cargo.status === 'CREATED') {
      navigate(`/dashboard/cargos/list?view=${cargo.id}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6">
              <div className="animate-pulse">
                <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              <TranslatedText text="Dashboard Overview" />
            </h1>
            <p className="text-gray-600">
              <TranslatedText text="Real-time visibility across your logistics network" />
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/dashboard/cargos/create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <TranslatedText text="Create Cargo" />
            </button>
            <button
              onClick={() => navigate('/dashboard/analytics')}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              <TranslatedText text="Analytics" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                <TranslatedText text="Total Shipments" />
              </p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCargos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Truck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                <TranslatedText text="Active Shipments" />
              </p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeCargos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                <TranslatedText text="Delivery Rate" />
              </p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.onTimeDeliveryRate)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                <TranslatedText text="Total Value" />
              </p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          <TranslatedText text="Recent Activity" />
        </h2>
        {recentCargoActivity.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              <TranslatedText text="No recent cargo activity" />
            </p>
            <button
              onClick={() => navigate('/dashboard/cargos/create')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <TranslatedText text="Create Your First Cargo" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {recentCargoActivity.map((activity) => (
              <div
                key={activity.id}
                onClick={() => handleCargoRowClick(activity.fullCargo)}
                className="flex items-center justify-between py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 rounded-lg px-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">{activity.logo}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.name}</p>
                    <p className="text-sm text-gray-600">{activity.type} • {activity.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(activity.amount)}
                  </span>
                  <span className={`px-3 py-1 text-xs rounded-full ${activity.statusColor}`}>
                    <TranslatedText text={activity.status} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          <TranslatedText text="Quick Actions" />
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/dashboard/cargos/create')}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">
              <TranslatedText text="Create New Cargo" />
            </p>
          </button>
          
          <button
            onClick={() => navigate('/dashboard/analytics')}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <BarChart3 className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">
              <TranslatedText text="View Analytics" />
            </p>
          </button>
          
          <button
            onClick={() => navigate('/dashboard/cargos')}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <Truck className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">
              <TranslatedText text="Manage Cargos" />
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FixedDashboard;