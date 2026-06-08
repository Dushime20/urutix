import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FaEye, FaEyeSlash, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { CheckCircle2, Circle, Briefcase, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

import logoUrutiXNew from '../assets/urutiX Logistics Logo (1).svg';
import logoUrutiXBackground from '../assets/logo-urutix.svg';

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

const BrokerPasswordSetup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [passwordCriteria, setPasswordCriteria] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const { register, handleSubmit, watch, formState: { errors } } = useForm<PasswordSetupFormData>({
    resolver: zodResolver(passwordSetupSchema),
  });

  const passwordValue = watch('password');

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
      setPasswordCriteria({ minLength: false, hasUppercase: false, hasLowercase: false, hasNumber: false, hasSpecialChar: false });
    }
  }, [passwordValue]);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing setup token. Please check your email.');
      navigate('/auth');
    }
  }, [token, navigate]);

  const onSubmit = async (data: PasswordSetupFormData) => {
    if (!token) { toast.error('Invalid setup token'); return; }
    try {
      setIsLoading(true);
      await authAPI.setupBrokerPassword({ token, password: data.password, confirmPassword: data.confirmPassword });
      setIsSuccess(true);
      toast.success('Password set successfully! Redirecting to login...');
      setTimeout(() => navigate('/auth'), 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to set password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const criteria = [
    { key: 'minLength',     label: 'At least 8 characters',   met: passwordCriteria.minLength },
    { key: 'hasUppercase',  label: 'One uppercase letter',     met: passwordCriteria.hasUppercase },
    { key: 'hasLowercase',  label: 'One lowercase letter',     met: passwordCriteria.hasLowercase },
    { key: 'hasNumber',     label: 'One number',               met: passwordCriteria.hasNumber },
    { key: 'hasSpecialChar',label: 'One special character',    met: passwordCriteria.hasSpecialChar },
  ];

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
        <img src={logoUrutiXBackground} alt="" className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-10 z-0" />
        <div className="w-full max-w-md px-4 relative z-10">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 pt-8 pb-4 text-center">
              <div className="flex justify-center mb-6">
                <img src={logoUrutiXNew} alt="UrutiX Logistics" className="h-20 w-auto object-contain" />
              </div>
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 rounded-full p-3">
                  <FaCheckCircle className="text-green-600 text-3xl" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">Password Set Successfully!</h2>
              <p className="text-sm text-gray-600 mb-6">
                Your Broker account is now active. You can log in and start managing loads.
              </p>
              <button onClick={() => navigate('/auth')} className="w-full bg-primary-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-primary-700 transition-all flex items-center justify-center gap-2 text-sm">
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden antialiased">
      <img src={logoUrutiXBackground} alt="" className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-10 z-0" />
      <div className="w-full max-w-2xl px-4 relative z-10">
        <div className="flex justify-center mb-8">
          <img src={logoUrutiXNew} alt="UrutiX Logistics" className="h-24 w-auto object-contain drop-shadow-md" />
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-8 pt-8 pb-4">
            <div className="flex justify-center mb-4">
              <div className="bg-indigo-50 rounded-full p-3 border-2 border-indigo-200">
                <Briefcase className="text-indigo-600 w-7 h-7" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-1 text-center tracking-tight">Set Up Your Password</h2>
            <p className="text-sm font-medium text-slate-500 text-center">
              Welcome to UrutiX! Your Broker account has been created. Please set a secure password to get started.
            </p>
          </div>

          <div className="px-6 pb-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Password</label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="w-full px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-10"
                    placeholder="Enter your password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600">
                    {showPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-2 text-[10px] font-black text-red-600 uppercase tracking-wide px-1">{errors.password.message}</p>}

                {passwordValue && (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-xs font-medium text-gray-700 mb-2">Password must contain:</p>
                    <div className="space-y-1">
                      {criteria.map(c => (
                        <div key={c.key} className="flex items-center gap-2">
                          {c.met ? <CheckCircle2 className="text-green-500 w-3.5 h-3.5" /> : <Circle className="text-gray-400 w-3.5 h-3.5" />}
                          <span className={`text-[10px] font-black uppercase tracking-wide ${c.met ? 'text-green-600' : 'text-slate-400'}`}>{c.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Confirm Password</label>
                <div className="relative">
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    className="w-full px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-10"
                    placeholder="Confirm your password"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600">
                    {showConfirmPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-2 text-[10px] font-black text-red-600 uppercase tracking-wide px-1">{errors.confirmPassword.message}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-600 text-white font-black uppercase tracking-widest py-3 px-4 rounded-xl hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[11px]"
              >
                {isLoading
                  ? <><FaSpinner className="animate-spin h-4 w-4" /><span>Setting up password...</span></>
                  : <><span>Set Password</span><ArrowRight className="h-4 w-4" /></>
                }
              </button>

              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Already have an account?{' '}
                  <button type="button" onClick={() => navigate('/auth')} className="text-primary-600 hover:text-primary-500 transition-colors">
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

export default BrokerPasswordSetup;
