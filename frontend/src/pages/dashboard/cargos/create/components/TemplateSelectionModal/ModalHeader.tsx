import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui";
import React from "react";

interface ModalHeaderProps {
  onClose: () => void;
}

const ModalHeader: React.FC<ModalHeaderProps> = () => {
  return (
    <DialogHeader className="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-teal-100">
      <div className="flex items-center justify-between">
        <div>
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
            Choose Cargo Template
          </DialogTitle>
          <DialogDescription className="text-gray-500 text-sm mt-1">
            Select a template to pre-fill cargo details and streamline your
            shipping process
          </DialogDescription>
        </div>
      </div>
    </DialogHeader>
  );
};

export default ModalHeader;
