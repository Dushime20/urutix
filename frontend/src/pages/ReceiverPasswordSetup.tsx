import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FaEye, FaEyeSlash, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { CheckCircle2, Circle, Package, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import logoUrutiX from '../assets/logo-urutix.svg';

// Zod schema for password setup
const passwordSetupSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' })
      .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
      .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
      .regex(/[0-9]/, { message: 'Password must contain at least one number' })
      .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type PasswordSetupFormData = z.infer<typeof passwordSetupSchema>;

const ReceiverPasswordSetup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Password validation criteria
  const [passwordCriteria, setPasswordCriteria] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PasswordSetupFormData>({
    resolver: zodResolver(passwordSetupSchema),
  });

  // Watch password field for real-time validation
  const passwordValue = watch('password');

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

  // Check if token is present
  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing setup token. Please check your email.');
      navigate('/auth');
    }
  }, [token, navigate]);

  const onSubmit = async (data: PasswordSetupFormData) => {
    if (!token) {
      toast.error('Invalid setup token');
      return;
    }

    try {
      setIsLoading(true);
      await authAPI.setupReceiverPassword({
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      setIsSuccess(true);
      toast.success('Password set successfully! Redirecting to login...');

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } catch (error: any) {
      console.error('Password setup error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to set password. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
        {/* Full Page Background Logo */}
        <img src={logoUrutiX} alt="UrutiX Logo Background" className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-10 z-0" style={{objectPosition: 'center'}} />
        <div className="w-full max-w-md px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 rounded-full p-3">
                  <FaCheckCircle className="text-green-600 text-3xl" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Password Set Successfully!
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Your receiver account has been activated. You can now log in to access your dashboard.
              </p>
              <button
                onClick={() => navigate('/auth')}
                className="w-full bg-primary-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center space-x-2 text-sm"
              >
                <span>Go to Login</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
      {/* Full Page Background Logo */}
      <img src={logoUrutiX} alt="UrutiX Logo Background" className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-10 z-0" style={{objectPosition: 'center'}} />
      {/* Centered Form */}
      <div className="w-full max-w-md px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Form Container */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Form Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex justify-center mb-4">
              <div className="bg-emerald-50 rounded-full p-3 border-2 border-emerald-200">
                <Package className="text-emerald-600 text-2xl" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1 text-center">
              Set Up Your Password
            </h2>
            <p className="text-sm text-gray-600 text-center">
              Welcome to UrutiX! You have been invited to become a cargo receiver. Please set a secure password to get started.
            </p>
          </div>

          {/* Form Content */}
          <div className="px-6 pb-6">

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                )}

                {/* Password Criteria */}
                {passwordValue && (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      Password must contain:
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        {passwordCriteria.minLength ? (
                          <CheckCircle2 className="text-green-500 w-3.5 h-3.5" />
                        ) : (
                          <Circle className="text-gray-400 w-3.5 h-3.5" />
                        )}
                        <span
                          className={
                            passwordCriteria.minLength
                              ? 'text-green-600'
                              : 'text-gray-500'
                          }
                        >
                          At least 8 characters
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordCriteria.hasUppercase ? (
                          <CheckCircle2 className="text-green-500 w-3.5 h-3.5" />
                        ) : (
                          <Circle className="text-gray-400 w-3.5 h-3.5" />
                        )}
                        <span
                          className={
                            passwordCriteria.hasUppercase
                              ? 'text-green-600'
                              : 'text-gray-500'
                          }
                        >
                          One uppercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordCriteria.hasLowercase ? (
                          <CheckCircle2 className="text-green-500 w-3.5 h-3.5" />
                        ) : (
                          <Circle className="text-gray-400 w-3.5 h-3.5" />
                        )}
                        <span
                          className={
                            passwordCriteria.hasLowercase
                              ? 'text-green-600'
                              : 'text-gray-500'
                          }
                        >
                          One lowercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordCriteria.hasNumber ? (
                          <CheckCircle2 className="text-green-500 w-3.5 h-3.5" />
                        ) : (
                          <Circle className="text-gray-400 w-3.5 h-3.5" />
                        )}
                        <span
                          className={
                            passwordCriteria.hasNumber
                              ? 'text-green-600'
                              : 'text-gray-500'
                          }
                        >
                          One number
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordCriteria.hasSpecialChar ? (
                          <CheckCircle2 className="text-green-500 w-3.5 h-3.5" />
                        ) : (
                          <Circle className="text-gray-400 w-3.5 h-3.5" />
                        )}
                        <span
                          className={
                            passwordCriteria.hasSpecialChar
                              ? 'text-green-600'
                              : 'text-gray-500'
                          }
                        >
                          One special character
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 pr-10"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin h-4 w-4" />
                    <span>Setting up password...</span>
                  </>
                ) : (
                  <>
                    <span>Set Password</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/auth')}
                    className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiverPasswordSetup;

