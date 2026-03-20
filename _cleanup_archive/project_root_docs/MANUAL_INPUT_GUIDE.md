# Manual Input Guide for Matching Truck and Cargo

This guide provides all the details needed to manually create a truck and cargo that will match each other.

## 🚛 TRUCK DETAILS (for truck.owner@test.com)

### Basic Information (Required Fields)
- **License Plate**: `MATCH-001`
- **VIN**: `MATCH001TRUCK2024`
- **Make**: `Mercedes-Benz`
- **Model**: `Actros 2651`
- **Year**: `2023`
- **Color**: `Blue`
- **Fuel Type**: `DIESEL` (select from dropdown)
- **Capacity Weight (kg)**: `25000`
- **Capacity Volume (cubic ft)**: `80` (Note: Frontend shows cubic ft, but backend uses m³ - use 80)
- **Registration Number**: `REG-MATCH-001`
- **Registration Expiry**: `2026-12-31` (or any future date)
- **Insurance Policy**: `INS-MATCH-001`
- **Insurance Expiry**: `2026-12-31` (or any future date)
- **Roadworthy Cert Expiry**: `2026-12-31` (optional, but recommended)
- **Mileage**: `10000`

### Truck Type & Equipment
- **Truck Type**: `VAN` (select from dropdown)
- **Trailer Type**: Leave empty or select `N/A`

### Essential Features (Checkboxes - IMPORTANT FOR MATCHING)
✅ **Has Lift Gate**: `true` (CHECKED - Required for cargo matching)
✅ **Has GPS**: `true` (CHECKED - Required for cargo matching)
✅ **Has Forklift**: `true` (CHECKED - Required for cargo matching)
✅ **Has Loading Dock**: `true` (CHECKED - Required for cargo matching)
❌ **Has Refrigeration**: `false` (UNCHECKED)
❌ **Has Hazmat Permit**: `false` (UNCHECKED)

### Additional Equipment (Optional - can leave unchecked)
- Has Side Rails: `false`
- Has Tarps: `false`
- Has Straps: `false`
- Has Chains: `false`
- Has Winch: `false`
- Has Ram: `false`
- Has Tail Lift: `true` (CHECKED - this is the lift gate)
- Has Side Lift: `false`
- Has Roller Bed: `false`
- Has Drop Deck: `false`
- Has Extendable: `false`
- Has Lowbed: `false`
- Has Step Deck: `false`
- Has Power Only: `false`
- Has Container Chassis: `false`

### Cargo Type Capabilities (Optional)
- Has Tanker: `false`
- Has Bulk: `false`
- Has Refrigerated: `false`
- Has Heated: `false`
- Has Ventilated: `false`
- Has Curtain Side: `false`
- Has Box: `false`
- Has Van: `true` (CHECKED - matches truck type)
- Has Platform: `false`
- Has Car Carrier: `false`
- Has Heavy Haul: `false`
- Has Oversized: `false`
- Has Hazmat: `false`
- Has Dangerous Goods: `false`
- Has Food Grade: `false`
- Has Pharmaceutical: `false`
- Has Liquid: `false`
- Has Dry Bulk: `false`
- Has Gas: `false`
- Has Chemical: `false`
- Has Waste: `false`

### Temperature Control (Optional)
- Has Reefer: `false`
- Has Frozen: `false`
- Has Chilled: `false`
- Has Ambient: `false`
- Has Controlled Atmosphere: `false`
- Has Humidity Control: `false`
- Has Temperature Monitoring: `false`

### Technology & Tracking (Important for matching)
✅ **Has GPS**: `true` (CHECKED - Required)
✅ **Has Tracking**: `true` (CHECKED)
✅ **Has Telematics**: `true` (CHECKED)
✅ **Has ELD**: `true` (CHECKED)
✅ **Has Dash Cam**: `true` (CHECKED)
✅ **Has Safety Cameras**: `true` (CHECKED)
✅ **Has Cargo Monitoring**: `true` (CHECKED)
✅ **Has Weight Monitoring**: `true` (CHECKED)
✅ **Has Volume Monitoring**: `true` (CHECKED)

### Status
- **Status**: `AVAILABLE` (select from dropdown)
- **Is Active**: `true` (CHECKED)

---

## 📦 CARGO DETAILS (for deborah@gmail.com)

### Basic Information (Required Fields)
- **Title**: `Electronics Shipment - Nairobi to Mombasa`
- **Description**: `High-value electronics shipment requiring careful handling and lift gate access`
- **Cargo Type**: `FRAGILE` (select from dropdown - this is for electronics)
- **Weight (kg)**: `15000`
- **Volume (cubic meters)**: `50`
- **Load Type**: `FTL` (Full Truck Load)
- **Equipment Type**: `DRY_VAN`
- **Visibility**: `public`
- **Units Required**: `1`

### Dates (Required)
- **Pickup Date**: `2025-11-28` (2 days from today, or any future date)
- **Delivery Date**: `2025-12-01` (5 days from today, or any future date)

### Financial Information
- **Load Value**: `500000` (in USD)
- **Currency Code**: `USD`
- **Payment Terms**: `Net30`
- **Offered Price**: `0` (optional, can leave empty)

### Special Requirements (Important for matching)
✅ **Is Fragile**: `true` (CHECKED - matches truck's fragile handling capability)
✅ **Requires Forklift**: `true` (CHECKED - matches truck's forklift capability)
✅ **Requires Loading Dock**: `true` (CHECKED - matches truck's loading dock capability)
✅ **Requires GPS Monitoring**: `true` (CHECKED - matches truck's GPS capability)
❌ **Is Hazardous**: `false` (UNCHECKED)
❌ **Requires Refrigeration**: `false` (UNCHECKED)
✅ **Is Stackable**: `true` (CHECKED)
❌ **Requires Humidity Control**: `false` (UNCHECKED)
❌ **Requires Crane**: `false` (UNCHECKED)
❌ **Is Time Critical**: `false` (UNCHECKED)
❌ **Requires Temperature Monitoring**: `false` (UNCHECKED)
❌ **Requires Low Clearance Route**: `false` (UNCHECKED)
❌ **Requires Escort Vehicle**: `false` (UNCHECKED)
✅ **Requires Pre-Shipment Inspection**: `true` (CHECKED)
✅ **Requires Delivery Inspection**: `true` (CHECKED)
✅ **Requires Photographic Documentation**: `true` (CHECKED)

### Urgency Level
- **Urgency Level**: `NORMAL` (select from dropdown)

### Contact Information
- **Contact Person**: `Deborah Smith`
- **Contact Phone**: `+254-712-345-678`
- **Contact Email**: `deborah@gmail.com`

### Pickup Location (Required)
- **Location Name**: `Nairobi Warehouse`
- **Address**: `Industrial Area, Nairobi, Kenya`
- **Latitude**: `-1.2921`
- **Longitude**: `36.8219`
- **Contact Person**: `Warehouse Manager`
- **Contact Phone**: `+254-712-345-678`
- **Contact Email**: `warehouse@example.com`
- **Access Instructions**: `Use main gate, lift gate required for loading`
- **Special Instructions**: `Fragile cargo - handle with care`
- **Scheduled Date**: `2025-11-28` (same as pickup date)
- **Estimated Time (minutes)**: `120`

### Pickup Location Requirements
✅ **Requires Forklift**: `true` (CHECKED)
✅ **Requires Loading Dock**: `true` (CHECKED)
❌ **Requires Crane**: `false` (UNCHECKED)
❌ **Hazmat Certified**: `false` (UNCHECKED)
❌ **Temperature Controlled**: `false` (UNCHECKED)
- **Security Clearance**: `STANDARD`

### Delivery Location (Required)
- **Location Name**: `Mombasa Distribution Center`
- **Address**: `Port Road, Mombasa, Kenya`
- **Latitude**: `-4.0435`
- **Longitude**: `39.6682`
- **Contact Person**: `Distribution Manager`
- **Contact Phone**: `+254-712-345-679`
- **Contact Email**: `distribution@example.com`
- **Access Instructions**: `Use side entrance, lift gate required for unloading`
- **Special Instructions**: `Deliver during business hours only`
- **Scheduled Date**: `2025-12-01` (same as delivery date)
- **Estimated Time (minutes)**: `120`

### Delivery Location Requirements
✅ **Requires Forklift**: `true` (CHECKED)
✅ **Requires Loading Dock**: `true` (CHECKED)
❌ **Requires Crane**: `false` (UNCHECKED)
❌ **Hazmat Certified**: `false` (UNCHECKED)
❌ **Temperature Controlled**: `false` (UNCHECKED)
- **Security Clearance**: `STANDARD`

### Loading/Unloading Instructions
- **Loading Instructions**: `Handle with care, use forklift, requires lift gate for loading.`
- **Unloading Instructions**: `Requires lift gate for unloading, deliver to warehouse bay 3.`
- **Special Handling Instructions**: `Keep upright, do not drop.`

### Matching Settings (Important!)
✅ **Auto Match Enabled**: `true` (CHECKED - This enables automatic matching)

### Truck Requirements (Important for matching)
- **Min Capacity Weight (kg)**: `15000`
- **Min Capacity Volume (m³)**: `40`
- **Required Truck Types**: `VAN` (select from dropdown or enter as array)
- **Required Features**: `LIFT_GATE`, `FORKLIFT`, `GPS` (enter as comma-separated or array)

### Additional Information (Optional)
- **Number of Pieces**: `100`
- **Number of Pallets**: `10`
- **Packaging Type**: `PALLETIZED` (select from dropdown)
- **Length (meters)**: `13.6` (optional)
- **Width (meters)**: `2.5` (optional)
- **Height (meters)**: `2.7` (optional)

---

## ✅ Matching Criteria Summary

The truck and cargo will match because:

1. **Weight**: Truck capacity (25,000 kg) >= Cargo weight (15,000 kg) ✅
2. **Volume**: Truck capacity (80 m³) >= Cargo volume (50 m³) ✅
3. **Truck Type**: Truck is VAN, cargo requires VAN ✅
4. **Lift Gate**: Truck has lift gate, cargo requires lift gate (via access instructions) ✅
5. **Forklift**: Truck has forklift, cargo requires forklift ✅
6. **Loading Dock**: Truck has loading dock, cargo requires loading dock ✅
7. **GPS**: Truck has GPS, cargo requires GPS monitoring ✅
8. **Status**: Truck is AVAILABLE and ACTIVE ✅
9. **Cargo Type**: Truck supports FRAGILE cargo, cargo is FRAGILE ✅
10. **Auto-Match**: Cargo has auto-match enabled ✅

---

## 📝 Notes

1. **Volume Units**: The frontend may show "cubic ft" but the backend uses m³. Use the values as specified (80 m³ for truck, 50 m³ for cargo).

2. **Lift Gate Requirement**: The cargo's lift gate requirement is specified in the location's `accessInstructions` field, not as a direct cargo field. The matching system checks if the truck has `hasLiftGate: true` against the location requirements.

3. **Dates**: Use future dates (at least 2 days from today for pickup, 5 days for delivery).

4. **Coordinates**: Use the exact coordinates provided for Nairobi and Mombasa to ensure proper location matching.

5. **Required Features**: When entering "Required Features" for the cargo, you may need to enter them as an array or comma-separated string depending on the form implementation.

6. **Truck Owner**: Make sure you're logged in as `truck.owner@test.com` when creating the truck.

7. **Cargo Owner**: Make sure you're logged in as `deborah@gmail.com` when creating the cargo.

---

## 🚀 After Creation

Once both are created:
1. The cargo should automatically match to the truck if auto-match is enabled
2. Check the matching interface to see the match
3. The match score should be high (close to 100%) because all criteria are met

