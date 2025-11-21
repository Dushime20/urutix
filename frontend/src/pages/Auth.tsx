import { useState, useEffect } from 'react';
import logoUrutiX from '../assets/logo-urutix.svg';
import { Package, ArrowRight, CheckCircle, Truck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import CompanySearch from '../components/CompanySearch';
import type { Tenant } from '../types/tenant';


// Zod schemas
const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const registerSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  companyName: z.string().min(1, { message: 'Company name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string().min(6, { message: 'Please confirm your password' }),
  userType: z.enum(['CARGO_OWNER', 'TRUCK_OWNER']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
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
            navigate('/dashboard/cargos');
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
      const user = await authRegister({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        companyName: values.companyName,
        userType: values.userType,
        tenantId: selectedTenant?.id, // Include selected tenant ID if available
      });
      if (user) {
        // Role-based redirects for registration
        switch (user.role) {
          case 'CARGO_OWNER':
            navigate('/dashboard/cargos');
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
      <div className="w-full max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Logo removed as per request */}

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Form Header */}
          <div className="px-8 pt-8 pb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-gray-600">
              {isLogin ? 'Sign in to access your dashboard' : 'Join thousands of users in the logistics industry'}
            </p>
          </div>

          {/* Form Content */}
          <div className="px-8 pb-8">
            {isLogin ? (
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <input
                    {...loginForm.register('email')}
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email"
                    required
                  />
                  {loginForm.formState.errors.email && (
                    <p className="mt-2 text-sm text-red-600">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      {...loginForm.register('password')}
                      type={showPassword ? 'text' : 'password'}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 pr-12"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="mt-2 text-sm text-red-600">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm" role="alert">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-primary-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <FaSpinner className="animate-spin h-5 w-5" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setIsLogin(false)}
                      className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                {/* User Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    I am a...
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {userTypes.map((type) => (
                      <button
                        key={type?.id}
                        type="button"
                        onClick={() => {
                          setSelectedUserType(type?.id as 'CARGO_OWNER' | 'TRUCK_OWNER');
                          registerForm.setValue('userType', type?.id as 'CARGO_OWNER' | 'TRUCK_OWNER');
                        }}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          selectedUserType === type.id
                            ? `${type.borderColor} ${type.bgColor} border-opacity-100`
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <type.icon className={`h-6 w-6 ${selectedUserType === type.id ? type.textColor : type.textColor}`} />
                          <div className="text-center">
                            <div className={`font-medium text-sm ${selectedUserType === type.id ? type.textColor : 'text-gray-900'}`}>{type.title}</div>
                            <div className={`text-xs ${selectedUserType === type.id ? type.textColor : 'text-gray-500'}`}>
                              {type.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* First Name */}
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                        First name
                      </label>
                      <input
                        {...registerForm.register('firstName')}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                        placeholder="First name"
                      />
                      {registerForm.formState.errors.firstName && (
                        <p className="mt-2 text-sm text-red-600">{registerForm.formState.errors.firstName.message}</p>
                      )}
                    </div>

                    {/* Company Name */}
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                        Company name
                      </label>
                      <CompanySearch
                        value={registerForm.watch('companyName')}
                        onChange={(value) => {
                          registerForm.setValue('companyName', value);
                          if (!value) {
                            setSelectedTenant(null);
                          }
                        }}
                        onSelect={(tenant) => {
                          setSelectedTenant(tenant);
                          registerForm.setValue('companyName', tenant.name);
                        }}
                        error={registerForm.formState.errors.companyName?.message}
                        placeholder="Search for your company..."
                      />
                      {selectedTenant && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-800">
                              Company found: {selectedTenant.name}
                              {selectedTenant.city && ` • ${selectedTenant.city}`}
                              {selectedTenant.country && ` • ${selectedTenant.country}`}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          {...registerForm.register('password')}
                          type={showPassword ? 'text' : 'password'}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 pr-12"
                          placeholder="Create a password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                        </button>
                      </div>
                      {registerForm.formState.errors.password && (
                        <p className="mt-2 text-sm text-red-600">{registerForm.formState.errors.password.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Last Name */}
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                        Last name
                      </label>
                      <input
                        {...registerForm.register('lastName')}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                        placeholder="Last name"
                      />
                      {registerForm.formState.errors.lastName && (
                        <p className="mt-2 text-sm text-red-600">{registerForm.formState.errors.lastName.message}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email address
                      </label>
                      <input
                        {...registerForm.register('email')}
                        type="email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter your email"
                      />
                      {registerForm.formState.errors.email && (
                        <p className="mt-2 text-sm text-red-600">{registerForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm password
                      </label>
                      <div className="relative">
                        <input
                          {...registerForm.register('confirmPassword')}
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 pr-12"
                          placeholder="Confirm your password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                        </button>
                      </div>
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="mt-2 text-sm text-red-600">{registerForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm" role="alert">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-primary-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <FaSpinner className="animate-spin h-5 w-5" />
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                {/* Sign In Link */}
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setIsLogin(true)}
                      className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                    >
                      Sign in
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