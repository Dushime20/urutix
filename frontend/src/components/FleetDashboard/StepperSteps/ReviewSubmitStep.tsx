import React from 'react';
import {
  Check,
  Truck,
  User,
  Settings,
  Shield,
  Map,
  Award,
  FileText,
  Calendar,
  Tag,
  AlignLeft,
  Clock,
  Info,
} from 'lucide-react';
import { flattenComplianceDocuments } from '../../../utils/vehicleComplianceDocuments';

interface ReviewSubmitStepProps {
  formData: any;
  activeTab?: 'trucks' | 'drivers';
}

// ─── helpers ────────────────────────────────────────────────────────────────

const getValueFromPath = (obj: any, path: string) => {
  if (!obj || !path) return undefined;
  if (!path.includes('.')) return obj[path];
  return path.split('.').reduce((acc: any, key: string) => (acc ? acc[key] : undefined), obj);
};

const labelFromPath = (path: string) => {
  const last = path.includes('.') ? path.split('.').slice(-1)[0] : path;
  return last.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
};

const formatValue = (value: any): string => {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    try { return new Date(value).toLocaleDateString(); } catch { return value; }
  }
  if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '';
  return String(value);
};

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  DRIVER_LICENSE: 'Driver License',
  DRIVER_MEDICAL_CERT: 'Medical Certificate',
  DRIVER_DRUG_TEST: 'Drug Test',
  DRIVER_BACKGROUND_CHECK: 'Background Check',
  DRIVER_TRAINING_CERT: 'Training Certificate',
  DRIVER_INSURANCE: 'Insurance',
  OTHER: 'Other',
};

// ─── sub-components ──────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; accent?: string }> = ({
  icon,
  title,
  accent = 'text-blue-600 dark:text-blue-400',
}) => (
  <div className={`flex items-center gap-2 mb-4 px-1 ${accent}`}>
    {icon}
    <h4 className="text-[10px] font-black uppercase tracking-widest">{title}</h4>
  </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between items-start gap-4 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest shrink-0">
      {label}
    </span>
    <span className="text-[11px] font-semibold text-gray-900 dark:text-gray-100 text-right break-words max-w-[60%]">
      {value || '—'}
    </span>
  </div>
);

const Section: React.FC<{
  title: string;
  icon: React.ReactNode;
  data: any;
  fields: string[];
  accent?: string;
}> = ({ title, icon, data, fields, accent }) => {
  const rows = fields
    .map((f) => ({ label: labelFromPath(f), value: formatValue(getValueFromPath(data, f)) }))
    .filter((r) => r.value !== '');

  if (rows.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 p-5">
      <SectionHeader icon={icon} title={title} accent={accent} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
        {rows.map((r) => (
          <InfoRow key={r.label} label={r.label} value={r.value} />
        ))}
      </div>
    </div>
  );
};

// ─── document card ────────────────────────────────────────────────────────────

const DocumentCard: React.FC<{ doc: any; index: number }> = ({ doc, index }) => {
  const typeLabel = DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType ?? 'Document';
  const fileName = doc.file?.name ?? doc.fileName ?? 'Unknown file';
  const fileSize = doc.file?.size
    ? `${(doc.file.size / 1024).toFixed(1)} KB`
    : null;

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg p-4 flex gap-4">
      {/* index badge */}
      <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-blue-600/20 flex items-center justify-center">
        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400">{index + 1}</span>
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        {/* title + type */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-widest truncate">
            {doc.title || 'Untitled Document'}
          </p>
          <span className="shrink-0 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800">
            {typeLabel}
          </span>
        </div>

        {/* file name + size */}
        <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
          <FileText className="w-3 h-3 shrink-0" />
          <span className="text-[10px] font-medium truncate">{fileName}</span>
          {fileSize && (
            <span className="text-[9px] font-bold opacity-60 shrink-0">· {fileSize}</span>
          )}
        </div>

        {/* description */}
        {doc.description && (
          <div className="flex items-start gap-1.5">
            <AlignLeft className="w-3 h-3 text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
            <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
              {doc.description}
            </p>
          </div>
        )}

        {/* expiry */}
        {doc.expiryDate && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-rose-500 shrink-0" />
            <span className="text-[9px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest">
              Expires: {new Date(doc.expiryDate).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── main component ───────────────────────────────────────────────────────────

const ReviewSubmitStep: React.FC<ReviewSubmitStepProps> = ({ formData, activeTab = 'trucks' }) => {

  // ── driver field groups ────────────────────────────────────────────────────
  const driverPersonalFields = [
    'firstName', 'lastName', 'dateOfBirth', 'address',
    'contactInfo.phone', 'contactInfo.email',
  ];

  const driverLicenseFields = [
    'licenseNumber', 'licenseType', 'licenseIssueDate', 'licenseExpiry',
    'licenseState', 'licenseCountry', 'experience',
  ];

  const driverEmploymentFields = [
    'employmentType', 'hireDate', 'status', 'availabilityStatus',
    'hourlyRate', 'mileageRate',
  ];

  const driverComplianceFields = [
    'medicalCertExpiry', 'drugTestDate', 'backgroundCheckDate', 'trainingCompletionDate',
  ];

  const driverNotesFields = ['driverNotes', 'specialCertifications'];

  const driverEmergencyFields = [
    'emergencyContact.name', 'emergencyContact.phone', 'emergencyContact.relationship',
  ];

  // ── truck field groups ────────────────────────────────────────────────────
  const basicFields = [
    'plateNumber', 'vin', 'make', 'model', 'year', 'color', 'fuelType',
    'capacityWeight', 'capacityVolume', 'registrationNumber', 'registrationExpiry',
    'insurancePolicy', 'insuranceExpiry',
  ];

  const cargoFields = [
    'truckType', 'trailerType', 'hasTanker', 'hasBulk', 'hasRefrigerated',
    'hasCarCarrier', 'hasHeavyHaul', 'hasOversized', 'hasHazmat',
    'hasDangerousGoods', 'hasFoodGrade', 'hasPharmaceutical',
  ];

  const equipmentFields = [
    'hasSideRails', 'hasTarps', 'hasStraps', 'hasChains', 'hasWinch',
    'hasRam', 'hasTailLift', 'hasSideLift', 'hasRollerBed', 'hasDropDeck',
    'hasExtendable', 'hasLowbed', 'hasStepDeck', 'hasPowerOnly',
  ];

  const technologyFields = [
    'hasGPS', 'hasTracking', 'hasTelematics', 'hasELD', 'hasDashCam',
    'hasSafetyCameras', 'hasCollisionAvoidance', 'hasLaneDeparture',
    'hasAdaptiveCruise', 'hasBlindSpot', 'hasBackupCamera',
  ];

  // ── certifications (driver) ───────────────────────────────────────────────
  const certLabels: Record<string, string> = {
    cdlCertified: 'CDL Certified',
    hazmatEndorsement: 'Hazmat Endorsement',
    tankerEndorsement: 'Tanker Endorsement',
    doublesTriplesEndorsement: 'Doubles / Triples',
    passengerEndorsement: 'Passenger',
    schoolBusEndorsement: 'School Bus',
    hazmatCertified: 'Hazmat Certified',
    dangerousGoodsCertified: 'Dangerous Goods',
    foodGradeCertified: 'Food Grade',
    pharmaceuticalCertified: 'Pharmaceutical',
  };

  const selectedCerts = Object.keys(certLabels).filter(
    (k) => formData?.certifications?.[k],
  );

  // ── documents ─────────────────────────────────────────────────────────────
  const documents: any[] = Array.isArray(formData?.documents) ? formData.documents : [];

  return (
    <div className="space-y-6 text-gray-900 dark:text-white">

      {/* header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-green-600/10 dark:bg-green-600/20 flex items-center justify-center">
          <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Review & Submit
          </h3>
          <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
            Verify all data below before creating the {activeTab === 'drivers' ? 'driver' : 'truck'}.
          </p>
        </div>
      </div>

      {/* ── DRIVER SECTIONS ───────────────────────────────────────────────── */}
      {activeTab === 'drivers' && (
        <>
          <Section
            title="Personal Information"
            icon={<User className="w-3.5 h-3.5" />}
            data={formData}
            fields={driverPersonalFields}
            accent="text-blue-600 dark:text-blue-400"
          />

          <Section
            title="License & Authorization"
            icon={<Award className="w-3.5 h-3.5" />}
            data={formData}
            fields={driverLicenseFields}
            accent="text-blue-600 dark:text-blue-400"
          />

          <Section
            title="Employment"
            icon={<Settings className="w-3.5 h-3.5" />}
            data={formData}
            fields={driverEmploymentFields}
            accent="text-blue-600 dark:text-blue-400"
          />

          <Section
            title="Compliance & Safety"
            icon={<Shield className="w-3.5 h-3.5" />}
            data={formData}
            fields={driverComplianceFields}
            accent="text-amber-600 dark:text-amber-400"
          />

          <Section
            title="Emergency Contact"
            icon={<Info className="w-3.5 h-3.5" />}
            data={formData}
            fields={driverEmergencyFields}
            accent="text-rose-600 dark:text-rose-400"
          />

          <Section
            title="Notes"
            icon={<AlignLeft className="w-3.5 h-3.5" />}
            data={formData}
            fields={driverNotesFields}
            accent="text-gray-500 dark:text-gray-400"
          />

          {/* certifications */}
          {selectedCerts.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 p-5">
              <SectionHeader
                icon={<Award className="w-3.5 h-3.5" />}
                title="Certifications & Endorsements"
                accent="text-blue-600 dark:text-blue-400"
              />
              <div className="flex flex-wrap gap-2">
                {selectedCerts.map((k) => (
                  <span
                    key={k}
                    className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 text-[9px] font-black uppercase tracking-widest"
                  >
                    {certLabels[k]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── DOCUMENTS ──────────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 p-5">
            <SectionHeader
              icon={<FileText className="w-3.5 h-3.5" />}
              title={`Documents (${documents.length})`}
              accent="text-blue-600 dark:text-blue-400"
            />

            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
                <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  No documents attached
                </p>
                <p className="text-[9px] text-gray-400 dark:text-gray-600 mt-1">
                  Go back to Step 1 to upload driver documents.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc: any, i: number) => (
                  <DocumentCard key={i} doc={doc} index={i} />
                ))}

                {/* summary bar */}
                <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                  <p className="text-[10px] font-bold text-green-700 dark:text-green-300">
                    {documents.length} document{documents.length !== 1 ? 's' : ''} will be uploaded together with the driver profile.
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TRUCK SECTIONS ────────────────────────────────────────────────── */}
      {activeTab === 'trucks' && (
        <>
          <Section
            title="Basic Information"
            icon={<Truck className="w-3.5 h-3.5" />}
            data={formData}
            fields={basicFields}
            accent="text-blue-600 dark:text-blue-400"
          />
          <Section
            title="Cargo Capabilities"
            icon={<Settings className="w-3.5 h-3.5" />}
            data={formData}
            fields={cargoFields}
            accent="text-blue-600 dark:text-blue-400"
          />
          <Section
            title="Loading Equipment"
            icon={<Shield className="w-3.5 h-3.5" />}
            data={formData}
            fields={equipmentFields}
            accent="text-blue-600 dark:text-blue-400"
          />
          <Section
            title="Technology & Tracking"
            icon={<Map className="w-3.5 h-3.5" />}
            data={formData}
            fields={technologyFields}
            accent="text-blue-600 dark:text-blue-400"
          />
          {flattenComplianceDocuments(formData.complianceDocuments).length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 p-5">
              <SectionHeader
                icon={<FileText className="w-3.5 h-3.5" />}
                title="Compliance documents"
                accent="text-blue-600 dark:text-blue-400"
              />
              <div className="space-y-2">
                {flattenComplianceDocuments(formData.complianceDocuments).map(({ title, record }, idx) => (
                  <div key={`${title}-${idx}`} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{title}</p>
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                        {record.number ? `${record.number} · ` : ''}
                        {record.fileName || (record.file ? record.file.name : 'No file attached')}
                      </p>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                      {record.expiryDate ? `Exp ${record.expiryDate}` : record.status || ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ready banner */}
      <div className="flex items-start gap-3 px-5 py-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
        <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-[10px] font-black text-green-800 dark:text-green-300 uppercase tracking-widest">
            Ready to Submit
          </p>
          <p className="text-[10px] font-medium text-green-700 dark:text-green-400 mt-0.5">
            All required information has been provided.
            {activeTab === 'drivers' && documents.length > 0
              ? ` ${documents.length} document${documents.length !== 1 ? 's' : ''} will be submitted together.`
              : ' Click submit to create the entry.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReviewSubmitStep;
