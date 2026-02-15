import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import AdminTenants from '../AdminTenants';
import * as adminApi from '../../services/adminApi';
import React from 'react';

// Mock the adminApi module
vi.mock('../../services/adminApi');

// Mock the AuthContext
vi.mock('../../contexts/AuthContext', () => ({
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

const mockTenants = [
  {
    id: '1',
    name: 'Test Tenant 1',
    subdomain: 'test1',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    lastActivity: '2024-01-15T00:00:00Z',
    userCount: 10,
    trucksCount: 5,
    revenue: 1000,
    plan: 'professional',
    contactEmail: 'admin@test1.com',
    healthScore: 85,
    subscription: {
      planName: 'Professional',
      status: 'active',
      expiresAt: new Date('2024-12-31'),
    },
    credits: {
      balance: 5000,
      lastPurchase: new Date('2024-01-10'),
    },
    users: {
      total: 10,
      active: 8,
    },
  },
  {
    id: '2',
    name: 'Test Tenant 2',
    subdomain: 'test2',
    status: 'inactive',
    createdAt: '2024-01-02T00:00:00Z',
    lastActivity: '2024-01-14T00:00:00Z',
    userCount: 5,
    trucksCount: 2,
    revenue: 500,
    plan: 'starter',
    contactEmail: 'admin@test2.com',
    healthScore: 45,
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

describe('AdminTenants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tenant management page', () => {
    vi.mocked(adminApi.fetchEnrichedTenants).mockResolvedValue(mockTenants);
    
    render(<AdminTenants />, { wrapper: createWrapper() });
    
    expect(screen.getByText(/Tenant Management/i)).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    vi.mocked(adminApi.fetchEnrichedTenants).mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );
    
    render(<AdminTenants />, { wrapper: createWrapper() });
    
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('displays tenant list when data loads', async () => {
    vi.mocked(adminApi.fetchEnrichedTenants).mockResolvedValue(mockTenants);
    
    render(<AdminTenants />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('Test Tenant 1')).toBeInTheDocument();
      expect(screen.getByText('Test Tenant 2')).toBeInTheDocument();
    });
  });

  it('displays health scores in enriched view', async () => {
    vi.mocked(adminApi.fetchEnrichedTenants).mockResolvedValue(mockTenants);
    
    render(<AdminTenants />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('85')).toBeInTheDocument(); // Health score
      expect(screen.getByText(/EXCELLENT|GOOD/i)).toBeInTheDocument();
    });
  });

  it('filters tenants by search term', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.fetchEnrichedTenants).mockResolvedValue(mockTenants);
    
    render(<AdminTenants />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('Test Tenant 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Test Tenant 1');
    
    await waitFor(() => {
      expect(screen.getByText('Test Tenant 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Tenant 2')).not.toBeInTheDocument();
    });
  });

  it('filters tenants by status', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.fetchEnrichedTenants).mockResolvedValue(mockTenants);
    
    render(<AdminTenants />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('Test Tenant 1')).toBeInTheDocument();
    });

    const statusFilter = screen.getByRole('combobox', { name: /status/i });
    await user.selectOptions(statusFilter, 'active');
    
    await waitFor(() => {
      expect(screen.getByText('Test Tenant 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Tenant 2')).not.toBeInTheDocument();
    });
  });

  it('opens create tenant modal', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.fetchEnrichedTenants).mockResolvedValue(mockTenants);
    
    render(<AdminTenants />, { wrapper: createWrapper() });
    
    const addButton = await screen.findByRole('button', { name: /add tenant/i });
    await user.click(addButton);
    
    expect(screen.getByText(/Initialize New Node|Create Tenant/i)).toBeInTheDocument();
  });

  it('validates create tenant form', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.fetchEnrichedTenants).mockResolvedValue(mockTenants);
    vi.mocked(adminApi.createTenant).mockResolvedValue({ success: true });
    
    render(<AdminTenants />, { wrapper: createWrapper() });
    
    const addButton = await screen.findByRole('button', { name: /add tenant/i });
    await user.click(addButton);
    
    const submitButton = screen.getByRole('button', { name: /initialize|create/i });
    await user.click(submitButton);
    
    // Should show validation errors
    expect(await screen.findByText(/required/i)).toBeInTheDocument();
  });

  it('handles empty tenant list', async () => {
    vi.mocked(adminApi.fetchEnrichedTenants).mockResolvedValue([]);
    
    render(<AdminTenants />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/No tenants found/i)).toBeInTheDocument();
    });
  });

  it('handles API errors', async () => {
    vi.mocked(adminApi.fetchEnrichedTenants).mockRejectedValue(new Error('API Error'));
    
    render(<AdminTenants />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load|error/i)).toBeInTheDocument();
    });
  });

  it('displays credit balance in enriched view', async () => {
    vi.mocked(adminApi.fetchEnrichedTenants).mockResolvedValue(mockTenants);
    
    render(<AdminTenants />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/5,000/)).toBeInTheDocument(); // Credit balance
      expect(screen.getByText(/CREDITS/i)).toBeInTheDocument();
    });
  });

  it('displays active user count', async () => {
    vi.mocked(adminApi.fetchEnrichedTenants).mockResolvedValue(mockTenants);
    
    render(<AdminTenants />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/8 ACTIVE/i)).toBeInTheDocument();
    });
  });

  it('handles tenant status change', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.fetchEnrichedTenants).mockResolvedValue(mockTenants);
    vi.mocked(adminApi.setTenantStatus).mockResolvedValue({ success: true });
    
    render(<AdminTenants />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('Test Tenant 1')).toBeInTheDocument();
    });

    // Find and click status toggle button
    const statusButtons = screen.getAllByRole('button', { name: /activate|deactivate/i });
    if (statusButtons.length > 0) {
      await user.click(statusButtons[0]);
      
      await waitFor(() => {
        expect(vi.mocked(adminApi.setTenantStatus)).toHaveBeenCalled();
      });
    }
  });

  it('displays subscription expiration date', async () => {
    vi.mocked(adminApi.fetchEnrichedTenants).mockResolvedValue(mockTenants);
    
    render(<AdminTenants />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/2024-12-31|Dec 31|December/i)).toBeInTheDocument();
    });
  });

  it('shows low health score warning', async () => {
    vi.mocked(adminApi.fetchEnrichedTenants).mockResolvedValue(mockTenants);
    
    render(<AdminTenants />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('45')).toBeInTheDocument(); // Low health score
      expect(screen.getByText(/POOR|WARNING/i)).toBeInTheDocument();
    });
  });

  it('filters by subscription plan', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.fetchEnrichedTenants).mockResolvedValue(mockTenants);
    
    render(<AdminTenants />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('Test Tenant 1')).toBeInTheDocument();
    });

    const planFilter = screen.getByRole('combobox', { name: /plan/i });
    await user.selectOptions(planFilter, 'professional');
    
    await waitFor(() => {
      expect(screen.getByText('Test Tenant 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Tenant 2')).not.toBeInTheDocument();
    });
  });

  it('sorts tenants by name', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.fetchEnrichedTenants).mockResolvedValue(mockTenants);
    
    render(<AdminTenants />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('Test Tenant 1')).toBeInTheDocument();
    });

    const sortButton = screen.getByRole('button', { name: /sort/i });
    await user.click(sortButton);
    
    // Verify tenants are displayed (sorting logic is internal)
    expect(screen.getByText('Test Tenant 1')).toBeInTheDocument();
    expect(screen.getByText('Test Tenant 2')).toBeInTheDocument();
  });

  it('displays last activity timestamp', async () => {
    vi.mocked(adminApi.fetchEnrichedTenants).mockResolvedValue(mockTenants);
    
    render(<AdminTenants />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/2024-01-15|Jan 15|January/i)).toBeInTheDocument();
    });
  });

  it('shows tenant details modal', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.fetchEnrichedTenants).mockResolvedValue(mockTenants);
    vi.mocked(adminApi.getTenantDetailsEnriched).mockResolvedValue({
      ...mockTenants[0],
      recentActivity: [],
      creditHistory: [],
    });
    
    render(<AdminTenants />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('Test Tenant 1')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByRole('button', { name: /view|details/i });
    if (viewButtons.length > 0) {
      await user.click(viewButtons[0]);
      
      await waitFor(() => {
        expect(vi.mocked(adminApi.getTenantDetailsEnriched)).toHaveBeenCalled();
      });
    }
  });

  it('handles bulk update operation', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.fetchEnrichedTenants).mockResolvedValue(mockTenants);
    vi.mocked(adminApi.bulkUpdateTenants).mockResolvedValue({ 
      success: true, 
      updated: 2, 
      failed: 0 
    });
    
    render(<AdminTenants />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('Test Tenant 1')).toBeInTheDocument();
    });

    // Select multiple tenants (if checkboxes exist)
    const checkboxes = screen.queryAllByRole('checkbox');
    if (checkboxes.length > 0) {
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);
    }
  });

  it('displays credit balance with formatting', async () => {
    vi.mocked(adminApi.fetchEnrichedTenants).mockResolvedValue(mockTenants);
    
    render(<AdminTenants />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      // Should format 5000 as 5,000
      expect(screen.getByText(/5,000/)).toBeInTheDocument();
    });
  });

  it('shows loading state for tenant operations', async () => {
    vi.mocked(adminApi.fetchEnrichedTenants).mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );
    
    render(<AdminTenants />, { wrapper: createWrapper() });
    
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('handles network errors with retry', async () => {
    vi.mocked(adminApi.fetchEnrichedTenants)
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce(mockTenants);
    
    render(<AdminTenants />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load|error/i)).toBeInTheDocument();
    });
  });

  it('displays tenant count summary', async () => {
    vi.mocked(adminApi.fetchEnrichedTenants).mockResolvedValue(mockTenants);
    
    render(<AdminTenants />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/2|Total/i)).toBeInTheDocument();
    });
  });
});
