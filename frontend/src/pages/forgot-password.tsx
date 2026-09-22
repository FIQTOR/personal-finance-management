import { useEffect, useState } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { TbMail, TbKeyOff, TbArrowLeft, TbCheck, TbAlertCircle } from 'react-icons/tb';
import { useAppSelector } from '@/store/hooks';
import { selectAuth } from '@/store/authSlice';
import AppConfig from '@/config/AppConfig';
import authApi from '@/services/authApi';
import { Link } from 'react-router-dom';
import LoadingPage from '@/components/LoadingPage';
import NeuralNetworkBackground from '@/components/NeuralNetworkBackground';
import { getErrorMessage } from '@/utils/error';

interface FeedbackResponse {
    status: 'success' | 'failed';
    message: string;
}

const ForgotPassword = () => {
    const { user } = useAppSelector(selectAuth)
    const [email, setEmail] = useState('');
    const [response, setResponse] = useState<FeedbackResponse | null>(null)
    const [countdown, setCountdown] = useState(0)
    const [isLoading, setLoading] = useState(false);

    useEffect(() => {
        document.title = `Forgot Password ${AppConfig.exTitle}`
    }, [])

    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(interval);
    }, [countdown])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (countdown !== 0) return null;

        if (!email) {
            return setResponse({
                status: 'failed',
                message: 'Email required!'
            })
        }

        setLoading(true)

        try {
            const res = await authApi.requestPasswordReset(email);
            setResponse({ status: 'success', message: res.data.message });
            setCountdown(res.data.data?.time ?? 0);
            setLoading(false)
        } catch (error: unknown) {
            setResponse({
                status: 'failed',
                message: getErrorMessage(error, 'Request failed.'),
            });
            setLoading(false)
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
                className='p-10 w-full max-w-sm mx-4 rounded-3xl relative backdrop-blur-2xl bg-white/70 dark:bg-neutral-900/70 border border-white/40 dark:border-neutral-800/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col gap-6'
            >
                <motion.div
                    variants={itemVariants}
                    className='absolute -top-10 left-1/2 -translate-x-1/2 p-5 rounded-3xl bg-white dark:bg-neutral-800 border-2 border-white/50 dark:border-neutral-700 shadow-2xl backdrop-blur-xl'
                >
                    <TbKeyOff className='w-8 h-8 text-blue-600 dark:text-blue-400' />
                </motion.div>

                <div className="pt-6 space-y-2 text-center">
                    <motion.h1
                        variants={itemVariants}
                        className='text-3xl font-black bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent tracking-tight'
                    >
                        Forgot Password
                    </motion.h1>
                    <motion.p variants={itemVariants} className='text-neutral-500 dark:text-neutral-400 text-xs font-semibold uppercase tracking-widest'>
                        Secure Identity Recovery
                    </motion.p>
                </div>

                <motion.p variants={itemVariants} className='text-neutral-600 dark:text-neutral-300 text-sm text-center leading-relaxed px-2 transition-colors'>
                    Enter your authorized email address to initiate a reset sequence.
                </motion.p>

                <AnimatePresence mode="wait">
                    {response && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="w-full overflow-hidden"
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
                        <label htmlFor="email" className='text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 pl-1'>
                            Access Identifier
                        </label>
                        <div className="group relative">
                            <TbMail className='absolute w-5 h-5 top-1/2 -translate-y-1/2 left-4 text-neutral-400 group-focus-within:text-blue-500 transition-colors' />
                            <input
                                type="email"
                                name="email"
                                id="email"
                                placeholder='your@email.com'
                                autoComplete='email'
                                onChange={e => setEmail(e.target.value)}
                                value={email}
                                className='w-full pl-12 pr-4 py-4 rounded-2xl bg-neutral-100/50 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-sm'
                            />
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        {countdown > 0 ? (
                            <div className='bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] text-center'>
                                Sequence locked for {countdown}s
                            </div>
                        ) : (
                            <button className='w-full py-4 px-6 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer'>
                                Request Reset Link
                            </button>
                        )}
                    </motion.div>
                </form>

                <motion.div
                    variants={itemVariants}
                    className='mt-2 pt-6 border-t border-neutral-200/50 dark:border-neutral-700/50 flex flex-col items-center gap-4'
                >
                    {!user && (
                        <Link to="/signin" className='group flex items-center gap-2 text-neutral-400 hover:text-indigo-500 text-[10px] font-black uppercase tracking-[0.2em] transition-colors'>
                            <TbArrowLeft className='group-hover:-translate-x-1 transition-transform' />
                            Back to Access Hub
                        </Link>
                    )}
                </motion.div>
            </motion.div>
        </div>
    )
}

export default ForgotPassword
