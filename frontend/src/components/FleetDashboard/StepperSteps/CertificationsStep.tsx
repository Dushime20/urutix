import React from 'react';
import { FaCertificate, FaShieldAlt, FaUserGraduate, FaDollarSign } from 'react-icons/fa';
import { useCurrencyFormat } from '../../../hooks/useCurrencyFormat';
import ComplianceDocumentField from './ComplianceDocumentField';

interface CertificationsStepProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

export const CertificationsStep: React.FC<CertificationsStepProps> = ({
  formData,
  handleInputChange,
}) => {
  const { currency } = useCurrencyFormat();
  const handleCertificationToggle = (certification: string) => {
    handleInputChange('certifications', {
      ...formData.certifications,
      [certification]: !formData.certifications?.[certification],
    });
  };

  const handleCertificationInputChange = (field: string, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    handleInputChange('certifications', {
      ...formData.certifications,
      [field]: numValue,
    });
  };

  const handleArrayInputChange = (field: string, value: string) => {
    const updatedArray = value ? value.split(',').map(item => item.trim()) : [];
    
    handleInputChange('certifications', {
      ...formData.certifications,
      [field]: updatedArray,
    });
  };

  const certificationCategories = [
    {
      title: 'Safety Certifications',
      icon: <FaShieldAlt className="w-4 h-4" />,
      certifications: [
        { key: 'hazmatCertified', label: 'Hazmat Certified', description: 'Hazardous materials transport' },
        { key: 'dangerousGoodsCertified', label: 'Dangerous Goods Certified', description: 'Dangerous goods handling' },
        { key: 'foodGradeCertified', label: 'Food Grade Certified', description: 'Food transport compliance' },
        { key: 'pharmaceuticalCertified', label: 'Pharmaceutical Certified', description: 'Pharmaceutical transport' },
        { key: 'explosivesCertified', label: 'Explosives Certified', description: 'Explosives transport' },
        { key: 'radioactiveCertified', label: 'Radioactive Certified', description: 'Radioactive materials' },
      ],
    },
    {
      title: 'Driver Endorsements',
      icon: <FaUserGraduate className="w-4 h-4" />,
      certifications: [
        { key: 'cdlCertified', label: 'CDL Certified', description: 'Commercial driver license' },
        { key: 'hazmatEndorsement', label: 'Hazmat Endorsement', description: 'Hazmat driver endorsement' },
        { key: 'tankerEndorsement', label: 'Tanker Endorsement', description: 'Tanker driver endorsement' },
        { key: 'doublesTriplesEndorsement', label: 'Doubles/Triples Endorsement', description: 'Multiple trailer endorsement' },
        { key: 'passengerEndorsement', label: 'Passenger Endorsement', description: 'Passenger transport' },
        { key: 'schoolBusEndorsement', label: 'School Bus Endorsement', description: 'School bus operation' },
      ],
    },
    {
      title: 'Vehicle Certifications',
      icon: <FaCertificate className="w-4 h-4" />,
      certifications: [
        { key: 'dotCertified', label: 'DOT Certified', description: 'Department of Transportation' },
        { key: 'epaCertified', label: 'EPA Certified', description: 'Environmental Protection Agency' },
        { key: 'carbCertified', label: 'CARB Certified', description: 'California Air Resources Board' },
        { key: 'csaCertified', label: 'CSA Certified', description: 'Compliance, Safety, Accountability' },
        { key: 'smartwayCertified', label: 'SmartWay Certified', description: 'EPA SmartWay program' },
        { key: 'isoCertified', label: 'ISO Certified', description: 'International Standards Organization' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <FaCertificate className="w-4 h-4 text-blue-600 dark:text-blue-500" />
        <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Compliance & Accreditation Registry</h3>
      </div>

      {/* Certification Categories */}
      <div className="space-y-8">
        {certificationCategories.map((category) => (
          <div key={category.title} className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <span className="text-blue-600 dark:text-blue-500">{category.icon}</span>
              <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{category.title}</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {category.certifications.map(({ key, label, description }) => (
                <label key={key} className="group flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-600/30 transition-all shadow-none">
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={formData.certifications?.[key] || false}
                      onChange={() => handleCertificationToggle(key)}
                      className="w-3.5 h-3.5 rounded border-gray-200 dark:border-gray-600 text-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:ring-offset-0 bg-white dark:bg-gray-700 transition-all"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors mb-0.5">
                      {label}
                    </span>
                    <p className="text-[9px] text-gray-500 dark:text-gray-400 font-medium leading-tight">
                      {description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Insurance & Coverage */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center">
          <FaDollarSign className="w-3.5 h-3.5 mr-2 text-blue-600 dark:text-blue-500" />
          Financial Liability Matrix
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">MAX Aggregate Coverage ({currency})</label>
            <input
              type="number"
              value={formData.certifications?.maxInsuranceCoverage || ''}
              onChange={(e) => handleCertificationInputChange('maxInsuranceCoverage', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              placeholder="1000000"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">MIN Operational Tenure (YRS)</label>
            <input
              type="number"
              value={formData.certifications?.maxDriverExperience || ''}
              onChange={(e) => handleCertificationInputChange('maxDriverExperience', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              placeholder="5"
            />
          </div>
        </div>
      </div>

      {/* Required Certifications */}
      <div className="space-y-4">
        <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">
          Specialized Endorsements (CSV Format)
        </label>
        <textarea
          value={formData.certifications?.requiredCertifications?.join(', ') || ''}
          onChange={(e) => handleArrayInputChange('requiredCertifications', e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none min-h-[100px] resize-none"
          placeholder="E.G., CDL, Hazmat Endorsement, DOT Certification"
        />
        <p className="text-[9px] text-gray-500 dark:text-gray-400 font-medium italic">
          * PARSE SYSTEM WILL EXTRACT UNIQUE IDENTIFIERS FROM COMMA-SEPARATED VALUES
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Vehicle Certification Documents
          </h4>
          <button
            type="button"
            onClick={() => {
              const current = formData.complianceDocuments?.vehicleCertifications || [];
              handleInputChange('complianceDocuments', {
                ...(formData.complianceDocuments || {}),
                vehicleCertifications: [...current, { status: 'VALID', certificationType: '' }],
              });
            }}
            className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-500 hover:underline"
          >
            + Add certificate
          </button>
        </div>
        {(formData.complianceDocuments?.vehicleCertifications || []).length === 0 && (
          <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Attach official vehicle certificates with a file input, number, issuer, and expiry.
          </p>
        )}
        {(formData.complianceDocuments?.vehicleCertifications || []).map((cert: any, index: number) => (
          <ComplianceDocumentField
            key={`vehicle-cert-${index}`}
            title={`Vehicle Certification ${index + 1}`}
            numberLabel="Certificate number"
            value={cert}
            extraField={(
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">
                  Certification type
                </label>
                <input
                  type="text"
                  value={cert.certificationType || ''}
                  onChange={(e) => {
                    const next = [...(formData.complianceDocuments?.vehicleCertifications || [])];
                    next[index] = { ...cert, certificationType: e.target.value };
                    handleInputChange('complianceDocuments', {
                      ...(formData.complianceDocuments || {}),
                      vehicleCertifications: next,
                    });
                  }}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
                  placeholder="e.g. DOT, ISO, SmartWay"
                  maxLength={80}
                />
              </div>
            )}
            onChange={(record) => {
              const next = [...(formData.complianceDocuments?.vehicleCertifications || [])];
              next[index] = record;
              handleInputChange('complianceDocuments', {
                ...(formData.complianceDocuments || {}),
                vehicleCertifications: next,
              });
            }}
            onRemove={() => {
              const next = (formData.complianceDocuments?.vehicleCertifications || []).filter((_: any, i: number) => i !== index);
              handleInputChange('complianceDocuments', {
                ...(formData.complianceDocuments || {}),
                vehicleCertifications: next,
              });
            }}
          />
        ))}
      </div>

      {/* Certifications Summary */}
      <div className="bg-blue-600/5 dark:bg-blue-600/10 rounded-lg p-4 border border-blue-600/10">
        <h4 className="text-[10px] font-bold text-blue-600 dark:text-blue-500 uppercase tracking-widest mb-4">Accreditation Summary</h4>
        <div className="space-y-4">
          {certificationCategories.map((category) => {
            const selectedCertifications = category.certifications.filter(
              ({ key }) => formData.certifications?.[key]
            );
            
            if (selectedCertifications.length === 0) return null;
            
            return (
              <div key={category.title} className="border-l-2 border-blue-600/20 pl-4 py-0.5">
                <div className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="opacity-50">{category.icon}</span>
                  {category.title}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCertifications.map(({ key, label }) => (
                    <span key={key} className="px-2 py-0.5 bg-white dark:bg-gray-800 text-[9px] font-bold text-gray-600 dark:text-gray-400 rounded border border-gray-100 dark:border-gray-700 uppercase tracking-wider">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {Object.values(formData.certifications || {}).filter(Boolean).length === 0 && (
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest italic">NO ACCREDITATIONS REGISTERED</span>
        )}
      </div>
    </div>
  );
};

