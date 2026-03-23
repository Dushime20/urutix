# Functional Requirements Specification (FRS) - Driver Module (Updated)

## 🎯 Project Overview
The Driver Module is a mission-critical component of the Uruti platform, providing truck drivers with a high-performance, mobile-optimized command center for logistics execution, financial management, and safety compliance.

---

## 🏗️ 1. Tactical Command & Control (New Features)

### 1.1 Priority Mission Dashboards
- **Requirement**: The system must prioritize active mission data on the primary dashboard.
- **Specification**:
    - Automatic reordering to place **Live Route Map** and **Mission Control Card** at the fold.
    - Heartbeat animation for active trip status.
    - Quick-action buttons for "Start Trip", "Pause", and "Complete Trip".

### 1.2 Tactical Mission Overlay (Sticky Command Bar)
- **Requirement**: Drivers must have persistent access to mission-critical metrics and actions.
- **Specification**:
    - **Persistent Bar**: A sticky header/overlay visible across all tabs during an active mission.
    - **Real-time Metrics**: Displays dynamic ETA, Distance Remaining, and Cargo Health.
    - **Global Actions**: Includes a "Focus Mission" button and a specialized "Quick Refuel" shortcut for the Fuel Management suite.

### 1.3 Post-Trip Compliance Checklist
- **Requirement**: Drivers must complete a verification flow before closing a mission.
- **Specification**:
    - **Multi-step Modal**: Guided flow for checking vehicle status, cargo integrity, and document submission.
    - **Photo Proof**: Integrated camera/gallery upload for Proof of Delivery (POD) and vehicle condition.
    - **Data Integration**: Automatically links checklist data to the specific trip ID in the backend.

---

## 🤖 2. Intelligence & Support

### 2.1 Tactical AI Assistant (Driver Chatbot)
- **Requirement**: A floating AI companion must be available for real-time driver support.
- **Specification**:
    - **Accessibility**: Floating bubble accessible from any dashboard tab.
    - **Performance UI**: High-contrast terminal-style interface for readability in various lighting conditions.
    - **Context Awareness**: Provides route insights, safety alerts, and fuel efficiency advice based on real-time trip data.

### 2.2 AI Fuel Advisor & Eco-Scores
- **Requirement**: The system should analyze fuel logs to provide efficiency feedback.
- **Specification**:
    - **Refuel Capture**: Form for recording volume, price/liter, and odometer readings.
    - **Efficiency Metrics**: Calculation of Kms per Liter and Cost per Km.
    - **Eco-Driving Rank**: Provides a percentile ranking for the driver compared to fleet averages.

---

## 📱 3. Mobile Adaptivity & Ergonomics

### 3.1 Mobile-First Navigation
- **Requirement**: The interface must be optimized for one-handed operation on mobile devices.
- **Specification**:
    - **Bottom Tactical Nav**: A fixed bottom navigation bar containing core tabs: Overview, Missions, Finance, and Chat.
    - **Gesture Friendly**: Large touch targets (min 44x44px) for all primary actions.
    - **Responsive Density**: Transitions from multi-column desktop layouts to single or double-column stacks on mobile (e.g., Quick Stats grid).

### 3.2 Dynamic Layout System
- **Requirement**: Dashboards must adapt to various screen sizes without losing information.
- **Specification**:
    - **Responsive Grids**: Quick stats utilize `grid-cols-2` on mobile and `grid-cols-4` on desktop.
    - **Tactical Padding**: Automatic padding adjustments (`pb-28`) to prevent content overlap with fixed navigation systems.
    - **Full-Screen Modals**: Forms and detail views transition to full-screen overlays on small viewports.

---

## 🛡️ 4. Safety & Compliance

### 4.1 Incident Reporting Engine
- **Requirement**: Drivers must be able to report hazards, accidents, or expenses immediately.
- **Specification**:
    - **Standardized Categories**: Accident, Near Miss, Hazard, Trip Expense, Property Damage.
    - **Severity Matrix**: Categorization from Minor to Critical.
    - **Proof Requirement**: Mandatory photo/document upload for expense reimbursement or insurance claims.
    - **Real-time Alerting**: Immediate transmission of incident data to fleet managers.

### 4.2 Cargo Health Monitoring
- **Requirement**: Real-time sensor data must be visible to the driver.
- **Specification**:
    - Visual indicators for Temperature, Humidity, and Shock/Vibration.
    - Alert states for threshold breaches.
    - Interactive telemetry charts optimized for mobile touch-zoom.

---

## 💰 5. Financial Management

### 5.1 Driver Wallet & Advances
- **Requirement**: Drivers must manage their earnings and requested advances directly.
- **Specification**:
    - **Balance Hub**: High-visibility balance display with currency breakdown.
    - **Transaction Ledger**: Searchable history of credits and debits with status indicators (Approved, Pending, Rejected).
    - **Advance Requests**: Form for submitting financial assistance requests with automated validation.

---

## ✅ 6. Document Matrix (Inventory of Key Assets)

| Feature | Component/File | API Integration |
| :--- | :--- | :--- |
| Tactical Overlay | `DriverDashboard.tsx` | `driverApi.getDashboardStats` |
| Bottom Navigation | `MobileBottomNav.tsx` | N/A (UI Layout) |
| Post-Trip Checklist | `PostTripChecklistModal.tsx` | `driverApi.completeTripChecklist` |
| AI Assistant | `TacticalAiAssistant.tsx` (in `DriverLayout`) | `openaiApi` / `geminiApi` |
| Incident Reporting | `IncidentReportModal.tsx` | `driverApi.reportIncident` |
| Fuel Management | `FuelManagement.tsx` | `fuelApi.logFuel` |
| Wallet & Advances | `WalletAdvances.tsx` | `walletApi` |
| Cargo Health | `CargoHealthModal.tsx` | `iotApi` |

---

**Document Version**: 2.2.0  
**Last Updated**: 2026-03-23  
**Status**: ACTIVE / IMPLEMENTED
