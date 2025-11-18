import React, { useState } from 'react';
import CompanyInfoStep from './CompanyInfoStep';
import AdminUserStep from './AdminUserStep';
import PaymentStep from './PaymentStep';
import BrandingStep from './BrandingStep';
import InviteUsersStep from './InviteUsersStep';
import TourStep from './TourStep';
import GoLiveStep from './GoLiveStep';
import { trackOnboardingStep } from '../../services/analyticsApi';

const steps = [
  'Company Information',
  'Admin User Creation',
  'Payment Configuration',
  'Branding Setup',
  'Initial User Invitations',
  'Feature Tour',
  'Go-live Checklist',
];

const OnboardingFlow: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [formData, setFormData] = useState<any>({});

  const next = async () => {
    await trackOnboardingStep(steps[current], formData);
    setCurrent((c) => Math.min(c + 1, steps.length - 1));
  };
  const prev = () => setCurrent((c) => Math.max(c - 1, 0));

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded shadow">
      <div className="mb-6 flex items-center justify-between">
        <div className="font-bold text-xl">Onboarding</div>
        <div className="flex gap-2">
          {steps.map((step, i) => (
            <span key={step} className={`px-2 py-1 rounded ${i === current ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>{i + 1}</span>
          ))}
        </div>
      </div>
      {current === 0 && <CompanyInfoStep formData={formData} setFormData={setFormData} next={next} />}
      {current === 1 && <AdminUserStep formData={formData} setFormData={setFormData} next={next} prev={prev} />}
      {current === 2 && <PaymentStep formData={formData} setFormData={setFormData} next={next} prev={prev} />}
      {current === 3 && <BrandingStep formData={formData} setFormData={setFormData} next={next} prev={prev} />}
      {current === 4 && <InviteUsersStep formData={formData} setFormData={setFormData} next={next} prev={prev} />}
      {current === 5 && <TourStep formData={formData} setFormData={setFormData} next={next} prev={prev} />}
      {current === 6 && <GoLiveStep formData={formData} setFormData={setFormData} prev={prev} />}
    </div>
  );
};

export default OnboardingFlow;
