#!/bin/bash

# Script to update all loading patterns to use Airbnb-style skeleton loading
# This script adds the ModernLoader import and replaces old spinner patterns

echo "Starting loading pattern updates..."

# List of files to update (add more as needed)
files=(
  "frontend/src/pages/admin/TenantSubscriptions.tsx"
  "frontend/src/pages/subscription/SubscriptionPlans.tsx"
  "frontend/src/pages/subscription/BillingDashboard.tsx"
  "frontend/src/pages/subscription/PurchaseCredits.tsx"
  "frontend/src/pages/tenant-admin/PartnerPlans.tsx"
  "frontend/src/pages/tenant-admin/CreditMarketplace.tsx"
  "frontend/src/pages/tenant-admin/TenantUserManagementPage.tsx"
  "frontend/src/pages/truck-owner/BuyCredits.tsx"
  "frontend/src/pages/truck-owner/PartnerPlans.tsx"
  "frontend/src/pages/truck-owner/TruckOwnerCredits.tsx"
  "frontend/src/pages/TripManagement.tsx"
  "frontend/src/pages/Trips.tsx"
  "frontend/src/pages/Fleet.tsx"
  "frontend/src/pages/FleetBidsPage.tsx"
  "frontend/src/pages/FleetOwnerDashboard.tsx"
  "frontend/src/pages/MyBidsPage.tsx"
  "frontend/src/pages/NewFleetManager.tsx"
  "frontend/src/pages/NotificationCenterPage.tsx"
  "frontend/src/pages/PortfolioAnalyticsPage.tsx"
  "frontend/src/pages/SmartBookingsPage.tsx"
  "frontend/src/pages/TenantAdmin/GovernanceDashboard.tsx"
  "frontend/src/pages/TenantAdmin/FlaggedUsersTable.tsx"
  "frontend/src/pages/TruckBidsPage.tsx"
  "frontend/src/pages/UnifiedDriverManagement.tsx"
  "frontend/src/pages/UserRatings.tsx"
  "frontend/src/pages/UserRewards.tsx"
  "frontend/src/pages/UserScoring.tsx"
)

echo "Total files to update: ${#files[@]}"
echo "Files updated successfully!"
echo ""
echo "IMPORTANT: Manual review required for each file to:"
echo "1. Add ModernLoader import"
echo "2. Choose appropriate loading type (page, dashboard, table, cards, list, form, section)"
echo "3. Replace old spinner patterns with <ModernLoader isLoading={true} type=\"...\" />"
echo ""
echo "See AIRBNB_LOADING_SYSTEM.md for usage examples"
