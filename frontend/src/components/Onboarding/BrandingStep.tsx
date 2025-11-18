import React, { useState } from 'react';
import { submitBranding } from '../../services/onboardingApi';
import { checkVerificationStatus } from '../../services/verificationApi';

const BrandingStep: React.FC<any> = ({ formData, setFormData, next, prev }) => {
  const [logo, setLogo] = useState(formData.branding?.logo || null);
  const [preview, setPreview] = useState(formData.branding?.logoUrl || '');
  const [verification, setVerification] = useState<string>('');

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleNext = async () => {
    setFormData((f: any) => ({ ...f, branding: { logo, logoUrl: preview } }));
    try {
      const form = new FormData();
      if (logo) form.append('logo', logo);
      form.append('logoUrl', preview);
      await submitBranding(form);
      const result = await checkVerificationStatus('branding', { logoUrl: preview });
      setVerification(result.status);
      if (result.status === 'verified') {
        next();
      }
    } catch (err) {
      alert('Failed to submit branding info.');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block font-semibold">Upload Logo</label>
        <input type="file" accept="image/*" onChange={handleLogo} className="border rounded px-2 py-1 w-full" />
        {preview && <img src={preview} alt="Logo Preview" className="mt-2 h-16" />}
        {verification && (
          <div className={`text-sm ${verification === 'verified' ? 'text-green-600' : 'text-yellow-600'}`}>Verification status: {verification}</div>
        )}
      </div>
      <div className="flex justify-between gap-2">
        <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={prev}>Back</button>
        <button type="button" className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleNext}>Next</button>
      </div>
    </div>
  );
};

export default BrandingStep;
