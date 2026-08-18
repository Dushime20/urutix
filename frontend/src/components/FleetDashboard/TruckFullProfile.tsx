import React, { useMemo } from 'react';
import { flattenComplianceDocuments } from '../../utils/vehicleComplianceDocuments';

interface TruckFullProfileProps {
  truck: Record<string, any> | null | undefined;
  compact?: boolean;
}

const HIDDEN_ROOT_KEYS = new Set([
  'id',
  'tenantId',
  'ownerId',
  'owner',
  'currentDriver',
  'currentDriverId',
  'currentTripId',
  'deletedAt',
  'type',
  'name',
  'licensePlate',
  'capacity',
  'documents',
  'maintenance',
  'inspections',
  'fuel',
  'tires',
  'compliance',
]);

function isEmptyValue(value: any): boolean {
  if (value === undefined || value === null || value === '') return true;
  if (typeof value === 'boolean') return false;
  if (typeof value === 'number') return Number.isNaN(value);
  if (Array.isArray(value)) return value.length === 0 || value.every(isEmptyValue);
  if (typeof value === 'object') {
    if (value instanceof Date) return Number.isNaN(value.getTime());
    return Object.values(value).every(isEmptyValue);
  }
  return false;
}

function prettyLabel(key: string): string {
  return key
    .replace(/^has/, '')
    .replace(/^supports/, '')
    .replace(/^max/, '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (s) => s.toUpperCase());
}

function formatScalar(value: any): string {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number.isInteger(value) ? value.toLocaleString() : Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      }
    }
    if (/^[A-Z0-9_]+$/.test(value) && value.includes('_')) return value.replace(/_/g, ' ');
    return value;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === 'object' ? JSON.stringify(item) : formatScalar(item))).join(', ');
  }
  return String(value);
}

function locationText(truck: Record<string, any>): string {
  const loc = truck.currentLocation;
  if (typeof loc === 'string' && loc.trim()) return loc;
  if (loc?.address) return loc.address;
  if (truck.currentAddress) return truck.currentAddress;
  if (truck.currentLocationString) return truck.currentLocationString;
  const coords = loc?.coordinates || truck.coordinates;
  if (Array.isArray(coords) && coords.length >= 2) return `${coords[1]}, ${coords[0]}`;
  if (coords?.latitude != null && coords?.longitude != null) return `${coords.latitude}, ${coords.longitude}`;
  return '';
}

function FlagChips({ flags }: { flags: Array<{ key: string; label?: string; value?: any }> }) {
  const active = flags.filter((flag) => Boolean(flag.value));
  if (active.length === 0) return <p className="text-xs text-gray-400 dark:text-gray-500">None recorded</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {active.map((flag) => (
        <span
          key={flag.key}
          className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50 text-[9px] font-black uppercase tracking-widest"
        >
          {flag.label || prettyLabel(flag.key)}
        </span>
      ))}
    </div>
  );
}

function InfoGrid({ items }: { items: Array<{ label: string; value: any }> }) {
  const rows = items.filter((item) => !isEmptyValue(item.value));
  if (rows.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
      {rows.map((item) => (
        <div key={item.label} className="min-w-0">
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
            {item.label}
          </p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white break-words">
            {formatScalar(item.value)}
          </p>
        </div>
      ))}
    </div>
  );
}

function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  if (!children) return null;
  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
      <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
        {title}
      </h3>
      {children}
    </section>
  );
}

function ObjectFields({ data, hideEmpty = true }: { data: Record<string, any>; hideEmpty?: boolean }) {
  const entries = Object.entries(data || {}).filter(([, value]) => {
    if (typeof value === 'object' && value !== null && !(value instanceof Date) && !Array.isArray(value)) {
      return false;
    }
    return hideEmpty ? !isEmptyValue(value) : true;
  });
  if (entries.length === 0) return null;
  const flags = entries.filter(([, value]) => typeof value === 'boolean');
  const rest = entries.filter(([, value]) => typeof value !== 'boolean');
  return (
    <div className="space-y-4">
      {rest.length > 0 && (
        <InfoGrid items={rest.map(([key, value]) => ({ label: prettyLabel(key), value }))} />
      )}
      {flags.length > 0 && (
        <FlagChips flags={flags.map(([key, value]) => ({ key, value }))} />
      )}
    </div>
  );
}

export const TruckFullProfile: React.FC<TruckFullProfileProps> = ({ truck, compact = false }) => {
  const data = truck || {};
  const details = data.assetDetails && typeof data.assetDetails === 'object' ? data.assetDetails : {};
  const cargo = data.cargoCapabilities && typeof data.cargoCapabilities === 'object' ? data.cargoCapabilities : {};
  const loading = data.loadingCapabilities && typeof data.loadingCapabilities === 'object' ? data.loadingCapabilities : {};
  const security = data.securityFeatures && typeof data.securityFeatures === 'object' ? data.securityFeatures : {};
  const certs = data.certifications && typeof data.certifications === 'object' ? data.certifications : {};
  const routes = data.routeCapabilities && typeof data.routeCapabilities === 'object' ? data.routeCapabilities : {};
  const costs = data.costStructure && typeof data.costStructure === 'object' ? data.costStructure : {};
  const complianceDocs = flattenComplianceDocuments(data.complianceDocuments);
  const photos: any[] = Array.isArray(details.photos) ? details.photos : [];
  const claims: any[] = Array.isArray(details.insuranceClaims) ? details.insuranceClaims : [];
  const contacts: any[] = Array.isArray(data.emergencyContacts) ? data.emergencyContacts : [];
  const assignedDrivers: any[] = Array.isArray(data.assignedDrivers) ? data.assignedDrivers : [];
  const assignedRoutes: any[] = Array.isArray(data.assignedRoutes) ? data.assignedRoutes : [];

  const leftover = useMemo(() => {
    const known = new Set([
      ...HIDDEN_ROOT_KEYS,
      'plateNumber', 'vin', 'make', 'model', 'year', 'color', 'manufacturer', 'chassis',
      'status', 'availabilityStatus', 'ownershipType', 'vehicleClass', 'truckType', 'trailerType',
      'fleetGroup', 'businessUnit', 'costCenter', 'chassisConfiguration', 'fuelType',
      'capacityWeight', 'capacityVolume', 'maxLength', 'maxWidth', 'maxHeight', 'mileage',
      'registrationNumber', 'registrationExpiry', 'insurancePolicy', 'insuranceExpiry',
      'roadworthyCertExpiry', 'dotNumber', 'mcNumber', 'operatingAuthority', 'crossBorderPermit',
      'customsBond', 'portAuthorization', 'axleConfiguration', 'fuelTankCapacity', 'engineModel',
      'horsepower', 'torque', 'transmission', 'grossVehicleWeight', 'fuelEfficiency',
      'lastMaintenanceDate', 'nextMaintenanceDate', 'driverRequirements', 'operationalRestrictions',
      'createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'isActive', 'totalTrips', 'totalRevenue',
      'averageRating', 'currentLocation', 'currentAddress', 'currentLocationString', 'coordinates',
      'locationUpdatedAt', 'estimatedAvailableTime',
      'assetDetails', 'complianceDocuments', 'cargoCapabilities', 'loadingCapabilities',
      'securityFeatures', 'certifications', 'routeCapabilities', 'costStructure',
      'emergencyContacts', 'assignedDrivers', 'assignedRoutes', 'equipmentList',
      'insuranceAlerts', 'maintenanceAlerts', 'inspectionAlerts', 'fuelAlerts', 'tireAlerts',
      'complianceAlerts',
      'hasRefrigeration', 'hasLiftGate', 'hasGps', 'hasGPS', 'hasHazmatPermit',
      'hasSideRails', 'hasTarps', 'hasStraps', 'hasChains', 'hasWinch', 'hasRam', 'hasTailLift',
      'hasSideLift', 'hasRollerBed', 'hasDropDeck', 'hasExtendable', 'hasLowbed', 'hasStepDeck',
      'hasPowerOnly', 'hasContainerChassis', 'hasTanker', 'hasBulk', 'hasRefrigerated', 'hasHeated',
      'hasVentilated', 'hasCurtainSide', 'hasBox', 'hasVan', 'hasPlatform', 'hasCarCarrier',
      'hasHeavyHaul', 'hasOversized', 'hasHazmat', 'hasDangerousGoods', 'hasFoodGrade',
      'hasPharmaceutical', 'hasLiquid', 'hasDryBulk', 'hasGas', 'hasChemical', 'hasWaste',
      'hasReefer', 'hasFrozen', 'hasChilled', 'hasAmbient', 'hasControlledAtmosphere',
      'hasHumidityControl', 'hasTemperatureMonitoring', 'hasTracking', 'hasTelematics', 'hasELD',
      'hasDashCam', 'hasSafetyCameras', 'hasCollisionAvoidance', 'hasLaneDeparture',
      'hasAdaptiveCruise', 'hasBlindSpot', 'hasBackupCamera', 'hasTirePressureMonitoring',
      'hasEngineMonitoring', 'hasFuelMonitoring', 'hasMaintenanceAlerts', 'hasDriverMonitoring',
      'hasFatigueMonitoring', 'hasSpeedMonitoring', 'hasIdleMonitoring', 'hasRouteOptimization',
      'hasRealTimeTracking', 'hasGeofencing', 'hasTemperatureAlerts', 'hasHumidityAlerts',
      'hasShockMonitoring', 'hasTiltMonitoring', 'hasDoorMonitoring', 'hasCargoMonitoring',
      'hasWeightMonitoring', 'hasVolumeMonitoring', 'hasPressureMonitoring', 'hasFlowMonitoring',
      'hasLevelMonitoring', 'hasQualityMonitoring', 'hasContaminationMonitoring',
      'hasLeakDetection', 'hasOverfillProtection', 'hasEmergencyShutdown', 'hasFireSuppression',
      'hasExplosionProof', 'hasCorrosionResistant', 'hasStainlessSteel', 'hasAluminum',
      'hasCarbonSteel', 'hasFiberglass', 'hasPlastic', 'hasComposite', 'hasInsulated',
      'hasForklift', 'hasCrane', 'hasLoadingDock',
    ]);
    return Object.entries(data).filter(([key, value]) => !known.has(key) && !isEmptyValue(value));
  }, [data]);

  const equipmentFlags = [
    'hasForklift', 'hasCrane', 'hasLoadingDock', 'hasLiftGate', 'hasTailLift', 'hasSideLift',
    'hasRollerBed', 'hasDropDeck', 'hasExtendable', 'hasLowbed', 'hasStepDeck', 'hasPowerOnly',
    'hasContainerChassis', 'hasSideRails', 'hasTarps', 'hasStraps', 'hasChains', 'hasWinch', 'hasRam',
  ].map((key) => ({ key, value: data[key] || loading[key] }));

  const cargoFlags = [
    'hasTanker', 'hasBulk', 'hasRefrigerated', 'hasHeated', 'hasVentilated', 'hasCurtainSide',
    'hasBox', 'hasVan', 'hasPlatform', 'hasCarCarrier', 'hasHeavyHaul', 'hasOversized', 'hasHazmat',
    'hasDangerousGoods', 'hasFoodGrade', 'hasPharmaceutical', 'hasLiquid', 'hasDryBulk', 'hasGas',
    'hasChemical', 'hasWaste', 'hasReefer', 'hasFrozen', 'hasChilled', 'hasAmbient',
    'hasControlledAtmosphere', 'hasHumidityControl', 'hasTemperatureMonitoring',
  ].map((key) => ({ key, value: data[key] || cargo[key] }));

  if (!truck) {
    return <p className="text-sm text-gray-400">No truck data available.</p>;
  }

  return (
    <div className={`space-y-5 ${compact ? 'text-[13px]' : ''}`}>
      <ProfileSection title="Basic Information">
        <InfoGrid
          items={[
            { label: 'Plate Number', value: data.plateNumber },
            { label: 'VIN', value: data.vin },
            { label: 'Registration Code', value: data.registrationNumber },
            { label: 'Manufacturer', value: data.manufacturer },
            { label: 'Make', value: data.make },
            { label: 'Model', value: data.model },
            { label: 'Year', value: data.year },
            { label: 'Color', value: data.color },
            { label: 'Chassis', value: data.chassis },
            { label: 'Vehicle Status', value: data.status },
            { label: 'Availability', value: data.availabilityStatus },
            { label: 'Ownership', value: data.ownershipType },
            { label: 'Class', value: data.vehicleClass },
            { label: 'Type', value: data.truckType },
            { label: 'Fleet Group', value: data.fleetGroup },
            { label: 'Business Unit', value: data.businessUnit },
            { label: 'Cost Center', value: data.costCenter },
            { label: 'Home Terminal', value: details.homeTerminal },
          ]}
        />
      </ProfileSection>

      {photos.length > 0 && (
        <ProfileSection title="Vehicle Photos">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {photos.map((photo, index) => (
              <div key={photo.documentId || photo.fileName || index} className="rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden bg-gray-50 dark:bg-gray-800/50 p-3">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">
                  {photo.fileName || `Photo ${index + 1}`}
                </p>
                {photo.documentId && (
                  <p className="text-[9px] text-gray-400 mt-1 truncate">ID {photo.documentId}</p>
                )}
              </div>
            ))}
          </div>
        </ProfileSection>
      )}

      <ProfileSection title="Legal & Compliance">
        <div className="space-y-4">
          <InfoGrid
            items={[
              { label: 'Insurance Policy ID', value: data.insurancePolicy || data.complianceDocuments?.insurance?.number },
              { label: 'Insurance Status', value: data.complianceDocuments?.insurance?.status },
              { label: 'Insurance Issuer', value: data.complianceDocuments?.insurance?.issuingAuthority },
              { label: 'Insurance Issue Date', value: data.complianceDocuments?.insurance?.issueDate },
              { label: 'Insurance Expiry', value: data.insuranceExpiry || data.complianceDocuments?.insurance?.expiryDate },
              { label: 'Registry Expiry', value: data.registrationExpiry },
              { label: 'Roadworthy Expiry', value: data.roadworthyCertExpiry || data.complianceDocuments?.roadworthy?.expiryDate },
              { label: 'DOT Number', value: data.dotNumber },
              { label: 'MC Number', value: data.mcNumber },
              { label: 'Operating Authority', value: data.operatingAuthority },
              { label: 'Cross-Border Permit', value: data.crossBorderPermit },
              { label: 'Customs Bond', value: data.customsBond },
              { label: 'Port Authorization', value: data.portAuthorization },
            ]}
          />
          {complianceDocs.length > 0 && (
            <div className="space-y-2">
              {complianceDocs.map(({ title, record }, idx) => (
                <div key={`${title}-${idx}`} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                      {[record.number, record.issuingAuthority, record.fileName].filter(Boolean).join(' · ') || 'On file'}
                    </p>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 shrink-0">
                    {record.status || 'Valid'}
                    {record.expiryDate ? ` · Exp ${formatScalar(record.expiryDate)}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </ProfileSection>

      {claims.length > 0 && (
        <ProfileSection title="Insurance Claims">
          <div className="space-y-2">
            {claims.map((claim, index) => (
              <div key={claim.claimNumber || index} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                <InfoGrid
                  items={[
                    { label: 'Claim Number', value: claim.claimNumber },
                    { label: 'Incident Date', value: claim.incidentDate },
                    { label: 'Amount', value: claim.amount },
                    { label: 'Status', value: claim.status },
                    { label: 'Description', value: claim.description },
                  ]}
                />
              </div>
            ))}
          </div>
        </ProfileSection>
      )}

      <ProfileSection title="Specifications">
        <InfoGrid
          items={[
            { label: 'Chassis Config', value: data.chassisConfiguration },
            { label: 'Architecture Type', value: data.trailerType },
            { label: 'Payload', value: data.capacityWeight != null ? `${Number(data.capacityWeight).toLocaleString()} kg` : '' },
            { label: 'Volume', value: data.capacityVolume != null ? `${Number(data.capacityVolume).toLocaleString()} m³` : '' },
            { label: 'Length', value: data.maxLength != null ? `${data.maxLength} m` : cargo.maxLengthCapacity },
            { label: 'Width', value: data.maxWidth != null ? `${data.maxWidth} m` : cargo.maxWidthCapacity },
            { label: 'Height', value: data.maxHeight != null ? `${data.maxHeight} m` : cargo.maxHeightCapacity },
            { label: 'Axle Configuration', value: data.axleConfiguration },
            { label: 'Fuel Tank', value: data.fuelTankCapacity != null ? `${data.fuelTankCapacity} L` : '' },
            { label: 'Odometer', value: data.mileage != null ? `${Number(data.mileage).toLocaleString()} km` : '' },
            { label: 'Engine', value: data.engineModel },
            { label: 'Horsepower', value: data.horsepower },
            { label: 'Torque', value: data.torque },
            { label: 'Transmission', value: data.transmission },
            { label: 'Propulsion', value: data.fuelType },
            { label: 'GVW', value: data.grossVehicleWeight != null ? `${Number(data.grossVehicleWeight).toLocaleString()} kg` : '' },
            { label: 'Fuel Efficiency', value: data.fuelEfficiency != null ? `${data.fuelEfficiency} km/l` : '' },
            { label: 'Trailer Compatibility', value: details.trailerCompatibility },
            { label: 'Fifth Wheel', value: details.fifthWheel },
            { label: 'Battery Capacity', value: details.batteryCapacity },
            { label: 'Charging Type', value: details.chargingType },
            { label: 'Charging Speed', value: details.chargingSpeed },
            { label: 'Operating Range', value: details.operatingRange },
            { label: 'CO2 Emissions', value: details.co2Emissions },
            { label: 'Emission Standard', value: details.emissionStandard },
            { label: 'Euro Rating', value: details.euroRating },
          ]}
        />
      </ProfileSection>

      <ProfileSection title="Cargo Capabilities">
        <div className="space-y-4">
          {Array.isArray(cargo.supportedCargoTypes) && cargo.supportedCargoTypes.length > 0 && (
            <FlagChips flags={cargo.supportedCargoTypes.map((type: string) => ({ key: type, label: prettyLabel(type), value: true }))} />
          )}
          <InfoGrid
            items={[
              { label: 'Temp Min', value: cargo.temperatureRange?.min },
              { label: 'Temp Max', value: cargo.temperatureRange?.max },
              { label: 'Humidity Control', value: cargo.humidityControl },
              { label: 'Max Weight', value: cargo.maxWeight },
              { label: 'Max Volume', value: cargo.maxVolumeCapacity || cargo.maxVolume },
              { label: 'Max Axle Weight', value: cargo.maxWeightPerAxle },
              { label: 'Clearance Height', value: cargo.maxClearanceHeight },
              { label: 'Stackable Height', value: cargo.maxStackableHeight },
            ]}
          />
          <FlagChips
            flags={[
              ...cargoFlags,
              { key: 'maxFragileHandling', value: cargo.maxFragileHandling, label: 'Fragile' },
              { key: 'maxHazardousHandling', value: cargo.maxHazardousHandling, label: 'Hazardous' },
              { key: 'maxRefrigeratedHandling', value: cargo.maxRefrigeratedHandling, label: 'Refrigerated' },
              { key: 'maxLiquidHandling', value: cargo.maxLiquidHandling, label: 'Liquid' },
              { key: 'maxOversizedHandling', value: cargo.maxOversizedHandling, label: 'Oversized' },
              { key: 'maxValuableHandling', value: cargo.maxValuableHandling, label: 'Valuable' },
            ]}
          />
        </div>
      </ProfileSection>

      <ProfileSection title="Loading Equipment">
        <div className="space-y-4">
          <FlagChips flags={equipmentFlags} />
          <InfoGrid
            items={[
              { label: 'Load Time (min)', value: loading.maxLoadingTime },
              { label: 'Unload Time (min)', value: loading.maxUnloadingTime },
            ]}
          />
        </div>
      </ProfileSection>

      <ProfileSection title="Security & Monitoring">
        <div className="space-y-4">
          <ObjectFields data={security} />
          <InfoGrid items={[{ label: 'IoT Device IDs', value: details.iotDeviceIds }]} />
        </div>
      </ProfileSection>

      <ProfileSection title="Certifications & Endorsements">
        <ObjectFields data={certs} />
      </ProfileSection>

      <ProfileSection title="Routes & Terrain">
        <div className="space-y-4">
          <ObjectFields data={routes} />
          <InfoGrid
            items={[
              { label: 'Air Freight Compliance', value: details.airFreightCompliance || routes.airFreightCompliance },
              { label: 'Operational Restrictions', value: data.operationalRestrictions },
            ]}
          />
        </div>
      </ProfileSection>

      <ProfileSection title="Costing & Operations">
        <div className="space-y-4">
          <ObjectFields data={costs} />
          <InfoGrid
            items={[
              { label: 'Purchase Date', value: details.purchaseDate },
              { label: 'Purchase Price', value: details.purchasePrice },
              { label: 'Current Value', value: details.currentValue },
              { label: 'Lessor', value: details.leaseLessor },
              { label: 'Lease Contract', value: details.leaseContractNumber },
              { label: 'Lease Start', value: details.leaseStartDate },
              { label: 'Lease End', value: details.leaseEndDate },
              { label: 'Lease Payment', value: details.leasePayment },
              { label: 'Fuel Card Provider', value: details.fuelCardProvider },
              { label: 'Fuel Card Number', value: details.fuelCardNumber },
              { label: 'Fuel Card Expiry', value: details.fuelCardExpiry },
              { label: 'Retirement Status', value: details.retirementStatus },
              { label: 'Retirement Date', value: details.retirementDate },
              { label: 'Retirement Reason', value: details.retirementReason },
              { label: 'Last Maintenance', value: data.lastMaintenanceDate },
              { label: 'Next Maintenance', value: data.nextMaintenanceDate },
              { label: 'Driver Requirements', value: data.driverRequirements },
              { label: 'Total Trips', value: data.totalTrips },
              { label: 'Total Revenue', value: data.totalRevenue },
              { label: 'Rating', value: data.averageRating },
            ]}
          />
        </div>
      </ProfileSection>

      {contacts.some((contact) => contact?.name || contact?.phone || contact?.email) && (
        <ProfileSection title="Emergency Contacts">
          <div className="space-y-3">
            {contacts.filter((contact) => contact?.name || contact?.phone || contact?.email).map((contact, index) => (
              <InfoGrid
                key={`${contact.name || 'contact'}-${index}`}
                items={[
                  { label: 'Name', value: contact.name },
                  { label: 'Phone', value: contact.phone },
                  { label: 'Relationship', value: contact.relationship },
                  { label: 'Email', value: contact.email },
                ]}
              />
            ))}
          </div>
        </ProfileSection>
      )}

      <ProfileSection title="Location & Audit">
        <InfoGrid
          items={[
            { label: 'Current Location', value: locationText(data) },
            { label: 'Location Updated', value: data.locationUpdatedAt },
            { label: 'Created', value: data.createdAt },
            { label: 'Updated', value: data.updatedAt },
            { label: 'Created By', value: data.createdBy || details.createdBy },
            { label: 'Updated By', value: data.updatedBy || details.updatedBy },
            { label: 'Active', value: data.isActive },
          ]}
        />
      </ProfileSection>

      {assignedDrivers.length > 0 && (
        <ProfileSection title="Assigned Drivers">
          <div className="space-y-2">
            {assignedDrivers.map((driver, index) => (
              <div key={driver.driverId || index} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{driver.driverName || driver.name || 'Driver'}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                  {[driver.status, driver.driverId, driver.assignmentDate ? formatScalar(driver.assignmentDate) : '']
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            ))}
          </div>
        </ProfileSection>
      )}

      {assignedRoutes.length > 0 && (
        <ProfileSection title="Assigned Routes">
          <div className="space-y-2">
            {assignedRoutes.map((route, index) => (
              <div key={route.routeId || index} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{route.routeName || route.name || 'Route'}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                  {[route.origin, route.destination, route.status].filter(Boolean).join(' · ')}
                </p>
              </div>
            ))}
          </div>
        </ProfileSection>
      )}

      {leftover.length > 0 && (
        <ProfileSection title="Additional Truck Data">
          <div className="space-y-4">
            {leftover.map(([key, value]) => {
              if (Array.isArray(value)) {
                if (value.length === 0) return null;
                if (typeof value[0] === 'object') {
                  return (
                    <div key={key}>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{prettyLabel(key)}</p>
                      <div className="space-y-2">
                        {value.map((item, index) => (
                          <div key={index} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            {typeof item === 'object' ? <ObjectFields data={item} /> : <p className="text-sm">{formatScalar(item)}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return <InfoGrid key={key} items={[{ label: prettyLabel(key), value }]} />;
              }
              if (typeof value === 'object') {
                return (
                  <div key={key}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{prettyLabel(key)}</p>
                    <ObjectFields data={value} />
                  </div>
                );
              }
              return <InfoGrid key={key} items={[{ label: prettyLabel(key), value }]} />;
            })}
          </div>
        </ProfileSection>
      )}
    </div>
  );
};

export default TruckFullProfile;
