import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Circle, CheckCircle, ArrowRight } from 'lucide-react';
import { FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';

import logoUrutiXNew from '../assets/urutiX Logistics Logo (1).svg';
import logoUrutiXBackground from '../assets/logo-urutix.svg';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { TranslatedText } from '../components/translated-text';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),
  confirmPassword: z.string().min(6, { message: 'Please confirm your password' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordCriteria, setPasswordCriteria] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const passwordValue = form.watch('password');

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

  // Check if token exists
  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token');
      navigate('/auth');
    }
  }, [token, navigate]);

  const onSubmit = async (values: ResetPasswordFormData) => {
    if (!token) {
      toast.error('Invalid reset token');
      return;
    }

    try {
      setIsLoading(true);
      await authAPI.resetPassword(token, values.password, values.confirmPassword);
      setResetSuccess(true);
      toast.success('Password reset successfully!');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
    } catch (error: any) {
      console.error('Reset password error:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to reset password. The link may have expired.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden antialiased">
      <div className="fixed inset-0 bg-slate-50 z-0" />
      {/* Background Logo */}
      <img
        src={logoUrutiXBackground}
        alt="UrutiX Logo Background"
        className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-10 z-0"
        style={{ objectPosition: 'center' }}
      />

      {/* Centered Container */}
      <div className="w-full max-w-2xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-center mb-8">
          <img
            src={logoUrutiXNew}
            alt="UrutiX Logistics Logo"
            className="h-24 md:h-32 w-auto object-contain drop-shadow-lg"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-4">
            <h2 className="text-2xl font-black text-slate-900 mb-1 font-manrope tracking-tight">
              <TranslatedText text="Create new password" />
            </h2>
            <p className="text-sm font-medium text-slate-500">
              <TranslatedText text="Enter your new password below. Make sure it's strong and secure." />
            </p>
          </div>

          {/* Form Content */}
          <div className="px-6 pb-6">
            {!resetSuccess ? (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* New Password */}
                <div>
                  <label htmlFor="password" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                    <TranslatedText text="New password" />
                  </label>
                  <div className="relative">
                    <input
                      {...form.register('password')}
                      type={showPassword ? 'text' : 'password'}
                      className="w-full px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 pr-10 placeholder:text-slate-400 placeholder:font-normal"
                      placeholder="Enter new password"
                      disabled={isLoading}
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
                      <span className={`text-[10px] font-black uppercase tracking-wide ${passwordCriteria.minLength ? 'text-green-600' : 'text-slate-400'}`}>
                        <TranslatedText text="At least 8 characters" />
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordCriteria.hasUppercase ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <Circle className="h-3 w-3 text-gray-300" />
                      )}
                      <span className={`text-[10px] font-black uppercase tracking-wide ${passwordCriteria.hasUppercase ? 'text-green-600' : 'text-slate-400'}`}>
                        <TranslatedText text="One uppercase letter" />
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordCriteria.hasLowercase ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <Circle className="h-3 w-3 text-gray-300" />
                      )}
                      <span className={`text-[10px] font-black uppercase tracking-wide ${passwordCriteria.hasLowercase ? 'text-green-600' : 'text-slate-400'}`}>
                        <TranslatedText text="One lowercase letter" />
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordCriteria.hasNumber ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <Circle className="h-3 w-3 text-gray-300" />
                      )}
                      <span className={`text-[10px] font-black uppercase tracking-wide ${passwordCriteria.hasNumber ? 'text-green-600' : 'text-slate-400'}`}>
                        <TranslatedText text="One number" />
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordCriteria.hasSpecialChar ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <Circle className="h-3 w-3 text-gray-300" />
                      )}
                      <span className={`text-[10px] font-black uppercase tracking-wide ${passwordCriteria.hasSpecialChar ? 'text-green-600' : 'text-slate-400'}`}>
                        <TranslatedText text="One special character" />
                      </span>
                    </div>
                  </div>

                  {form.formState.errors.password && (
                    <p className="mt-2 text-[10px] font-black text-red-600 uppercase tracking-wide px-1">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                    <TranslatedText text="Confirm new password" />
                  </label>
                  <div className="relative">
                    <input
                      {...form.register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="w-full px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 pr-10 placeholder:text-slate-400 placeholder:font-normal"
                      placeholder="Confirm new password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                    </button>
                  </div>
                  {form.formState.errors.confirmPassword && (
                    <p className="mt-2 text-[10px] font-black text-red-600 uppercase tracking-wide px-1">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary-600 text-white font-black uppercase tracking-widest py-3 px-4 rounded-xl hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-[11px]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <FaSpinner className="animate-spin h-4 w-4" />
                  ) : (
                    <>
                      <span><TranslatedText text="Reset Password" /></span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-4">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2 font-manrope tracking-tight">
                  <TranslatedText text="Password reset successful!" />
                </h3>
                <p className="text-sm font-medium text-slate-500 mb-6 px-4">
                  <TranslatedText text="Your password has been reset successfully. You can now log in with your new password." />
                </p>
                <div className="w-full bg-green-50 text-green-700 py-3 rounded-lg flex items-center justify-center gap-2 text-xs font-medium border border-green-100">
                  <FaSpinner className="animate-spin h-3.5 w-3.5" />
                  <TranslatedText text="Redirecting to login page..." />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
