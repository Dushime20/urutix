import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { FaSpinner } from 'react-icons/fa';
import logoUrutiX from '../assets/logo-urutix.svg';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      await authAPI.forgotPassword(values.email);
      setEmailSent(true);
      toast.success('Password reset email sent! Please check your inbox.');
    } catch (error: any) {
      console.error('Forgot password error:', error);
      // Even on error, show success message for security (don't reveal if email exists)
      setEmailSent(true);
      toast.success('If an account exists with this email, a password reset link has been sent.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
      {/* Background Logo */}
      <img
        src={logoUrutiX}
        alt="UrutiX Logo Background"
        className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-10 z-0"
        style={{ objectPosition: 'center' }}
      />

      {/* Centered Form */}
      <div className="w-full max-w-md px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-center mb-8">
          <img src={logoUrutiX} alt="UrutiX Logistics Logo" className="h-24 w-auto object-contain drop-shadow-md" />
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <button
              onClick={() => navigate('/auth')}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to login
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Reset your password
            </h2>
            <p className="text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {/* Form Content */}
          <div className="px-6 pb-6">
            {!emailSent ? (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <input
                      {...form.register('email')}
                      type="email"
                      className="w-full px-3 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your email"
                      disabled={isLoading}
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  {form.formState.errors.email && (
                    <p className="mt-1 text-xs text-red-600">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <FaSpinner className="animate-spin h-4 w-4" />
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      <span>Send reset link</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Check your email
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  If an account exists with <span className="font-medium">{form.getValues('email')}</span>,
                  you will receive a password reset link shortly.
                </p>
                <button
                  onClick={() => navigate('/auth')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Return to login
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Additional Help */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              onClick={() => setEmailSent(false)}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              try again
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
