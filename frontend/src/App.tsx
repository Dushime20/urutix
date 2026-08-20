import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { PermissionProvider } from './contexts/PermissionContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { I18nProvider } from './contexts/i18n-context';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense, type ReactNode } from 'react';
import { MutationSyncProvider } from './components/MutationSyncProvider';

// Keep essential components that are needed immediately (layouts, auth, home)
import CargoOwnerLayout from './components/Layout/CargoOwnerLayout';
import FleetOwnerLayout from './components/Layout/FleetOwnerLayout';
import DriverLayout from './components/Layout/DriverLayout';
import AdminLayout from './components/Layout/AdminLayout';
import AdminOperationalLayout from './components/Layout/AdminOperationalLayout';
import TenantAdminLayout from './components/Layout/TenantAdminLayout';
import LenderLayout from './components/Layout/LenderLayout';
import BrokerLayout from './components/Layout/BrokerLayout';
import ParkingLayout from './components/Layout/ParkingLayout';

import Auth from './pages/Auth';
import Home from './pages/Home';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DriverPasswordSetup from './pages/DriverPasswordSetup';
import TenantPasswordSetup from './pages/TenantPasswordSetup';
import LenderPasswordSetup from './pages/LenderPasswordSetup';
import ReceiverPasswordSetup from './pages/ReceiverPasswordSetup';
import CargoOwnerPasswordSetup from './pages/CargoOwnerPasswordSetup';
import TruckOwnerPasswordSetup from './pages/TruckOwnerPasswordSetup';
import CustomsOfficerPasswordSetup from './pages/CustomsOfficerPasswordSetup';
import BrokerPasswordSetup from './pages/BrokerPasswordSetup';
import AgentPasswordSetup from './pages/AgentPasswordSetup';

// Lazy load pages that use heavy libraries (charts/maps) to reduce initial bundle size
// Analytics pages
const UnifiedAnalyticsManagement = lazy(() => import('./pages/dashboard/analytics'));
const PredictiveLogistics = lazy(() => import('./components/Analytics/PredictiveLogistics'));

// Lazy load all page components to reduce initial bundle size
const CargoList = lazy(() => import('./pages/dashboard/cargos/list'));
const SmartMatchingHub = lazy(() => import('./pages/dashboard/SmartMatchingHub'));
const CargoOwnerContracts = lazy(() => import('./pages/cargo-owner/Contracts'));
const EnhancedJourneyFlow = lazy(() => import('./components/CargoOwnerJourney/EnhancedJourneyFlow'));
const EnhancedCargoDemo = lazy(() => import('./pages/EnhancedCargoDemo'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminOperationalDashboard = lazy(() => import('./pages/admin-dashboard/Dashboard'));

// Dashboard components - create placeholders for missing ones
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CargoDashboard = lazy(() => import('./pages/CargoDashboard'));
const FleetDashboard = lazy(() => import('./pages/FleetDashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const FleetAnalytics = lazy(() => import('./pages/FleetAnalytics'));
const FleetSafety = lazy(() => import('./pages/FleetSafety'));
const DriverDashboard = lazy(() => import('./pages/driver/DriverDashboard'));

const SubscriptionPlans = lazy(() => import('./pages/subscription/SubscriptionPlans'));

const TruckRecordsPage = lazy(() => import('./pages/TruckRecordsPage'));
const TruckOwnerCredits = lazy(() => import('./pages/truck-owner/TruckOwnerCredits'));

// NEW: Credit Marketplace Pages (replacing old partner plans)
const CreditMarketplace = lazy(() => import('./pages/tenant-admin/CreditMarketplace'));
const BuyCredits = lazy(() => import('./pages/truck-owner/BuyCredits'));

const CargoHelpSupport = lazy(() => import('./pages/CargoHelpSupport'));
const FleetHelpSupport = lazy(() => import('./pages/FleetHelpSupport'));
const DriverHelpSupport = lazy(() => import('./pages/DriverHelpSupport'));
const TruckOwnerEpodDashboard = lazy(() => import('./components/FleetDashboard/TruckOwnerEpodDashboard'));
const CargoOwnerEpodDashboard = lazy(() => import('./components/CargoOwner/CargoOwnerEpodDashboard'));
const AdminAnalytics = lazy(() => import('./pages/admin/AnalyticsManagement'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminTrucks = lazy(() => import('./pages/AdminTrucks'));
const AdminLoads = lazy(() => import('./pages/AdminLoads'));
const AdminTrips = lazy(() => import('./pages/AdminTrips'));
const AdminTenants = lazy(() => import('./pages/AdminTenants'));
const AdminRoutes = lazy(() => import('./pages/AdminRoutes'));
const MonitoringDashboard = lazy(() => import('./pages/admin/MonitoringDashboard'));
const BiddingManagement = lazy(() => import('./pages/admin/BiddingManagement'));
const DisputeManagement = lazy(() => import('./pages/admin/DisputeManagement'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const OperationalAdminDisputes = lazy(() => import('./pages/admin-operational/Disputes'));
const OperationalAdminTrips = lazy(() => import('./pages/admin-operational/Trips'));
const OperationalAdminLoads = lazy(() => import('./pages/admin-operational/Loads'));
const OperationalAdminBidding = lazy(() => import('./pages/admin-operational/Bidding'));
const OperationalAdminMonitoring = lazy(() => import('./pages/admin-operational/Monitoring'));
const OperationalAdminAnalytics = lazy(() => import('./pages/admin-operational/Analytics'));
const OperationalAdminFinancial = lazy(() => import('./pages/admin-operational/Financial'));
const OperationalAdminReports = lazy(() => import('./pages/admin-operational/Reports'));
const OperationalAdminActivityLogs = lazy(() => import('./pages/admin-operational/ActivityLogs'));
const OperationalAdminProfile = lazy(() => import('./pages/admin-operational/Profile'));
const OperationalAdminSettings = lazy(() => import('./pages/admin-operational/Settings'));
const FinancialAdminDashboard = lazy(() => import('./pages/admin/FinancialAdminDashboard'));
const TenantAdminDashboard = lazy(() => import('./pages/admin-dashboard/Dashboard'));
const EnhancedPermissions = lazy(() => import('./pages/admin/EnhancedPermissions'));
const FeatureControls = lazy(() => import('./pages/admin/FeatureControls'));
const AdminParkingReservations = lazy(() => import('./pages/admin/AdminParkingReservations'));
const ParkingReservationPage = lazy(() => import('./pages/ParkingReservation'));
const ParkingReservationLookupPage = lazy(() => import('./pages/ParkingReservationLookup'));
const ParkingReservationsDashboard = lazy(() => import('./pages/parking/ParkingReservationsDashboard'));
const ParkingReservationDetails = lazy(() => import('./pages/parking/ParkingReservationDetails'));
const ParkingFeeSettings = lazy(() => import('./pages/parking/ParkingFeeSettings'));
const MyParkingReservations = lazy(() => import('./pages/parking/MyParkingReservations'));
const OperationalParkingReservations = lazy(() => import('./pages/admin-operational/ParkingReservations'));
const ActivityLogs = lazy(() => import('./pages/admin/ActivityLogs'));
const SubscriptionManagement = lazy(() => import('./pages/admin/SubscriptionManagement'));
const RoleManagement = lazy(() => import('./pages/admin/RoleManagement'));
// OLD: const PartnerPlans = lazy(() => import('./pages/tenant-admin/PartnerPlans')); // Replaced by CreditMarketplace
const AdvancedSettings = lazy(() => import('./pages/admin/AdvancedSettings'));
const SystemSettings = lazy(() => import('./pages/admin/SystemSettings'));
const AdminAccountHub = lazy(() => import('./pages/admin/AdminAccountHub'));
const ComponentShowcase = lazy(() => import('./pages/admin/ComponentShowcase'));
const BulkEmail = lazy(() => import('./pages/admin/BulkEmail'));

// Dispute Resolution System
const DisputeResolutionCenter = lazy(() => import('./pages/admin/DisputeResolutionCenter'));
const UserDisputesPage = lazy(() => import('./pages/dashboard/disputes'));

// ─── Support Module ───────────────────────────────────────────────────────────
const UserSupportPage            = lazy(() => import('./pages/support/UserSupportPage'));
const TenantSupportCenter        = lazy(() => import('./pages/support/TenantSupportCenter'));
const SupportAnalyticsDashboard  = lazy(() => import('./pages/support/SupportAnalyticsDashboard'));
// ─── New Feature Pages ────────────────────────────────────────────────────────
const RevenueDashboard = lazy(() => import('./pages/admin/RevenueDashboard'));
const AdminNotificationsHub = lazy(() => import('./pages/admin/AdminNotificationsHub'));
const ComplianceDashboard = lazy(() => import('./pages/shared/ComplianceDashboard'));
const GeofenceManager = lazy(() => import('./pages/shared/GeofenceManager'));
const CarrierMarketplacePage = lazy(() => import('./pages/dashboard/CarrierMarketplacePage'));
const BackhaulMatchingPage = lazy(() => import('./pages/dashboard/fleet/BackhaulMatchingPage'));
const CarrierTierPage = lazy(() => import('./pages/dashboard/fleet/CarrierTierPage'));
const LoadMapPage = lazy(() => import('./pages/dashboard/fleet/LoadMapPage'));
const BulkUploadPage = lazy(() => import('./pages/dashboard/cargos/BulkUploadPage'));
const LoadTemplatesPage = lazy(() => import('./pages/dashboard/LoadTemplatesPage'));
const DistributionCampaignPage = lazy(() => import('./pages/cargo-owner/DistributionCampaignPage'));
const AvailableSpacePage = lazy(() => import('./pages/cargo-owner/AvailableSpacePage'));
const SellCapacityPage = lazy(() => import('./pages/truck-owner/SellCapacityPage'));
const IntegrationsPage = lazy(() => import('./pages/tenant-admin/IntegrationsPage'));
const BrandingSettingsPage = lazy(() => import('./pages/tenant-admin/BrandingSettingsPage'));

// Subscription Management Pages
const BillingDashboard = lazy(() => import('./pages/subscription/BillingDashboard'));
const PurchaseCredits = lazy(() => import('./pages/subscription/PurchaseCredits'));
const TenantDashboardPage = lazy(() => import('./pages/TenantDashboard'));
const PartnerBillingManager = lazy(() => import('./pages/tenant-admin/PartnerBillingManager'));
const TenantAdminRoutes = lazy(() => import('./components/TenantAdmin/TenantAdminRoutes'));

const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const LenderPolicySettingsPage = lazy(() => import('./pages/LenderPolicySettingsPage'));
const AdminLenderRegistrationPage = lazy(() => import('./pages/AdminLenderRegistrationPage'));
const AdminBorrowersPage = lazy(() => import('./pages/AdminBorrowersPage'));

// Enhanced Transaction Flow Components - lazy load
const BookingConfirmation = lazy(() => import('./pages/BookingConfirmation'));
const TruckOwnerProfilePage = lazy(() => import('./pages/TruckOwnerProfilePage'));
const TripManagement = lazy(() => import('./pages/TripManagement'));
const PaymentProcessing = lazy(() => import('./pages/PaymentProcessing'));
const TransactionFlow = lazy(() => import('./pages/TransactionFlow'));
const MatchResults = lazy(() => import('./pages/MatchResults'));
const ContractNegotiation = lazy(() => import('./pages/ContractNegotiation'));
const EscrowManagement = lazy(() => import('./pages/EscrowManagement'));
const DisputeResolution = lazy(() => import('./pages/DisputeResolution'));
const TripTracking = lazy(() => import('./pages/TripTracking'));
const LiveTracking = lazy(() => import('./pages/Tracking'));

const DeliveryConfirmation = lazy(() => import('./pages/DeliveryConfirmation'));
const SettlementProcessing = lazy(() => import('./pages/SettlementProcessing'));
const LenderDashboardPage = lazy(() => import('./pages/LenderDashboardPage'));
const EnhancedLoanRequestsPage = lazy(() => import('./pages/EnhancedLoanRequestsPage'));
const UnifiedFinancialManagement = lazy(() => import('./pages/dashboard/financial'));
const UnifiedDocumentManagement = lazy(() => import('./pages/dashboard/documents'));
const InvoiceViewer = lazy(() => import('./components/CargoOwner/InvoiceViewer'));
const ReceiverCargosPage = lazy(() => import('./pages/cargo-owner/ReceiverCargosPage'));
const CargoOwnerProfile = lazy(() => import('./pages/cargo-owner/CargoOwnerProfile'));
const CargoInspectionPage = lazy(() => import('./pages/cargo-owner/CargoInspectionPage'));
const ReceiptViewer = lazy(() => import('./components/Lender/ReceiptViewer'));

const UnifiedNotificationManagement = lazy(() => import('./pages/dashboard/notifications'));
const SmartBookingRequests = lazy(() => import('./pages/SmartBookingsPage'));
const UnifiedReputationManagement = lazy(() => import('./pages/dashboard/reputation'));
const UnifiedAccountManagement = lazy(() => import('./pages/dashboard/account'));
const UnifiedTrackingManagement = lazy(() => import('./pages/dashboard/tracking'));
const UnifiedBiddingManagement = lazy(() => import('./pages/dashboard/bidding/UnifiedBiddingManagement'));
const ReceiversPage = lazy(() => import('./pages/cargo-owner/ReceiversPage'));
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
const NotificationResourceUnavailablePage = lazy(() => import('./pages/NotificationResourceUnavailablePage'));
const NotificationsHubRedirect = lazy(() => import('./pages/NotificationsHubRedirect'));
const LenderSupportPage = lazy(() => import('./pages/LenderSupportPage'));
const LenderTeamManagementPage = lazy(() => import('./pages/LenderTeamManagementPage'));

// Cargo Owner: Customs Inspections
const CargoCustomsInspectionsPage = lazy(() => import('./pages/dashboard/customs/CargoCustomsInspectionsPage'));

// Customs Officer Pages
const CustomsDashboard = lazy(() => import('./pages/customs/CustomsDashboard'));
const TruckSearchPage = lazy(() => import('./pages/customs/TruckSearchPage'));
const InspectionsPage = lazy(() => import('./pages/customs/InspectionsPage'));
const InspectionDetailPage = lazy(() => import('./pages/customs/InspectionDetailPage'));
const NewInspectionPage = lazy(() => import('./pages/customs/NewInspectionPage'));
const FlaggedCargoPage = lazy(() => import('./pages/customs/FlaggedCargoPage'));
const ClearedShipmentsPage = lazy(() => import('./pages/customs/ClearedShipmentsPage'));
const CheckpointsPage = lazy(() => import('./pages/customs/CheckpointsPage'));
const CustomsAnalyticsPage = lazy(() => import('./pages/customs/CustomsAnalyticsPage'));
const CustomsAuditPage = lazy(() => import('./pages/customs/CustomsAuditPage'));
const CustomsOfficerProfilePage = lazy(() => import('./pages/customs/CustomsOfficerProfilePage'));

// Broker Pages
const SimpleBrokerDashboard = lazy(() => import('./pages/broker/BrokerDashboard'));

const BrokerProfile = lazy(() => import('./pages/broker/BrokerProfile'));
const BrokerBidding = lazy(() => import('./pages/broker/BrokerBidding'));
const CargoDiscovery = lazy(() => import('./pages/broker/CargoDiscovery'));
const DealFacilitation = lazy(() => import('./pages/broker/DealFacilitation'));
const CommissionsPage = lazy(() => import('./pages/broker/CommissionsPage'));
const BrokerLoadsPage = lazy(() => import('./pages/broker/BrokerLoadsPage'));
const BrokerLoadDetail = lazy(() => import('./pages/broker/BrokerLoadDetail'));
const BrokerAnalytics = lazy(() => import('./pages/broker/BrokerAnalytics'));
const LoadTracking = lazy(() => import('./pages/broker/LoadTracking'));
const ContractManagement = lazy(() => import('./pages/broker/ContractManagement'));
const InsuranceVerification = lazy(() => import('./pages/broker/InsuranceVerification'));
const BrokerDisputeResolution = lazy(() => import('./pages/broker/DisputeResolution'));
const BrokerEscrowManagement = lazy(() => import('./pages/broker/EscrowManagement'));
const DocumentManagement = lazy(() => import('./pages/broker/DocumentManagement'));
const SmartMatching = lazy(() => import('./pages/broker/SmartMatching'));
const MarketIntelligence = lazy(() => import('./pages/broker/MarketIntelligence'));
const CreditManagement = lazy(() => import('./pages/broker/CreditManagement'));
const MultiStopManagement = lazy(() => import('./pages/broker/MultiStopManagement'));
const PerformanceAnalytics = lazy(() => import('./pages/broker/PerformanceAnalytics'));
const PayoutsPage = lazy(() => import('./pages/broker/PayoutsPage'));

// Loading fallback component for lazy-loaded pages
const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
      <p className="ui-body-small text-gray-500">Loading...</p>
    </div>
  </div>
);

function AppUiShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isMarketing = pathname === '/';
  return (
    <div className="contents" {...(!isMarketing ? { 'data-app-ui': '' } : {})}>
      {children}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider
        defaultLanguage="en"
        googleTranslateApiKey={import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY}
      >
        <ThemeProvider>
          <AuthProvider>
          <MutationSyncProvider>
          <PermissionProvider>
          <CurrencyProvider>
            <NotificationProvider>
              <Router>
                <AppUiShell>
                <Suspense fallback={<PageLoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/parking-reservation" element={<ParkingReservationPage />} />
                    <Route path="/parking-reservation/lookup" element={<ParkingReservationLookupPage />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/setup-password" element={<DriverPasswordSetup />} />
                    <Route path="/driver/setup-password" element={<DriverPasswordSetup />} />
                    <Route path="/tenant/setup-password" element={<TenantPasswordSetup />} />
                    <Route path="/lender/setup-password" element={<LenderPasswordSetup />} />
                    <Route path="/receiver/setup-password" element={<ReceiverPasswordSetup />} />
                    <Route path="/cargo-owner/setup-password" element={<CargoOwnerPasswordSetup />} />
                    <Route path="/truck-owner/setup-password" element={<TruckOwnerPasswordSetup />} />
                    <Route path="/customs-officer/setup-password" element={<CustomsOfficerPasswordSetup />} />
                    <Route path="/broker/setup-password" element={<BrokerPasswordSetup />} />
                    <Route path="/agent/setup-password" element={<AgentPasswordSetup />} />
                    <Route path="/notifications" element={<NotificationsHubRedirect />} />
                    <Route path="/resource-unavailable" element={<NotificationResourceUnavailablePage />} />

                    {/* Cargo Owner Routes */}
                    <Route path="/dashboard" element={<CargoOwnerLayout />}>
                      <Route index element={<Dashboard />} />
                      <Route path="cargos" element={<CargoDashboard />} />
                      <Route path="cargos/create" element={<CargoList />} />
                      <Route path="cargos/list" element={<CargoList />} />
                      <Route path="resource-unavailable" element={<NotificationResourceUnavailablePage />} />
                      <Route path="cargos/active" element={<CargoList />} />
                      <Route path="cargos/my-cargos" element={<ReceiverCargosPage />} />
                      <Route path="cargos/:cargoId/inspect" element={<CargoInspectionPage />} />
                      <Route path="cargos/enhanced-demo" element={<EnhancedCargoDemo />} />
                      <Route path="cargos/enhanced-demo/:cargoId" element={<EnhancedCargoDemo />} />
                      <Route path="bidding" element={<UnifiedBiddingManagement />} />
                      <Route path="my-bids" element={<UnifiedBiddingManagement />} />
                      <Route path="contracts" element={<CargoOwnerContracts />} />
                      <Route path="smart-matching" element={<SmartMatchingHub />} />
                      <Route path="accepted-matches" element={<SmartMatchingHub />} />
                      <Route path="journey" element={<EnhancedJourneyFlow />} />
                      <Route path="tenant-dashboard" element={<TenantDashboardPage />} />
                      <Route path="analytics" element={<Navigate to="/dashboard/analytics/operational" replace />} />
                      <Route path="analytics/operational" element={<UnifiedAnalyticsManagement />} />
                      <Route path="analytics/advanced" element={<UnifiedAnalyticsManagement />} />
                      <Route path="analytics/detailed" element={<UnifiedAnalyticsManagement />} />
                      <Route path="analytics/predictive" element={<PredictiveLogistics />} />
                      <Route path="analytics/financial" element={<UnifiedFinancialManagement />} />
                      <Route path="reports" element={<UnifiedAnalyticsManagement />} />
                      <Route path="history" element={<UnifiedAnalyticsManagement />} />
                      <Route path="tracking" element={<LiveTracking />} />
                      <Route path="tracking/trips/:tripId" element={<TripTracking />} />
                      <Route path="inspections" element={<UnifiedTrackingManagement />} />
                      <Route path="routes" element={<UnifiedTrackingManagement />} />
                      <Route path="profile" element={<CargoOwnerProfile />} />
                      <Route path="settings" element={<UnifiedAccountManagement />} />
                      <Route path="payments" element={<UnifiedFinancialManagement />} />
                      <Route path="pending-payments" element={<UnifiedFinancialManagement />} />
                      <Route path="transaction-history" element={<UnifiedFinancialManagement />} />
                      <Route path="financial" element={<UnifiedFinancialManagement />} />
                      <Route path="expenses" element={<UnifiedFinancialManagement />} />
                      <Route path="overview" element={<UnifiedFinancialManagement />} />
                      <Route path="loan-requests" element={<UnifiedFinancialManagement />} />
                      <Route path="invoices" element={<InvoiceViewer />} />
                      <Route path="documents" element={<UnifiedDocumentManagement />} />
                      <Route path="documents/:entityType" element={<UnifiedDocumentManagement />} />
                      <Route path="notification-center" element={<UnifiedNotificationManagement />} />
                      <Route path="notifications" element={<UnifiedNotificationManagement />} />
                      <Route path="support" element={<CargoHelpSupport />} />
                      <Route path="ratings" element={<UnifiedReputationManagement />} />
                      <Route path="rewards" element={<UnifiedReputationManagement />} />
                      <Route path="scoring" element={<UnifiedReputationManagement />} />
                      <Route path="receivers" element={<ReceiversPage />} />
                      <Route path="customs-inspections" element={<CargoCustomsInspectionsPage />} />
                      <Route path="customs-inspections/:id" element={<CargoCustomsInspectionsPage />} />
                      <Route path="carrier-marketplace" element={<CarrierMarketplacePage />} />
                      <Route path="templates" element={<LoadTemplatesPage />} />
                      <Route path="campaigns" element={<DistributionCampaignPage />} />
                      <Route path="available-space" element={<AvailableSpacePage />} />
                      <Route path="cargos/bulk-upload" element={<BulkUploadPage />} />

                      {/* Enhanced Transaction Flow Routes */}
                      <Route path="transaction-flow" element={<TransactionFlow />} />
                      <Route path="match-results" element={<MatchResults />} />
                      <Route path="booking-confirmation/:matchId" element={<BookingConfirmation />} />
                      <Route path="contract-negotiation/:bookingId" element={<ContractNegotiation />} />
                      <Route path="payment-processing/:bookingId" element={<PaymentProcessing />} />
                      <Route path="escrow-management/:bookingId" element={<EscrowManagement />} />
                      <Route path="trip-tracking/:tripId" element={<TripTracking />} />
                      <Route path="delivery-confirmation/:tripId" element={<DeliveryConfirmation />} />
                      <Route path="epod-reports" element={<CargoOwnerEpodDashboard />} />
                      <Route path="settlement-processing/:tripId" element={<SettlementProcessing />} />
                      <Route path="dispute-resolution/:tripId" element={<DisputeResolution />} />
                      <Route path="disputes" element={<UserDisputesPage />} />
                      <Route path="parking-reservations" element={<MyParkingReservations basePath="/dashboard/parking-reservations" />} />
                      <Route path="parking-reservations/:id" element={<ParkingReservationDetails listPath="/dashboard/parking-reservations" />} />
                      <Route path="support" element={<UserSupportPage />} />
                      <Route path="support/new" element={<UserSupportPage />} />
                    </Route>

                    {/* Cargo Owner Routes (alias for /dashboard) */}
                    <Route path="/cargo-owner" element={<CargoOwnerLayout />}>
                      <Route index element={<Dashboard />} />
                      <Route path="cargos" element={<CargoDashboard />} />
                      <Route path="cargos/create" element={<CargoList />} />
                      <Route path="cargos/list" element={<CargoList />} />
                      <Route path="cargos/active" element={<CargoList />} />
                      <Route path="cargos/my-cargos" element={<ReceiverCargosPage />} />
                      <Route path="cargos/:cargoId/inspect" element={<CargoInspectionPage />} />
                      <Route path="cargos/enhanced-demo" element={<EnhancedCargoDemo />} />
                      <Route path="cargos/enhanced-demo/:cargoId" element={<EnhancedCargoDemo />} />
                      <Route path="bidding" element={<UnifiedBiddingManagement />} />
                      <Route path="my-bids" element={<UnifiedBiddingManagement />} />
                      <Route path="contracts" element={<CargoOwnerContracts />} />
                      <Route path="journey" element={<EnhancedJourneyFlow />} />
                      <Route path="tenant-dashboard" element={<TenantDashboardPage />} />
                      <Route path="analytics" element={<UnifiedAnalyticsManagement />} />
                      <Route path="reports" element={<UnifiedAnalyticsManagement />} />
                      <Route path="history" element={<UnifiedAnalyticsManagement />} />
                      <Route path="tracking" element={<LiveTracking />} />
                      <Route path="tracking/trips/:tripId" element={<TripTracking />} />
                      <Route path="routes" element={<UnifiedTrackingManagement />} />
                      <Route path="profile" element={<CargoOwnerProfile />} />
                      <Route path="settings" element={<UnifiedAccountManagement />} />
                      <Route path="payments" element={<UnifiedFinancialManagement />} />
                      <Route path="pending-payments" element={<UnifiedFinancialManagement />} />
                      <Route path="transaction-history" element={<UnifiedFinancialManagement />} />
                      <Route path="payment" element={<UnifiedFinancialManagement />} />
                      <Route path="expenses" element={<UnifiedFinancialManagement />} />
                      <Route path="overview" element={<UnifiedFinancialManagement />} />
                      <Route path="loan-requests" element={<UnifiedFinancialManagement />} />
                      <Route path="financial-info" element={<UnifiedFinancialManagement />} />
                      <Route path="invoices" element={<InvoiceViewer />} />
                      <Route path="documents" element={<UnifiedDocumentManagement />} />
                      <Route path="documents/:entityType" element={<UnifiedDocumentManagement />} />
                      <Route path="notification-center" element={<UnifiedNotificationManagement />} />
                      <Route path="notifications" element={<UnifiedNotificationManagement />} />
                      <Route path="support" element={<CargoHelpSupport />} />
                      <Route path="ratings" element={<UnifiedReputationManagement />} />
                      <Route path="rewards" element={<UnifiedReputationManagement />} />
                      <Route path="scoring" element={<UnifiedReputationManagement />} />
                      <Route path="receivers" element={<ReceiversPage />} />
                      <Route path="campaigns" element={<DistributionCampaignPage />} />
                      <Route path="available-space" element={<AvailableSpacePage />} />

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

                    {/* Fleet Dashboard Routes */}
                    <Route path="/dashboard/fleet" element={<FleetOwnerLayout />}>
                      <Route index element={<FleetDashboard />} />
                      <Route path="trucks" element={<FleetDashboard />} />
                      <Route path="trucks/:truckId/records" element={<TruckRecordsPage />} />
                      <Route path="drivers" element={<FleetDashboard />} />
                      <Route path="epod-reports" element={<TruckOwnerEpodDashboard />} />
                      <Route path="analytics" element={<FleetAnalytics />} />
                      <Route path="reports" element={<FleetAnalytics />} />
                      <Route path="safety" element={<FleetSafety />} />
                      <Route path="financial" element={<FleetDashboard />} />
                      <Route path="financial/expenses" element={<FleetDashboard />} />
                      <Route path="financial/overview" element={<FleetDashboard />} />
                      <Route path="financial/reports" element={<FleetDashboard />} />
                      <Route path="financial/cost-analysis" element={<FleetDashboard />} />
                      <Route path="cost-analysis" element={<FleetDashboard />} />
                      <Route path="loan-requests" element={<FleetDashboard />} />
                      <Route path="overview" element={<FleetDashboard />} />
                      <Route path="financial-info" element={<UnifiedFinancialManagement />} />
                      <Route path="credits" element={<TruckOwnerCredits />} />
                      {/* NEW: Credit Marketplace - Buy Credits */}
                      <Route path="buy-credits" element={<BuyCredits />} />
                      <Route path="bids" element={<FleetDashboard />} />
                      <Route path="my-bids" element={<FleetDashboard />} />
                      <Route path="bidding-analytics" element={<FleetDashboard />} />
                      <Route path="smart-bookings" element={<SmartBookingRequests />} />
                      <Route path="fuel" element={<FleetDashboard />} />
                      <Route path="expenses" element={<FleetDashboard />} />

                      <Route path="routes" element={<FleetDashboard />} />
                      <Route path="assignments" element={<FleetDashboard />} />
                      <Route path="ratings" element={<UnifiedReputationManagement />} />
                      <Route path="rewards" element={<UnifiedReputationManagement />} />
                      <Route path="scoring" element={<UnifiedReputationManagement />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="support" element={<FleetHelpSupport />} />
                      <Route path="backhaul" element={<BackhaulMatchingPage />} />
                      <Route path="capacity" element={<SellCapacityPage />} />
                      <Route path="tier" element={<CarrierTierPage />} />
                      <Route path="load-map" element={<LoadMapPage />} />
                      <Route path="notifications" element={<UnifiedNotificationManagement />} />
                      <Route path="notification-center" element={<UnifiedNotificationManagement />} />
                      <Route path="resource-unavailable" element={<NotificationResourceUnavailablePage />} />
                      {/* Live GPS Tracking */}
                      <Route path="tracking" element={<LiveTracking />} />
                      <Route path="tracking/trips/:tripId" element={<TripTracking />} />
                      <Route path="trip-tracking/:tripId" element={<TripTracking />} />
                      <Route path="disputes" element={<UserDisputesPage />} />
                      <Route path="parking-reservations" element={<MyParkingReservations basePath="/dashboard/fleet/parking-reservations" />} />
                      <Route path="parking-reservations/:id" element={<ParkingReservationDetails listPath="/dashboard/fleet/parking-reservations" />} />
                      <Route path="support" element={<UserSupportPage />} />
                      <Route path="support/new" element={<UserSupportPage />} />
                    </Route>

                    {/* Profile Route for Truck Owner */}
                    <Route path="/dashboard/profile/fleet" element={<FleetOwnerLayout />}>
                      <Route index element={<TruckOwnerProfilePage />} />
                    </Route>

                    {/* Trips Route */}
                    <Route path="/dashboard/trips" element={<FleetOwnerLayout />}>
                      <Route index element={<TripManagement />} />
                    </Route>

                    {/* Driver Routes */}
                    <Route path="/dashboard/driver" element={<DriverLayout />}>
                      <Route index element={<DriverDashboard />} />
                      <Route path="missions" element={<DriverDashboard />} />
                      <Route path="trips" element={<DriverDashboard />} />
                      <Route path="finance" element={<DriverDashboard />} />
                      <Route path="messages" element={<DriverDashboard />} />
                      <Route path="cargo" element={<DriverDashboard />} />
                      <Route path="inspection" element={<DriverDashboard />} />
                      <Route path="checklist" element={<DriverDashboard />} />
                      <Route path="post_trip" element={<DriverDashboard />} />
                      <Route path="leaderboard" element={<DriverDashboard />} />
                      <Route path="announcements" element={<DriverDashboard />} />
                      <Route path="truck" element={<DriverDashboard />} />
                      <Route path="earnings" element={<DriverDashboard />} />
                      <Route path="safety" element={<DriverDashboard />} />
                      <Route path="documents" element={<DriverDashboard />} />
                      <Route path="tracking" element={<LiveTracking />} />
                      <Route path="tracking/trips/:tripId" element={<TripTracking />} />
                      <Route path="trip-tracking/:tripId" element={<TripTracking />} />
                      <Route path="analytics" element={<DriverDashboard />} />
                      <Route path="notifications" element={<DriverDashboard />} />
                      <Route path="profile" element={<DriverDashboard />} />
                      <Route path="settings" element={<DriverDashboard />} />
                      <Route path="parking" element={<DriverDashboard />} />
                      <Route path="parking-reservations" element={<DriverDashboard />} />
                      <Route path="parking-reservations/:id" element={<ParkingReservationDetails listPath="/dashboard/driver/parking" />} />
                      <Route path="support" element={<DriverHelpSupport />} />
                      <Route path="ratings" element={<UnifiedReputationManagement />} />
                      <Route path="rewards" element={<UnifiedReputationManagement />} />
                      <Route path="scoring" element={<UnifiedReputationManagement />} />
                      <Route path="disputes" element={<UserDisputesPage />} />
                      <Route path="support" element={<UserSupportPage />} />
                      <Route path="support/new" element={<UserSupportPage />} />
                    </Route>

                    {/* Admin Routes - Super Admin (System Level) */}
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="lenders/register" element={<AdminLenderRegistrationPage />} />
                      <Route path="lenders" element={<Navigate to="lenders/register" replace />} />
                      <Route path="borrowers" element={<AdminBorrowersPage />} />
                      <Route path="analytics" element={<AdminAnalytics />} />
                      <Route path="monitoring" element={<MonitoringDashboard />} />
                      <Route path="notifications" element={<NotificationsPage />} />
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
                      <Route path="subscriptions" element={<SubscriptionManagement />} />
                      <Route path="subscription-plans" element={<Navigate to="/admin/subscriptions?tab=plans" replace />} />
                      <Route path="pricing-rules" element={<Navigate to="/admin/subscriptions?tab=pricing-rules" replace />} />
                      <Route path="credit-usage" element={<Navigate to="/admin/subscriptions?tab=credit-usage" replace />} />
                      <Route path="roles" element={<RoleManagement />} />
                      <Route path="permissions" element={<EnhancedPermissions />} />
                      <Route path="enhanced-permissions" element={<EnhancedPermissions />} />
                      <Route path="feature-controls" element={<FeatureControls />} />
                      <Route path="parking-reservations" element={<AdminParkingReservations />} />
                      <Route path="parking-reservations/:id" element={<AdminParkingReservations />} />
                      <Route path="activity-logs" element={<ActivityLogs />} />
                      <Route path="advanced-settings" element={<AdvancedSettings />} />
                      <Route path="system-settings" element={<SystemSettings />} />
                      <Route path="component-showcase" element={<ComponentShowcase />} />
                      <Route path="bulk-email" element={<BulkEmail />} />
                      <Route path="reports" element={<Analytics />} />
                      <Route path="help" element={<Settings />} />
                      <Route path="profile" element={<AdminAccountHub />} />
                      <Route path="settings" element={<AdminAccountHub />} />
                      <Route path="billing" element={<BillingDashboard />} />
                      <Route path="credits" element={<PurchaseCredits />} />
                      <Route path="revenue" element={<RevenueDashboard />} />
                      <Route path="onboarding" element={<AdminNotificationsHub />} />
                      <Route path="support" element={<TenantSupportCenter />} />
                      <Route path="support/analytics" element={<SupportAnalyticsDashboard onBack={() => window.history.back()} />} />
                    </Route>

                    {/* Admin Operational Routes - ADMIN Role (Operational Oversight) */}
                    <Route path="/admin-operational" element={<AdminOperationalLayout />}>
                      <Route index element={<AdminOperationalDashboard />} />
                      <Route path="trips" element={<OperationalAdminTrips />} />
                      <Route path="loads" element={<OperationalAdminLoads />} />
                      <Route path="disputes" element={<OperationalAdminDisputes />} />
                      <Route path="parking-reservations" element={<OperationalParkingReservations />} />
                      <Route path="parking-reservations/:id" element={<OperationalParkingReservations />} />
                      <Route path="analytics" element={<OperationalAdminAnalytics />} />
                      <Route path="financial" element={<OperationalAdminFinancial />} />
                      <Route path="bidding" element={<OperationalAdminBidding />} />
                      <Route path="monitoring" element={<OperationalAdminMonitoring />} />
                      <Route path="notifications" element={<NotificationsPage />} />
                      <Route path="activity-logs" element={<OperationalAdminActivityLogs />} />
                      <Route path="reports" element={<OperationalAdminReports />} />
                      <Route path="profile" element={<OperationalAdminProfile />} />
                      <Route path="settings" element={<OperationalAdminSettings />} />
                      <Route path="compliance" element={<ComplianceDashboard />} />
                      <Route path="geofences" element={<GeofenceManager />} />
                    </Route>

                    {/* Admin-Tenant Routes - TENANT_ADMIN Role (Tenant Level) */}
                    <Route path="/admin-tenant" element={<TenantAdminLayout />}>
                      <Route index element={<TenantAdminDashboard />} />
                      <Route path="lenders/register" element={<AdminLenderRegistrationPage />} />
                      <Route path="lenders" element={<Navigate to="lenders/register" replace />} />
                      <Route path="borrowers" element={<AdminBorrowersPage />} />
                      <Route path="analytics" element={<AdminAnalytics />} />
                      <Route path="monitoring" element={<MonitoringDashboard />} />
                      <Route path="bidding" element={<BiddingManagement />} />
                      <Route path="disputes" element={<DisputeResolutionCenter />} />
                      <Route path="financial" element={<FinancialAdminDashboard />} />
                      <Route path="transaction-monitoring" element={<TransactionFlow />} />
                      <Route path="dispute-management" element={<DisputeResolutionCenter />} />
                      <Route path="escrow-management" element={<EscrowManagement />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="trucks" element={<AdminTrucks />} />
                      <Route path="loads" element={<AdminLoads />} />
                      <Route path="trips" element={<AdminTrips />} />
                      <Route path="tenants" element={<AdminTenants />} />
                      <Route path="routes" element={<AdminRoutes />} />
                      <Route path="subscriptions" element={<SubscriptionManagement />} />
                      <Route path="subscription-plans" element={<Navigate to="/admin-tenant/subscriptions?tab=plans" replace />} />
                      <Route path="pricing-rules" element={<Navigate to="/admin-tenant/subscriptions?tab=pricing-rules" replace />} />
                      <Route path="credit-usage" element={<Navigate to="/admin-tenant/subscriptions?tab=credit-usage" replace />} />
                      <Route path="roles" element={<RoleManagement />} />
                      <Route path="permissions" element={<EnhancedPermissions />} />
                      <Route path="enhanced-permissions" element={<EnhancedPermissions />} />
                      <Route path="activity-logs" element={<ActivityLogs />} />
                      <Route path="advanced-settings" element={<AdvancedSettings />} />
                      <Route path="component-showcase" element={<ComponentShowcase />} />
                      <Route path="bulk-email" element={<BulkEmail />} />
                      <Route path="reports" element={<Analytics />} />
                      <Route path="help" element={<Settings />} />
                      <Route path="profile" element={<Profile />} />
                      <Route path="settings" element={<Settings />} />

                      {/* Subscription Management Routes */}
                      <Route path="billing" element={<BillingDashboard />} />
                      <Route path="credits" element={<PurchaseCredits />} />
                    </Route>

                    {/* Tenant Admin Routes */}
                    <Route path="/tenant-admin" element={<TenantAdminLayout />}>
                      <Route index element={<TenantDashboardPage />} />
                      <Route path="fleet" element={<TenantDashboardPage defaultView="fleet" />} />
                      <Route path="cargo" element={<TenantDashboardPage defaultView="cargo" />} />
                      <Route path="drivers" element={<TenantDashboardPage defaultView="drivers" />} />
                       <Route path="users" element={<TenantDashboardPage defaultView="users" />} />
                      <Route path="lenders" element={<TenantDashboardPage defaultView="lenders" />} />
                      <Route path="routes" element={<TenantAdminRoutes />} />
                      <Route path="trips" element={<TenantDashboardPage defaultView="trips" />} />
                      <Route path="financial" element={<TenantDashboardPage defaultView="financial" />} />
                      <Route path="purchase-credits" element={<TenantDashboardPage defaultView="purchase-credits" />} />
                      <Route path="billing" element={<TenantDashboardPage defaultView="billing" />} />
                      <Route path="subscription-plans" element={<TenantDashboardPage defaultView="subscription-plans" />} />
                      {/* NEW: Credit Marketplace - Configure and Manage */}
                      <Route path="credit-marketplace" element={<CreditMarketplace />} />
                      <Route path="truck-owners" element={<TenantDashboardPage defaultView="truck-owners" />} />
                      <Route path="partner-billing" element={<PartnerBillingManager />} />
                       <Route path="communication" element={<TenantDashboardPage defaultView="communicate" />} />
                      <Route path="analytics" element={<TenantDashboardPage />} />
                      <Route path="reports" element={<TenantDashboardPage defaultView="reports" />} />
                      <Route path="profile" element={<TenantDashboardPage defaultView="profile" />} />
                      <Route path="settings" element={<TenantDashboardPage defaultView="settings" />} />
                      <Route path="compliance" element={<ComplianceDashboard />} />
                      <Route path="geofences" element={<GeofenceManager />} />
                      <Route path="integrations" element={<IntegrationsPage />} />
                      <Route path="branding" element={<BrandingSettingsPage />} />
                      <Route path="notifications" element={<UnifiedNotificationManagement />} />
                      <Route path="notification-center" element={<UnifiedNotificationManagement />} />
                      <Route path="resource-unavailable" element={<NotificationResourceUnavailablePage />} />
                      <Route path="support" element={<TenantSupportCenter />} />
                      <Route path="support/analytics" element={<SupportAnalyticsDashboard onBack={() => window.history.back()} />} />
                      <Route path="parking-reservations" element={<ParkingReservationsDashboard basePath="/tenant-admin/parking-reservations" />} />
                      <Route path="parking-reservations/:id" element={<ParkingReservationDetails listPath="/tenant-admin/parking-reservations" />} />
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
                      <Route path="notifications" element={<UnifiedNotificationManagement />} />
                      <Route path="notification-center" element={<UnifiedNotificationManagement />} />
                      <Route path="team" element={<LenderTeamManagementPage />} />
                      <Route path="support" element={<LenderSupportPage />} />
                      <Route path="financial" element={<UnifiedFinancialManagement />} />
                      <Route path="financial-info" element={<UnifiedFinancialManagement />} />
                      <Route path="receipts" element={<ReceiptViewer />} />
                      <Route path="disputes" element={<UserDisputesPage />} />
                      <Route path="support" element={<UserSupportPage />} />
                      <Route path="support/new" element={<UserSupportPage />} />
                    </Route>

                    {/* Broker Routes */}
                    <Route path="/dashboard/broker" element={<BrokerLayout />}>
                      <Route index element={<SimpleBrokerDashboard />} />
                      <Route path="loads" element={<BrokerLoadsPage />} />
                      <Route path="loads/:loadId" element={<BrokerLoadDetail />} />
                      <Route path="customs-inspections" element={<CargoCustomsInspectionsPage />} />
                      <Route path="customs-inspections/:id" element={<CargoCustomsInspectionsPage />} />
                      <Route path="loads/:loadId/tracking" element={<LoadTracking />} />
                      <Route path="bidding" element={<BrokerBidding />} />
                      <Route path="tracking" element={<LiveTracking />} />
                      <Route path="tracking/trips/:tripId" element={<TripTracking />} />
                      <Route path="trip-tracking/:tripId" element={<TripTracking />} />
                      <Route path="discovery" element={<CargoDiscovery />} />
                      <Route path="deals" element={<DealFacilitation />} />
                      <Route path="commissions" element={<CommissionsPage />} />
                      <Route path="statistics" element={<Navigate to="/dashboard/broker/analytics" replace />} />
                      <Route path="analytics" element={<BrokerAnalytics />} />
                      <Route path="profile" element={<BrokerProfile />} />
                      <Route path="notifications" element={<UnifiedNotificationManagement />} />
                      <Route path="notification-center" element={<UnifiedNotificationManagement />} />
                      <Route path="settings" element={<BrokerProfile />} />
                      {/* Critical Features Routes */}
                      <Route path="contracts" element={<ContractManagement />} />
                      <Route path="insurance" element={<InsuranceVerification />} />
                      <Route path="disputes" element={<UserDisputesPage />} />
                      <Route path="escrow" element={<BrokerEscrowManagement />} />
                      <Route path="documents" element={<DocumentManagement />} />
                      {/* Intelligence Features Routes */}
                      <Route path="smart-matching" element={<SmartMatching />} />
                      <Route path="market-intelligence" element={<MarketIntelligence />} />
                      <Route path="credit-management" element={<CreditManagement />} />
                      <Route path="multi-stop" element={<MultiStopManagement />} />
                      <Route path="performance" element={<PerformanceAnalytics />} />
                      <Route path="payouts" element={<PayoutsPage />} />
                      <Route path="support" element={<UserSupportPage />} />
                      <Route path="support/new" element={<UserSupportPage />} />
                    </Route>

                    {/* Parking Reservation Officer Routes */}
                    <Route path="/dashboard/parking" element={<ParkingLayout />}>
                      <Route index element={<Navigate to="reservations" replace />} />
                      <Route path="reservations" element={<ParkingReservationsDashboard />} />
                      <Route path="reservations/:id" element={<ParkingReservationDetails />} />
                      <Route path="fees" element={<ParkingFeeSettings />} />
                    </Route>

                    {/* Customs Officer Routes */}
                    <Route path="/dashboard/customs" element={<CargoOwnerLayout />}>
                      <Route index element={<CustomsDashboard />} />
                      <Route path="search" element={<TruckSearchPage />} />
                      <Route path="inspections" element={<InspectionsPage />} />
                      <Route path="inspections/new" element={<NewInspectionPage />} />
                      <Route path="inspections/:id" element={<InspectionDetailPage />} />
                      <Route path="flagged" element={<FlaggedCargoPage />} />
                      <Route path="cleared" element={<ClearedShipmentsPage />} />
                      <Route path="checkpoints" element={<CheckpointsPage />} />
                      <Route path="analytics" element={<CustomsAnalyticsPage />} />
                      <Route path="audit" element={<CustomsAuditPage />} />
                      <Route path="reports" element={<CustomsAuditPage />} />
                      <Route path="profile" element={<CustomsOfficerProfilePage />} />
                      <Route path="settings" element={<CustomsOfficerProfilePage />} />
                      <Route path="notifications" element={<UnifiedNotificationManagement />} />
                      <Route path="notification-center" element={<UnifiedNotificationManagement />} />
                      <Route path="resource-unavailable" element={<NotificationResourceUnavailablePage />} />
                    </Route>
                    <Route path="/customs" element={<Navigate to="/dashboard/customs" replace />} />

                    {/* Alias: support /dashboard/admin by redirecting to /admin */}
                    <Route path="/dashboard/admin/*" element={<Navigate to="/admin" replace />} />
                  </Routes>
                </Suspense>
                </AppUiShell>
              </Router>
            </NotificationProvider>
          </CurrencyProvider>
          </PermissionProvider>
          </MutationSyncProvider>
        </AuthProvider>
      </ThemeProvider>
      <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 2000,
            style: {
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '0.875rem',
              fontWeight: 700,
            },
          }}
          containerClassName="!z-[9999999]"
        />
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
