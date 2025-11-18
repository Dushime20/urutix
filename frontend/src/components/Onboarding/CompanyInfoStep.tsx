import React from 'react';
import { useForm } from 'react-hook-form';
import { submitCompanyInfo } from '../../services/onboardingApi';
import { checkVerificationStatus } from '../../services/verificationApi';

const CompanyInfoStep: React.FC<any> = ({ formData, setFormData, next }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: formData.company || {} });
  const [verification, setVerification] = React.useState<string>('');
  
  const onSubmit = async (data: any) => {
    setFormData((f: any) => ({ ...f, company: data }));
    try {
      await submitCompanyInfo(data);
      const result = await checkVerificationStatus('company', data);
      setVerification(result.status);
      if (result.status === 'verified') {
        next();
      }
    } catch (err) {
      alert('Failed to submit company info.');
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block font-semibold">Company Name</label>
        <input {...register('name', { required: true })} className="border rounded px-2 py-1 w-full" />
        {errors.name && <span className="text-red-600 text-xs">Required</span>}
      </div>
      <div>
        <label className="block font-semibold">Industry</label>
        <input {...register('industry', { required: true })} className="border rounded px-2 py-1 w-full" />
        {errors.industry && <span className="text-red-600 text-xs">Required</span>}
      </div>
      <div>
        <label className="block font-semibold">Website</label>
        <input {...register('website')} className="border rounded px-2 py-1 w-full" />
      </div>
      {verification && (
        <div className={`text-sm ${verification === 'verified' ? 'text-green-600' : 'text-yellow-600'}`}>
          Verification status: {verification}
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Next</button>
      </div>
    </form>
  );
};

export default CompanyInfoStep;
