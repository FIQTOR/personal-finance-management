import { useEffect, useRef, useState } from 'react';
import { TbArrowRight, TbCircleCheckFilled, TbCircleXFilled, TbRefresh } from 'react-icons/tb';
import AppConfig from '@/config/AppConfig';
import authApi from '@/services/authApi';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { refreshToken } from '@/store/authSlice';
import type { AppDispatch } from '@/store/store';
import LoadingPage from '@/components/LoadingPage';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import NeuralNetworkBackground from '@/components/NeuralNetworkBackground';

const VerifyEmail = () => {
    const [message, setMessage] = useState('');
    const [verified, setVerified] = useState(false);
    const hasFetched = useRef(false);
    const [isLoading, setIsLoading] = useState(true);
    const dispatch = useDispatch<AppDispatch>();

    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    useEffect(() => {
        document.title = `Verify Email ${AppConfig.exTitle}`
        if (hasFetched.current) return;
        hasFetched.current = true;
        if (!token) {
            setIsLoading(false);
            return;
        }

        const checkToken = async () => {
            try {
                await authApi.verifyEmail(token);
                setMessage('Your email has been verified successfully.');
                setVerified(true);
                dispatch(refreshToken());
            } catch (error) {
                console.error(error);
                setMessage('Invalid or expired token. Please try again.');
                setVerified(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkToken();
    }, [token, dispatch]);

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
                className='p-10 w-full max-w-xl mx-4 rounded-3xl relative backdrop-blur-2xl bg-white/70 dark:bg-neutral-900/70 border border-white/40 dark:border-neutral-800/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col items-center text-center'
            >
                <motion.div variants={itemVariants} className="space-y-4 mb-8">
                    <motion.h1
                        className='text-3xl font-black bg-linear-to-br from-blue-600 via-indigo-600 to-blue-600 dark:from-blue-400 dark:via-indigo-400 dark:to-blue-400 bg-clip-text text-transparent tracking-tight'
                    >
                        Verification Status
                    </motion.h1>
                    <p className="text-neutral-500 dark:text-neutral-400 text-xs font-black uppercase tracking-[0.2em]">
                        Processing secure handshake...
                    </p>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    className="relative flex items-center justify-center mb-8"
                >
                    <AnimatePresence mode="wait">
                        {verified ? (
                            <motion.div
                                key="success"
                                initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
                                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                className="h-24 w-24 bg-emerald-500/10 rounded-full flex items-center justify-center border-4 border-emerald-500/20"
                            >
                                <TbCircleCheckFilled className="w-16 h-16 text-emerald-500 shadow-lg" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="failed"
                                initial={{ scale: 0.5, opacity: 0, rotate: 45 }}
                                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                className="h-24 w-24 bg-rose-500/10 rounded-full flex items-center justify-center border-4 border-rose-500/20"
                            >
                                <TbCircleXFilled className="w-16 h-16 text-rose-500 shadow-lg" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {message && (
                    <motion.div
                        variants={itemVariants}
                        className={`w-full ${verified ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'} p-5 rounded-2xl border backdrop-blur-sm mb-6 text-sm font-black uppercase tracking-tight`}
                    >
                        {message}
                    </motion.div>
                )}

                <motion.div variants={itemVariants} className="w-full space-y-6">
                    {verified ? (
                        <>
                            <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed px-4">
                                Authentication complete. Your account is active.
                            </p>
                            <Link
                                to='/panel/dashboard'
                                className='group w-full bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-4 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 active:scale-[0.98]'
                            >
                                Enter Workspace <TbArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </>
                    ) : (
                        <>
                            <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed px-4">
                                Error detecting valid handshake.
                            </p>
                            <Link
                                to='/email-verification'
                                className='group w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-[0.98]'
                            >
                                <TbRefresh className="group-hover:rotate-180 transition-transform duration-500" />
                                Resend Handshake Request
                            </Link>
                        </>
                    )}
                </motion.div>

                <motion.div variants={itemVariants} className="mt-10 pt-6 border-t border-neutral-200/50 dark:border-neutral-700/50 w-full">
                    <Link to="/signin" className="text-neutral-400 hover:text-indigo-500 font-bold text-[10px] uppercase tracking-widest transition-colors">
                        Return to Authentication Hub
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default VerifyEmail;
