import { useState, useEffect } from 'react';
import logoUrutiX from '../assets/logo-urutix.svg';
import { Package, ArrowRight, CheckCircle, Truck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
import { CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tenantAPI } from '../services/api';
import type { Tenant } from '../types/tenant';
import toast from 'react-hot-toast';
import { TranslatedText } from '../components/translated-text';


// Zod schemas
const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const registerSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  companyName: z.string().min(1, { message: 'Please select a company' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),
  confirmPassword: z.string().min(6, { message: 'Please confirm your password' }),
  userType: z.enum(['CARGO_OWNER', 'TRUCK_OWNER']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine((data) => {
  // Both CARGO_OWNER and TRUCK_OWNER must select a company from the list
  return data.companyName && data.companyName.trim().length > 0;
}, {
  message: 'Please select a company from the dropdown',
  path: ['companyName'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const Auth = () => {
  const { login, register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserType, setSelectedUserType] = useState<'CARGO_OWNER' | 'TRUCK_OWNER'>('CARGO_OWNER');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [loginEmailError, setLoginEmailError] = useState<string | null>(null);
  const [registerEmailError, setRegisterEmailError] = useState<string | null>(null);
  
  // Password validation criteria
  const [passwordCriteria, setPasswordCriteria] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  // Fetch active tenants for dropdown (for both CARGO_OWNER and TRUCK_OWNER)
  const { data: tenantsData, isLoading: isLoadingTenants, refetch: refetchTenants } = useQuery({
    queryKey: ['active-tenants'],
    queryFn: async () => {
      const response = await tenantAPI.searchTenants({});
      // Extract tenants from response
      if (response.data?.success && response.data?.data?.results) {
        return response.data.data.results;
      } else if (response.data?.data?.results) {
        return response.data.data.results;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    },
    enabled: true, // Always fetch tenants for both user types
    staleTime: 30 * 1000, // Cache for 30 seconds (reduced from 5 minutes to show new tenants faster)
    refetchOnWindowFocus: true, // Refetch when window regains focus to get latest tenants
  });

  const tenants = tenantsData || [];

  // Login form
  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Register form
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      companyName: '',
      email: '',
      password: '',
      confirmPassword: '',
      userType: 'CARGO_OWNER',
    },
  });

  // Watch password field for real-time validation
  const passwordValue = registerForm.watch('password');

  // Update password criteria as user types
  useEffect(() => {
    if (passwordValue) {
      setPasswordCriteria({
        minLength: passwordValue.length >= 8,
        hasUppercase: /[A-Z]/.test(passwordValue),
        hasLowercase: /[a-z]/.test(passwordValue),
        hasNumber: /[0-9]/.test(passwordValue),
        hasSpecialChar: /[^A-Za-z0-9]/.test(passwordValue),
      });
    } else {
      setPasswordCriteria({
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false,
      });
    }
  }, [passwordValue]);


  const onLoginSubmit = async (values: any) => {
    try {
      setError(null);
      setIsLoading(true);
      console.log('🔐 Attempting login for:', values.email);
      const user = await login(values.email, values.password);
      if (user) {
        console.log("✅ Login successful, user:", user);

        // Role-based redirects
        switch (user.role) {
          case 'CARGO_OWNER':
            navigate('/dashboard'); // Redirect to main dashboard with analytics
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
          default:
            navigate('/dashboard');
            break;
        }
      } else {
        // The login function already shows an error toast, but we can add more context
        setError('Login failed: Please check your credentials and try again. If the problem persists, the user may not exist in the database.');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Invalid email or password';
      setError(errorMessage);
      console.error('Full error details:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit = async (values: any) => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Validate tenant selection for both CARGO_OWNER and TRUCK_OWNER
      // selectedTenant should be set when user selects from dropdown
      if (!selectedTenant || !values.companyName) {
        setError('Please select a company from the dropdown');
        registerForm.setError('companyName', { message: 'Please select a company from the dropdown' });
        setIsLoading(false);
        return;
      }
      
      // Use the selected tenant (already set from dropdown selection)
      const tenant = selectedTenant;
      
      const user = await authRegister({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        companyName: tenant.name, // Use tenant name
        userType: values.userType,
        tenantId: tenant.id, // Use tenant ID
      });
      
      if (user) {
        // Redirect CARGO_OWNER to login page
        if (user.role === 'CARGO_OWNER') {
          toast.success('Registration successful! Please log in.');
          setIsLogin(true); // Switch to login form
          registerForm.reset(); // Clear registration form
          setSelectedTenant(null); // Clear selected tenant
          setSelectedTenantId(''); // Clear selected tenant ID
          return; // Exit early, don't navigate
        }
        
        // Role-based redirects for other user types
        switch (user.role) {
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
          default:
            navigate('/dashboard');
            break;
        }
      } else {
        setError('Registration failed: No token received');
      }
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const userTypes = [
    {
      id: 'CARGO_OWNER',
      title: 'Cargo Owner',
      description: 'Ship goods and find carriers',
      icon: Package,
      gradient: 'from-blue-500 to-indigo-600',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'TRUCK_OWNER',
      title: 'Truck Owner',
      description: 'Provide transportation services',
      icon: Truck,
      gradient: 'from-emerald-500 to-primary-600',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
    },
  ];

  // const features = [
  //   { icon: Shield, text: 'Secure & Encrypted' },
  //   { icon: Users, text: 'Trusted by 10,000+ users' },
  //   { icon: Globe, text: 'Global logistics network' },
  // ];

  useEffect(() => {
    console.log('selectedUserType', selectedUserType);

    console.log("registerForm.getValues('userType')", registerForm.getValues('userType'));
  }, [selectedUserType]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
      {/* Full Page Background Logo */}
      <img src={logoUrutiX} alt="UrutiX Logo Background" className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-10 z-0" style={{objectPosition: 'center'}} />
      {/* Centered Auth Form */}
      <div className="w-full max-w-2xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Logo removed as per request */}

        {/* Form Container */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Form Header */}
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {isLogin ? <TranslatedText text="Welcome back" /> : <TranslatedText text="Create your account" />}
            </h2>
            <p className="text-sm text-gray-600">
              {isLogin ? <TranslatedText text="Sign in to access your dashboard" /> : <TranslatedText text="Join thousands of users in the logistics industry" />}
            </p>
          </div>

          {/* Form Content */}
          <div className="px-6 pb-6">
            {isLogin ? (
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1.5">
                    <TranslatedText text="Email address" />
                  </label>
                  <input
                    {...loginForm.register('email')}
                    type="email"
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                      loginEmailError ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email"
                    required
                    onBlur={(e) => {
                      const emailValue = e.target.value.trim();
                      if (emailValue && !emailValue.includes('@')) {
                        setLoginEmailError('Email must contain an @ sign');
                      } else {
                        setLoginEmailError(null);
                      }
                    }}
                    onChange={(e) => {
                      loginForm.setValue('email', e.target.value);
                      if (loginEmailError && e.target.value.includes('@')) {
                        setLoginEmailError(null);
                      }
                    }}
                  />
                  {loginEmailError && (
                    <p className="mt-1 text-xs text-red-600">{loginEmailError}</p>
                  )}
                  {loginForm.formState.errors.email && !loginEmailError && (
                    <p className="mt-1 text-xs text-red-600">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1.5">
                    <TranslatedText text="Password" />
                  </label>
                  <div className="relative">
                    <input
                      {...loginForm.register('password')}
                      type={showPassword ? 'text' : 'password'}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 pr-10"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="mt-2 text-sm text-red-600">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs" role="alert">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-primary-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <FaSpinner className="animate-spin h-4 w-4" />
                  ) : (
                    <>
                      <span><TranslatedText text="Sign In" /></span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    <TranslatedText text="Don't have an account?" />{' '}
                    <button
                      type="button"
                      onClick={() => setIsLogin(false)}
                      className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                    >
                      <TranslatedText text="Sign up" />
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                {/* User Type Selection */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    <TranslatedText text="I am a..." />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {userTypes.map((type) => (
                      <button
                        key={type?.id}
                        type="button"
                        onClick={() => {
                          setSelectedUserType(type?.id as 'CARGO_OWNER' | 'TRUCK_OWNER');
                          registerForm.setValue('userType', type?.id as 'CARGO_OWNER' | 'TRUCK_OWNER');
                          // Clear tenant selection when switching user types
                          setSelectedTenant(null);
                          setSelectedTenantId('');
                          registerForm.setValue('companyName', '');
                        }}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                          selectedUserType === type.id
                            ? `${type.borderColor} ${type.bgColor} border-opacity-100`
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-1">
                          <type.icon className={`h-5 w-5 ${selectedUserType === type.id ? type.textColor : type.textColor}`} />
                          <div className="text-center">
                            <div className={`font-medium text-xs ${selectedUserType === type.id ? type.textColor : 'text-gray-900'}`}>
                              <TranslatedText text={type.title} />
                            </div>
                            <div className={`text-[10px] ${selectedUserType === type.id ? type.textColor : 'text-gray-500'}`}>
                              <TranslatedText text={type.description} />
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* First Name */}
                    <div>
                      <label htmlFor="firstName" className="block text-xs font-medium text-gray-700 mb-1.5">
                        <TranslatedText text="First name" />
                      </label>
                      <input
                        {...registerForm.register('firstName')}
                        type="text"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                        placeholder="First name"
                      />
                      {registerForm.formState.errors.firstName && (
                        <p className="mt-2 text-sm text-red-600">{registerForm.formState.errors.firstName.message}</p>
                      )}
                    </div>

                    {/* Company Name - Only show for CARGO_OWNER */}
                    {selectedUserType === 'CARGO_OWNER' && (
                      <div>
                        <label htmlFor="companyName" className="block text-xs font-medium text-gray-700 mb-1.5">
                          Select your company <span className="text-red-500">*</span>
                        </label>
                        {isLoadingTenants ? (
                          <div className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 flex items-center space-x-2">
                            <FaSpinner className="animate-spin h-3.5 w-3.5 text-gray-400" />
                            <span className="text-xs text-gray-500"><TranslatedText text="Loading companies..." /></span>
                          </div>
                        ) : (
                          <>
                            {/* Hidden input for form validation */}
                            <input
                              type="hidden"
                              {...registerForm.register('companyName', {
                                required: 'Please select a company',
                              })}
                              value={selectedTenant?.name || ''}
                            />
                            <select
                              id="companyName"
                              value={selectedTenantId}
                              onChange={(e) => {
                                const tenantId = e.target.value;
                                setSelectedTenantId(tenantId);
                                if (tenantId) {
                                  const tenant = tenants.find((t: Tenant) => t.id === tenantId);
                                  if (tenant) {
                                    setSelectedTenant(tenant);
                                    registerForm.setValue('companyName', tenant.name, { shouldValidate: true });
                                    registerForm.clearErrors('companyName');
                                  }
                                } else {
                                  setSelectedTenant(null);
                                  registerForm.setValue('companyName', '', { shouldValidate: true });
                                }
                              }}
                              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white ${
                                registerForm.formState.errors.companyName
                                  ? 'border-red-500'
                                  : 'border-gray-300'
                              }`}
                            >
                            <option value="" disabled>
                              {isLoadingTenants ? 'Loading companies...' : 'Select a company...'}
                            </option>
                            {tenants.map((tenant: Tenant) => (
                              <option key={tenant.id} value={tenant.id}>
                                {tenant.name}
                                {tenant.city && tenant.country
                                  ? ` - ${tenant.city}, ${tenant.country}`
                                  : tenant.city
                                    ? ` - ${tenant.city}`
                                    : tenant.country
                                      ? ` - ${tenant.country}`
                                      : ''}
                              </option>
                            ))}
                            </select>
                          </>
                        )}
                        {registerForm.formState.errors.companyName && (
                          <p className="mt-1 text-xs text-red-600">
                            {registerForm.formState.errors.companyName.message}
                          </p>
                        )}
                        {selectedTenant && (
                          <div className="mt-1.5 p-2 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center space-x-1.5">
                              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                              <span className="text-xs text-green-800">
                                Company selected: {selectedTenant.name}
                                {selectedTenant.city && ` • ${selectedTenant.city}`}
                                {selectedTenant.country && ` • ${selectedTenant.country}`}
                              </span>
                            </div>
                          </div>
                        )}
                        {tenants.length === 0 && !isLoadingTenants && (
                          <p className="mt-1 text-xs text-amber-600">
                            No active companies available. Please contact support.
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Company Name - For TRUCK_OWNER (selectable dropdown) */}
                    {selectedUserType === 'TRUCK_OWNER' && (
                      <div>
                        <label htmlFor="companyName" className="block text-xs font-medium text-gray-700 mb-1.5">
                          Select your company <span className="text-red-500">*</span>
                        </label>
                        {isLoadingTenants ? (
                          <div className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 flex items-center space-x-2">
                            <FaSpinner className="animate-spin h-3.5 w-3.5 text-gray-400" />
                            <span className="text-xs text-gray-500"><TranslatedText text="Loading companies..." /></span>
                          </div>
                        ) : (
                          <>
                            {/* Hidden input for form validation */}
                            <input
                              type="hidden"
                              {...registerForm.register('companyName', {
                                required: 'Please select a company',
                              })}
                              value={selectedTenant?.name || ''}
                            />
                            <select
                              id="companyName"
                              value={selectedTenantId}
                              onChange={(e) => {
                                const tenantId = e.target.value;
                                setSelectedTenantId(tenantId);
                                if (tenantId) {
                                  const tenant = tenants.find((t: Tenant) => t.id === tenantId);
                                  if (tenant) {
                                    setSelectedTenant(tenant);
                                    registerForm.setValue('companyName', tenant.name, { shouldValidate: true });
                                    registerForm.clearErrors('companyName');
                                  }
                                } else {
                                  setSelectedTenant(null);
                                  registerForm.setValue('companyName', '', { shouldValidate: true });
                                }
                              }}
                              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white ${
                                registerForm.formState.errors.companyName
                                  ? 'border-red-500'
                                  : 'border-gray-300'
                              }`}
                            >
                            <option value="" disabled>
                              {isLoadingTenants ? 'Loading companies...' : 'Select a company...'}
                            </option>
                            {tenants.map((tenant: Tenant) => (
                              <option key={tenant.id} value={tenant.id}>
                                {tenant.name}
                                {tenant.city && tenant.country
                                  ? ` - ${tenant.city}, ${tenant.country}`
                                  : tenant.city
                                    ? ` - ${tenant.city}`
                                    : tenant.country
                                      ? ` - ${tenant.country}`
                                      : ''}
                              </option>
                            ))}
                            </select>
                          </>
                        )}
                        {registerForm.formState.errors.companyName && (
                          <p className="mt-1 text-xs text-red-600">
                            {registerForm.formState.errors.companyName.message}
                          </p>
                        )}
                        {selectedTenant && (
                          <div className="mt-1.5 p-2 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center space-x-1.5">
                              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                              <span className="text-xs text-green-800">
                                Company selected: {selectedTenant.name}
                                {selectedTenant.city && ` • ${selectedTenant.city}`}
                                {selectedTenant.country && ` • ${selectedTenant.country}`}
                              </span>
                            </div>
                          </div>
                        )}
                        {tenants.length === 0 && !isLoadingTenants && (
                          <p className="mt-1 text-xs text-amber-600">
                            No active companies available. Please contact support.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Password */}
                    <div>
                      <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1.5">
                        <TranslatedText text="Password" />
                      </label>
                      <div className="relative">
                        <input
                          {...registerForm.register('password')}
                          type={showPassword ? 'text' : 'password'}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 pr-10"
                          placeholder="Create a password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                        </button>
                      </div>
                      {/* Password Validation Criteria */}
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2">
                          {passwordCriteria.minLength ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          ) : (
                            <Circle className="h-3 w-3 text-gray-300" />
                          )}
                          <span className={`text-xs ${passwordCriteria.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                            <TranslatedText text="at least 8 characters" />
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordCriteria.hasUppercase ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          ) : (
                            <Circle className="h-3 w-3 text-gray-300" />
                          )}
                          <span className={`text-xs ${passwordCriteria.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
                            <TranslatedText text="one uppercase letter" />
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordCriteria.hasLowercase ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          ) : (
                            <Circle className="h-3 w-3 text-gray-300" />
                          )}
                          <span className={`text-xs ${passwordCriteria.hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
                            <TranslatedText text="one lowercase letter" />
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordCriteria.hasNumber ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          ) : (
                            <Circle className="h-3 w-3 text-gray-300" />
                          )}
                          <span className={`text-xs ${passwordCriteria.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                            <TranslatedText text="one number" />
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordCriteria.hasSpecialChar ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          ) : (
                            <Circle className="h-3 w-3 text-gray-300" />
                          )}
                          <span className={`text-xs ${passwordCriteria.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
                            <TranslatedText text="one special character" />
                          </span>
                        </div>
                      </div>
                      {registerForm.formState.errors.password && (
                        <p className="mt-1 text-xs text-red-600">{registerForm.formState.errors.password.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Last Name */}
                    <div>
                      <label htmlFor="lastName" className="block text-xs font-medium text-gray-700 mb-1.5">
                        <TranslatedText text="Last name" />
                      </label>
                      <input
                        {...registerForm.register('lastName')}
                        type="text"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                        placeholder="Last name"
                      />
                      {registerForm.formState.errors.lastName && (
                        <p className="mt-1 text-xs text-red-600">{registerForm.formState.errors.lastName.message}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1.5">
                        <TranslatedText text="Email address" />
                      </label>
                      <input
                        {...registerForm.register('email')}
                        type="email"
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                          registerEmailError ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your email"
                        onBlur={(e) => {
                          const emailValue = e.target.value.trim();
                          if (emailValue && !emailValue.includes('@')) {
                            setRegisterEmailError('Email must contain an @ sign');
                          } else {
                            setRegisterEmailError(null);
                          }
                        }}
                        onChange={(e) => {
                          registerForm.setValue('email', e.target.value);
                          if (registerEmailError && e.target.value.includes('@')) {
                            setRegisterEmailError(null);
                          }
                        }}
                      />
                      {registerEmailError && (
                        <p className="mt-1 text-xs text-red-600">{registerEmailError}</p>
                      )}
                      {registerForm.formState.errors.email && !registerEmailError && (
                        <p className="mt-1 text-xs text-red-600">{registerForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 mb-1.5">
                        <TranslatedText text="Confirm password" />
                      </label>
                      <div className="relative">
                        <input
                          {...registerForm.register('confirmPassword')}
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 pr-10"
                          placeholder="Confirm your password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                        </button>
                      </div>
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="mt-1 text-xs text-red-600">{registerForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs" role="alert">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-primary-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <FaSpinner className="animate-spin h-4 w-4" />
                  ) : (
                    <>
                      <span><TranslatedText text="Create Account" /></span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>

                {/* Sign In Link */}
                <div className="text-center">
                  <p className="text-xs text-gray-600">
                    <TranslatedText text="Already have an account?" />{' '}
                    <button
                      type="button"
                      onClick={() => setIsLogin(true)}
                      className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                    >
                      <TranslatedText text="Sign in" />
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;