import React from 'react';
import { FaCertificate, FaShieldAlt, FaUserGraduate, FaDollarSign } from 'react-icons/fa';

interface CertificationsStepProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

export const CertificationsStep: React.FC<CertificationsStepProps> = ({
  formData,
  handleInputChange,
}) => {
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
      title: 'Driver Certifications',
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
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <FaCertificate className="w-5 h-5 text-gray-600" />
          Certifications & Compliance
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure certifications, endorsements, and compliance requirements.
        </p>
      </div>

      {/* Certification Categories */}
      <div className="space-y-6">
        {certificationCategories.map((category) => (
          <div key={category.title} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              {category.icon}
              <h4 className="text-md font-medium text-gray-900">{category.title}</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {category.certifications.map(({ key, label, description }) => (
                <div key={key} className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.certifications?.[key] || false}
                      onChange={() => handleCertificationToggle(key)}
                      className="mt-1 rounded border-gray-300 text-gray-600 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">{label}</div>
                      <div className="text-xs text-gray-600 mt-1">{description}</div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Insurance & Coverage */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FaDollarSign className="w-4 h-4 text-gray-500" />
          <label className="block text-sm font-medium text-gray-700">
            Insurance & Coverage Limits
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Max Insurance Coverage ($)</label>
            <input
              type="number"
              value={formData.certifications?.maxInsuranceCoverage || ''}
              onChange={(e) => handleCertificationInputChange('maxInsuranceCoverage', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="1000000"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Max Driver Experience (years)</label>
            <input
              type="number"
              value={formData.certifications?.maxDriverExperience || ''}
              onChange={(e) => handleCertificationInputChange('maxDriverExperience', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="5"
            />
          </div>
        </div>
      </div>

      {/* Required Certifications */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Required Certifications (comma-separated)
          </label>
          <textarea
            value={formData.certifications?.requiredCertifications?.join(', ') || ''}
            onChange={(e) => handleArrayInputChange('requiredCertifications', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={3}
            placeholder="CDL, Hazmat Endorsement, DOT Certification"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter specific certifications required, separated by commas
          </p>
        </div>
      </div>

      {/* Certifications Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Certifications Summary</h4>
        <div className="space-y-2">
          {certificationCategories.map((category) => {
            const selectedCertifications = category.certifications.filter(
              ({ key }) => formData.certifications?.[key]
            );
            
            if (selectedCertifications.length === 0) return null;
            
            return (
              <div key={category.title} className="border-l-4 border-gray-500 pl-3">
                <div className="text-sm font-medium text-gray-900 mb-1">{category.title}</div>
                <div className="flex flex-wrap gap-1">
                  {selectedCertifications.map(({ key, label }) => (
                    <span key={key} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {Object.values(formData.certifications || {}).filter(Boolean).length === 0 && (
          <span className="text-gray-500 text-sm">No certifications selected</span>
        )}
      </div>
    </div>
  );
};

