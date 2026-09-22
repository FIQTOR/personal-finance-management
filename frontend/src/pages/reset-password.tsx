import { useEffect, useState } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { TbKey, TbLock, TbEye, TbEyeOff, TbArrowLeft, TbCheck, TbAlertCircle } from 'react-icons/tb';
import AppConfig from '@/config/AppConfig';
import authApi from '@/services/authApi';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import LoadingPage from '@/components/LoadingPage';
import NeuralNetworkBackground from '@/components/NeuralNetworkBackground';
import { getErrorMessage } from '@/utils/error';

interface FeedbackResponse {
    status: 'success' | 'failed';
    message: string;
}

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showPassword, setShowPassword] = useState({
        password: false,
        passwordConfirm: false
    });

    const [tokenValid, setTokenValid] = useState(false)
    const [response, setResponse] = useState<FeedbackResponse | null>(null)
    const [isLoading, setLoading] = useState(true)

    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== passwordConfirm) {
            return setResponse({
                status: 'failed',
                message: 'Passwords do not match!'
            });
        }

        if (password.length < 8) {
            return setResponse({
                status: 'failed',
                message: 'Password must be at least 8 characters.'
            });
        }

        setLoading(true)
        try {
            const res = await authApi.resetPassword(token as string, password);

            const message = res.data.message
            navigate('/signin', {
                state: {
                    message: message,
                    type: 'success'
                }
            });
        } catch (error: unknown) {
            setResponse({
                status: 'failed',
                message: getErrorMessage(error, 'Reset failed'),
            })
            setLoading(false)
        }
    }

    useEffect(() => {
        document.title = `Reset Password ${AppConfig.exTitle}`

        const checkToken = async () => {
            try {
                await authApi.checkResetToken(token as string)
                setTokenValid(true)
                setLoading(false)
            } catch {
                setTokenValid(false)
                setLoading(false)
            }
        }

        checkToken()
    }, [token])

    const containerVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
    };

    if (isLoading) return <LoadingPage />;

    if (!tokenValid) {
        return (
            <div className='w-full min-h-screen flex justify-center items-center relative overflow-hidden bg-neutral-50 dark:bg-neutral-950 font-sans'>
                <NeuralNetworkBackground />

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className='p-10 backdrop-blur-2xl bg-white/70 dark:bg-neutral-900/70 border border-white/40 dark:border-neutral-800/50 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col items-center gap-6 max-w-sm mx-4'
                >
                    <motion.div
                        variants={itemVariants}
                        className='h-20 w-20 bg-rose-500/10 rounded-3xl flex items-center justify-center border border-rose-500/20 shadow-lg'
                    >
                        <TbAlertCircle className='w-10 h-10 text-rose-500' />
                    </motion.div>

                    <div className="text-center space-y-2">
                        <motion.h2
                            variants={itemVariants}
                            className='text-2xl font-black bg-linear-to-br from-rose-600 to-orange-600 dark:from-rose-400 dark:to-orange-400 bg-clip-text text-transparent tracking-tight'
                        >
                            Session Expired
                        </motion.h2>
                        <motion.p variants={itemVariants} className='text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed'>
                            The reset token is either invalid or expired.
                        </motion.p>
                    </div>

                    <motion.div variants={itemVariants} className="w-full">
                        <button
                            onClick={() => navigate('/forgot-password')}
                            className='w-full px-6 py-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 shadow-xl shadow-blue-500/20 active:scale-[0.98]'
                        >
                            Request New Link
                        </button>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Link to="/signin" className="text-neutral-400 hover:text-indigo-500 font-bold text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2">
                            <TbArrowLeft size={16} /> Return to Hub
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        )
    }

    return (
        <div className='flex justify-center items-center min-h-screen relative overflow-hidden bg-neutral-50 dark:bg-neutral-950 font-sans'>
            <NeuralNetworkBackground />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className='p-10 w-full max-w-sm mx-4 relative backdrop-blur-2xl bg-white/70 dark:bg-neutral-900/70 border border-white/40 dark:border-neutral-800/50 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col gap-6'
            >
                <motion.div
                    variants={itemVariants}
                    className='absolute -top-10 left-1/2 -translate-x-1/2 p-5 rounded-3xl bg-white dark:bg-neutral-800 border-2 border-white/50 dark:border-neutral-700 shadow-2xl backdrop-blur-xl'
                >
                    <TbKey className='w-8 h-8 text-blue-600 dark:text-blue-400' />
                </motion.div>

                <div className="pt-6 space-y-2 text-center">
                    <motion.h1
                        variants={itemVariants}
                        className='text-3xl font-black bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent tracking-tight'
                    >
                        Reset Password
                    </motion.h1>
                    <motion.p variants={itemVariants} className='text-neutral-500 dark:text-neutral-400 text-xs font-semibold uppercase tracking-widest'>
                        Override Security Sequence
                    </motion.p>
                </div>

                <AnimatePresence mode="wait">
                    {response && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <div className={`${response.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'} p-4 rounded-xl border backdrop-blur-sm flex items-center gap-3 text-xs font-black uppercase tracking-tight`}>
                                {response.status === 'success' ? <TbCheck size={18} /> : <TbAlertCircle size={18} />}
                                {response.message}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className='flex flex-col gap-6 relative z-10'>
                    <motion.div variants={itemVariants} className='flex flex-col gap-2 relative'>
                        <label htmlFor="password" className='text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 pl-1'>New Master Key</label>
                        <div className="group relative">
                            <TbLock className='absolute w-5 h-5 top-1/2 -translate-y-1/2 left-4 text-neutral-400 group-focus-within:text-blue-500 transition-colors' />
                            <input
                                type={showPassword.password ? 'text' : 'password'}
                                name="password"
                                id="password"
                                placeholder='At least 8 characters'
                                onChange={e => setPassword(e.target.value)}
                                value={password}
                                autoComplete='new-password'
                                className='w-full pl-12 pr-12 py-4 rounded-2xl bg-neutral-100/50 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-sm'
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(prev => ({ ...prev, password: !prev.password }))}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-blue-500 transition-colors"
                            >
                                {showPassword.password ? <TbEyeOff size={20} /> : <TbEye size={20} />}
                            </button>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className='flex flex-col gap-2 relative'>
                        <label htmlFor="password-confirm" className='text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 pl-1'>Confirm Sequence</label>
                        <div className='relative group'>
                            <TbLock className='absolute w-5 h-5 top-1/2 -translate-y-1/2 left-4 text-neutral-400 group-focus-within:text-blue-500 transition-colors' />
                            <input
                                type={showPassword.passwordConfirm ? 'text' : 'password'}
                                name="password-confirm"
                                id="password-confirm"
                                autoComplete='off'
                                placeholder='Repeat Master Key'
                                onChange={e => setPasswordConfirm(e.target.value)}
                                className='w-full pl-12 pr-12 py-4 rounded-2xl bg-neutral-100/50 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-sm'
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(prev => ({ ...prev, passwordConfirm: !prev.passwordConfirm }))}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-blue-500 transition-colors"
                            >
                                {showPassword.passwordConfirm ? <TbEyeOff size={20} /> : <TbEye size={20} />}
                            </button>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <button className='w-full py-4 px-6 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer'>
                            Commit Changes
                        </button>
                    </motion.div>
                </form>

                <motion.div variants={itemVariants} className="mt-2 pt-6 border-t border-neutral-200/50 dark:border-neutral-700/50 text-center">
                    <Link to="/signin" className="text-neutral-400 hover:text-indigo-500 font-bold text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                        <TbArrowLeft size={16} /> Return to Access Hub
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    )
}

export default ResetPassword
