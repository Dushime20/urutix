import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { getRoleHomePath } from '../utils/resolveNotificationRoute';
import { useAuth } from '../contexts/AuthContext';

/**
 * Friendly landing page when a notification deep-link points at a missing,
 * archived, or inaccessible resource.
 */
const NotificationResourceUnavailablePage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();

  const modulePath = params.get('module') || getRoleHomePath(user?.role);
  const message =
    params.get('message') ||
    'This item is no longer available. The referenced record may have been deleted or archived.';

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-6 w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Item unavailable
        </h1>
        <p className="text-sm text-gray-600 mb-8 leading-relaxed">{message}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => navigate(modulePath)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Return to module
          </button>
          <button
            type="button"
            onClick={() => navigate(getRoleHomePath(user?.role))}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to home
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationResourceUnavailablePage;
