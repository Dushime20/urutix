import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { onboardingAPI } from '../../services/onboardingApi';
import {
    FaBuilding, FaFileAlt, FaCreditCard,
    FaCogs, FaCheckCircle, FaSpinner,
    FaRocket, FaShieldAlt, FaGlobe,
    FaPalette, FaUsers, FaChartLine
} from 'react-icons/fa';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';

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
    const [orgData, setOrgData] = useState({
        name: '',
        description: '',
        primaryColor: '#3b82f6',
        secondaryColor: '#1e293b',
        portalTitle: '',
        faviconUrl: ''
    });
    const [kycData, setKycData] = useState({
        registrationNumber: '',
        taxId: '',
        businessType: 'LLC',
        description: ''
    });
    const [plan, setPlan] = useState<'FREE' | 'PRO' | 'ENTERPRISE'>('FREE');
    const [configData, setConfigData] = useState({
        subdomain: '',
        termsUrl: '',
        privacyPolicyUrl: '',
        dataResidency: 'us-east-1'
    });

    useEffect(() => {
        const fetchOnboardingStatus = async () => {
            try {
                const response = await onboardingAPI.getStatus();
                const tenant = response.data;
                if (tenant) {
                    setOrgData({
                        name: tenant.name || '',
                        description: tenant.description || '',
                        primaryColor: tenant.primaryColor || '#3b82f6',
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

        fetchOnboardingStatus();
    }, []);

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
            <AdminPageLayout title="Onboarding" description="Setting up your workspace">
                <div className="flex justify-center items-center h-96">
                    <div className="text-center">
                        <FaSpinner className="animate-spin text-5xl text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading onboarding wizard...</p>
                    </div>
                </div>
            </AdminPageLayout>
        );
    }

    return (
        <AdminPageLayout 
            title="Workspace Onboarding" 
            description="Complete your organization setup in 5 easy steps"
        >
            <div className="max-w-5xl mx-auto">
                {/* Progress Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 mb-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-3 rounded-lg">
                                <FaRocket className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Getting Started</h2>
                                <p className="text-blue-100 text-sm">Step {currentStep} of {STEPS.length}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold">{Math.round((currentStep / STEPS.length) * 100)}%</div>
                            <div className="text-blue-100 text-sm">Complete</div>
                        </div>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                        <div 
                            className="bg-white rounded-full h-2 transition-all duration-500"
                            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Stepper */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex justify-between items-center relative">
                        {STEPS.map((s, idx) => (
                            <React.Fragment key={s.id}>
                                <div className="flex flex-col items-center relative z-10 flex-1">
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                                            currentStep > s.id 
                                                ? 'bg-green-500 text-white shadow-lg' 
                                                : currentStep === s.id 
                                                ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-100' 
                                                : 'bg-gray-200 text-gray-400'
                                        }`}
                                    >
                                        {currentStep > s.id ? <FaCheckCircle size={20} /> : <s.icon size={18} />}
                                    </div>
                                    <span className={`text-xs font-medium text-center ${
                                        currentStep >= s.id ? 'text-gray-900' : 'text-gray-400'
                                    }`}>
                                        {s.title}
                                    </span>
                                </div>
                                {/* Connector Line */}
                                {idx < STEPS.length - 1 && (
                                    <div className="flex-1 h-0.5 mx-2 relative" style={{ top: '-20px' }}>
                                        <div className={`h-full transition-all duration-300 ${
                                            currentStep > s.id ? 'bg-green-500' : 'bg-gray-200'
                                        }`} />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Content Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

            {/* Content */}
            <div className="p-8 min-h-[500px]">
                {currentStep === 1 && (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaBuilding className="text-blue-600 text-2xl" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Organization Profile</h2>
                            <p className="text-gray-600">Tell us about your company and customize your workspace</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <FaBuilding className="inline mr-2 text-blue-600" />
                                    Company Name *
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    value={orgData.name}
                                    onChange={e => setOrgData({ ...orgData, name: e.target.value })}
                                    placeholder="Acme Logistics Inc."
                                />
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <FaGlobe className="inline mr-2 text-blue-600" />
                                    Portal Title
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    value={orgData.portalTitle}
                                    onChange={e => setOrgData({ ...orgData, portalTitle: e.target.value })}
                                    placeholder="Acme Portal"
                                />
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                <textarea
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    rows={4}
                                    value={orgData.description}
                                    onChange={e => setOrgData({ ...orgData, description: e.target.value })}
                                    placeholder="Brief description of your organization and services..."
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <FaPalette className="inline mr-2 text-blue-600" />
                                    Primary Brand Color
                                </label>
                                <div className="flex gap-3">
                                    <input
                                        type="color"
                                        className="h-12 w-12 rounded-lg cursor-pointer border-2 border-gray-300"
                                        value={orgData.primaryColor}
                                        onChange={e => setOrgData({ ...orgData, primaryColor: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={orgData.primaryColor}
                                        onChange={e => setOrgData({ ...orgData, primaryColor: e.target.value })}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <FaPalette className="inline mr-2 text-blue-600" />
                                    Secondary Brand Color
                                </label>
                                <div className="flex gap-3">
                                    <input
                                        type="color"
                                        className="h-12 w-12 rounded-lg cursor-pointer border-2 border-gray-300"
                                        value={orgData.secondaryColor}
                                        onChange={e => setOrgData({ ...orgData, secondaryColor: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        <div className="text-center mb-8">
                            <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaShieldAlt className="text-green-600 text-2xl" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Legal & Compliance</h2>
                            <p className="text-gray-600">Provide your business registration and compliance information</p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Business Registration Number *</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    value={kycData.registrationNumber}
                                    onChange={e => setKycData({ ...kycData, registrationNumber: e.target.value })}
                                    placeholder="REG-123456789"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Tax ID / VAT Number *</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    value={kycData.taxId}
                                    onChange={e => setKycData({ ...kycData, taxId: e.target.value })}
                                    placeholder="TAX-987654321"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Business Type *</label>
                                <select
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                                    value={kycData.businessType}
                                    onChange={e => setKycData({ ...kycData, businessType: e.target.value })}
                                >
                                    <option value="LLC">Limited Liability Company (LLC)</option>
                                    <option value="Corporation">Corporation</option>
                                    <option value="Partnership">Partnership</option>
                                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                                </select>
                            </div>
                            
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex gap-3">
                                    <FaShieldAlt className="text-blue-600 mt-1 flex-shrink-0" />
                                    <div className="text-sm text-blue-900">
                                        <p className="font-semibold mb-1">Secure & Confidential</p>
                                        <p className="text-blue-700">Your business information is encrypted and stored securely. We comply with all data protection regulations.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <div className="bg-purple-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaCreditCard className="text-purple-600 text-2xl" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
                            <p className="text-gray-600">Select the plan that best fits your organization's needs</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                            {/* Free Plan */}
                            <div
                                className={`border-2 rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg ${
                                    plan === 'FREE' 
                                        ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-100 shadow-lg' 
                                        : 'border-gray-200 hover:border-blue-300'
                                }`}
                                onClick={() => setPlan('FREE')}
                            >
                                <div className="text-center mb-6">
                                    <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <FaUsers className="text-gray-600" />
                                    </div>
                                    <h3 className="font-bold text-xl mb-2">Starter</h3>
                                    <div className="mb-2">
                                        <span className="text-4xl font-bold">$0</span>
                                        <span className="text-gray-500 text-sm">/month</span>
                                    </div>
                                    <p className="text-sm text-gray-600">Perfect for small teams</p>
                                </div>
                                <ul className="space-y-3 mb-6">
                                    <li className="flex items-start gap-2 text-sm">
                                        <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                                        <span>Up to 5 Users</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm">
                                        <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                                        <span>5GB Storage</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm">
                                        <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                                        <span>Basic Support</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm">
                                        <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                                        <span>Core Features</span>
                                    </li>
                                </ul>
                                {plan === 'FREE' && (
                                    <div className="bg-blue-600 text-white text-center py-2 rounded-lg font-medium">
                                        Selected
                                    </div>
                                )}
                            </div>

                            {/* Pro Plan */}
                            <div
                                className={`border-2 rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg relative ${
                                    plan === 'PRO' 
                                        ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-100 shadow-lg' 
                                        : 'border-gray-200 hover:border-blue-300'
                                }`}
                                onClick={() => setPlan('PRO')}
                            >
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs px-4 py-1 rounded-full font-semibold shadow-md">
                                        MOST POPULAR
                                    </span>
                                </div>
                                <div className="text-center mb-6 mt-2">
                                    <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <FaChartLine className="text-blue-600" />
                                    </div>
                                    <h3 className="font-bold text-xl mb-2">Professional</h3>
                                    <div className="mb-2">
                                        <span className="text-4xl font-bold">$49</span>
                                        <span className="text-gray-500 text-sm">/month</span>
                                    </div>
                                    <p className="text-sm text-gray-600">For growing businesses</p>
                                </div>
                                <ul className="space-y-3 mb-6">
                                    <li className="flex items-start gap-2 text-sm">
                                        <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                                        <span>Up to 50 Users</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm">
                                        <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                                        <span>50GB Storage</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm">
                                        <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                                        <span>Priority Support</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm">
                                        <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                                        <span>Advanced Analytics</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm">
                                        <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                                        <span>API Access</span>
                                    </li>
                                </ul>
                                {plan === 'PRO' && (
                                    <div className="bg-blue-600 text-white text-center py-2 rounded-lg font-medium">
                                        Selected
                                    </div>
                                )}
                            </div>

                            {/* Enterprise Plan */}
                            <div
                                className={`border-2 rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg ${
                                    plan === 'ENTERPRISE' 
                                        ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-100 shadow-lg' 
                                        : 'border-gray-200 hover:border-blue-300'
                                }`}
                                onClick={() => setPlan('ENTERPRISE')}
                            >
                                <div className="text-center mb-6">
                                    <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <FaRocket className="text-purple-600" />
                                    </div>
                                    <h3 className="font-bold text-xl mb-2">Enterprise</h3>
                                    <div className="mb-2">
                                        <span className="text-4xl font-bold">$199</span>
                                        <span className="text-gray-500 text-sm">/month</span>
                                    </div>
                                    <p className="text-sm text-gray-600">For large organizations</p>
                                </div>
                                <ul className="space-y-3 mb-6">
                                    <li className="flex items-start gap-2 text-sm">
                                        <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                                        <span>Unlimited Users</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm">
                                        <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                                        <span>Unlimited Storage</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm">
                                        <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                                        <span>24/7 Dedicated Support</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm">
                                        <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                                        <span>Custom Integrations</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm">
                                        <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                                        <span>SLA Guarantee</span>
                                    </li>
                                </ul>
                                {plan === 'ENTERPRISE' && (
                                    <div className="bg-blue-600 text-white text-center py-2 rounded-lg font-medium">
                                        Selected
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 4 && (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaCogs className="text-indigo-600 text-2xl" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">System Configuration</h2>
                            <p className="text-gray-600">Configure your workspace settings and preferences</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <FaGlobe className="inline mr-2 text-indigo-600" />
                                    Workspace Subdomain
                                </label>
                                <div className="flex">
                                    <input
                                        type="text"
                                        className="flex-1 px-4 py-3 border border-r-0 border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={configData.subdomain}
                                        onChange={e => setConfigData({ ...configData, subdomain: e.target.value })}
                                        placeholder="my-company"
                                    />
                                    <div className="bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg px-4 py-3 text-gray-600 font-medium">
                                        .urutix.com
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Your workspace will be accessible at this URL</p>
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Data Residency</label>
                                <select
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                                    value={configData.dataResidency}
                                    onChange={e => setConfigData({ ...configData, dataResidency: e.target.value })}
                                >
                                    <option value="us-east-1">🇺🇸 United States (East)</option>
                                    <option value="eu-central-1">🇪🇺 Europe (Germany)</option>
                                    <option value="ap-southeast-1">🌏 Asia Pacific (Singapore)</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Choose where your data will be stored</p>
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Terms of Service URL</label>
                                <input
                                    type="url"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={configData.termsUrl}
                                    onChange={e => setConfigData({ ...configData, termsUrl: e.target.value })}
                                    placeholder="https://example.com/terms"
                                />
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Privacy Policy URL</label>
                                <input
                                    type="url"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={configData.privacyPolicyUrl}
                                    onChange={e => setConfigData({ ...configData, privacyPolicyUrl: e.target.value })}
                                    placeholder="https://example.com/privacy"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 5 && (
                    <div className="space-y-6 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <FaCheckCircle className="text-white text-5xl" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900">You're All Set!</h2>
                        <p className="text-gray-600 max-w-md mx-auto text-lg">
                            Review your configuration below and launch your workspace
                        </p>

                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl max-w-2xl mx-auto space-y-4 border border-gray-200 shadow-sm">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="text-left">
                                    <div className="text-sm text-gray-500 mb-1">Organization</div>
                                    <div className="font-semibold text-gray-900">{orgData.name}</div>
                                </div>
                                <div className="text-left">
                                    <div className="text-sm text-gray-500 mb-1">Subscription Plan</div>
                                    <div className="font-semibold text-gray-900">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                            {plan}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-left">
                                    <div className="text-sm text-gray-500 mb-1">Workspace URL</div>
                                    <div className="font-semibold text-blue-600">{configData.subdomain}.urutix.com</div>
                                </div>
                                <div className="text-left">
                                    <div className="text-sm text-gray-500 mb-1">Data Region</div>
                                    <div className="font-semibold text-gray-900">{configData.dataResidency}</div>
                                </div>
                                <div className="text-left col-span-2">
                                    <div className="text-sm text-gray-500 mb-1">Business Type</div>
                                    <div className="font-semibold text-gray-900">{kycData.businessType}</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
                            <div className="flex gap-3 text-left">
                                <FaRocket className="text-blue-600 mt-1 flex-shrink-0 text-xl" />
                                <div className="text-sm text-blue-900">
                                    <p className="font-semibold mb-1">Ready to Launch</p>
                                    <p className="text-blue-700">Click "Launch Workspace" to complete setup and start using your new workspace!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer / Actions */}
            <div className="bg-gray-50 p-6 border-t border-gray-200 flex justify-between items-center">
                <button
                    onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                    className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                        currentStep === 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-200 border border-gray-300'
                    }`}
                    disabled={currentStep === 1 || submitting}
                >
                    ← Back
                </button>
                
                <div className="text-sm text-gray-500">
                    Step {currentStep} of {STEPS.length}
                </div>
                
                <button
                    onClick={handleNext}
                    disabled={submitting}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting && <FaSpinner className="animate-spin" />}
                    {currentStep === 5 ? (
                        <>
                            <FaRocket />
                            Launch Workspace
                        </>
                    ) : (
                        <>
                            Continue
                            →
                        </>
                    )}
                </button>
            </div>
        </div>
    </div>
</AdminPageLayout>
    );
};

export default OnboardingWizard;
