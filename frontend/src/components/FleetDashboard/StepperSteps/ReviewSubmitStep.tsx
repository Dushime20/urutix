import React from 'react';
import { FaCheck, FaTruck, FaUser, FaCog, FaShieldAlt, FaMapMarkedAlt, FaCertificate } from 'react-icons/fa';

interface ReviewSubmitStepProps {
  formData: any;
  activeTab?: 'trucks' | 'drivers';
}

const ReviewSubmitStep: React.FC<ReviewSubmitStepProps> = ({ formData, activeTab = 'trucks' }) => {
  const getValueFromPath = (obj: any, path: string) => {
    if (!obj || !path) return undefined;
    if (!path.includes('.')) return obj[path];
    return path.split('.').reduce((acc: any, key: string) => (acc ? acc[key] : undefined), obj);
  };

  const labelFromPath = (path: string) => {
    if (!path.includes('.')) {
      return path
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase());
    }
    const parts = path.split('.');
    const parent = parts[0]
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
    const child = parts[1]
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
    return `${parent} (${child})`;
  };

  const renderSection = (title: string, icon: React.ReactNode, data: any, fields: string[]) => {
    return (
      <div className="space-y-3">
        <h4 className="text-lg font-medium text-gray-800 flex items-center">
          {icon}
          <span className="ml-2">{title}</span>
        </h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => {
              const value = getValueFromPath(data, field);
              if (value === undefined || value === null || value === '') return null;
              
              return (
                <div key={field} className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600 capitalize">
                    {labelFromPath(field)}:
                  </span>
                  <span className="text-sm text-gray-900">
                    {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const basicFields = [
    'plateNumber', 'vin', 'make', 'model', 'year', 'color', 'fuelType',
    'capacityWeight', 'capacityVolume', 'registrationNumber', 'registrationExpiry',
    'insurancePolicy', 'insuranceExpiry'
  ];

  const cargoFields = [
    'truckType', 'trailerType', 'hasTanker', 'hasBulk', 'hasRefrigerated',
    'hasCarCarrier', 'hasHeavyHaul', 'hasOversized', 'hasHazmat',
    'hasDangerousGoods', 'hasFoodGrade', 'hasPharmaceutical'
  ];

  const equipmentFields = [
    'hasSideRails', 'hasTarps', 'hasStraps', 'hasChains', 'hasWinch',
    'hasRam', 'hasTailLift', 'hasSideLift', 'hasRollerBed', 'hasDropDeck',
    'hasExtendable', 'hasLowbed', 'hasStepDeck', 'hasPowerOnly'
  ];

  const technologyFields = [
    'hasGPS', 'hasTracking', 'hasTelematics', 'hasELD', 'hasDashCam',
    'hasSafetyCameras', 'hasCollisionAvoidance', 'hasLaneDeparture',
    'hasAdaptiveCruise', 'hasBlindSpot', 'hasBackupCamera'
  ];

  const driverFields = [
    'firstName', 'lastName', 'licenseNumber', 'licenseType', 'experience',
    'contactInfo.phone', 'contactInfo.email'
  ];

  const renderDriverCertifications = () => {
    const certLabels: Record<string, string> = {
      cdlCertified: 'CDL Certified',
      hazmatEndorsement: 'Hazmat Endorsement',
      tankerEndorsement: 'Tanker Endorsement',
      doublesTriplesEndorsement: 'Doubles/Triples Endorsement',
      passengerEndorsement: 'Passenger Endorsement',
      schoolBusEndorsement: 'School Bus Endorsement',
    };
    const selected = Object.keys(certLabels).filter((key) => formData?.certifications?.[key]);
    if (selected.length === 0) return null;
    return (
      <div className="space-y-3">
        <h4 className="text-lg font-medium text-gray-800 flex items-center">
          <FaCertificate className="w-5 h-5 text-primary-600" />
          <span className="ml-2">Driver Certifications</span>
        </h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex flex-wrap gap-2">
            {selected.map((key) => (
              <span key={key} className="px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800">
                {certLabels[key]}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <FaCheck className="w-6 h-6 text-green-600" />
        <h3 className="text-xl font-semibold text-gray-900">Review & Submit</h3>
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <FaCheck className="w-5 h-5 text-primary-600 mr-2" />
          <p className="text-primary-800 font-medium">
            Please review all the information below before submitting. You can go back to previous steps to make changes.
          </p>
        </div>
      </div>

      {activeTab === 'drivers' ? (
        <>
          {renderSection(
            'Driver Information',
            <FaUser className="w-5 h-5 text-primary-600" />,
            formData,
            driverFields
          )}
          {renderDriverCertifications()}
        </>
      ) : (
        <>
          {renderSection(
            'Basic Information',
            <FaTruck className="w-5 h-5 text-primary-600" />,
            formData,
            basicFields
          )}
          {renderSection(
            'Cargo Capabilities',
            <FaCog className="w-5 h-5 text-primary-600" />,
            formData,
            cargoFields
          )}
          {renderSection(
            'Equipment & Safety',
            <FaShieldAlt className="w-5 h-5 text-primary-600" />,
            formData,
            equipmentFields
          )}
          {renderSection(
            'Technology & Tracking',
            <FaMapMarkedAlt className="w-5 h-5 text-primary-600" />,
            formData,
            technologyFields
          )}
        </>
      )}

      {/* Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <FaCheck className="w-5 h-5 text-green-600 mr-2" />
          <div>
            <h4 className="text-green-800 font-medium">Ready to Submit</h4>
            <p className="text-green-700 text-sm">
              All required information has been provided. Click submit to create your fleet entry.
            </p>
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="space-y-3">
        <h4 className="text-lg font-medium text-gray-800">Additional Notes</h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            {formData.additionalNotes || 'No additional notes provided.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReviewSubmitStep; 