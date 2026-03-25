import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui";
import React from "react";
import { FaBox } from "react-icons/fa";

interface ModalHeaderProps {
  onClose: () => void;
}

const ModalHeader: React.FC<ModalHeaderProps> = () => {
  return (
    <DialogHeader className="p-4 sm:p-5 border-b border-slate-50 bg-white">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50/50 flex items-center justify-center">
          <FaBox className="w-5 h-5 text-[#345E85]" />
        </div>
        <div className="flex-1 min-w-0">
          <DialogTitle className="text-xl font-black text-[#0f172a] tracking-tight truncate">
            Cargo Template Selection
          </DialogTitle>
          <DialogDescription className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 truncate">
            ACCELERATE SHIPMENT WITH PROTOCOL_PROFILES
          </DialogDescription>
        </div>
      </div>
    </DialogHeader>
  );
};

export default ModalHeader;
