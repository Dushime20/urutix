import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Route, 
  Clock, 
  MapPin, 
  FileText, 
  Bell,
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const DriverDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTrips: 12,
    completedTrips: 8,
    pendingTrips: 2,
    totalHours: 156,
    totalDistance: 2840,
    rating: 4.8
  });

  const [recentTrips, setRecentTrips] = useState([
    {
      id: 1,
      origin: 'Los Angeles, CA',
      destination: 'San Francisco, CA',
      status: 'completed',
      date: '2024-01-15',
      distance: '380 miles',
      earnings: '$285'
    },
    {
      id: 2,
      origin: 'San Diego, CA',
      destination: 'Phoenix, AZ',
      status: 'in_progress',
      date: '2024-01-16',
      distance: '355 miles',
      earnings: '$320'
    },
    {
      id: 3,
      origin: 'Las Vegas, NV',
      destination: 'Salt Lake City, UT',
      status: 'pending',
      date: '2024-01-17',
      distance: '420 miles',
      earnings: '$380'
    }
  ]);

  const [upcomingTasks, setUpcomingTasks] = useState([
    {
      id: 1,
      type: 'Document Renewal',
      title: 'Driver License Expires Soon',
      dueDate: '2024-02-15',
      priority: 'high'
    },
    {
      id: 2,
      type: 'Training',
      title: 'Safety Training Required',
      dueDate: '2024-01-25',
      priority: 'medium'
    },
    {
      id: 3,
      type: 'Maintenance',
      title: 'Truck Inspection Due',
      dueDate: '2024-01-30',
      priority: 'medium'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Driver Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.firstName}! Here's your driving overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Route className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Trips</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTrips}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedTrips}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Hours</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalHours}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Distance</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDistance}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rating</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rating}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingTrips}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Trips and Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Trips */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Trips</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentTrips.map((trip) => (
                <div key={trip.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                        {trip.status.replace('_', ' ')}
                      </div>
                      <span className="text-sm text-gray-500">{trip.date}</span>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-900">
                        {trip.origin} → {trip.destination}
                      </p>
                      <p className="text-sm text-gray-600">{trip.distance}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{trip.earnings}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className="text-sm text-gray-500">{task.dueDate}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mt-1">{task.title}</p>
                    <p className="text-sm text-gray-600">{task.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <FileText className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-900">Documents</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <Route className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-900">View Trips</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <Bell className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-purple-900">Notifications</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
              <Truck className="w-8 h-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-orange-900">My Truck</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
