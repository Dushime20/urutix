import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PurchaseCredits: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to subscription plans page
    navigate('/tenant-admin/subscription-plans', { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#345E85] mx-auto"></div>
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Redirecting...</p>
      </div>
    </div>
  );
};

export default PurchaseCredits;
