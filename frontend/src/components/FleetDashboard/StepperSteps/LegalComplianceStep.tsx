import React from 'react';
import { FaBalanceScale, FaPassport } from 'react-icons/fa';
import ComplianceDocumentField from './ComplianceDocumentField';
import type {
  ComplianceDocRecord,
  VehicleComplianceDocuments,
} from '../../../utils/vehicleComplianceDocuments';
import { COMPLIANCE_DOC_CONFIG } from '../../../utils/vehicleComplianceDocuments';

interface LegalComplianceStepProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

const inputClass =
  'w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-none appearance-none';
const labelClass =
  'block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1';

export const LegalComplianceStep: React.FC<LegalComplianceStepProps> = ({
  formData,
  handleInputChange,
}) => {
  const docs: VehicleComplianceDocuments = formData.complianceDocuments || {};
  const hasCrossBorder =
    Boolean(formData.hasCrossBorderPermit) ||
    Boolean(docs.crossBorderPermit?.number) ||
    Boolean(docs.customsBond?.number) ||
    Boolean(docs.portAuthorization?.number) ||
    Boolean(docs.crossBorderPermit?.file) ||
    Boolean(docs.customsBond?.file) ||
    Boolean(docs.portAuthorization?.file);

  const updateDoc = (
    key: keyof VehicleComplianceDocuments,
    record: ComplianceDocRecord,
    scalarMap?: Record<string, string | undefined>,
  ) => {
    handleInputChange('complianceDocuments', {
      ...docs,
      [key]: record,
    });
    if (scalarMap) {
      Object.entries(scalarMap).forEach(([field, value]) => {
        handleInputChange(field, value || '');
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <FaBalanceScale className="w-4 h-4 text-blue-600 dark:text-blue-500" />
        <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Legal & Compliance
        </h3>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Insurance & Registration
        </h4>
        <div>
          <label className={labelClass}>Registry Expiry *</label>
          <input
            type="date"
            value={formData.registrationExpiry || ''}
            onChange={(e) => handleInputChange('registrationExpiry', e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <ComplianceDocumentField
          title={COMPLIANCE_DOC_CONFIG.insurance.title}
          numberLabel="Insurance Policy ID"
          required
          value={docs.insurance || { number: formData.insurancePolicy, expiryDate: formData.insuranceExpiry, status: 'VALID' }}
          onChange={(record) =>
            updateDoc('insurance', record, {
              insurancePolicy: record.number,
              insuranceExpiry: record.expiryDate,
            })
          }
        />
        <ComplianceDocumentField
          title={COMPLIANCE_DOC_CONFIG.roadworthy.title}
          numberLabel={COMPLIANCE_DOC_CONFIG.roadworthy.numberLabel}
          value={docs.roadworthy || { expiryDate: formData.roadworthyCertExpiry, status: 'VALID' }}
          onChange={(record) =>
            updateDoc('roadworthy', record, {
              roadworthyCertExpiry: record.expiryDate,
            })
          }
        />
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Operating Authority
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>DOT Number</label>
            <input
              type="text"
              value={formData.dotNumber || ''}
              onChange={(e) => handleInputChange('dotNumber', e.target.value)}
              className={inputClass}
              maxLength={50}
              placeholder="DOT number"
            />
          </div>
          <div>
            <label className={labelClass}>MC Number</label>
            <input
              type="text"
              value={formData.mcNumber || ''}
              onChange={(e) => handleInputChange('mcNumber', e.target.value)}
              className={inputClass}
              maxLength={50}
              placeholder="MC number"
            />
          </div>
        </div>
        <ComplianceDocumentField
          title={COMPLIANCE_DOC_CONFIG.operatingAuthority.title}
          numberLabel={COMPLIANCE_DOC_CONFIG.operatingAuthority.numberLabel}
          value={docs.operatingAuthority || { number: formData.operatingAuthority, status: 'VALID' }}
          onChange={(record) =>
            updateDoc('operatingAuthority', record, {
              operatingAuthority: record.number,
            })
          }
        />
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center">
          <FaPassport className="w-3.5 h-3.5 mr-2 text-blue-600 dark:text-blue-500" />
          Cross-Border & Port
        </h4>
        <label className="group flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-600/30 transition-all shadow-none w-fit">
          <input
            type="checkbox"
            checked={hasCrossBorder}
            onChange={() => handleInputChange('hasCrossBorderPermit', !formData.hasCrossBorderPermit)}
            className="w-4 h-4 rounded border-gray-200 dark:border-gray-600 text-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:ring-offset-0 bg-white dark:bg-gray-700 transition-all"
          />
          <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">
            Vehicle operates cross-border / port routes
          </span>
        </label>

        {hasCrossBorder && (
          <div className="space-y-4">
            <ComplianceDocumentField
              title={COMPLIANCE_DOC_CONFIG.crossBorderPermit.title}
              numberLabel={COMPLIANCE_DOC_CONFIG.crossBorderPermit.numberLabel}
              value={docs.crossBorderPermit || { number: formData.crossBorderPermit, status: 'VALID' }}
              onChange={(record) =>
                updateDoc('crossBorderPermit', record, {
                  crossBorderPermit: record.number,
                })
              }
            />
            <ComplianceDocumentField
              title={COMPLIANCE_DOC_CONFIG.customsBond.title}
              numberLabel={COMPLIANCE_DOC_CONFIG.customsBond.numberLabel}
              value={docs.customsBond || { number: formData.customsBond, status: 'VALID' }}
              onChange={(record) =>
                updateDoc('customsBond', record, {
                  customsBond: record.number,
                })
              }
            />
            <ComplianceDocumentField
              title={COMPLIANCE_DOC_CONFIG.portAuthorization.title}
              numberLabel={COMPLIANCE_DOC_CONFIG.portAuthorization.numberLabel}
              value={docs.portAuthorization || { number: formData.portAuthorization, status: 'VALID' }}
              onChange={(record) =>
                updateDoc('portAuthorization', record, {
                  portAuthorization: record.number,
                })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LegalComplianceStep;
