/**
 * TwoFactorChallenge — shown at login when backend returns requiresTwoFactor: true
 * Used inside Auth.tsx login flow
 */
import React, { useState } from 'react';
import { Shield, KeyRound, ArrowLeft } from 'lucide-react';
import { twoFactorApi } from '../../services/featuresApi';
import { TranslatedText } from '../translated-text';
import toast from 'react-hot-toast';

interface Props {
  userId: string;
  preAuthToken: string;
  onSuccess: (token: string) => void;
  onBack: () => void;
}

const TwoFactorChallenge: React.FC<Props> = ({ userId, preAuthToken, onSuccess, onBack }) => {
  const [code, setCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      let result: any;
      if (useBackup) {
        result = await twoFactorApi.backup(userId, code.trim());
      } else {
        result = await twoFactorApi.validate(userId, code.trim());
      }
      if (result?.success) {
        toast.success('2FA verified');
        onSuccess(preAuthToken);
      } else {
        toast.error(result?.message || 'Invalid code. Please try again.');
        setCode('');
      }
    } catch {
      toast.error('Verification failed. Please try again.');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield size={28} className="text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
          <TranslatedText text="Two-Factor Authentication" />
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          {useBackup
            ? <TranslatedText text="Enter one of your backup codes" />
            : <TranslatedText text="Enter the 6-digit code from your authenticator app" />}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            {useBackup ? <TranslatedText text="Backup Code" /> : <TranslatedText text="Authentication Code" />}
          </label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\s/g, ''))}
            placeholder={useBackup ? 'XXXXXXXX' : '000000'}
            maxLength={useBackup ? 8 : 6}
            autoFocus
            className="w-full px-4 py-3 text-center text-2xl font-black tracking-[0.5em] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={loading || code.length < (useBackup ? 8 : 6)}
          className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <><KeyRound size={16} /> <TranslatedText text="Verify" /></>
          )}
        </button>
      </form>

      <div className="flex flex-col gap-2 text-center">
        <button
          onClick={() => { setUseBackup(!useBackup); setCode(''); }}
          className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
        >
          {useBackup
            ? <TranslatedText text="Use authenticator app instead" />
            : <TranslatedText text="Use a backup code instead" />}
        </button>
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={12} /> <TranslatedText text="Back to login" />
        </button>
      </div>
    </div>
  );
};

export default TwoFactorChallenge;
