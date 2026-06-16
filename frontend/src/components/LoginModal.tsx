import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { X, Lock, Mail, ShieldAlert, KeyRound } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const [contact, setContact] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.trim()) {
      setError('Please provide your email or phone number.');
      return;
    }

    setLoading(true);
    setError('');
    setDevOtp(null);

    try {
      const res = await api.requestOtp(contact.trim());
      setStep(2);
      if (res.testOtp) {
        setDevOtp(res.testOtp);
      }
    } catch (err: any) {
      setError(err.message || 'Verification request failed. Make sure you are registered!');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.verifyOtp(contact.trim(), code.trim());
      login(res.token, res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-500 dark:bg-sky-950/50 dark:text-sky-400">
              <Lock size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Secure Access</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Identity verification required</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
              <ShieldAlert className="mt-0.5 shrink-0" size={16} />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Email or Phone Number
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Enter email (e.g. admin@eventportal.com)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium outline-none focus:border-sky-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950/50 dark:focus:border-sky-400 dark:focus:bg-slate-950"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Tip: Log in as admin using <span className="font-semibold text-sky-500">admin@eventportal.com</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-sky-500 py-3 font-semibold text-white transition hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:bg-sky-400 dark:bg-sky-600 dark:hover:bg-sky-700"
              >
                {loading ? 'Sending verification...' : 'Request OTP Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  6-Digit OTP Code
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium outline-none focus:border-sky-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950/50 dark:focus:border-sky-400 dark:focus:bg-slate-950"
                  />
                </div>
              </div>

              {devOtp && (
                <div className="rounded-xl border border-dashed border-sky-200 bg-sky-50/50 p-4 dark:border-sky-900/30 dark:bg-sky-950/20">
                  <p className="text-xs font-medium text-sky-600 dark:text-sky-400">
                    💡 <span className="font-bold">Test Environment OTP:</span> Use <code className="bg-sky-100 px-1.5 py-0.5 font-bold dark:bg-sky-900">{devOtp}</code> to verify instantly. (This is also logged to the server console).
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border border-slate-200 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-sky-500 py-3 font-semibold text-white transition hover:bg-sky-600 disabled:bg-sky-400 dark:bg-sky-600 dark:hover:bg-sky-700"
                >
                  {loading ? 'Verifying...' : 'Verify & Log In'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
