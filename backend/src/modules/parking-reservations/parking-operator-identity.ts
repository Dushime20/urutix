export type OperatorIdKind = 'mc' | 'usdot' | 'generic';

export type OperatorIdentityField = {
  key: 'primary' | 'secondary';
  label: string;
  hint: string;
  placeholder: string;
  required: boolean;
  kind: OperatorIdKind;
};

export type OperatorIdentityProfile = {
  countryCode: string;
  primary: OperatorIdentityField;
  secondary?: OperatorIdentityField;
};

const MC_PATTERN = /^(MC[-\s]?)?\d{5,8}$/i;
const USDOT_PATTERN = /^(USDOT[-\s]?)?\d{5,8}$/i;
const GENERIC_PATTERN = /^[A-Z0-9][A-Z0-9/.\- ]{2,39}$/i;

const EU_COMMUNITY_LICENCE = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
]);

function field(
  key: OperatorIdentityField['key'],
  label: string,
  hint: string,
  placeholder: string,
  required: boolean,
  kind: OperatorIdKind = 'generic',
): OperatorIdentityField {
  return { key, label, hint, placeholder, required, kind };
}

function communityLicenceProfile(countryCode: string): OperatorIdentityProfile {
  return {
    countryCode,
    primary: field(
      'primary',
      'Community / operator licence',
      'EU/EEA road haulage Community licence or national operator licence number.',
      'e.g. D/1234567/0',
      true,
    ),
    secondary: field(
      'secondary',
      'VAT / company registration',
      'Optional tax or company registration number used to identify the operator.',
      'e.g. DE123456789',
      false,
    ),
  };
}

const SPECIFIC: Record<string, OperatorIdentityProfile> = {
  US: {
    countryCode: 'US',
    primary: field('primary', 'MC Number', 'FMCSA motor carrier authority number.', 'MC123456', true, 'mc'),
    secondary: field('secondary', 'USDOT Number', 'U.S. Department of Transportation number.', '1234567', true, 'usdot'),
  },
  CA: {
    countryCode: 'CA',
    primary: field('primary', 'NSC / CVOR number', 'National Safety Code or CVOR carrier number.', 'e.g. 123-456-789', true),
    secondary: field('secondary', 'Business number', 'Optional Canada Revenue Agency business number.', 'e.g. 123456789RC0001', false),
  },
  MX: {
    countryCode: 'MX',
    primary: field('primary', 'SCT permit number', 'Federal SCT/SICT autotransporte permit.', 'e.g. 1234SPF', true),
  },
  GB: {
    countryCode: 'GB',
    primary: field('primary', 'Operator licence', 'Traffic Commissioner O-licence number.', 'e.g. OD1234567', true),
    secondary: field('secondary', 'Company number', 'Optional Companies House number.', 'e.g. 01234567', false),
  },
  CH: {
    countryCode: 'CH',
    primary: field('primary', 'Operator licence', 'Swiss road haulage operator licence.', 'Licence number', true),
    secondary: field('secondary', 'UID / VAT number', 'Optional Swiss UID or VAT number.', 'CHE-123.456.789', false),
  },
  NO: {
    countryCode: 'NO',
    primary: field('primary', 'Operator licence', 'Norwegian professional goods transport licence.', 'Licence number', true),
  },
  KE: {
    countryCode: 'KE',
    primary: field('primary', 'NTSA operator licence', 'NTSA PSV, goods, or transport operator licence.', 'e.g. PSV-123456', true),
    secondary: field('secondary', 'KRA PIN', 'Optional Kenya Revenue Authority PIN.', 'P051234567A', false),
  },
  UG: {
    countryCode: 'UG',
    primary: field('primary', 'Transport operator licence', 'Uganda transport operator or goods-vehicle licence.', 'Licence number', true),
  },
  TZ: {
    countryCode: 'TZ',
    primary: field('primary', 'LATRA operator licence', 'Tanzania LATRA/SUMATRA goods transport licence.', 'Licence number', true),
  },
  RW: {
    countryCode: 'RW',
    primary: field('primary', 'RURA operator licence', 'Rwanda RURA goods transport operator licence.', 'Licence number', true),
    secondary: field('secondary', 'RDB / TIN', 'Optional company registration or TIN.', 'TIN number', false),
  },
  ZA: {
    countryCode: 'ZA',
    primary: field('primary', 'Operating licence', 'Cross-border or provincial operating licence (OL).', 'OL number', true),
    secondary: field('secondary', 'CIPC / VAT number', 'Optional company or VAT registration.', 'e.g. 4123456789', false),
  },
  NG: {
    countryCode: 'NG',
    primary: field('primary', 'FRSC / operator permit', 'FRSC or state transport operator permit.', 'Permit number', true),
    secondary: field('secondary', 'CAC number', 'Optional Corporate Affairs Commission number.', 'RC123456', false),
  },
  GH: {
    countryCode: 'GH',
    primary: field('primary', 'DVLA operator licence', 'Ghana DVLA commercial operator licence.', 'Licence number', true),
  },
  EG: {
    countryCode: 'EG',
    primary: field('primary', 'Land transport licence', 'Egypt land transport operator licence.', 'Licence number', true),
  },
  AE: {
    countryCode: 'AE',
    primary: field('primary', 'RTA / FTA trade licence', 'Emirate transport or trade licence for the operator.', 'Licence number', true),
  },
  SA: {
    countryCode: 'SA',
    primary: field('primary', 'Transport operator licence', 'Saudi transport activity licence.', 'Licence number', true),
  },
  IN: {
    countryCode: 'IN',
    primary: field('primary', 'National permit / RC', 'All-India permit or goods vehicle RC number.', 'e.g. MH12AB1234', true),
    secondary: field('secondary', 'GSTIN', 'Optional GST identification number.', '22AAAAA0000A1Z5', false),
  },
  CN: {
    countryCode: 'CN',
    primary: field('primary', 'Road transport permit', 'Road freight transport business permit.', 'Permit number', true),
  },
  JP: {
    countryCode: 'JP',
    primary: field('primary', 'Transport business licence', 'Japanese general trucking business licence.', 'Licence number', true),
  },
  AU: {
    countryCode: 'AU',
    primary: field('primary', 'NHVR accreditation', 'NHVAS or heavy vehicle operator accreditation.', 'Accreditation number', true),
    secondary: field('secondary', 'ABN', 'Optional Australian Business Number.', '12 345 678 901', false),
  },
  NZ: {
    countryCode: 'NZ',
    primary: field('primary', 'Transport service licence', 'NZTA TSL number.', 'TSL number', true),
  },
  BR: {
    countryCode: 'BR',
    primary: field('primary', 'RNTRC number', 'ANTT RNTRC freight operator registration.', 'RNTRC number', true),
    secondary: field('secondary', 'CNPJ', 'Optional company tax ID.', '00.000.000/0001-00', false),
  },
  AR: {
    countryCode: 'AR',
    primary: field('primary', 'CNRT operator number', 'Argentina CNRT freight operator registration.', 'Operator number', true),
  },
  TR: {
    countryCode: 'TR',
    primary: field('primary', 'K1 / C2 licence', 'Turkish international/domestic goods transport licence.', 'Licence number', true),
  },
  UA: {
    countryCode: 'UA',
    primary: field('primary', 'Transport licence', 'Ukrainian goods transport licence.', 'Licence number', true),
  },
};

function defaultProfile(countryCode: string): OperatorIdentityProfile {
  return {
    countryCode,
    primary: field(
      'primary',
      'Transport operator licence',
      'National goods-transport or trucking operator licence issued in this country.',
      'Licence or permit number',
      true,
    ),
    secondary: field(
      'secondary',
      'Company registration / tax ID',
      'Optional company, tax, or trade registration number.',
      'Registration number',
      false,
    ),
  };
}

export function normalizeCountryCode(value: string): string {
  return (value || '').trim().toUpperCase().slice(0, 2);
}

export function operatorIdentityForCountry(countryCode: string): OperatorIdentityProfile {
  const code = normalizeCountryCode(countryCode);
  if (SPECIFIC[code]) return SPECIFIC[code];
  if (EU_COMMUNITY_LICENCE.has(code)) return communityLicenceProfile(code);
  return defaultProfile(code || 'XX');
}

export function normalizeOperatorId(value: string): string {
  return (value || '').trim().toUpperCase().replace(/\s+/g, ' ');
}

export function isValidOperatorId(value: string, spec: OperatorIdentityField): boolean {
  const trimmed = (value || '').trim();
  if (!spec.required && !trimmed) return true;
  if (trimmed.length < 3 || trimmed.length > 40) return false;
  const compact = normalizeOperatorId(trimmed).replace(/\s+/g, '');
  if (spec.kind === 'mc') return MC_PATTERN.test(compact);
  if (spec.kind === 'usdot') return USDOT_PATTERN.test(compact);
  return GENERIC_PATTERN.test(trimmed);
}

export function validateOperatorIdentity(
  countryCode: string,
  primaryValue: string,
  secondaryValue?: string,
): string | null {
  const country = normalizeCountryCode(countryCode);
  if (!/^[A-Z]{2}$/.test(country)) {
    return 'Select the company country of registration.';
  }
  const profile = operatorIdentityForCountry(country);
  if (!isValidOperatorId(primaryValue, profile.primary)) {
    return `Enter a valid ${profile.primary.label}.`;
  }
  if (profile.secondary && !isValidOperatorId(secondaryValue || '', profile.secondary)) {
    return `Enter a valid ${profile.secondary.label}.`;
  }
  return null;
}
