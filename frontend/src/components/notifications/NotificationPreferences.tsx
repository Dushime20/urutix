import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import {
  FaBell,
  FaEnvelope,
  FaSms,
  FaMobile,
  FaDesktop,
  FaSave,
  FaCheck,
  FaTimes,
  FaCog,
} from 'react-icons/fa';

interface NotificationPreference {
  id?: string;
  notificationType: string;
  enabledChannels: string[];
  isEnabled: boolean;
  emailAddress?: string;
  phoneNumber?: string;
  settings?: {
    frequency?: 'IMMEDIATE' | 'HOURLY' | 'DAILY' | 'WEEKLY';
    threshold?: number;
    quietHours?: {
      start: string;
      end: string;
      timezone: string;
    };
  };
}

const NotificationPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();

  // Fetch current preferences
  const { data: preferencesData, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await api.get('/notification-preferences');
      return response.data.data;
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: NotificationPreference[]) => {
      const response = await api.post('/notification-preferences', { preferences });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      setHasChanges(false);
    },
  });

  // Initialize preferences when data loads
  useEffect(() => {
    if (preferencesData) {
      setPreferences(preferencesData);
    }
  }, [preferencesData]);

  const notificationTypes = [
    {
      type: 'LOW_BALANCE',
      label: 'Low Credit Balance',
      description: 'Alerts when your credit balance is running low',
      icon: <FaBell className="text-yellow-500" />,
    },
    {
      type: 'SUBSCRIPTION_EXPIRING',
      label: 'Subscription Expiring',
      description: 'Reminders when your subscription is about to expire',
      icon: <FaCog className="text-blue-500" />,
    },
    {
      type: 'TRIAL_EXPIRING',
      label: 'Trial Expiring',
      description: 'Notifications when your trial period is ending',
      icon: <FaCog className="text-purple-500" />,
    },
    {
      type: 'PAYMENT_FAILED',
      label: 'Payment Failed',
      description: 'Alerts when payment processing fails',
      icon: <FaTimes className="text-red-500" />,
    },
    {
      type: 'CREDITS_EXPIRED',
      label: 'Credits Expired',
      description: 'Notifications when credits expire',
      icon: <FaBell className="text-orange-500" />,
    },
    {
      type: 'USAGE_THRESHOLD',
      label: 'Usage Threshold',
      description: 'Alerts when usage exceeds defined thresholds',
      icon: <FaBell className="text-green-500" />,
    },
  ];

  const channels = [
    { key: 'EMAIL', label: 'Email', icon: <FaEnvelope /> },
    { key: 'SMS', label: 'SMS', icon: <FaSms /> },
    { key: 'PUSH', label: 'Push', icon: <FaMobile /> },
    { key: 'IN_APP', label: 'In-App', icon: <FaDesktop /> },
  ];

  const handleToggleNotification = (type: string, enabled: boolean) => {
    const updated = preferences.map(pref =>
      pref.notificationType === type ? { ...pref, isEnabled: enabled } : pref
    );
    
    // If preference doesn't exist, create it
    if (!preferences.find(p => p.notificationType === type)) {
      updated.push({
        notificationType: type,
        enabledChannels: ['EMAIL', 'IN_APP'],
        isEnabled: enabled,
        settings: { frequency: 'IMMEDIATE' },
      });
    }
    
    setPreferences(updated);
    setHasChanges(true);
  };

  const handleToggleChannel = (type: string, channel: string, enabled: boolean) => {
    const updated = preferences.map(pref => {
      if (pref.notificationType === type) {
        const channels = enabled
          ? [...pref.enabledChannels, channel]
          : pref.enabledChannels.filter(c => c !== channel);
        return { ...pref, enabledChannels: channels };
      }
      return pref;
    });
    
    setPreferences(updated);
    setHasChanges(true);
  };

  const handleFrequencyChange = (type: string, frequency: string) => {
    const updated = preferences.map(pref =>
      pref.notificationType === type
        ? { ...pref, settings: { ...pref.settings, frequency: frequency as any } }
        : pref
    );
    
    setPreferences(updated);
    setHasChanges(true);
  };

  const handleSave = () => {
    updatePreferencesMutation.mutate(preferences);
  };

  const getPreference = (type: string): NotificationPreference => {
    return preferences.find(p => p.notificationType === type) || {
      notificationType: type,
      enabledChannels: ['EMAIL', 'IN_APP'],
      isEnabled: true,
      settings: { frequency: 'IMMEDIATE' },
    };
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaBell className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
          </div>
          
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={updatePreferencesMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <FaSave />
              {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {notificationTypes.map(notifType => {
          const pref = getPreference(notifType.type);
          
          return (
            <div key={notifType.type} className="border border-gray-200 rounded-lg p-4">
              {/* Notification Type Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">{notifType.icon}</div>
                  <div>
                    <h4 className="font-medium text-gray-900">{notifType.label}</h4>
                    <p className="text-sm text-gray-600">{notifType.description}</p>
                  </div>
                </div>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={pref.isEnabled}
                    onChange={(e) => handleToggleNotification(notifType.type, e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    pref.isEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      pref.isEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </div>
                </label>
              </div>

              {/* Channels and Settings */}
              {pref.isEnabled && (
                <div className="space-y-4">
                  {/* Channels */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Channels
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {channels.map(channel => (
                        <label key={channel.key} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={pref.enabledChannels.includes(channel.key)}
                            onChange={(e) => handleToggleChannel(notifType.type, channel.key, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="flex items-center gap-1 text-sm text-gray-700">
                            {channel.icon}
                            {channel.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Frequency */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequency
                    </label>
                    <select
                      value={pref.settings?.frequency || 'IMMEDIATE'}
                      onChange={(e) => handleFrequencyChange(notifType.type, e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="IMMEDIATE">Immediate</option>
                      <option value="HOURLY">Hourly</option>
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Success Message */}
      {updatePreferencesMutation.isSuccess && (
        <div className="px-6 py-3 bg-green-50 border-t border-green-200">
          <div className="flex items-center gap-2 text-green-800">
            <FaCheck />
            <span className="text-sm">Notification preferences saved successfully!</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {updatePreferencesMutation.isError && (
        <div className="px-6 py-3 bg-red-50 border-t border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <FaTimes />
            <span className="text-sm">Failed to save preferences. Please try again.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPreferences;