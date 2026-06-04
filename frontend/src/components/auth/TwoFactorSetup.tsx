/**
 * TwoFactorSetup — embedded in Settings/Profile page
 * Roles: ALL (mandatory for ADMIN, SUPER_ADMIN, LENDER)
 */
import React, { useState } from 'react';
import { Shield, ShieldCheck, ShieldOff, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { twoFactorApi } from '../../services/featuresApi';
import { useAuth } from '../../contexts/AuthContext';
import { TranslatedText } from '../translated-text';
import toast from 'react-hot-toast';

const MANDATORY_ROLES = ['SUPER_ADMIN', 'ADMIN', 'LENDER'];

const TwoFactorSetup: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [step, setStep] = useState<'idle' | 'scan' | 'verify' | 'backup' | 'disable'>('idle');
  const [qrData, setQrData] = useState<{ secret: string; qrCodeUri: string; qrCodeBase64: string } | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [token, setToken] = useState('');
  const [disableToken, setDisableToken] = useState('');
  const [copied, setCopied] = useState(false);

  const isMandatory = MANDATORY_ROLES.includes(user?.role ?? '');
  const isEnabled = (user as any)?.twoFactorEnabled ?? false;

  const setupMutation = useMutation({
    mutationFn: twoFactorApi.setup,
    onSuccess: (data: any) => {
      setQrData(data);
      setStep('scan');
    },
    onError: () => toast.error('Failed to initiate 2FA setup'),
  });

  const verifyMutation = useMutation({
    mutationFn: () => twoFactorApi.verifySetup(token),
    onSuccess: (data: any) => {
      setBackupCodes(data.backupCodes ?? []);
      setStep('backup');
      toast.success('2FA enabled successfully!');
      qc.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: () => { toast.error('Invalid code. Please try again.'); setToken(''); },
  });

  const disableMutation = useMutation({
    mutationFn: () => twoFactorApi.disable(disableToken),
    onSuccess: () => {
      setStep('idle');
      setDisableToken('');
      toast.success('2FA disabled');
      qc.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: () => { toast.error('Invalid code'); setDisableToken(''); },
  });

  const copySecret = () => {
    if (qrData?.secret) {
      navigator.clipboard.writeText(qrData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast.success('Backup codes copied');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isEnabled ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
            {isEnabled
              ? <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400" />
              : <Shield size={20} className="text-slate-400 dark:text-slate-500" />}
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">
              <TranslatedText text="Two-Factor Authentication" />
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isEnabled
                ? <TranslatedText text="Your account is protected with 2FA" />
                : <TranslatedText text="Add an extra layer of security to your account" />}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isMandatory && !isEnabled && (
            <span className="flex items-center gap-1 text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-lg">
              <AlertTriangle size={10} /> Required
            </span>
          )}
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${isEnabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
            {isEnabled ? 'ENABLED' : 'DISABLED'}
          </span>
        </div>
      </div>

      {/* IDLE STATE */}
      {step === 'idle' && (
        <div className="flex gap-3">
          {!isEnabled ? (
            <button
              onClick={() => setupMutation.mutate()}
              disabled={setupMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-black transition-all disabled:opacity-50"
            >
              <Shield size={14} />
              {setupMutation.isPending ? '...' : <TranslatedText text="Enable 2FA" />}
            </button>
          ) : (
            <button
              onClick={() => setStep('disable')}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-black transition-all border border-red-200 dark:border-red-800"
            >
              <ShieldOff size={14} /> <TranslatedText text="Disable 2FA" />
            </button>
          )}
        </div>
      )}

      {/* SCAN QR CODE */}
      {step === 'scan' && qrData && (
        <div className="space-y-5">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-3">
              <TranslatedText text="1. Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)" />
            </p>
            <div className="flex justify-center mb-4">
              <img src={qrData.qrCodeBase64} alt="QR Code" className="w-48 h-48 rounded-xl border-4 border-white dark:border-slate-700 shadow-md" />
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
              <TranslatedText text="Or enter this secret manually:" />
            </p>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700">
              <code className="flex-1 text-xs font-mono text-slate-700 dark:text-slate-300 break-all">{qrData.secret}</code>
              <button onClick={copySecret} className="text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors flex-shrink-0">
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
              <TranslatedText text="2. Enter the 6-digit code from your app to confirm setup:" />
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={token}
                onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="flex-1 px-4 py-2.5 text-center text-xl font-black tracking-[0.5em] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={() => verifyMutation.mutate()}
                disabled={token.length < 6 || verifyMutation.isPending}
                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-black transition-all disabled:opacity-50"
              >
                {verifyMutation.isPending ? '...' : <TranslatedText text="Verify" />}
              </button>
            </div>
          </div>
          <button onClick={() => setStep('idle')} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold">
            <TranslatedText text="Cancel" />
          </button>
        </div>
      )}

      {/* BACKUP CODES */}
      {step === 'backup' && (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                <TranslatedText text="Save these backup codes in a safe place. Each code can only be used once. You'll need them if you lose access to your authenticator app." />
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, i) => (
                <code key={i} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-mono px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800 text-center tracking-widest">
                  {code}
                </code>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={copyBackupCodes} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black transition-all">
              <Copy size={14} /> <TranslatedText text="Copy All Codes" />
            </button>
            <button onClick={() => setStep('idle')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all">
              <CheckCircle size={14} /> <TranslatedText text="Done — I've saved my codes" />
            </button>
          </div>
        </div>
      )}

      {/* DISABLE 2FA */}
      {step === 'disable' && (
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="text-xs font-bold text-red-700 dark:text-red-300">
              <TranslatedText text="Enter your current 2FA code to disable two-factor authentication." />
            </p>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={disableToken}
              onChange={e => setDisableToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="flex-1 px-4 py-2.5 text-center text-xl font-black tracking-[0.5em] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={() => disableMutation.mutate()}
              disabled={disableToken.length < 6 || disableMutation.isPending}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-black transition-all disabled:opacity-50"
            >
              {disableMutation.isPending ? '...' : <TranslatedText text="Disable" />}
            </button>
          </div>
          <button onClick={() => setStep('idle')} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold">
            <TranslatedText text="Cancel" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TwoFactorSetup;
