export type CompliancePermitStatus =
  | 'VALID'
  | 'PENDING'
  | 'EXPIRING'
  | 'EXPIRED'
  | 'SUSPENDED';

export interface ComplianceDocRecord {
  number?: string;
  issuingAuthority?: string;
  issueDate?: string;
  expiryDate?: string;
  status?: CompliancePermitStatus;
  documentId?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  /** Client-only pending upload. Never sent to the truck API. */
  file?: File;
  previewUrl?: string;
  certificationType?: string;
}

export interface VehicleComplianceDocuments {
  insurance?: ComplianceDocRecord;
  registration?: ComplianceDocRecord;
  roadworthy?: ComplianceDocRecord;
  operatingAuthority?: ComplianceDocRecord;
  crossBorderPermit?: ComplianceDocRecord;
  customsBond?: ComplianceDocRecord;
  portAuthorization?: ComplianceDocRecord;
  vehicleCertifications?: ComplianceDocRecord[];
}

export const COMPLIANCE_DOC_CONFIG: Record<
  Exclude<keyof VehicleComplianceDocuments, 'vehicleCertifications'>,
  { title: string; documentType: string; complianceKind: string; numberLabel: string }
> = {
  insurance: {
    title: 'Insurance Policy',
    documentType: 'VEHICLE_INSURANCE',
    complianceKind: 'INSURANCE_POLICY',
    numberLabel: 'Policy number',
  },
  registration: {
    title: 'Registration Document',
    documentType: 'VEHICLE_REGISTRATION',
    complianceKind: 'VEHICLE_REGISTRATION',
    numberLabel: 'Registration number',
  },
  roadworthy: {
    title: 'Roadworthy Certificate',
    documentType: 'VEHICLE_INSPECTION',
    complianceKind: 'ROADWORTHY_CERTIFICATE',
    numberLabel: 'Certificate number',
  },
  operatingAuthority: {
    title: 'Operating Authority',
    documentType: 'VEHICLE_PERMIT',
    complianceKind: 'OPERATING_AUTHORITY',
    numberLabel: 'Authority number',
  },
  crossBorderPermit: {
    title: 'Cross-Border Permit',
    documentType: 'VEHICLE_PERMIT',
    complianceKind: 'CROSS_BORDER_PERMIT',
    numberLabel: 'Permit number',
  },
  customsBond: {
    title: 'Customs Bond',
    documentType: 'VEHICLE_PERMIT',
    complianceKind: 'CUSTOMS_BOND',
    numberLabel: 'Bond number',
  },
  portAuthorization: {
    title: 'Port Authorization',
    documentType: 'VEHICLE_PERMIT',
    complianceKind: 'PORT_AUTHORIZATION',
    numberLabel: 'Authorization number',
  },
};

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
const ALLOWED_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function validateComplianceFile(file: File): string | null {
  const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_MIME.includes(file.type)) {
    return `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`;
  }
  if (file.size > MAX_FILE_BYTES) {
    return 'File exceeds the 10MB limit.';
  }
  return null;
}

export function stripComplianceFiles(
  docs?: VehicleComplianceDocuments | null,
): VehicleComplianceDocuments {
  if (!docs) return {};
  const strip = (record?: ComplianceDocRecord): ComplianceDocRecord | undefined => {
    if (!record) return undefined;
    const { file: _file, previewUrl: _preview, ...rest } = record;
    return rest;
  };
  return {
    insurance: strip(docs.insurance),
    registration: strip(docs.registration),
    roadworthy: strip(docs.roadworthy),
    operatingAuthority: strip(docs.operatingAuthority),
    crossBorderPermit: strip(docs.crossBorderPermit),
    customsBond: strip(docs.customsBond),
    portAuthorization: strip(docs.portAuthorization),
    vehicleCertifications: (docs.vehicleCertifications || [])
      .map(strip)
      .filter(Boolean) as ComplianceDocRecord[],
  };
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function uploadOne(
  truckId: string,
  record: ComplianceDocRecord,
  documentType: string,
  complianceKind: string,
  title: string,
): Promise<ComplianceDocRecord> {
  if (!(record.file instanceof File)) {
    const { file: _f, previewUrl: _p, ...rest } = record;
    return rest;
  }

  const { documentApi } = await import('../services/documents/documentApi');
  const uploaded = await documentApi.createDocument(
    {
      entityType: 'TRUCK',
      entityId: truckId,
      documentType,
      category: 'COMPLIANCE',
      title: `${title}${record.number ? ` - ${record.number}` : ''}`,
      description: record.issuingAuthority
        ? `Issued by ${record.issuingAuthority}`
        : `${title} uploaded with vehicle record`,
      documentNumber: record.number,
      issueDate: record.issueDate,
      expiryDate: record.expiryDate,
      priority: 'HIGH',
      requiresRenewal: Boolean(record.expiryDate),
      renewalReminderDays: 30,
      tags: [complianceKind],
      metadata: {
        complianceKind,
        issuingAuthority: record.issuingAuthority,
        permitStatus: record.status || 'VALID',
        certificationType: record.certificationType,
      },
    },
    record.file,
  );

  if (record.previewUrl) URL.revokeObjectURL(record.previewUrl);

  return {
    number: record.number,
    issuingAuthority: record.issuingAuthority,
    issueDate: record.issueDate,
    expiryDate: record.expiryDate,
    status: record.status,
    certificationType: record.certificationType,
    documentId: uploaded.id,
    fileName: uploaded.originalFileName || record.fileName,
    fileSize: uploaded.fileSize || record.fileSize,
    mimeType: uploaded.mimeType || record.mimeType,
  };
}

export function hasPendingComplianceFiles(
  docs?: VehicleComplianceDocuments | null,
): boolean {
  if (!docs) return false;
  const records = [
    docs.insurance,
    docs.registration,
    docs.roadworthy,
    docs.operatingAuthority,
    docs.crossBorderPermit,
    docs.customsBond,
    docs.portAuthorization,
    ...(docs.vehicleCertifications || []),
  ];
  return records.some((record) => record?.file instanceof File);
}

export async function uploadVehicleComplianceDocuments(
  truckId: string,
  docs?: VehicleComplianceDocuments | null,
): Promise<VehicleComplianceDocuments> {
  if (!docs) return {};

  const next: VehicleComplianceDocuments = {};
  const singles = Object.keys(COMPLIANCE_DOC_CONFIG) as Array<
    keyof typeof COMPLIANCE_DOC_CONFIG
  >;

  for (const key of singles) {
    const record = docs[key];
    if (!record) continue;
    const config = COMPLIANCE_DOC_CONFIG[key];
    next[key] = await uploadOne(
      truckId,
      record,
      config.documentType,
      config.complianceKind,
      config.title,
    );
  }

  if (Array.isArray(docs.vehicleCertifications)) {
    next.vehicleCertifications = [];
    for (const cert of docs.vehicleCertifications) {
      next.vehicleCertifications.push(
        await uploadOne(
          truckId,
          cert,
          'SAFETY_CERT',
          'VEHICLE_CERTIFICATION',
          cert.certificationType || 'Vehicle Certification',
        ),
      );
    }
  }

  return stripComplianceFiles(next);
}

function toDateInput(value?: string): string {
  if (!value) return '';
  return String(value).slice(0, 10);
}

export function hydrateComplianceDocuments(
  docs?: VehicleComplianceDocuments | null,
  scalars?: {
    insurancePolicy?: string;
    insuranceExpiry?: string;
    registrationNumber?: string;
    registrationExpiry?: string;
    roadworthyCertExpiry?: string;
    operatingAuthority?: string;
    crossBorderPermit?: string;
    customsBond?: string;
    portAuthorization?: string;
    insuranceStatus?: string;
    insuranceIssuingAuthority?: string;
    insuranceIssueDate?: string;
  },
): VehicleComplianceDocuments {
  const seed = (
    record?: ComplianceDocRecord,
    extras?: Partial<ComplianceDocRecord>,
  ): ComplianceDocRecord => {
    const { file: _f, previewUrl: _p, ...rest } = record || {};
    const compactExtras = Object.fromEntries(
      Object.entries(extras || {}).filter(([, value]) => value !== undefined && value !== ''),
    );
    return {
      ...rest,
      ...compactExtras,
      number: (compactExtras.number as string) || rest.number,
      expiryDate: toDateInput((compactExtras.expiryDate as string) || rest.expiryDate),
      issueDate: toDateInput((compactExtras.issueDate as string) || rest.issueDate),
      status: ((compactExtras.status as CompliancePermitStatus) || rest.status || 'VALID'),
    };
  };

  return {
    insurance: seed(docs?.insurance, {
      number: docs?.insurance?.number || scalars?.insurancePolicy,
      expiryDate: docs?.insurance?.expiryDate || scalars?.insuranceExpiry,
      status: (docs?.insurance?.status || scalars?.insuranceStatus || 'VALID') as CompliancePermitStatus,
      issuingAuthority: docs?.insurance?.issuingAuthority || scalars?.insuranceIssuingAuthority,
      issueDate: docs?.insurance?.issueDate || scalars?.insuranceIssueDate,
    }),
    registration: seed(docs?.registration, {
      number: docs?.registration?.number || scalars?.registrationNumber,
      expiryDate: docs?.registration?.expiryDate || scalars?.registrationExpiry,
    }),
    roadworthy: seed(docs?.roadworthy, {
      expiryDate: docs?.roadworthy?.expiryDate || scalars?.roadworthyCertExpiry,
    }),
    operatingAuthority: seed(docs?.operatingAuthority, {
      number: docs?.operatingAuthority?.number || scalars?.operatingAuthority,
    }),
    crossBorderPermit: seed(docs?.crossBorderPermit, {
      number: docs?.crossBorderPermit?.number || scalars?.crossBorderPermit,
    }),
    customsBond: seed(docs?.customsBond, {
      number: docs?.customsBond?.number || scalars?.customsBond,
    }),
    portAuthorization: seed(docs?.portAuthorization, {
      number: docs?.portAuthorization?.number || scalars?.portAuthorization,
    }),
    vehicleCertifications: (docs?.vehicleCertifications || []).map((cert) =>
      seed(cert),
    ),
  };
}

export function flattenComplianceDocuments(
  docs?: VehicleComplianceDocuments | null,
): Array<{ title: string; record: ComplianceDocRecord }> {
  if (!docs) return [];
  const items: Array<{ title: string; record: ComplianceDocRecord }> = [];
  (Object.keys(COMPLIANCE_DOC_CONFIG) as Array<keyof typeof COMPLIANCE_DOC_CONFIG>).forEach(
    (key) => {
      const record = docs[key];
      if (record && (record.number || record.documentId || record.expiryDate || record.fileName || record.status || record.issuingAuthority)) {
        items.push({ title: COMPLIANCE_DOC_CONFIG[key].title, record });
      }
    },
  );
  (docs.vehicleCertifications || []).forEach((cert, index) => {
    if (cert && (cert.number || cert.documentId || cert.expiryDate || cert.fileName)) {
      items.push({
        title: cert.certificationType || `Vehicle Certification ${index + 1}`,
        record: cert,
      });
    }
  });
  return items;
}
