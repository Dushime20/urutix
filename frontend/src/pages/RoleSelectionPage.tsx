import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Package, Truck, User, Building2, ShieldCheck, FileText, ArrowRight } from 'lucide-react';
import { FaSpinner } from 'react-icons/fa';
import logoUrutiXBackground from '../assets/logo-urutix.svg';

import { TranslatedText } from '../components/translated-text';
import toast from 'react-hot-toast';

const RoleSelectionPage = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { selectRole } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);

    const availableRoles = state?.availableRoles || [];
    const preAuthToken = state?.preAuthToken;

    useEffect(() => {
        if (!preAuthToken || !availableRoles || availableRoles.length === 0) {
            toast.error('Invalid session state. Please login again.');
            navigate('/auth');
        }
    }, [preAuthToken, availableRoles, navigate]);

    const handleRoleSelect = async (role: string) => {
        setSelectedRole(role);
        setIsLoading(true);
        try {
            const user = await selectRole(role, preAuthToken);
            if (user) {
                // Role-based redirects (copied from Auth.tsx)
                switch (user.role) {
                    case 'CARGO_OWNER':
                        navigate('/dashboard');
                        break;
                    case 'CARGO_RECEIVER':
                        navigate('/dashboard');
                        break;
                    case 'TRUCK_OWNER':
                        navigate('/dashboard/fleet');
                        break;
                    case 'DRIVER':
                        navigate('/dashboard/driver');
                        break;
                    case 'ADMIN':
                    case 'SUPER_ADMIN':
                        navigate('/dashboard/admin');
                        break;
                    case 'TENANT_ADMIN':
                        navigate('/tenant-admin');
                        break;
                    case 'LENDER':
                        navigate('/lender');
                        break;
                    case 'BROKER':
                        navigate('/dashboard/broker');
                        break;
                    case 'CUSTOMS_OFFICER':
                        navigate('/dashboard/customs');
                        break;
                    default:
                        navigate('/dashboard');
                        break;
                }
            }
        } catch (error) {
            console.error('Role selection failed', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getRoleDetails = (role: string) => {
        switch (role) {
            case 'CARGO_OWNER':
                return {
                    title: 'Cargo Owner',
                    description: 'Ship goods and find carriers',
                    icon: Package,
                    gradient: 'from-blue-500 to-indigo-600',
                    borderColor: 'border-blue-200',
                    textColor: 'text-blue-700',
                    bgColor: 'bg-blue-50',
                };
            case 'TRUCK_OWNER':
                return {
                    title: 'Truck Owner',
                    description: 'Provide transportation services',
                    icon: Truck,
                    gradient: 'from-emerald-500 to-primary-600',
                    borderColor: 'border-emerald-200',
                    textColor: 'text-emerald-700',
                    bgColor: 'bg-emerald-50',
                };
            case 'DRIVER':
                return {
                    title: 'Driver',
                    description: 'View assigned trips and tasks',
                    icon: User,
                    gradient: 'from-gray-500 to-gray-600',
                    borderColor: 'border-gray-200',
                    textColor: 'text-gray-700',
                    bgColor: 'bg-gray-50',
                };
            case 'CARGO_RECEIVER':
                return {
                    title: 'Receiver',
                    description: 'Track and receive shipments',
                    icon: Package,
                    gradient: 'from-orange-500 to-red-600',
                    borderColor: 'border-orange-200',
                    textColor: 'text-orange-700',
                    bgColor: 'bg-orange-50',
                };
            case 'TENANT_ADMIN':
                return {
                    title: 'Tenant Admin',
                    description: 'Manage company settings and users',
                    icon: Building2,
                    gradient: 'from-purple-500 to-purple-600',
                    borderColor: 'border-purple-200',
                    textColor: 'text-purple-700',
                    bgColor: 'bg-purple-50',
                };
            case 'LENDER':
                return {
                    title: 'Lender',
                    description: 'Provide financing solutions',
                    icon: FileText,
                    gradient: 'from-green-500 to-teal-600',
                    borderColor: 'border-green-200',
                    textColor: 'text-green-700',
                    bgColor: 'bg-green-50',
                };
            default:
                return {
                    title: role,
                    description: 'Access your account',
                    icon: ShieldCheck,
                    gradient: 'from-gray-500 to-gray-600',
                    borderColor: 'border-gray-200',
                    textColor: 'text-gray-700',
                    bgColor: 'bg-gray-50',
                };
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden antialiased">
            {/* Background Logo */}
            <img
                src={logoUrutiXBackground}
                alt="UrutiX Logo Background"
                className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-10 z-0"
                style={{ objectPosition: 'center' }}
            />
            <div className="max-w-4xl w-full px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="px-8 pt-8 pb-4 text-center">
                        <h2 className="text-2xl font-black text-slate-900 mb-1 font-manrope tracking-tight">
                            <TranslatedText text="Select Account" />
                        </h2>
                        <p className="text-sm font-medium text-slate-500">
                            <TranslatedText text="Please select the account you want to use for this session." />
                        </p>
                    </div>

                    <div className="px-6 pb-6">
                        <div className="grid grid-cols-1 gap-4">
                            {availableRoles.map((roleObj: any) => {
                                const details = getRoleDetails(roleObj.role);
                                const isSelected = selectedRole === roleObj.role;

                                return (
                                    <button
                                        key={roleObj.role}
                                        onClick={() => handleRoleSelect(roleObj.role)}
                                        disabled={isLoading}
                                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 group ${isSelected
                                            ? `${details.borderColor} ${details.bgColor} ring-2 ring-offset-2 ring-primary-500`
                                            : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className={`p-3 rounded-lg ${details.bgColor}`}>
                                                <details.icon className={`h-6 w-6 ${details.textColor}`} />
                                            </div>
                                            <div className="text-left">
                                                <h3 className={`font-semibold ${details.textColor}`}>
                                                    <TranslatedText text={details.title} />
                                                </h3>
                                                <p className="text-xs text-gray-500">
                                                    {roleObj.tenantName}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    <TranslatedText text={details.description} />
                                                </p>
                                            </div>
                                        </div>

                                        <div className={`transform transition-transform duration-200 ${isSelected ? 'translate-x-1' : ''}`}>
                                            {isLoading && isSelected ? (
                                                <FaSpinner className="animate-spin h-5 w-5 text-gray-400" />
                                            ) : (
                                                <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-6 text-center">
                            <button
                                onClick={() => navigate('/auth')}
                                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <TranslatedText text="Cancel and sign out" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoleSelectionPage;
