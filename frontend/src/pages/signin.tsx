import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { TbLock, TbMail, TbArrowRight, TbCheck, TbChevronRight, TbWallet } from 'react-icons/tb';
import { useAppDispatch } from '@/store/hooks';
import { refreshToken } from '@/store/authSlice';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AppConfig from '@/config/AppConfig';
import LoadingPage from '@/components/LoadingPage';
import NeuralNetworkBackground from '@/components/NeuralNetworkBackground';

const Signin: React.FC = () => {
    const location = useLocation();
    const { status, message } = location.state || {};

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState({ email: '', password: '', general: '' });
    const [isLoading, setLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);

    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    useEffect(() => {
        document.title = `Sign In ${AppConfig.exTitle}`
        checkSetup();
    }, [])

    const checkSetup = async () => {
        try {
            const res = await axios.get(`${AppConfig.baseApiUrl}/check-setup`);
            if (res.data.success && res.data.setupRequired) {
                navigate('/setup', { replace: true });
            }
        } catch {
            // ignore
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError({ email: '', password: '', general: '' });

        let hasError = false;
        if (!email) {
            setError(prev => ({ ...prev, email: 'Email is required.' }));
            hasError = true;
        }

        if (!password) {
            setError(prev => ({ ...prev, password: 'Password is required.' }));
            hasError = true;
        }

        if (hasError) return;

        try {
            setLoading(true);
            await axios.post(`${AppConfig.baseApiUrl}/signin`, {
                email,
                password,
                remember_me: rememberMe
            }, { withCredentials: true });

            const result = await dispatch(refreshToken() as any);

            if (result.meta.requestStatus === 'fulfilled') {
                const origin = location.state?.from?.pathname || '/panel/dashboard';
                navigate(origin, { replace: true });
            } else {
                throw new Error('Failed to update auth state');
            }
        } catch (error: any) {
            setResponse(error.response?.data || {
                status: 'error',
                message: 'Login failed. Please try again.'
            });
            setLoading(false);
        }
    };

    const handleSigninWithGoogle = () => {
        const originPath = location.state?.from?.pathname || '/panel/dashboard';
        window.location.href = `${AppConfig.baseApiUrl}/auth/google?origin=${originPath}`;
    };
    if (isLoading) return <LoadingPage />;

    return (
        <div className='flex min-h-screen bg-white dark:bg-neutral-950 relative overflow-hidden'>
            <NeuralNetworkBackground />

            {/* Left Side: Inspiration/Benefits */}
            <div className='hidden lg:flex lg:w-1/2 relative bg-emerald-950/40 backdrop-blur-md overflow-hidden items-center justify-center p-12 border-r border-emerald-500/10'>
                <div className='relative z-10 max-w-lg'>
                    <div className='flex items-center gap-3 mb-8'>
                        <div className='p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl'>
                            <TbWallet className='w-10 h-10 text-emerald-400' />
                        </div>
                        <span className='text-3xl font-bold text-white tracking-tight uppercase'>Finance Hub</span>
                    </div>

                    <h2 className='text-5xl font-bold text-white mb-8 leading-tight'>
                        Take total control of your <span className='text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-teal-300'>financial health.</span>
                    </h2>

                    <div className='space-y-6'>
                        {[
                            'Real-Time Multi-Currency Expense Tracking',
                            'Dynamic Category Budget Limits & Overflow Alerts',
                            'Milestone Progress Tracking for Savings Goals',
                            'Server-Side Excel Reports Export (.xlsx)'
                        ].map((benefit, index) => (
                            <div key={index} className='flex items-center gap-4 text-emerald-100'>
                                <div className='shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center'>
                                    <TbCheck className='text-emerald-400 w-4 h-4' />
                                </div>
                                <span className='text-lg font-medium'>{benefit}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                        <p className='text-emerald-200 italic'>"Beware of little expenses. A small leak will sink a great ship. Sign in to monitor, budget, and grow your personal wealth."</p>
                    </div>
                </div>
            </div>

            {/* Right Side: Signin Form */}
            <div className='w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-20 bg-neutral-50/80 dark:bg-neutral-950/80 backdrop-blur-sm relative'>
                <div className='w-full max-w-md'>
                    <div className='mb-10'>
                        <h1 className='text-3xl font-bold text-neutral-900 dark:text-white mb-2'>Sign In</h1>
                        <p className='text-neutral-500 dark:text-neutral-400'>Enter your account to manage your personal finances.</p>
                    </div>

                    {status && message && (
                        <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${status === 'success' ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'}`}>
                            <p className='text-sm'>{message}</p>
                        </div>
                    )}

                    {response && response.message && !response.errors && (
                        <div className={`mb-6 p-4 rounded-xl border flex justify-between items-start gap-3 ${response.status === 'success' ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'}`}>
                            <p className='text-sm'>{response.message}</p>
                            <button onClick={() => setResponse(null)} className="text-current opacity-70 hover:opacity-100 font-bold">×</button>
                        </div>
                    )}

                    {response && response.errors && (
                        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl text-red-700 dark:text-red-400">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-semibold text-sm">Validation Errors:</span>
                                <button onClick={() => setResponse(null)} className="text-red-500 hover:text-red-700 dark:hover:text-red-300 font-bold">×</button>
                            </div>
                            <ul className="list-disc list-inside text-sm space-y-1">
                                {Object.entries(response.errors).map(([field, messages]) => (
                                    <li key={field} className="capitalize">
                                        <span className="font-medium">{field}:</span> {Array.isArray(messages) ? (messages as string[]).join(', ') : String(messages)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className='space-y-5'>
                        <div className='space-y-2'>
                            <label className='text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1'>Email Address</label>
                            <div className='relative group'>
                                <TbMail className='absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-emerald-500 transition-colors' size={20} />
                                <input
                                    type="email"
                                    placeholder='name@domain.com'
                                    onChange={e => setEmail(e.target.value)}
                                    value={email}
                                    autoComplete='email'
                                    className='w-full pl-12 pr-4 py-3.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all dark:text-white'
                                />
                            </div>
                            {error.email && <p className='text-xs text-red-500 mt-1 ml-1'>{error.email}</p>}
                        </div>

                        <div className='space-y-2'>
                            <label className='text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1'>Password</label>
                            <div className='relative group'>
                                <TbLock className='absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-emerald-500 transition-colors' size={20} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder='••••••••'
                                    onChange={e => setPassword(e.target.value)}
                                    value={password}
                                    autoComplete='current-password'
                                    className='w-full pl-12 pr-16 py-3.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all dark:text-white'
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className='absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-xs font-bold'
                                >
                                    {showPassword ? 'HIDE' : 'SHOW'}
                                </button>
                            </div>
                            {error.password && <p className='text-xs text-red-500 mt-1 ml-1'>{error.password}</p>}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={() => setRememberMe(!rememberMe)}
                                        className="peer sr-only"
                                    />
                                    <div className="w-5 h-5 border-2 border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-900 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-colors flex items-center justify-center">
                                        <TbCheck className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
                                    </div>
                                </div>
                                <span className="text-sm text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-200 transition-colors">
                                    Remember me
                                </span>
                            </label>
                            <Link to="/forgot-password" className='text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors'>
                                Forgot password?
                            </Link>
                        </div>

                        <div className='pt-4'>
                            <button className='cursor-pointer w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group'>
                                Sign In to Finance App
                                <TbArrowRight className='group-hover:translate-x-1 transition-transform' />
                            </button>
                        </div>

                        <div
                            onClick={handleSigninWithGoogle}
                            className='cursor-pointer group w-full py-4 px-6 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-all duration-300 flex items-center justify-between shadow-xs hover:shadow-md active:scale-[0.98]'
                        >
                            <div className='flex items-center gap-4'>
                                <div className='p-2.5 bg-white dark:bg-neutral-900 rounded-xl shadow-xs group-hover:scale-110 transition-all duration-300 border border-neutral-100 dark:border-neutral-800 flex items-center justify-center'>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M23.5 12.2c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.8-2.4 3.6v3h3.8c2.2-2 3.6-5 3.6-8.7z" fill="#4285F4" />
                                        <path d="M12 24c3.2 0 6-1 8-2.8l-3.8-3c-1.1.8-2.6 1.2-4.2 1.2-3.2 0-5.9-2.2-6.9-5.2H1.3v3C3.3 21 7.2 24 12 24z" fill="#34A853" />
                                        <path d="M5.1 14.2c-.3-.8-.4-1.6-.4-2.2s.1-1.4.4-2.2v-3H1.3C.5 8.4 0 10.1 0 12s.5 3.6 1.3 5.2l3.8-3z" fill="#FBBC05" />
                                        <path d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.2 0 3.3 3 1.3 7.2l3.8 3c1-3 3.7-5.2 6.9-5.2z" fill="#EA4335" />
                                    </svg>
                                </div>
                                <div className="flex flex-col">
                                    <span className='block text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight'>Sign In with Google</span>
                                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Fast & Secure Access</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <TbChevronRight className='text-neutral-300 dark:text-neutral-600 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all' />
                            </div>
                        </div>
                    </form>

                    <div className='mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-800 text-center'>
                        <p className='text-neutral-600 dark:text-neutral-400 text-sm'>
                            Don't have an account yet?
                            <Link to="/signup" className='ml-2 font-bold text-emerald-600 dark:text-emerald-400 hover:underline'>Sign Up here</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signin;
