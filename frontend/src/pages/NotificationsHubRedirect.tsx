import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getNotificationsHubPath } from '../utils/resolveNotificationRoute';

/** Redirect bare `/notifications` bookmarks to the role-correct hub. */
const NotificationsHubRedirect: React.FC = () => {
  const { user } = useAuth();
  return <Navigate to={getNotificationsHubPath(user?.role)} replace />;
};

export default NotificationsHubRedirect;
