import React, { useState } from 'react';
import { FaQuestionCircle, FaTimes } from 'react-icons/fa';
import { HelpCenter } from './HelpCenter';

export const FloatingHelpButton: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-all duration-300 flex items-center justify-center z-50 hover:scale-110"
        title="Get Help (Press ?)"
        aria-label="Help"
      >
        <FaQuestionCircle className="w-6 h-6" />
      </button>

      {showHelp && (
        <HelpCenter
          onClose={() => setShowHelp(false)}
        />
      )}
    </>
  );
};

