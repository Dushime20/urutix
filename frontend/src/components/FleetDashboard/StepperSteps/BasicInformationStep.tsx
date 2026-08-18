import React from 'react';
import { FaTruck, FaIdCard, FaBuilding } from 'react-icons/fa';

interface BasicInformationStepProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

const inputClass =
  'w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-none appearance-none';
const labelClass =
  'block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1';

const vehicleStatuses = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'OUT_OF_SERVICE', label: 'Out of Service' },
];

const availabilityStatuses = [
  { value: 'AVAILABLE', label: 'Available for Assignment' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'RESERVED', label: 'Reserved' },
  { value: 'UNAVAILABLE', label: 'Unavailable' },
];

const ownershipTypes = [
  { value: 'OWNED', label: 'Owned' },
  { value: 'LEASED', label: 'Leased' },
  { value: 'RENTED', label: 'Rented' },
  { value: 'OWNER_OPERATOR', label: 'Owner Operator' },
  { value: 'FINANCED', label: 'Financed' },
  { value: 'THIRD_PARTY', label: 'Third Party' },
];

const vehicleClasses = [
  { value: 'LIGHT', label: 'Light Duty' },
  { value: 'MEDIUM', label: 'Medium Duty' },
  { value: 'HEAVY', label: 'Heavy Duty' },
  { value: 'EXTRA_HEAVY', label: 'Extra Heavy' },
  { value: 'SPECIALIZED', label: 'Specialized' },
];

const vehicleTypes = [
  'FLATBED',
  'BOX_TRUCK',
  'REFRIGERATED',
  'TANKER',
  'CONTAINER',
  'LOWBED',
  'STEP_DECK',
  'POWER_ONLY',
  'CAR_CARRIER',
  'DUMP',
  'VAN',
  'PLATFORM',
  'BULK',
  'CURTAIN_SIDE',
  'HEAVY_HAUL',
  'SPECIALIZED',
];

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: currentYear - 1989 + 2 }, (_, i) => currentYear + 1 - i);

const BasicInformationStep: React.FC<BasicInformationStepProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <FaTruck className="w-4 h-4 text-blue-600 dark:text-blue-500" />
        <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Fleet Asset Identification
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center mb-4">
            <FaIdCard className="w-3.5 h-3.5 mr-2 text-blue-600 dark:text-blue-500" />
            Core Identification
          </h4>

          <div>
            <label className={labelClass}>Plate Number *</label>
            <input
              type="text"
              value={formData.plateNumber || ''}
              onChange={(e) => handleInputChange('plateNumber', e.target.value)}
              className={inputClass}
              required
              maxLength={20}
              placeholder="e.g. KAA 123A"
            />
          </div>

          <div>
            <label className={labelClass}>VIN Registry *</label>
            <input
              type="text"
              value={formData.vin || ''}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
                if (value.length <= 17) {
                  handleInputChange('vin', value);
                }
              }}
              className={`${inputClass} ${
                formData.vin?.length === 17
                  ? 'border-green-500/50 ring-green-500/5 focus:ring-green-500/10 focus:border-green-500'
                  : formData.vin?.length > 0
                    ? 'border-yellow-500/50 ring-yellow-500/5 focus:ring-yellow-500/10 focus:border-yellow-500'
                    : ''
              }`}
              required
              maxLength={17}
              minLength={17}
              placeholder="17-character VIN"
            />
            <div className="mt-1.5 flex items-center justify-between px-1">
              <span
                className={`text-[10px] font-bold uppercase tracking-widest ${
                  formData.vin?.length === 17
                    ? 'text-green-600 dark:text-green-500'
                    : formData.vin?.length > 0
                      ? 'text-yellow-600 dark:text-yellow-500'
                      : 'text-gray-400 dark:text-gray-600'
                }`}
              >
                {formData.vin?.length || 0} / 17 characters
              </span>
              {formData.vin?.length === 17 && (
                <span className="text-[10px] text-green-600 dark:text-green-500 font-bold uppercase tracking-widest">
                  ✓ Valid length
                </span>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>Registration Code *</label>
            <input
              type="text"
              value={formData.registrationNumber || ''}
              onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
              className={inputClass}
              required
              maxLength={50}
              placeholder="Vehicle registration code"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
            Manufacturer Specifications
          </h4>

          <div>
            <label className={labelClass}>Manufacturer</label>
            <input
              type="text"
              value={formData.manufacturer || ''}
              onChange={(e) => handleInputChange('manufacturer', e.target.value)}
              className={inputClass}
              maxLength={100}
              placeholder="e.g. Volvo Group"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Make *</label>
              <input
                type="text"
                value={formData.make || ''}
                onChange={(e) => handleInputChange('make', e.target.value)}
                className={inputClass}
                required
                placeholder="e.g. Volvo"
              />
            </div>

            <div>
              <label className={labelClass}>Model *</label>
              <input
                type="text"
                value={formData.model || ''}
                onChange={(e) => handleInputChange('model', e.target.value)}
                className={inputClass}
                required
                placeholder="e.g. FH16"
              />
            </div>

            <div>
              <label className={labelClass}>Production Year *</label>
              <select
                value={formData.year || ''}
                onChange={(e) =>
                  handleInputChange('year', e.target.value === '' ? '' : parseInt(e.target.value, 10))
                }
                className={inputClass}
                required
              >
                <option value="" className="dark:bg-gray-900">
                  Select year...
                </option>
                {yearOptions.map((year) => (
                  <option key={year} value={year} className="dark:bg-gray-900">
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Color</label>
              <input
                type="text"
                value={formData.color || ''}
                onChange={(e) => handleInputChange('color', e.target.value)}
                className={inputClass}
                maxLength={50}
                placeholder="e.g. White"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Chassis</label>
            <input
              type="text"
              value={formData.chassis || ''}
              onChange={(e) => handleInputChange('chassis', e.target.value)}
              className={inputClass}
              maxLength={100}
              placeholder="Chassis number / ID"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center mb-4">
          Status & Classification
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Vehicle Status</label>
            <select
              value={formData.status || 'AVAILABLE'}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className={inputClass}
            >
              {vehicleStatuses.map((option) => (
                <option key={option.value} value={option.value} className="dark:bg-gray-900">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Availability Status</label>
            <select
              value={formData.availabilityStatus || 'AVAILABLE'}
              onChange={(e) => handleInputChange('availabilityStatus', e.target.value)}
              className={inputClass}
            >
              {availabilityStatuses.map((option) => (
                <option key={option.value} value={option.value} className="dark:bg-gray-900">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Ownership Type</label>
            <select
              value={formData.ownershipType || ''}
              onChange={(e) => handleInputChange('ownershipType', e.target.value)}
              className={inputClass}
            >
              <option value="" className="dark:bg-gray-900">
                Select ownership...
              </option>
              {ownershipTypes.map((option) => (
                <option key={option.value} value={option.value} className="dark:bg-gray-900">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Vehicle Class</label>
            <select
              value={formData.vehicleClass || ''}
              onChange={(e) => handleInputChange('vehicleClass', e.target.value)}
              className={inputClass}
            >
              <option value="" className="dark:bg-gray-900">
                Select class...
              </option>
              {vehicleClasses.map((option) => (
                <option key={option.value} value={option.value} className="dark:bg-gray-900">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Vehicle Type</label>
            <select
              value={formData.truckType || ''}
              onChange={(e) => handleInputChange('truckType', e.target.value)}
              className={inputClass}
            >
              <option value="" className="dark:bg-gray-900">
                Select type...
              </option>
              {vehicleTypes.map((type) => (
                <option key={type} value={type} className="dark:bg-gray-900">
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center mb-4">
          <FaBuilding className="w-3.5 h-3.5 mr-2 text-blue-600 dark:text-blue-500" />
          Fleet Organization
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Fleet Group</label>
            <input
              type="text"
              value={formData.fleetGroup || ''}
              onChange={(e) => handleInputChange('fleetGroup', e.target.value)}
              className={inputClass}
              maxLength={100}
              placeholder="e.g. Long Haul East"
            />
          </div>
          <div>
            <label className={labelClass}>Business Unit</label>
            <input
              type="text"
              value={formData.businessUnit || ''}
              onChange={(e) => handleInputChange('businessUnit', e.target.value)}
              className={inputClass}
              maxLength={100}
              placeholder="e.g. Logistics"
            />
          </div>
          <div>
            <label className={labelClass}>Cost Center</label>
            <input
              type="text"
              value={formData.costCenter || ''}
              onChange={(e) => handleInputChange('costCenter', e.target.value)}
              className={inputClass}
              maxLength={100}
              placeholder="e.g. CC-1400"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center mb-4">
          Home Terminal
        </h4>
        <div>
          <label className={labelClass}>Home Terminal</label>
          <input
            type="text"
            value={formData.assetDetails?.homeTerminal || ''}
            onChange={(e) =>
              handleInputChange('assetDetails', {
                ...(formData.assetDetails || {}),
                homeTerminal: e.target.value,
              })
            }
            className={inputClass}
            maxLength={150}
            placeholder="e.g. Nairobi Depot / Mombasa Yard"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
          Vehicle Photos
        </h4>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            const current = formData.assetDetails?.photos || [];
            const next = [
              ...current,
              ...files.slice(0, Math.max(0, 8 - current.length)).map((file) => ({
                file,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type,
                previewUrl: URL.createObjectURL(file),
              })),
            ];
            handleInputChange('assetDetails', {
              ...(formData.assetDetails || {}),
              photos: next,
            });
            e.target.value = '';
          }}
          className="block w-full text-sm text-gray-600 dark:text-gray-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg"
        />
        <p className="text-[9px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
          JPG, PNG or WEBP · Up to 8 photos
        </p>
        <div className="flex flex-wrap gap-3">
          {(formData.assetDetails?.photos || []).map((photo: any, index: number) => (
            <div key={`${photo.fileName}-${index}`} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
              {photo.previewUrl ? (
                <img src={photo.previewUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[9px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 dark:bg-gray-800">
                  Photo
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  if (photo.previewUrl) URL.revokeObjectURL(photo.previewUrl);
                  const next = (formData.assetDetails?.photos || []).filter((_: any, i: number) => i !== index);
                  handleInputChange('assetDetails', {
                    ...(formData.assetDetails || {}),
                    photos: next,
                  });
                }}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px]"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BasicInformationStep;
