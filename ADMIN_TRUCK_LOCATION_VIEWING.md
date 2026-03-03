# Admin Truck Location Viewing Feature

## Overview

Super admins can now view truck locations in the Admin Trucks page. The system displays GPS coordinates and provides quick access to view locations on Google Maps.

## Features Implemented

### Backend Enhancements

**File**: `urutix/backend/src/modules/admin/admin.service.ts`

1. **Enhanced `listAllTrucks` Method**
   - Added relations loading for `currentDriver` and `owner`
   - Parses PostGIS Point objects to readable coordinates
   - Formats location data for frontend consumption
   - Returns additional fields:
     - `currentLocationString`: Human-readable coordinates (e.g., "40.7128, -74.0060")
     - `coordinates`: Object with `latitude` and `longitude`
     - `ownerName`: Formatted owner name
     - `currentDriverName`: Formatted driver name

2. **Location Data Format**
   ```typescript
   {
     currentLocationString: "40.7128, -74.0060",
     coordinates: {
       latitude: 40.7128,
       longitude: -74.0060
     },
     locationUpdatedAt: "2026-02-12T10:30:00Z"
   }
   ```

### Frontend Enhancements

**File**: `urutix/frontend/src/pages/AdminTrucks.tsx`

1. **Updated Truck Interface**
   - Added `currentLocationString` field
   - Added `coordinates` object with latitude/longitude
   - Added `locationUpdatedAt` timestamp

2. **Truck Table Display**
   - Shows location coordinates below truck performance metrics
   - Displays location with red map marker icon
   - Truncates long coordinates with tooltip showing full value

3. **Map View Button in Actions**
   - Green map marker button appears for trucks with location data
   - Opens Google Maps in new tab with truck coordinates
   - Hover shows "View Location on Map" tooltip

4. **Details Modal Enhancement**
   - Shows formatted location coordinates
   - Includes "View Map" link that opens Google Maps
   - Only shows map link if coordinates are available

## How It Works

### Location Data Flow

1. **Storage**: Truck locations are stored in PostgreSQL using PostGIS Point geometry
   - Format: `{ type: 'Point', coordinates: [longitude, latitude] }`
   - SRID: 4326 (WGS 84 - standard GPS coordinates)

2. **Backend Processing**: Admin service parses PostGIS data
   ```typescript
   const [lng, lat] = location.coordinates;
   currentLocationString = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
   coordinates = { latitude: lat, longitude: lng };
   ```

3. **Frontend Display**: Shows coordinates and provides map links
   ```typescript
   window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
   ```

## Usage

### Viewing Truck Locations

1. **In Truck Table**:
   - Location appears below performance metrics (if available)
   - Format: "40.7128, -74.0060" with map marker icon
   - Hover to see full coordinates

2. **Quick Map View**:
   - Click green map marker button in Actions column
   - Opens Google Maps in new tab
   - Shows exact truck location

3. **In Details Modal**:
   - Click "View Details" (eye icon) on any truck
   - Location shown in truck information section
   - Click "View Map" link to open Google Maps

### Location Update Tracking

- `locationUpdatedAt` field shows when location was last updated
- Useful for determining if location data is current
- Can be displayed in future enhancements

## Location Data Sources

Truck locations can be updated from:

1. **Real-time Tracking**: GPS devices sending location updates
2. **Driver App**: Mobile app reporting location during trips
3. **Manual Updates**: Admin or owner manually setting location
4. **Trip Tracking**: Automatic updates during active trips

## Permissions

- **Super Admin**: Can view all truck locations across all tenants
- **Tenant Admin**: Can view trucks within their tenant (via tenant filter)
- **Truck Owner**: Can view their own trucks (not in admin panel)

## Technical Details

### Database Schema

```sql
-- Truck entity location fields
currentLocation GEOMETRY(Point, 4326) NULL,
locationUpdatedAt TIMESTAMP NULL
```

### API Response Format

```json
{
  "trucks": [
    {
      "id": "uuid",
      "plateNumber": "ABC-123",
      "currentLocationString": "40.7128, -74.0060",
      "coordinates": {
        "latitude": 40.7128,
        "longitude": -74.0060
      },
      "locationUpdatedAt": "2026-02-12T10:30:00Z",
      "ownerName": "John Doe",
      "currentDriverName": "Jane Smith"
    }
  ]
}
```

## Future Enhancements

### Planned Features

1. **Map View Mode**
   - Toggle between table and map view
   - Show all trucks on interactive map
   - Cluster markers for better visualization
   - Filter trucks by location/region

2. **Location History**
   - View truck movement history
   - Playback route over time
   - Export location data

3. **Geofencing**
   - Set up geographic boundaries
   - Alerts when trucks enter/exit zones
   - Compliance monitoring

4. **Location Freshness Indicator**
   - Color-coded indicators for location age
   - Green: Updated within 5 minutes
   - Yellow: Updated within 1 hour
   - Red: Stale (over 1 hour old)

5. **Batch Location Updates**
   - Import locations from CSV
   - Bulk update via API
   - Integration with fleet management systems

## Troubleshooting

### Location Not Showing

**Possible Causes**:
1. Truck has no location data in database
2. Location data is in wrong format
3. PostGIS extension not installed

**Solutions**:
1. Check if `currentLocation` field is populated
2. Verify PostGIS Point format: `{ type: 'Point', coordinates: [lng, lat] }`
3. Ensure PostgreSQL has PostGIS extension enabled

### Map Link Not Working

**Possible Causes**:
1. Coordinates are null or undefined
2. Browser blocking popups
3. Invalid coordinate format

**Solutions**:
1. Check browser console for errors
2. Allow popups for the application
3. Verify coordinates are valid numbers

### Location Parsing Errors

**Check Backend Logs**:
```
Failed to parse location for truck {id}: [error details]
```

**Common Issues**:
- Coordinates array is empty
- Wrong coordinate order (should be [lng, lat])
- Non-numeric values in coordinates

## Related Files

### Backend
- `urutix/backend/src/modules/admin/admin.service.ts` - Location formatting logic
- `urutix/backend/src/entities/truck.entity.ts` - Truck entity with location fields
- `urutix/backend/src/modules/tracking/tracking.service.ts` - Location update logic

### Frontend
- `urutix/frontend/src/pages/AdminTrucks.tsx` - Admin trucks page with location display
- `urutix/frontend/src/services/adminApi.ts` - API calls for truck data

## Testing

### Manual Testing Steps

1. **View Location in Table**:
   - Navigate to Admin > Trucks
   - Find truck with location data
   - Verify coordinates are displayed
   - Check map marker icon appears

2. **Test Map View**:
   - Click green map marker button
   - Verify Google Maps opens in new tab
   - Confirm location is correct on map

3. **Test Details Modal**:
   - Click eye icon on truck with location
   - Verify location shows in details
   - Click "View Map" link
   - Confirm map opens correctly

4. **Test Without Location**:
   - Find truck without location data
   - Verify "N/A" is shown
   - Confirm no map button appears

## Status

✅ **IMPLEMENTED** - Super admins can now view truck locations with map integration.

All features are working and tested. Location data is properly formatted and displayed with easy access to Google Maps for detailed viewing.
