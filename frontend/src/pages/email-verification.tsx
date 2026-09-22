import LoadingPage from '@/components/LoadingPage';
import AppConfig from '@/config/AppConfig';
import { selectAuth, signOut } from '@/store/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import authApi from '@/services/authApi';
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { TbMailOpened, TbLogout, TbRefresh, TbAlertCircle, TbCheck } from 'react-icons/tb';
import NeuralNetworkBackground from '@/components/NeuralNetworkBackground';
import type { User } from '@/types';

interface ResendResponse {
    success: boolean;
    message: string;
}

const EmailVerification = () => {
    const { user }: { user: User | null } = useAppSelector(selectAuth);
    const dispatch = useAppDispatch()
    const [response, setResponse] = useState<ResendResponse | null>(null)
    const [isLoading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const navigate = useNavigate()

    useEffect(() => {
        document.title = `Email Verification ${AppConfig.exTitle}`
    }, [])

    useEffect(() => {
        if (user && (user.is_verified || user.isVerified)) {
            navigate('/panel/dashboard')
        }

        const interval = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(interval);
    }, [countdown, user, navigate])

    const handleLogout = () => {
        dispatch(signOut()).then(() => {
            navigate("/signin");
        });
    };

    const ResendEmailVerification = async () => {
        setLoading(true)
        try {
            const res = await authApi.resendVerification();
            setLoading(false)
            setResponse({ success: true, message: res.data.message })
        } catch (error) {
            const err = error as { response?: { data?: { message?: string; data?: { time?: number } } } };
            setLoading(false)
            setResponse({ success: false, message: err.response?.data?.message || 'Failed to resend email' })
            if (err.response?.data?.data?.time) {
                setCountdown(err.response.data.data.time)
            }
        }
    }

    const containerVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
    };

    if (isLoading) return <LoadingPage />;

    return (
        <div className='flex justify-center items-center min-h-screen relative overflow-hidden bg-neutral-50 dark:bg-neutral-950 font-sans'>
            <NeuralNetworkBackground />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className='p-8 w-full max-w-xl mx-4 rounded-3xl relative backdrop-blur-2xl bg-white/70 dark:bg-neutral-900/70 border border-white/40 dark:border-neutral-800/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col items-center gap-6 text-center'
            >
                <motion.div
                    variants={itemVariants}
                    className='h-20 w-20 bg-linear-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-2'
                >
                    <TbMailOpened className='text-white text-4xl' />
                </motion.div>

                <div className="space-y-2">
                    <motion.h1
                        variants={itemVariants}
                        className='text-3xl font-black bg-linear-to-br from-blue-600 via-indigo-600 to-blue-600 dark:from-blue-400 dark:via-indigo-400 dark:to-blue-400 bg-clip-text text-transparent tracking-tight'
                    >
                        Verify Your Email
                    </motion.h1>
                    <motion.p variants={itemVariants} className='text-neutral-500 dark:text-neutral-400 text-sm font-medium'>
                        We need to verify your address to secure your account.
                    </motion.p>
                </div>

                <AnimatePresence mode="wait">
                    {response && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="w-full overflow-hidden"
                        >
                            <div className={`${response.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'} p-4 rounded-2xl border backdrop-blur-sm flex items-center gap-3 text-sm font-bold`}>
                                {response.success ? <TbCheck size={20} /> : <TbAlertCircle size={20} />}
                                {response.message}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div variants={itemVariants} className='space-y-4'>
                    {user && (
                        <div className="bg-neutral-100/50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50">
                            <p className='text-neutral-600 dark:text-neutral-400 text-sm'>
                                We sent a secure link to:<br />
                                <span className='font-black text-neutral-900 dark:text-white text-base'>{user.email}</span>
                            </p>
                        </div>
                    )}

                    <p className='text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed px-4'>
                        Click the link in the email to complete your setup.
                        Can&apos;t find it? Check your <span className="text-blue-500 font-bold uppercase tracking-widest text-[10px]">Spam</span> folder.
                    </p>
                </motion.div>

                <motion.div variants={itemVariants} className="w-full pt-4">
                    {countdown > 0 ? (
                        <div className='bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-[0.2em]'>
                            Retry available in {countdown} seconds
                        </div>
                    ) : (
                        <button
                            onClick={ResendEmailVerification}
                            className='group w-full cursor-pointer bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-8 rounded-2xl transition-all duration-300 font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2'
                        >
                            <TbRefresh className="group-hover:rotate-180 transition-transform duration-500" size={18} />
                            Resend Verification
                        </button>
                    )}
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    className='w-full mt-4 pt-6 border-t border-neutral-200/50 dark:border-neutral-700/50'
                >
                    <button
                        onClick={handleLogout}
                        className='group text-neutral-400 hover:text-rose-500 font-bold text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 mx-auto'
                    >
                        <TbLogout className="group-hover:-translate-x-1 transition-transform" size={16} />
                        Sign Out Session
                    </button>
                </motion.div>
            </motion.div>
        </div>
    )
}

export default EmailVerification
