import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { onboardingAPI } from '../../services/onboardingApi';
import {
    FaBuilding, FaFileAlt, FaCreditCard,
    FaCogs, FaCheckCircle, FaSpinner
} from 'react-icons/fa';

const STEPS = [
    { id: 1, title: 'Organization', icon: FaBuilding },
    { id: 2, title: 'Compliance', icon: FaFileAlt },
    { id: 3, title: 'Subscription', icon: FaCreditCard },
    { id: 4, title: 'Configuration', icon: FaCogs },
    { id: 5, title: 'Review', icon: FaCheckCircle },
];

const OnboardingWizard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    secondaryColor: tenant.secondaryColor || '#1e293b',
        portalTitle: tenant.portalTitle || '',
            faviconUrl: tenant.faviconUrl || ''
});
if (tenant.kycData) {
    setKycData({
        registrationNumber: tenant.businessLicense || '',
        taxId: tenant.taxId || '',
        businessType: tenant.kycData.businessType || 'LLC',
        description: tenant.kycData.description || ''
    });
}
if (tenant.subscriptionPlan) setPlan(tenant.subscriptionPlan);
setConfigData({
    subdomain: tenant.subdomain || '',
    termsUrl: tenant.termsUrl || '',
    privacyPolicyUrl: tenant.privacyPolicyUrl || '',
    dataResidency: tenant.dataResidency || 'us-east-1'
});
    }
} catch (error) {
    console.error('Failed to fetch onboarding status', error);
    toast.error('Failed to load onboarding status');
} finally {
    setLoading(false);
}
    };

const handleNext = async () => {
    setSubmitting(true);
    try {
        if (currentStep === 1) {
            await onboardingAPI.updateStep1(orgData);
            setCurrentStep(2);
        } else if (currentStep === 2) {
            await onboardingAPI.updateStep2(kycData);
            setCurrentStep(3);
        } else if (currentStep === 3) {
            await onboardingAPI.updateStep3({ plan });
            setCurrentStep(4);
        } else if (currentStep === 4) {
            await onboardingAPI.updateStep4(configData);
            setCurrentStep(5);
        } else if (currentStep === 5) {
            await onboardingAPI.complete();
            toast.success('Onboarding complete! Redirecting to dashboard...');
            setTimeout(() => navigate('/admin'), 2000); // Redirect to admin dashboard
        }
    } catch (error) {
        console.error('Failed to save step', error);
        toast.error('Failed to save progress. Please try again.');
    } finally {
        setSubmitting(false);
    }
};

if (loading) {
    return (
        <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-blue-600" />
        </div>
    );
}

return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Stepper */}
        <div className="bg-gray-50 border-b border-gray-200 p-6">
            <div className="flex justify-between items-center max-w-3xl mx-auto">
                {STEPS.map((s, idx) => (
                    <div key={s.id} className="flex flex-col items-center relative z-10">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${currentStep >= s.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                                }`}
                        >
                            <s.icon size={16} />
                        </div>
                        <span className={`text-xs font-medium ${currentStep >= s.id ? 'text-blue-900' : 'text-gray-400'}`}>
                            {s.title}
                        </span>
                        {/* Connector Line */}
                        {idx < STEPS.length - 1 && (
                            <div className={`absolute top-5 left-1/2 w-full h-0.5 -z-10 ${currentStep > s.id ? 'bg-blue-600' : 'bg-gray-200'
                                }`} style={{ width: '200%', left: '50%' }} />
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* Content */}
        <div className="p-8 max-w-3xl mx-auto min-h-[400px]">
            {currentStep === 1 && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800">Organization Profile</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={orgData.name}
                                onChange={e => setOrgData({ ...orgData, name: e.target.value })}
                                placeholder="Acme Logistics"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Portal Title</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={orgData.portalTitle}
                                onChange={e => setOrgData({ ...orgData, portalTitle: e.target.value })}
                                placeholder="Acme Portal"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                value={orgData.description}
                                onChange={e => setOrgData({ ...orgData, description: e.target.value })}
                                placeholder="Brief description of your organization..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    className="h-10 w-10 rounded cursor-pointer"
                                    value={orgData.primaryColor}
                                    onChange={e => setOrgData({ ...orgData, primaryColor: e.target.value })}
                                />
                                <input
                                    type="text"
                                    className="flex-1 px-4 py-2 border rounded-lg"
                                    value={orgData.primaryColor}
                                    onChange={e => setOrgData({ ...orgData, primaryColor: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    className="h-10 w-10 rounded cursor-pointer"
                                    value={orgData.secondaryColor}
                                    onChange={e => setOrgData({ ...orgData, secondaryColor: e.target.value })}
                                />
                                <input
                                    type="text"
                                    className="flex-1 px-4 py-2 border rounded-lg"
                                    value={orgData.secondaryColor}
                                    onChange={e => setOrgData({ ...orgData, secondaryColor: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {currentStep === 2 && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800">Legal & Compliance</h2>
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Business Registration Number</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={kycData.registrationNumber}
                                onChange={e => setKycData({ ...kycData, registrationNumber: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID / VAT Number</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={kycData.taxId}
                                onChange={e => setKycData({ ...kycData, taxId: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                            <select
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={kycData.businessType}
                                onChange={e => setKycData({ ...kycData, businessType: e.target.value })}
                            >
                                <option value="LLC">LLC</option>
                                <option value="Corporation">Corporation</option>
                                <option value="Partnership">Partnership</option>
                                <option value="Sole Proprietorship">Sole Proprietorship</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {currentStep === 3 && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800 text-center">Choose your Plan</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Free Plan */}
                        <div
                            className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${plan === 'FREE' ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'
                                }`}
                            onClick={() => setPlan('FREE')}
                        >
                            <div className="text-center mb-4">
                                <h3 className="font-bold text-lg">Starter</h3>
                                <p className="text-3xl font-bold mt-2">$0<span className="text-sm text-gray-500 font-normal">/mo</span></p>
                            </div>
                            <ul className="text-sm space-y-2 text-gray-600">
                                <li className="flex items-center"><FaCheckCircle className="text-green-500 mr-2" size={12} /> Up to 5 Users</li>
                                <li className="flex items-center"><FaCheckCircle className="text-green-500 mr-2" size={12} /> 5GB Storage</li>
                                <li className="flex items-center"><FaCheckCircle className="text-green-500 mr-2" size={12} /> Basic Support</li>
                            </ul>
                        </div>

                        {/* Pro Plan */}
                        <div
                            className={`border-2 rounded-xl p-6 cursor-pointer transition-all relative ${plan === 'PRO' ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'
                                }`}
                            onClick={() => setPlan('PRO')}
                        >
                            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-2 py-1 rounded-bl-lg rounded-tr-lg">POPULAR</div>
                            <div className="text-center mb-4">
                                <h3 className="font-bold text-lg">Professional</h3>
                                <p className="text-3xl font-bold mt-2">$49<span className="text-sm text-gray-500 font-normal">/mo</span></p>
                            </div>
                            <ul className="text-sm space-y-2 text-gray-600">
                                <li className="flex items-center"><FaCheckCircle className="text-green-500 mr-2" size={12} /> Up to 50 Users</li>
                                <li className="flex items-center"><FaCheckCircle className="text-green-500 mr-2" size={12} /> 20GB Storage</li>
                                <li className="flex items-center"><FaCheckCircle className="text-green-500 mr-2" size={12} /> Priority Support</li>
                                <li className="flex items-center"><FaCheckCircle className="text-green-500 mr-2" size={12} /> Advanced Analytics</li>
                            </ul>
                        </div>

                        {/* Enterprise Plan */}
                        <div
                            className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${plan === 'ENTERPRISE' ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'
                                }`}
                            onClick={() => setPlan('ENTERPRISE')}
                        >
                            <div className="text-center mb-4">
                                <h3 className="font-bold text-lg">Enterprise</h3>
                                <p className="text-3xl font-bold mt-2">$199<span className="text-sm text-gray-500 font-normal">/mo</span></p>
                            </div>
                            <ul className="text-sm space-y-2 text-gray-600">
                                <li className="flex items-center"><FaCheckCircle className="text-green-500 mr-2" size={12} /> Unlimited Users</li>
                                <li className="flex items-center"><FaCheckCircle className="text-green-500 mr-2" size={12} /> 100GB Storage</li>
                                <li className="flex items-center"><FaCheckCircle className="text-green-500 mr-2" size={12} /> 24/7 Dedicated Support</li>
                                <li className="flex items-center"><FaCheckCircle className="text-green-500 mr-2" size={12} /> Custom Integrations</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {currentStep === 4 && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800">System Configuration</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subdomain</label>
                            <div className="flex">
                                <input
                                    type="text"
                                    className="flex-1 px-4 py-2 border border-r-0 rounded-l-lg focus:ring-2 focus:ring-blue-500"
                                    value={configData.subdomain}
                                    onChange={e => setConfigData({ ...configData, subdomain: e.target.value })}
                                    placeholder="my-company"
                                />
                                <div className="bg-gray-100 border border-l-0 rounded-r-lg px-3 py-2 text-gray-500">
                                    .urutix.com
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data Residency</label>
                            <select
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={configData.dataResidency}
                                onChange={e => setConfigData({ ...configData, dataResidency: e.target.value })}
                            >
                                <option value="us-east-1">United States (East)</option>
                                <option value="eu-central-1">Europe (Germany)</option>
                                <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Terms of Service URL</label>
                            <input
                                type="url"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={configData.termsUrl}
                                onChange={e => setConfigData({ ...configData, termsUrl: e.target.value })}
                                placeholder="https://example.com/terms"
                            />
                        </div>
                    </div>
                </div>
            )}

            {currentStep === 5 && (
                <div className="space-y-6 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaCheckCircle className="text-green-600 text-4xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">You're All Set!</h2>
                    <p className="text-gray-600 max-w-md mx-auto">
                        Please review your details below before launching your workspace.
                    </p>

                    <div className="bg-gray-50 p-6 rounded-xl text-left max-w-lg mx-auto space-y-4">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Organization</span>
                            <span className="font-medium">{orgData.name}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Plan</span>
                            <span className="font-medium">{plan}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Domain</span>
                            <span className="font-medium">{configData.subdomain}.urutix.com</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Data Region</span>
                            <span className="font-medium">{configData.dataResidency}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Footer / Actions */}
        <div className="bg-gray-50 p-6 border-t border-gray-200 flex justify-between">
            <button
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${currentStep === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-200'
                    }`}
                disabled={currentStep === 1 || submitting}
            >
                Back
            </button>
            <button
                onClick={handleNext}
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-medium shadow-md transition-all flex items-center gap-2"
            >
                {submitting && <FaSpinner className="animate-spin" />}
                {currentStep === 5 ? 'Launch Workspace' : 'Continue'}
            </button>
        </div>
    </div>
);
};

export default OnboardingWizard;
