import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import CargoDashboard from './pages/CargoDashboard';
import FleetDashboard from './pages/FleetDashboard';
import FleetSafety from './pages/FleetSafety';
import TruckBidsPage from './pages/TruckBidsPage';
import MyBidsPage from './pages/MyBidsPage';
import DriversListPage from './pages/DriversListPage';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Analytics from './pages/Analytics';
import FleetAnalytics from './pages/FleetAnalytics';
import CargoList from './pages/dashboard/cargos/list';
import EnhancedJourneyFlow from './components/CargoOwnerJourney/EnhancedJourneyFlow';
import EnhancedCargoDemo from './pages/EnhancedCargoDemo';
import CargoOwnerLayout from './components/Layout/CargoOwnerLayout';
import FleetOwnerLayout from './components/Layout/FleetOwnerLayout';
import DriverLayout from './components/Layout/DriverLayout';
import AdminLayout from './components/Layout/AdminLayout';
import Auth from './pages/Auth';
import Home from './pages/Home';
import TrucksListPage from './pages/TrucksListPage';
import TruckRecordsPage from './pages/TruckRecordsPage';
import UnifiedFleetManagement from './pages/UnifiedFleetManagement';
import UnifiedDriverManagement from './pages/UnifiedDriverManagement';
import FleetPaymentManagement from './pages/FleetPaymentManagement';
import FleetHelpSupport from './pages/FleetHelpSupport';
import CargoHelpSupport from './pages/CargoHelpSupport';
import RoutesPage from './pages/Routes';
import AdminUsers from './pages/AdminUsers';
import AdminTrucks from './pages/AdminTrucks';
import AdminLoads from './pages/AdminLoads';
import AdminTrips from './pages/AdminTrips';
import AdminTenants from './pages/AdminTenants';
import AdminRoutes from './pages/AdminRoutes';
import MonitoringDashboard from './pages/admin/MonitoringDashboard';
import BiddingManagement from './pages/admin/BiddingManagement';
import DisputeManagement from './pages/admin/DisputeManagement';
import FinancialAdminDashboard from './pages/admin/FinancialAdminDashboard';
import TenantDashboardPage from './pages/TenantDashboard';
import TenantAdminLayout from './components/Layout/TenantAdminLayout';
import TenantFleetManagement from './components/TenantAdmin/TenantFleetManagement';
import TenantCargoOperations from './components/TenantAdmin/TenantCargoOperations';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import LenderPolicySettingsPage from './pages/LenderPolicySettingsPage';
import AdminLenderRegistrationPage from './pages/AdminLenderRegistrationPage';
import AdminBorrowersPage from './pages/AdminBorrowersPage';

// Enhanced Transaction Flow Components
import BookingConfirmation from './pages/BookingConfirmation';
import TripManagement from './pages/TripManagement';
import PaymentProcessing from './pages/PaymentProcessing';
import TransactionFlow from './pages/TransactionFlow';
import MatchResults from './pages/MatchResults';
import ContractNegotiation from './pages/ContractNegotiation';
import EscrowManagement from './pages/EscrowManagement';
import DisputeResolution from './pages/DisputeResolution';
import TripTracking from './pages/TripTracking';
import DeliveryConfirmation from './pages/DeliveryConfirmation';
import SettlementProcessing from './pages/SettlementProcessing';
import LenderDashboardPage from './pages/LenderDashboardPage';
import LenderLayout from './components/Layout/LenderLayout';
import EnhancedLoanRequestsPage from './pages/EnhancedLoanRequestsPage';
import UnifiedFinancialManagement from './pages/dashboard/financial';
import UnifiedDocumentManagement from './pages/dashboard/documents';
import DocumentsPage from './pages/DocumentsPage';
import UnifiedNotificationManagement from './pages/dashboard/notifications';
import UnifiedReputationManagement from './pages/dashboard/reputation';
import UnifiedAccountManagement from './pages/dashboard/account';
import UnifiedAnalyticsManagement from './pages/dashboard/analytics';
import UnifiedTrackingManagement from './pages/dashboard/tracking';
import ActiveLoansPage from './pages/ActiveLoansPage';
import DisbursementsPage from './pages/DisbursementsPage';
import RepaymentsPage from './pages/RepaymentsPage';
import PortfolioAnalyticsPage from './pages/PortfolioAnalyticsPage';
import RiskAnalysisPage from './pages/RiskAnalysisPage';
import InterestTrackingPage from './pages/InterestTrackingPage';
import FinancialReportsPage from './pages/FinancialReportsPage';
import BorrowersManagementPage from './pages/BorrowersManagementPage';
import LendingPoliciesPage from './pages/LendingPoliciesPage';
import CreditAssessmentPage from './pages/CreditAssessmentPage';
import TransactionsHistoryPage from './pages/TransactionsHistoryPage';
import LenderProfilePage from './pages/LenderProfilePage';
import LenderNotificationsPage from './pages/LenderNotificationsPage';
import LenderSupportPage from './pages/LenderSupportPage';
import LenderTeamManagementPage from './pages/LenderTeamManagementPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Cargo Owner Routes */}
            <Route path="/dashboard" element={<CargoOwnerLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="cargos" element={<CargoDashboard />} />
              <Route path="cargos/create" element={<CargoList />} />
              <Route path="cargos/list" element={<CargoList />} />
              <Route path="cargos/active" element={<CargoList />} />
              <Route path="cargos/enhanced-demo" element={<EnhancedCargoDemo />} />
              <Route path="cargos/enhanced-demo/:cargoId" element={<EnhancedCargoDemo />} />
              <Route path="bidding" element={<CargoList />} />
              <Route path="my-bids" element={<MyBidsPage />} />
              <Route path="journey" element={<EnhancedJourneyFlow />} />
              <Route path="tenant-dashboard" element={<TenantDashboardPage />} />
              <Route path="analytics" element={<UnifiedAnalyticsManagement />} />
              <Route path="reports" element={<UnifiedAnalyticsManagement />} />
              <Route path="history" element={<UnifiedAnalyticsManagement />} />
              <Route path="tracking" element={<UnifiedTrackingManagement />} />
              <Route path="routes" element={<UnifiedTrackingManagement />} />
              <Route path="profile" element={<UnifiedAccountManagement />} />
              <Route path="settings" element={<UnifiedAccountManagement />} />
              <Route path="payments" element={<UnifiedFinancialManagement />} />
              <Route path="loan-requests" element={<UnifiedFinancialManagement />} />
              <Route path="documents" element={<UnifiedDocumentManagement />} />
              <Route path="documents/:entityType" element={<UnifiedDocumentManagement />} />
              <Route path="notification-center" element={<UnifiedNotificationManagement />} />
              <Route path="notifications" element={<UnifiedNotificationManagement />} />
              <Route path="support" element={<CargoHelpSupport />} />
              <Route path="ratings" element={<UnifiedReputationManagement />} />
              <Route path="rewards" element={<UnifiedReputationManagement />} />
              <Route path="scoring" element={<UnifiedReputationManagement />} />
              
              {/* Enhanced Transaction Flow Routes */}
              <Route path="transaction-flow" element={<TransactionFlow />} />
              <Route path="match-results" element={<MatchResults />} />
              <Route path="booking-confirmation/:matchId" element={<BookingConfirmation />} />
              <Route path="contract-negotiation/:bookingId" element={<ContractNegotiation />} />
              <Route path="payment-processing/:bookingId" element={<PaymentProcessing />} />
              <Route path="escrow-management/:bookingId" element={<EscrowManagement />} />
              <Route path="trip-tracking/:tripId" element={<TripTracking />} />
              <Route path="delivery-confirmation/:tripId" element={<DeliveryConfirmation />} />
              <Route path="settlement-processing/:tripId" element={<SettlementProcessing />} />
              <Route path="dispute-resolution/:tripId" element={<DisputeResolution />} />
            </Route>

            {/* Cargo Owner Routes (alias for /dashboard) */}
            <Route path="/cargo-owner" element={<CargoOwnerLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="cargos" element={<CargoDashboard />} />
              <Route path="cargos/create" element={<CargoList />} />
              <Route path="cargos/list" element={<CargoList />} />
              <Route path="cargos/active" element={<CargoList />} />
              <Route path="cargos/enhanced-demo" element={<EnhancedCargoDemo />} />
              <Route path="cargos/enhanced-demo/:cargoId" element={<EnhancedCargoDemo />} />
              <Route path="bidding" element={<CargoList />} />
              <Route path="my-bids" element={<MyBidsPage />} />
              <Route path="journey" element={<EnhancedJourneyFlow />} />
              <Route path="tenant-dashboard" element={<TenantDashboardPage />} />
              <Route path="analytics" element={<UnifiedAnalyticsManagement />} />
              <Route path="reports" element={<UnifiedAnalyticsManagement />} />
              <Route path="history" element={<UnifiedAnalyticsManagement />} />
              <Route path="tracking" element={<UnifiedTrackingManagement />} />
              <Route path="routes" element={<UnifiedTrackingManagement />} />
              <Route path="profile" element={<UnifiedAccountManagement />} />
              <Route path="settings" element={<UnifiedAccountManagement />} />
              <Route path="payments" element={<UnifiedFinancialManagement />} />
              <Route path="loan-requests" element={<UnifiedFinancialManagement />} />
              <Route path="documents" element={<UnifiedDocumentManagement />} />
              <Route path="documents/:entityType" element={<UnifiedDocumentManagement />} />
              <Route path="notification-center" element={<UnifiedNotificationManagement />} />
              <Route path="notifications" element={<UnifiedNotificationManagement />} />
              <Route path="support" element={<CargoHelpSupport />} />
              <Route path="ratings" element={<UnifiedReputationManagement />} />
              <Route path="rewards" element={<UnifiedReputationManagement />} />
              <Route path="scoring" element={<UnifiedReputationManagement />} />
              
              {/* Enhanced Transaction Flow Routes */}
              <Route path="transaction-flow" element={<TransactionFlow />} />
              <Route path="match-results" element={<MatchResults />} />
              <Route path="booking-confirmation/:matchId" element={<BookingConfirmation />} />
              <Route path="contract-negotiation/:bookingId" element={<ContractNegotiation />} />
              <Route path="payment-processing/:bookingId" element={<PaymentProcessing />} />
              <Route path="escrow-management/:bookingId" element={<EscrowManagement />} />
              <Route path="trip-tracking/:tripId" element={<TripTracking />} />
              <Route path="delivery-confirmation/:tripId" element={<DeliveryConfirmation />} />
              <Route path="settlement-processing/:tripId" element={<SettlementProcessing />} />
              <Route path="dispute-resolution/:tripId" element={<DisputeResolution />} />
            </Route>

            {/* Fleet Owner Routes */}
            <Route path="/fleet" element={<FleetOwnerLayout />}>
              <Route index element={<FleetDashboard />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="tenant-dashboard" element={<TenantDashboardPage />} />
            </Route>

            {/* Fleet Dashboard Routes (under dashboard path) */}
            <Route path="/dashboard/fleet" element={<FleetOwnerLayout />}>
              <Route index element={<FleetDashboard />} />
              <Route path="analytics" element={<FleetAnalytics />} />
              <Route path="trucks" element={<UnifiedFleetManagement />} />
              <Route path="trucks/create" element={<UnifiedFleetManagement />} />
              <Route path="trucks/:truckId/records" element={<TruckRecordsPage />} />
              <Route path="trips" element={<UnifiedFleetManagement />} />
              <Route path="bids" element={<TruckBidsPage />} />
              <Route path="drivers" element={<UnifiedDriverManagement />} />
              <Route path="drivers/create" element={<UnifiedDriverManagement />} />
              <Route path="assignments" element={<UnifiedDriverManagement />} />
              <Route path="maintenance" element={<FleetDashboard />} />
              <Route path="payments" element={<FleetPaymentManagement />} />
              <Route path="revenue" element={<FleetAnalytics />} />
              <Route path="reports" element={<FleetAnalytics />} />
              <Route path="history" element={<FleetAnalytics />} />
              <Route path="routes" element={<RoutesPage />} />
              <Route path="tenant-dashboard" element={<TenantDashboardPage />} />
              <Route path="profile" element={<FleetDashboard />} />
              <Route path="settings" element={<FleetDashboard />} />
              <Route path="notifications" element={<FleetDashboard />} />
              <Route path="support" element={<FleetHelpSupport />} />
              <Route path="ratings" element={<UnifiedDriverManagement />} />
              <Route path="rewards" element={<UnifiedDriverManagement />} />
              <Route path="scoring" element={<UnifiedDriverManagement />} />
              <Route path="safety" element={<FleetSafety />} />
              <Route path="financial" element={<FleetDashboard />} />
              <Route path="insurance" element={<FleetDashboard />} />
              
              {/* Fleet Transaction Flow Routes */}
              <Route path="available-loads" element={<MatchResults />} />
              <Route path="booking-requests" element={<BookingConfirmation />} />
              <Route path="contract-negotiation/:bookingId" element={<ContractNegotiation />} />
              <Route path="payment-processing/:bookingId" element={<PaymentProcessing />} />
              <Route path="escrow-management/:bookingId" element={<EscrowManagement />} />
              <Route path="trip-tracking/:tripId" element={<TripTracking />} />
              <Route path="delivery-confirmation/:tripId" element={<DeliveryConfirmation />} />
              <Route path="settlement-processing/:tripId" element={<SettlementProcessing />} />
              <Route path="dispute-resolution/:tripId" element={<DisputeResolution />} />
            </Route>

            {/* Driver Routes */}
            <Route path="/dashboard/driver" element={<DriverLayout />}>
              <Route index element={<DriverDashboard />} />
              <Route path="trips" element={<DriverDashboard />} />
              <Route path="truck" element={<DriverDashboard />} />
              <Route path="cargo" element={<DriverDashboard />} />
              <Route path="earnings" element={<DriverDashboard />} />
              <Route path="safety" element={<DriverDashboard />} />
              <Route path="documents" element={<DriverDashboard />} />
              <Route path="tracking" element={<DriverDashboard />} />
              <Route path="analytics" element={<DriverDashboard />} />
              <Route path="notifications" element={<DriverDashboard />} />
              <Route path="profile" element={<DriverDashboard />} />
              <Route path="settings" element={<DriverDashboard />} />
              <Route path="support" element={<DriverDashboard />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="lenders/register" element={<AdminLenderRegistrationPage />} />
              <Route path="lenders" element={<Navigate to="lenders/register" replace />} />
              <Route path="borrowers" element={<AdminBorrowersPage />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="monitoring" element={<MonitoringDashboard />} />
              <Route path="bidding" element={<BiddingManagement />} />
              <Route path="disputes" element={<DisputeManagement />} />
              <Route path="financial" element={<FinancialAdminDashboard />} />
              <Route path="transaction-monitoring" element={<TransactionFlow />} />
              <Route path="dispute-management" element={<DisputeResolution />} />
              <Route path="escrow-management" element={<EscrowManagement />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="trucks" element={<AdminTrucks />} />
              <Route path="loads" element={<AdminLoads />} />
              <Route path="trips" element={<AdminTrips />} />
              <Route path="tenants" element={<AdminTenants />} />
              <Route path="routes" element={<AdminRoutes />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Tenant Admin Routes */}
            <Route path="/tenant-admin" element={<TenantAdminLayout />}>
              <Route index element={<TenantDashboardPage />} />
              <Route path="fleet" element={<TenantFleetManagement />} />
              <Route path="cargo" element={<TenantCargoOperations />} />
              <Route path="drivers" element={<TenantDashboardPage />} />
              <Route path="routes" element={<TenantDashboardPage />} />
              <Route path="trips" element={<TenantDashboardPage />} />
              <Route path="financial" element={<TenantDashboardPage />} />
              <Route path="analytics" element={<TenantDashboardPage />} />
              <Route path="reports" element={<TenantDashboardPage />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Lender Routes */}
            <Route path="/lender" element={<LenderLayout />}>
              <Route index element={<LenderDashboardPage />} />
              <Route path="requests" element={<EnhancedLoanRequestsPage />} />
              <Route path="policy" element={<LenderPolicySettingsPage />} />
              <Route path="active" element={<ActiveLoansPage />} />
              <Route path="disbursements" element={<DisbursementsPage />} />
              <Route path="repayments" element={<RepaymentsPage />} />
              <Route path="analytics" element={<PortfolioAnalyticsPage />} />
              <Route path="risk" element={<RiskAnalysisPage />} />
              <Route path="interest" element={<InterestTrackingPage />} />
              <Route path="reports" element={<FinancialReportsPage />} />
              <Route path="borrowers" element={<BorrowersManagementPage />} />
              <Route path="policies" element={<LendingPoliciesPage />} />
              <Route path="credit" element={<CreditAssessmentPage />} />
              <Route path="history" element={<TransactionsHistoryPage />} />
              <Route path="profile" element={<LenderProfilePage />} />
              <Route path="notifications" element={<LenderNotificationsPage />} />
              <Route path="team" element={<LenderTeamManagementPage />} />
              <Route path="support" element={<LenderSupportPage />} />
            </Route>

            {/* Alias: support /dashboard/admin by redirecting to /admin */}
            <Route path="/dashboard/admin/*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{ duration: 2000 }}
      />
    </QueryClientProvider>
  );
}

export default App;
