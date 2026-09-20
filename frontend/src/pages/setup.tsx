import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { TbWallet, TbUser, TbMail, TbLock, TbArrowRight, TbWorld, TbCurrencyDollar } from 'react-icons/tb';
import AppConfig from '@/config/AppConfig';
import { useNavigate } from 'react-router-dom';
import LoadingPage from '@/components/LoadingPage';
import { useAppDispatch } from '@/store/hooks';
import { refreshToken } from '@/store/authSlice';
import NeuralNetworkBackground from '@/components/NeuralNetworkBackground';
import { useLanguage } from '@/context/LanguageContext';

export default function SetupPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { setLanguage } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [selectedLang, setSelectedLang] = useState<'en' | 'id'>('en');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = `Initial System Setup ${AppConfig.exTitle}`;
    checkIfSetupNeeded();
  }, []);

  const checkIfSetupNeeded = async () => {
    try {
      const res = await axios.get(`${AppConfig.baseApiUrl}/check-setup`);
      if (res.data.success && !res.data.setupRequired) {
        navigate('/signin', { replace: true });
      }
    } catch {
      // ignore
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setIsLoading(true);
      setLanguage(selectedLang);

      await axios.post(`${AppConfig.baseApiUrl}/setup`, {
        name,
        email,
        password,
        currency,
        language: selectedLang
      }, { withCredentials: true });

      const result = await dispatch(refreshToken() as any);

      if (result.meta.requestStatus === 'fulfilled') {
        navigate('/panel/dashboard', { replace: true });
      } else {
        throw new Error('Failed to start session');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Setup failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoogleSetup = () => {
    setLanguage(selectedLang);
    window.location.href = `${AppConfig.baseApiUrl}/auth/google?currency=${currency}&lang=${selectedLang}&origin=/panel/dashboard`;
  };

  if (isLoading) return <LoadingPage />;

  return (
    <div className="flex min-h-screen bg-white dark:bg-neutral-950 relative overflow-hidden items-center justify-center p-6">
      <NeuralNetworkBackground />

      <div className="w-full max-w-xl z-10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-2xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
            <TbWallet className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Initial App Setup</h1>
            <p className="text-xs text-gray-500 dark:text-neutral-400">Welcome! Configure your Personal Finance System owner account.</p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSetupSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 mb-1">Owner Name</label>
              <div className="relative">
                <TbUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 mb-1">Owner Email</label>
              <div className="relative">
                <TbMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 mb-1">Password</label>
            <div className="relative">
              <TbLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                <TbCurrencyDollar className="w-4 h-4 text-emerald-500" /> Primary Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="USD">USD ($)</option>
                <option value="IDR">IDR (Rp)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                <TbWorld className="w-4 h-4 text-blue-500" /> Default Language
              </label>
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value as 'en' | 'id')}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="en">English</option>
                <option value="id">Bahasa Indonesia</option>
              </select>
            </div>
          </div>

          <div className="pt-3 space-y-3">
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
            >
              Complete Setup & Open Dashboard <TbArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleGoogleSetup}
              className="w-full py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700 text-xs font-bold transition-all"
            >
              Or Complete Setup using Google Auth
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
