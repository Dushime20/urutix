import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import SystemHealthDashboard from '../SystemHealthDashboard';
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

const mockMetrics = {
  timestamp: new Date().toISOString(),
  database: {
    connectionCount: 10,
    activeQueries: 5,
    avgQueryTime: 25,
    slowQueries: 0,
    diskUsage: 45.5,
  },
  api: {
    requestsPerMinute: 150,
    avgResponseTime: 120,
    errorRate: 0.5,
    p95ResponseTime: 200,
    p99ResponseTime: 350,
  },
  server: {
    cpuUsage: 35.2,
    memoryUsage: 62.8,
    diskUsage: 48.3,
    networkIn: 1024,
    networkOut: 2048,
  },
};

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

describe('SystemHealthDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock all API calls with default successful responses
    vi.mocked(adminApi.fetchCurrentSystemHealth).mockResolvedValue(mockMetrics);
    vi.mocked(adminApi.fetchHistoricalSystemHealth).mockResolvedValue([]);
    vi.mocked(adminApi.exportSystemHealthMetrics).mockResolvedValue('csv,data');
  });

  it('renders dashboard title', async () => {
    render(<SystemHealthDashboard />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/System Health/i)).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    vi.mocked(adminApi.fetchCurrentSystemHealth).mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );
    
    render(<SystemHealthDashboard />, { wrapper: createWrapper() });
    
    // Look for loading indicator (CircularProgress)
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays system metrics when data loads', async () => {
    render(<SystemHealthDashboard />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/35.2/)).toBeInTheDocument(); // CPU usage
      expect(screen.getByText(/62.8/)).toBeInTheDocument(); // Memory usage
    });
  });

  it('shows threshold violations with warning colors', async () => {
    const highUsageMetrics = {
      ...mockMetrics,
      server: {
        ...mockMetrics.server,
        cpuUsage: 95.0, // High CPU should trigger warning
      },
    };
    
    vi.mocked(adminApi.fetchCurrentSystemHealth).mockResolvedValue(highUsageMetrics);
    
    render(<SystemHealthDashboard />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/95.0/)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(adminApi.fetchCurrentSystemHealth).mockRejectedValue(new Error('API Error'));
    
    render(<SystemHealthDashboard />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/API Error/i)).toBeInTheDocument();
    });
  });

  it('displays database metrics correctly', async () => {
    render(<SystemHealthDashboard />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/10/)).toBeInTheDocument(); // Connection count
      expect(screen.getByText(/25/)).toBeInTheDocument(); // Avg query time
    });
  });

  it('displays API metrics correctly', async () => {
    render(<SystemHealthDashboard />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/150/)).toBeInTheDocument(); // Requests per minute
      expect(screen.getByText(/0.5/)).toBeInTheDocument(); // Error rate
    });
  });

  it('handles refresh button click', async () => {
    const user = userEvent.setup();
    render(<SystemHealthDashboard />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/System Health/i)).toBeInTheDocument();
    });

    const refreshButton = screen.getByLabelText(/refresh/i);
    await user.click(refreshButton);
    
    // Should call API again
    await waitFor(() => {
      expect(vi.mocked(adminApi.fetchCurrentSystemHealth)).toHaveBeenCalledTimes(2);
    });
  });

  it('displays multiple threshold violations', async () => {
    const multipleViolations = {
      ...mockMetrics,
      server: {
        ...mockMetrics.server,
        cpuUsage: 95.0,
        memoryUsage: 92.0,
      },
    };
    
    vi.mocked(adminApi.fetchCurrentSystemHealth).mockResolvedValue(multipleViolations);
    
    render(<SystemHealthDashboard />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/95.0/)).toBeInTheDocument();
      expect(screen.getByText(/92.0/)).toBeInTheDocument();
    });
  });

  it('shows zero values correctly', async () => {
    const zeroMetrics = {
      ...mockMetrics,
      database: {
        ...mockMetrics.database,
        slowQueries: 0,
      },
      api: {
        ...mockMetrics.api,
        errorRate: 0,
      },
    };
    
    vi.mocked(adminApi.fetchCurrentSystemHealth).mockResolvedValue(zeroMetrics);
    
    render(<SystemHealthDashboard />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/0/)).toBeInTheDocument();
    });
  });

  it('displays network metrics', async () => {
    render(<SystemHealthDashboard />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/1024/)).toBeInTheDocument(); // Network in
      expect(screen.getByText(/2048/)).toBeInTheDocument(); // Network out
    });
  });

  it('handles empty historical data', async () => {
    vi.mocked(adminApi.fetchHistoricalSystemHealth).mockResolvedValue([]);
    
    render(<SystemHealthDashboard />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/System Health/i)).toBeInTheDocument();
    });
  });

  it('displays timestamp of last update', async () => {
    render(<SystemHealthDashboard />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/Last updated/i)).toBeInTheDocument();
    });
  });

  it('shows correct severity indicators', async () => {
    const criticalMetrics = {
      ...mockMetrics,
      server: {
        ...mockMetrics.server,
        cpuUsage: 98.0, // Critical threshold
      },
    };
    
    vi.mocked(adminApi.fetchCurrentSystemHealth).mockResolvedValue(criticalMetrics);
    
    render(<SystemHealthDashboard />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/98.0/)).toBeInTheDocument();
    });
  });

  it('handles partial metric data', async () => {
    const partialMetrics = {
      timestamp: new Date().toISOString(),
      database: mockMetrics.database,
      api: mockMetrics.api,
      server: {
        cpuUsage: 35.2,
        memoryUsage: 62.8,
        diskUsage: 48.3,
        networkIn: 0,
        networkOut: 0,
      },
    };
    
    vi.mocked(adminApi.fetchCurrentSystemHealth).mockResolvedValue(partialMetrics);
    
    render(<SystemHealthDashboard />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/35.2/)).toBeInTheDocument();
    });
  });
});
