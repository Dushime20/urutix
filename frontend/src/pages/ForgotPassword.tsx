import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';
import { FaSpinner } from 'react-icons/fa';

import logoUrutiXNew from '../assets/urutiX Logistics Logo (1).svg';
import logoUrutiXBackground from '../assets/logo-urutix.svg';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { TranslatedText } from '../components/translated-text';
import { useTranslation } from '../hooks/useTranslation';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const { tSync } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      setSubmitError(null);
      const response = await authAPI.forgotPassword(values.email);
      setEmailSent(true);
      toast.success(
        response.data?.message ||
          tSync('Password reset email sent! Please check your inbox.'),
      );
    } catch (error: any) {
      console.error('Forgot password error:', error);
      const errorMessage =
        error.response?.data?.message ||
        tSync('Unable to send password reset email. Please try again.');
      setEmailSent(false);
      setSubmitError(errorMessage);
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
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => navigate('/auth')}
                className="flex items-center text-[10px] text-indigo-600 hover:text-indigo-500 font-black uppercase tracking-widest transition-colors group"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1 group-hover:-translate-x-0.5 transition-transform" />
                <TranslatedText text="Back to login" />
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-[10px] text-primary-600 hover:text-primary-500 font-black uppercase tracking-widest transition-colors group"
              >
                <TranslatedText text="Back to home" />
              </button>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-1 font-manrope tracking-tight">
              <TranslatedText text="Reset your password" />
            </h2>
            <p className="text-sm font-medium text-slate-500">
              <TranslatedText text="Enter your email address and we'll send you a link to reset your password." />
            </p>
          </div>

          {/* Form Content */}
          <div className="px-6 pb-6">
            {!emailSent ? (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {submitError && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-red-700">{submitError}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                    <TranslatedText text="Email address" />
                  </label>
                  <div className="relative">
                    <input
                      {...form.register('email', {
                        onChange: () => {
                          if (submitError) setSubmitError(null);
                        },
                      })}
                      type="email"
                      className={`w-full px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder:text-slate-400 placeholder:font-normal ${
                        submitError ? 'border-red-300' : 'border-slate-200'
                      }`}
                      placeholder="Enter your email"
                      disabled={isLoading}
                    />
                  </div>
                  {form.formState.errors.email && (
                    <p className="mt-2 text-[10px] font-black text-red-600 uppercase tracking-wide px-1">
                      {form.formState.errors.email.message}
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
                      <span><TranslatedText text="Send Reset Link" /></span>
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
                  <TranslatedText text="Check your email" />
                </h3>
                <p className="text-sm font-medium text-slate-500 mb-8 px-4">
                  <TranslatedText text="A password reset link has been sent to your email address." />
                </p>
                <button
                  onClick={() => navigate('/auth')}
                  className="w-full bg-primary-600 text-white font-black uppercase tracking-widest py-3 px-4 rounded-xl hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 shadow-lg shadow-primary-500/20 flex items-center justify-center space-x-2 text-[11px]"
                >
                  <TranslatedText text="Return to Sign In" />
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Additional Help */}
        {emailSent && (
          <div className="mt-6 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              <TranslatedText text="Didn't receive the email? Check your spam folder or" />{' '}
              <button
                onClick={() => {
                  setEmailSent(false);
                  setSubmitError(null);
                }}
                className="text-primary-600 hover:text-primary-500 transition-colors"
              >
                <TranslatedText text="try again" />
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
