import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense } from 'react';

// Lazy load pages that use heavy libraries (charts/maps) to reduce initial bundle size
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CargoDashboard = lazy(() => import('./pages/CargoDashboard'));
const FleetDashboard = lazy(() => import('./pages/FleetDashboard'));
const FleetOwnerDashboard = lazy(() => import('./pages/FleetOwnerDashboard'));
const FleetSafety = lazy(() => import('./pages/FleetSafety'));
const TruckBidsPage = lazy(() => import('./pages/TruckBidsPage'));
const FleetBidsPage = lazy(() => import('./pages/FleetBidsPage'));
const MyBidsPage = lazy(() => import('./pages/MyBidsPage'));
const DriversListPage = lazy(() => import('./pages/DriversListPage'));
const DriverDashboard = lazy(() => import('./components/DriverDashboard/DriverDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const FleetAnalytics = lazy(() => import('./pages/FleetAnalytics'));

// Keep essential components that are needed immediately (layouts, auth, home)
import CargoOwnerLayout from './components/Layout/CargoOwnerLayout';
import FleetOwnerLayout from './components/Layout/FleetOwnerLayout';
import DriverLayout from './components/Layout/DriverLayout';
import AdminLayout from './components/Layout/AdminLayout';
import TenantAdminLayout from './components/Layout/TenantAdminLayout';
import LenderLayout from './components/Layout/LenderLayout';
import Auth from './pages/Auth';
import Home from './pages/Home';
import DriverPasswordSetup from './pages/DriverPasswordSetup';
import TenantPasswordSetup from './pages/TenantPasswordSetup';

// Lazy load all page components to reduce initial bundle size
const CargoList = lazy(() => import('./pages/dashboard/cargos/list'));
const EnhancedJourneyFlow = lazy(() => import('./components/CargoOwnerJourney/EnhancedJourneyFlow'));
const EnhancedCargoDemo = lazy(() => import('./pages/EnhancedCargoDemo'));
const TrucksListPage = lazy(() => import('./pages/TrucksListPage'));
const TruckRecordsPage = lazy(() => import('./pages/TruckRecordsPage'));
const UnifiedFleetManagement = lazy(() => import('./pages/UnifiedFleetManagement'));
const UnifiedDriverManagement = lazy(() => import('./pages/UnifiedDriverManagement'));
const FleetPaymentManagement = lazy(() => import('./pages/FleetPaymentManagement'));
const FleetHelpSupport = lazy(() => import('./pages/FleetHelpSupport'));
const CargoHelpSupport = lazy(() => import('./pages/CargoHelpSupport'));
const RoutesPage = lazy(() => import('./pages/Routes'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminTrucks = lazy(() => import('./pages/AdminTrucks'));
const AdminLoads = lazy(() => import('./pages/AdminLoads'));
const AdminTrips = lazy(() => import('./pages/AdminTrips'));
const AdminTenants = lazy(() => import('./pages/AdminTenants'));
const AdminRoutes = lazy(() => import('./pages/AdminRoutes'));
const MonitoringDashboard = lazy(() => import('./pages/admin/MonitoringDashboard'));
const BiddingManagement = lazy(() => import('./pages/admin/BiddingManagement'));
const DisputeManagement = lazy(() => import('./pages/admin/DisputeManagement'));
const FinancialAdminDashboard = lazy(() => import('./pages/admin/FinancialAdminDashboard'));
const TenantDashboardPage = lazy(() => import('./pages/TenantDashboard'));
const TenantFleetManagement = lazy(() => import('./components/TenantAdmin/TenantFleetManagement'));
const TenantCargoOperations = lazy(() => import('./components/TenantAdmin/TenantCargoOperations'));
const TenantAdminRoutes = lazy(() => import('./components/TenantAdmin/TenantAdminRoutes'));
const TenantAdminDrivers = lazy(() => import('./components/TenantAdmin/TenantAdminDrivers'));
const TenantAdminCargo = lazy(() => import('./components/TenantAdmin/TenantAdminCargo'));
const TenantAdminTrips = lazy(() => import('./components/TenantAdmin/TenantAdminTrips'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const LenderPolicySettingsPage = lazy(() => import('./pages/LenderPolicySettingsPage'));
const AdminLenderRegistrationPage = lazy(() => import('./pages/AdminLenderRegistrationPage'));
const AdminBorrowersPage = lazy(() => import('./pages/AdminBorrowersPage'));

// Enhanced Transaction Flow Components - lazy load
const BookingConfirmation = lazy(() => import('./pages/BookingConfirmation'));
const TripManagement = lazy(() => import('./pages/TripManagement'));
const PaymentProcessing = lazy(() => import('./pages/PaymentProcessing'));
const TransactionFlow = lazy(() => import('./pages/TransactionFlow'));
const MatchResults = lazy(() => import('./pages/MatchResults'));
const ContractNegotiation = lazy(() => import('./pages/ContractNegotiation'));
const EscrowManagement = lazy(() => import('./pages/EscrowManagement'));
const DisputeResolution = lazy(() => import('./pages/DisputeResolution'));
const TripTracking = lazy(() => import('./pages/TripTracking'));
const Tracking = lazy(() => import('./pages/Tracking'));
const DeliveryConfirmation = lazy(() => import('./pages/DeliveryConfirmation'));
const SettlementProcessing = lazy(() => import('./pages/SettlementProcessing'));
const LenderDashboardPage = lazy(() => import('./pages/LenderDashboardPage'));
const EnhancedLoanRequestsPage = lazy(() => import('./pages/EnhancedLoanRequestsPage'));
const UnifiedFinancialManagement = lazy(() => import('./pages/dashboard/financial'));
const UnifiedDocumentManagement = lazy(() => import('./pages/dashboard/documents'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const UnifiedNotificationManagement = lazy(() => import('./pages/dashboard/notifications'));
const UnifiedReputationManagement = lazy(() => import('./pages/dashboard/reputation'));
const UnifiedAccountManagement = lazy(() => import('./pages/dashboard/account'));
const UnifiedAnalyticsManagement = lazy(() => import('./pages/dashboard/analytics'));
const UnifiedTrackingManagement = lazy(() => import('./pages/dashboard/tracking'));
const ActiveLoansPage = lazy(() => import('./pages/ActiveLoansPage'));
const DisbursementsPage = lazy(() => import('./pages/DisbursementsPage'));
const RepaymentsPage = lazy(() => import('./pages/RepaymentsPage'));
const PortfolioAnalyticsPage = lazy(() => import('./pages/PortfolioAnalyticsPage'));
const RiskAnalysisPage = lazy(() => import('./pages/RiskAnalysisPage'));
const InterestTrackingPage = lazy(() => import('./pages/InterestTrackingPage'));
const FinancialReportsPage = lazy(() => import('./pages/FinancialReportsPage'));
const BorrowersManagementPage = lazy(() => import('./pages/BorrowersManagementPage'));
const LendingPoliciesPage = lazy(() => import('./pages/LendingPoliciesPage'));
const CreditAssessmentPage = lazy(() => import('./pages/CreditAssessmentPage'));
const TransactionsHistoryPage = lazy(() => import('./pages/TransactionsHistoryPage'));
const LenderProfilePage = lazy(() => import('./pages/LenderProfilePage'));
const LenderNotificationsPage = lazy(() => import('./pages/LenderNotificationsPage'));
const LenderSupportPage = lazy(() => import('./pages/LenderSupportPage'));
const LenderTeamManagementPage = lazy(() => import('./pages/LenderTeamManagementPage'));

// Loading fallback component for lazy-loaded pages
const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  </div>
);

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
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/driver/setup-password" element={<DriverPasswordSetup />} />
            <Route path="/tenant/setup-password" element={<TenantPasswordSetup />} />
            
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
              <Route index element={<FleetOwnerDashboard />} />
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
              <Route path="financial" element={<UnifiedFinancialManagement />} />
              <Route path="cost-analysis" element={<UnifiedFinancialManagement />} />
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
              <Route path="cargo" element={<TenantAdminCargo />} />
              <Route path="drivers" element={<TenantAdminDrivers />} />
              <Route path="routes" element={<TenantAdminRoutes />} />
              <Route path="trips" element={<TenantAdminTrips />} />
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
          </Suspense>
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
