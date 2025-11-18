import React from 'react';
import { useForm } from 'react-hook-form';
import { submitAdminUser } from '../../services/onboardingApi';
import { checkVerificationStatus } from '../../services/verificationApi';

const AdminUserStep: React.FC<any> = ({ formData, setFormData, next, prev }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: formData.admin || {} });
  const [verification, setVerification] = React.useState<string>('');
  const onSubmit = async (data: any) => {
    setFormData((f: any) => ({ ...f, admin: data }));
    try {
      await submitAdminUser(data);
      const result = await checkVerificationStatus('admin', data);
      setVerification(result.status);
      if (result.status === 'verified') {
        next();
      }
    } catch (err) {
      alert('Failed to submit admin user.');
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block font-semibold">Admin Name</label>
        <input {...register('name', { required: true })} className="border rounded px-2 py-1 w-full" />
        {errors.name && <span className="text-red-600 text-xs">Required</span>}
      </div>
      <div>
        <label className="block font-semibold">Email</label>
        <input {...register('email', { required: true })} className="border rounded px-2 py-1 w-full" type="email" />
        {errors.email && <span className="text-red-600 text-xs">Required</span>}
      </div>
      <div>
        <label className="block font-semibold">Phone</label>
        <input {...register('phone')} className="border rounded px-2 py-1 w-full" />
      </div>
      {verification && (
        <div className={`text-sm ${verification === 'verified' ? 'text-green-600' : 'text-yellow-600'}`}>
          Verification status: {verification}
        </div>
      )}
      <div className="flex justify-between gap-2">
        <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={prev}>Back</button>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Next</button>
      </div>
    </form>
  );
};

export default AdminUserStep;
