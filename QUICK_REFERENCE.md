# Quick Reference - Matching Truck & Cargo

## 🚛 TRUCK (truck.owner@test.com)

| Field | Value |
|-------|-------|
| **License Plate** | `MATCH-001` |
| **VIN** | `MATCH001TRUCK2024` |
| **Make** | `Mercedes-Benz` |
| **Model** | `Actros 2651` |
| **Year** | `2023` |
| **Color** | `Blue` |
| **Fuel Type** | `DIESEL` |
| **Capacity Weight (kg)** | `25000` |
| **Capacity Volume** | `80` |
| **Registration Number** | `REG-MATCH-001` |
| **Registration Expiry** | `2026-12-31` |
| **Insurance Policy** | `INS-MATCH-001` |
| **Insurance Expiry** | `2026-12-31` |
| **Mileage** | `10000` |
| **Truck Type** | `VAN` |
| **Status** | `AVAILABLE` |
| **Has Lift Gate** | ✅ `true` |
| **Has GPS** | ✅ `true` |
| **Has Forklift** | ✅ `true` |
| **Has Loading Dock** | ✅ `true` |

---

## 📦 CARGO (deborah@gmail.com)

| Field | Value |
|-------|-------|
| **Title** | `Electronics Shipment - Nairobi to Mombasa` |
| **Description** | `High-value electronics shipment requiring careful handling and lift gate access` |
| **Cargo Type** | `FRAGILE` |
| **Weight (kg)** | `15000` |
| **Volume (m³)** | `50` |
| **Load Type** | `FTL` |
| **Equipment Type** | `DRY_VAN` |
| **Pickup Date** | `2025-11-28` (or 2 days from today) |
| **Delivery Date** | `2025-12-01` (or 5 days from today) |
| **Load Value** | `500000` |
| **Currency Code** | `USD` |
| **Payment Terms** | `Net30` |
| **Is Fragile** | ✅ `true` |
| **Requires Forklift** | ✅ `true` |
| **Requires Loading Dock** | ✅ `true` |
| **Requires GPS Monitoring** | ✅ `true` |
| **Auto Match Enabled** | ✅ `true` |
| **Min Capacity Weight** | `15000` |
| **Min Capacity Volume** | `40` |
| **Required Truck Types** | `VAN` |
| **Required Features** | `LIFT_GATE, FORKLIFT, GPS` |

### Pickup Location
- **Name**: `Nairobi Warehouse`
- **Address**: `Industrial Area, Nairobi, Kenya`
- **Latitude**: `-1.2921`
- **Longitude**: `36.8219`
- **Access Instructions**: `Use main gate, lift gate required for loading`

### Delivery Location
- **Name**: `Mombasa Distribution Center`
- **Address**: `Port Road, Mombasa, Kenya`
- **Latitude**: `-4.0435`
- **Longitude**: `39.6682`
- **Access Instructions**: `Use side entrance, lift gate required for unloading`

---

## ✅ Why They Match

- ✅ Weight: 25,000 kg (truck) >= 15,000 kg (cargo)
- ✅ Volume: 80 m³ (truck) >= 50 m³ (cargo)
- ✅ Truck Type: VAN matches VAN requirement
- ✅ Lift Gate: Truck has it, cargo needs it
- ✅ Forklift: Truck has it, cargo needs it
- ✅ Loading Dock: Truck has it, cargo needs it
- ✅ GPS: Truck has it, cargo needs it
- ✅ Status: Truck is AVAILABLE
- ✅ Auto-Match: Enabled on cargo

