import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui";
import React from "react";
import { FaBox } from "react-icons/fa";

interface ModalHeaderProps {
  onClose: () => void;
}

const ModalHeader: React.FC<ModalHeaderProps> = () => {
  return (
    <DialogHeader className="p-6 border-b border-slate-100 bg-white">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
          <FaBox className="w-6 h-6 text-[#345E85]" />
        </div>
        <div>
          <DialogTitle className="text-2xl font-black text-[#0f172a] tracking-tight">
            Choose Cargo Template
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
            Accelerate your shipment with pre-configured logistics profiles
          </DialogDescription>
        </div>
      </div>
    </DialogHeader>
  );
};

export default ModalHeader;
