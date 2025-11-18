import React from 'react';

const TourStep: React.FC<any> = ({ next, prev }) => {
  // Placeholder for tour integration (e.g., react-joyride)
  return (
    <div className="space-y-4">
      <div className="font-semibold">Feature Tour</div>
      <div className="text-gray-600">A guided walkthrough of platform features will start here.</div>
      <div className="flex justify-between gap-2">
        <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={prev}>Back</button>
        <button type="button" className="bg-blue-600 text-white px-4 py-2 rounded" onClick={next}>Next</button>
      </div>
    </div>
  );
};

export default TourStep;
