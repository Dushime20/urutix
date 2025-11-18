import React from 'react';

export const CargoModal = ({ cargo, onClose }: any) => {
  if (!cargo) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded shadow-lg max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-black" aria-label="Close">&times;</button>
        <h2 className="text-xl font-bold mb-2">Cargo Details</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          {Object.entries(cargo).map(([key, value]) => (
            <React.Fragment key={key}>
              <dt className="font-semibold text-gray-600">{key}</dt>
              <dd className="text-gray-900 break-all">{String(value)}</dd>
            </React.Fragment>
          ))}
        </dl>
      </div>
    </div>
  );
};
