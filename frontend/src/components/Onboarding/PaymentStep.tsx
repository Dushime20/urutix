import React from 'react';
import { useForm } from 'react-hook-form';
import { submitPayment } from '../../services/onboardingApi';
import { checkVerificationStatus } from '../../services/verificationApi';

const PaymentStep: React.FC<any> = ({ formData, setFormData, next, prev }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: formData.payment || {} });
  const [verification, setVerification] = React.useState<string>('');
  
  const onSubmit = async (data: any) => {
    setFormData((f: any) => ({ ...f, payment: data }));
    try {
      await submitPayment(data);
      const result = await checkVerificationStatus('payment', data);
      setVerification(result.status);
      if (result.status === 'verified') {
        next();
      }
    } catch (err) {
      alert('Failed to submit payment info.');
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block font-semibold">Payment Method</label>
        <select {...register('method', { required: true })} className="border rounded px-2 py-1 w-full">
          <option value="">Select...</option>
          <option value="credit_card">Credit Card</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="digital_wallet">Digital Wallet</option>
        </select>
        {errors.method && <span className="text-red-600 text-xs">Required</span>}
      </div>
      <div>
        <label className="block font-semibold">Account Number</label>
        <input {...register('account', { required: true })} className="border rounded px-2 py-1 w-full" />
        {errors.account && <span className="text-red-600 text-xs">Required</span>}
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

export default PaymentStep;
