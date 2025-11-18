import React from 'react';
import { 
  MapPin, 
  Clock, 
  Truck, 
  MessageSquare, 
  Phone, 
  FileText,
  Navigation,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Settings,
  User,
  Shield,
  DollarSign
} from 'lucide-react';

interface QuickActionsProps {
  driverId: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ driverId }) => {
  const quickActions = [
    {
      id: 'start-trip',
      title: 'Start Trip',
      description: 'Begin a new trip',
      icon: Truck,
      color: 'bg-green-600 hover:bg-green-700',
      action: () => console.log('Start trip clicked')
    },
    {
      id: 'pause-trip',
      title: 'Pause Trip',
      description: 'Take a break',
      icon: Clock,
      color: 'bg-yellow-600 hover:bg-yellow-700',
      action: () => console.log('Pause trip clicked')
    },
    {
      id: 'complete-trip',
      title: 'Complete Trip',
      description: 'Finish current trip',
      icon: CheckCircle,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => console.log('Complete trip clicked')
    },
    {
      id: 'navigate',
      title: 'Navigate',
      description: 'Get directions',
      icon: Navigation,
      color: 'bg-purple-600 hover:bg-purple-700',
      action: () => console.log('Navigate clicked')
    },
    {
      id: 'report-issue',
      title: 'Report Issue',
      description: 'Report problems',
      icon: AlertTriangle,
      color: 'bg-red-600 hover:bg-red-700',
      action: () => console.log('Report issue clicked')
    },
    {
      id: 'contact-dispatch',
      title: 'Contact Dispatch',
      description: 'Call dispatch',
      icon: Phone,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      action: () => console.log('Contact dispatch clicked')
    },
    {
      id: 'send-message',
      title: 'Send Message',
      description: 'Message team',
      icon: MessageSquare,
      color: 'bg-pink-600 hover:bg-pink-700',
      action: () => console.log('Send message clicked')
    },
    {
      id: 'update-location',
      title: 'Update Location',
      description: 'Share current location',
      icon: MapPin,
      color: 'bg-teal-600 hover:bg-teal-700',
      action: () => console.log('Update location clicked')
    }
  ];

  const secondaryActions = [
    {
      id: 'view-schedule',
      title: 'View Schedule',
      description: 'Check upcoming trips',
      icon: Calendar,
      color: 'bg-gray-600 hover:bg-gray-700',
      action: () => console.log('View schedule clicked')
    },
    {
      id: 'view-earnings',
      title: 'View Earnings',
      description: 'Check pay information',
      icon: DollarSign,
      color: 'bg-green-600 hover:bg-green-700',
      action: () => console.log('View earnings clicked')
    },
    {
      id: 'view-safety',
      title: 'Safety Score',
      description: 'Check safety metrics',
      icon: Shield,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => console.log('View safety clicked')
    },
    {
      id: 'view-documents',
      title: 'Documents',
      description: 'Access certificates',
      icon: FileText,
      color: 'bg-purple-600 hover:bg-purple-700',
      action: () => console.log('View documents clicked')
    },
    {
      id: 'profile-settings',
      title: 'Profile',
      description: 'Update information',
      icon: User,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      action: () => console.log('Profile clicked')
    },
    {
      id: 'app-settings',
      title: 'Settings',
      description: 'App preferences',
      icon: Settings,
      color: 'bg-gray-600 hover:bg-gray-700',
      action: () => console.log('Settings clicked')
    }
  ];

  return (
    <div className="space-y-6">
      {/* Primary Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.action}
                className={`${action.color} text-white p-4 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-blue-500`}
              >
                <div className="text-center">
                  <Icon className="w-8 h-8 mx-auto mb-2" />
                  <h4 className="font-medium text-sm mb-1">{action.title}</h4>
                  <p className="text-xs opacity-90">{action.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Secondary Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {secondaryActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.action}
                className={`${action.color} text-white p-3 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-blue-500`}
              >
                <div className="text-center">
                  <Icon className="w-6 h-6 mx-auto mb-2" />
                  <h4 className="font-medium text-xs mb-1">{action.title}</h4>
                  <p className="text-xs opacity-90 leading-tight">{action.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Emergency Actions */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Emergency Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center space-x-2">
            <Phone className="w-5 h-5" />
            <span>Emergency Call</span>
          </button>
          <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Report Accident</span>
          </button>
          <button className="bg-red-700 hover:bg-red-800 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Safety Alert</span>
          </button>
        </div>
      </div>

      {/* Status Updates */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Status Updates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm">
            Available
          </button>
          <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium text-sm">
            On Break
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium text-sm">
            Off Duty
          </button>
          <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium text-sm">
            Maintenance
          </button>
        </div>
      </div>

      {/* Recent Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Actions</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>Trip started 2 hours ago</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>Location updated 15 minutes ago</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <MessageSquare className="w-4 h-4 text-gray-400" />
            <span>Message sent to dispatch 1 hour ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};
