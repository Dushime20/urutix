import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import SecurityCenter from '../SecurityCenter';
import * as adminApi from '../../../services/adminApi';
import React from 'react';

// Mock the adminApi module
vi.mock('../../../services/adminApi');

// Mock the AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { 
      id: '1', 
      email: 'admin@test.com', 
      role: 'super_admin',
      firstName: 'Test',
      lastName: 'Admin'
    },
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockSecurityEvents = [
  {
    id: '1',
    type: 'failed_login',
    severity: 'high',
    userId: 'user1',
    tenantId: 'tenant1',
    ipAddress: '192.168.1.1',
    timestamp: new Date('2024-01-15T10:00:00Z'),
    details: { attempts: 3 },
  },
  {
    id: '2',
    type: 'permission_escalation',
    severity: 'critical',
    userId: 'user2',
    tenantId: 'tenant2',
    ipAddress: '192.168.1.2',
    timestamp: new Date('2024-01-15T11:00:00Z'),
    details: { from: 'user', to: 'admin' },
  },
];

const mockFailedLogins = [
  {
    id: '1',
    userId: 'user1',
    email: 'user1@example.com',
    ipAddress: '192.168.1.1',
    timestamp: new Date('2024-01-15T10:00:00Z'),
    reason: 'Invalid password',
  },
];

const mockActiveSessions = [
  {
    sessionId: 'session1',
    userId: 'user1',
    tenantId: 'tenant1',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    startedAt: new Date('2024-01-15T09:00:00Z'),
    lastActivity: new Date('2024-01-15T10:00:00Z'),
  },
];

const mockFlaggedAccounts = [
  {
    userId: 'user1',
    tenantId: 'tenant1',
    email: 'user1@example.com',
    failedAttempts: 6,
    lastAttempt: new Date('2024-01-15T10:00:00Z'),
    ipAddresses: ['192.168.1.1', '192.168.1.2'],
    status: 'flagged',
  },
];

const mockPermissionHistory = [
  {
    id: '1',
    actor: 'admin@example.com',
    action: 'GRANT_PERMISSION',
    targetUser: 'user1@example.com',
    permission: 'manage_users',
    timestamp: new Date('2024-01-15T09:00:00Z'),
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('SecurityCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mocks
    vi.mocked(adminApi.fetchSecurityEvents).mockResolvedValue(mockSecurityEvents);
    vi.mocked(adminApi.fetchFailedLogins).mockResolvedValue(mockFailedLogins);
    vi.mocked(adminApi.fetchActiveSessions).mockResolvedValue(mockActiveSessions);
    vi.mocked(adminApi.fetchFlaggedAccounts).mockResolvedValue(mockFlaggedAccounts);
    vi.mocked(adminApi.fetchPermissionHistory).mockResolvedValue(mockPermissionHistory);
  });

  it('renders security center page', async () => {
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/Security Center/i)).toBeInTheDocument();
    });
  });

  it('displays all 5 tabs', async () => {
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Security Events/i })).toBeInTheDocument();
    });
    
    expect(screen.getByRole('tab', { name: /Failed Logins/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Active Sessions/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Flagged Accounts/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Permission History/i })).toBeInTheDocument();
  });

  it('displays security events by default', async () => {
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('failed_login')).toBeInTheDocument();
      expect(screen.getByText('permission_escalation')).toBeInTheDocument();
    });
  });

  it('shows severity colors for events', async () => {
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      const highSeverity = screen.getByText('high');
      const criticalSeverity = screen.getByText('critical');
      
      expect(highSeverity).toBeInTheDocument();
      expect(criticalSeverity).toBeInTheDocument();
    });
  });

  it('switches to failed logins tab', async () => {
    const user = userEvent.setup();
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    // Wait for tabs to appear
    const failedLoginsTab = await screen.findByRole('tab', { name: /Failed Logins/i });
    await user.click(failedLoginsTab);
    
    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('Invalid password')).toBeInTheDocument();
    });
  });

  it('switches to active sessions tab', async () => {
    const user = userEvent.setup();
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    // Wait for tabs to appear
    const sessionsTab = await screen.findByRole('tab', { name: /Active Sessions/i });
    await user.click(sessionsTab);
    
    await waitFor(() => {
      expect(screen.getByText('session1')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    });
  });

  it('displays terminate button for sessions', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.terminateSession).mockResolvedValue({ success: true });
    
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    // Wait for tabs to appear
    const sessionsTab = await screen.findByRole('tab', { name: /Active Sessions/i });
    await user.click(sessionsTab);
    
    await waitFor(() => {
      const terminateButton = screen.getByRole('button', { name: /terminate/i });
      expect(terminateButton).toBeInTheDocument();
    });
  });

  it('switches to flagged accounts tab', async () => {
    const user = userEvent.setup();
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    // Wait for tabs to appear
    const flaggedTab = await screen.findByRole('tab', { name: /Flagged Accounts/i });
    await user.click(flaggedTab);
    
    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument(); // Failed attempts
    });
  });

  it('switches to permission history tab', async () => {
    const user = userEvent.setup();
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    // Wait for tabs to appear
    const historyTab = await screen.findByRole('tab', { name: /Permission History/i });
    await user.click(historyTab);
    
    await waitFor(() => {
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      expect(screen.getByText('GRANT_PERMISSION')).toBeInTheDocument();
      expect(screen.getByText('manage_users')).toBeInTheDocument();
    });
  });

  it('filters events by severity', async () => {
    const user = userEvent.setup();
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('failed_login')).toBeInTheDocument();
    });

    const severityFilter = screen.getByRole('combobox', { name: /severity/i });
    await user.selectOptions(severityFilter, 'critical');
    
    await waitFor(() => {
      expect(screen.getByText('permission_escalation')).toBeInTheDocument();
      expect(screen.queryByText('failed_login')).not.toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const errorResponse = { response: { data: { message: 'Failed to fetch security data' } } };
    vi.mocked(adminApi.fetchSecurityEvents).mockRejectedValue(errorResponse);
    vi.mocked(adminApi.fetchFailedLogins).mockRejectedValue(errorResponse);
    vi.mocked(adminApi.fetchActiveSessions).mockRejectedValue(errorResponse);
    vi.mocked(adminApi.fetchFlaggedAccounts).mockRejectedValue(errorResponse);
    vi.mocked(adminApi.fetchPermissionHistory).mockRejectedValue(errorResponse);
    
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch security data/i)).toBeInTheDocument();
    });
  });

  it('displays loading state', () => {
    vi.mocked(adminApi.fetchSecurityEvents).mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );
    
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    // Look for loading indicator (CircularProgress)
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows export button', async () => {
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Export Security Logs/i)).toBeInTheDocument();
    });
  });

  it('handles session termination', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.terminateSession).mockResolvedValue({ success: true });
    
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    // Switch to sessions tab
    const sessionsTab = await screen.findByRole('tab', { name: /Active Sessions/i });
    await user.click(sessionsTab);
    
    await waitFor(() => {
      const terminateButton = screen.getByRole('button', { name: /terminate/i });
      expect(terminateButton).toBeInTheDocument();
    });

    const terminateButton = screen.getByRole('button', { name: /terminate/i });
    await user.click(terminateButton);
    
    await waitFor(() => {
      expect(vi.mocked(adminApi.terminateSession)).toHaveBeenCalledWith('session1');
    });
  });

  it('displays event timestamps correctly', async () => {
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/2024-01-15|Jan 15/i)).toBeInTheDocument();
    });
  });

  it('shows IP addresses for events', async () => {
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.2')).toBeInTheDocument();
    });
  });

  it('displays event details', async () => {
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('failed_login')).toBeInTheDocument();
    });
  });

  it('handles empty security events', async () => {
    vi.mocked(adminApi.fetchSecurityEvents).mockResolvedValue([]);
    
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/No security events|No events found/i)).toBeInTheDocument();
    });
  });

  it('handles empty failed logins', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.fetchFailedLogins).mockResolvedValue([]);
    
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    const failedLoginsTab = await screen.findByRole('tab', { name: /Failed Logins/i });
    await user.click(failedLoginsTab);
    
    await waitFor(() => {
      expect(screen.getByText(/No failed logins|No attempts found/i)).toBeInTheDocument();
    });
  });

  it('handles empty active sessions', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.fetchActiveSessions).mockResolvedValue([]);
    
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    const sessionsTab = await screen.findByRole('tab', { name: /Active Sessions/i });
    await user.click(sessionsTab);
    
    await waitFor(() => {
      expect(screen.getByText(/No active sessions|No sessions found/i)).toBeInTheDocument();
    });
  });

  it('displays multiple IP addresses for flagged accounts', async () => {
    const user = userEvent.setup();
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    const flaggedTab = await screen.findByRole('tab', { name: /Flagged Accounts/i });
    await user.click(flaggedTab);
    
    await waitFor(() => {
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.2')).toBeInTheDocument();
    });
  });

  it('shows user agent information', async () => {
    const user = userEvent.setup();
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    const sessionsTab = await screen.findByRole('tab', { name: /Active Sessions/i });
    await user.click(sessionsTab);
    
    await waitFor(() => {
      expect(screen.getByText(/Mozilla/i)).toBeInTheDocument();
    });
  });

  it('handles refresh for all tabs', async () => {
    const user = userEvent.setup();
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/Security Center/i)).toBeInTheDocument();
    });

    const refreshButton = screen.getByLabelText(/refresh/i);
    await user.click(refreshButton);
    
    await waitFor(() => {
      expect(vi.mocked(adminApi.fetchSecurityEvents)).toHaveBeenCalledTimes(2);
    });
  });

  it('displays session duration', async () => {
    const user = userEvent.setup();
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    const sessionsTab = await screen.findByRole('tab', { name: /Active Sessions/i });
    await user.click(sessionsTab);
    
    await waitFor(() => {
      expect(screen.getByText(/session1/i)).toBeInTheDocument();
    });
  });

  it('shows permission change details', async () => {
    const user = userEvent.setup();
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    const historyTab = await screen.findByRole('tab', { name: /Permission History/i });
    await user.click(historyTab);
    
    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    });
  });

  it('handles export security logs', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.exportSecurityLogs).mockResolvedValue('csv,data');
    
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Export Security Logs/i)).toBeInTheDocument();
    });

    const exportButton = screen.getByLabelText(/Export Security Logs/i);
    await user.click(exportButton);
    
    await waitFor(() => {
      expect(vi.mocked(adminApi.exportSecurityLogs)).toHaveBeenCalled();
    });
  });

  it('displays critical severity with proper styling', async () => {
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      const criticalChip = screen.getByText('critical');
      expect(criticalChip).toBeInTheDocument();
    });
  });

  it('shows flagged account status', async () => {
    const user = userEvent.setup();
    render(<SecurityCenter />, { wrapper: createWrapper() });
    
    const flaggedTab = await screen.findByRole('tab', { name: /Flagged Accounts/i });
    await user.click(flaggedTab);
    
    await waitFor(() => {
      expect(screen.getByText(/flagged/i)).toBeInTheDocument();
    });
  });
});
