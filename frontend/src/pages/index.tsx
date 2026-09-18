import HelmetContainer from "@/components/HelmetContainer";
import AppConfig from "@/config/AppConfig";
import NeuralNetworkBackground from "@/components/NeuralNetworkBackground";
import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    TbWallet,
    TbChartPie,
    TbTarget,
    TbFileSpreadsheet,
    TbCurrencyDollar,
    TbShieldCheck,
    TbArrowRight,
    TbRocket
} from 'react-icons/tb';
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Home() {
    const navigate = useNavigate();

    useEffect(() => {
        checkSetup();
    }, []);

    const checkSetup = async () => {
        try {
            const res = await axios.get(`${AppConfig.baseApiUrl}/check-setup`);
            if (res.data.success && res.data.setupRequired) {
                navigate('/setup', { replace: true });
            }
        } catch {
            // ignore
        }
    };
    const fadeIn: any = {
        hidden: { opacity: 0, y: 30 },
        visible: (i: number = 0) => ({
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, delay: i * 0.1 }
        })
    };

    return (
        <>
            <HelmetContainer title={`Homepage ${AppConfig.exTitle}`} />
            <div className="min-h-screen bg-neutral-950 text-white font-sans relative overflow-hidden selection:bg-emerald-500 selection:text-white">
                <NeuralNetworkBackground />

                {/* Hero Section */}
                <section className="relative z-10 pt-32 sm:pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
                    <motion.div
                        custom={0}
                        variants={fadeIn}
                        initial="hidden"
                        animate="visible"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md mb-8"
                    >
                        <TbWallet className="text-emerald-400 w-5 h-5 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">Smart Personal Finance Platform</span>
                    </motion.div>

                    <motion.h1
                        custom={1}
                        variants={fadeIn}
                        initial="hidden"
                        animate="visible"
                        className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-tight max-w-4xl"
                    >
                        Master Your Money & <span className="bg-linear-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">Achieve Financial Goals</span>
                    </motion.h1>

                    <motion.p
                        custom={2}
                        variants={fadeIn}
                        initial="hidden"
                        animate="visible"
                        className="mt-6 text-base sm:text-xl text-neutral-400 max-w-2xl leading-relaxed"
                    >
                        Comprehensive personal finance manager: track multi-currency transactions, enforce category budget limits, monitor savings goals, and export custom Excel reports.
                    </motion.p>

                    <motion.div
                        custom={3}
                        variants={fadeIn}
                        initial="hidden"
                        animate="visible"
                        className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
                    >
                        <Link
                            to="/panel/dashboard"
                            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-linear-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                        >
                            Open Finance Dashboard
                            <TbArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>
                </section>

                {/* Live Stats Section */}
                <section className="relative z-10 py-12 border-y border-neutral-800/60 bg-neutral-900/60 backdrop-blur-md">
                    <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { label: "Multi-Currency Support", value: "USD, IDR, EUR, GBP" },
                            { label: "Budget Over-limit Alerts", value: "Realtime" },
                            { label: "Report Export Format", value: "Excel (.xlsx)" },
                            { label: "Financial Data Encryption", value: "256-bit" }
                        ].map((stat, i) => (
                            <div key={i} className="space-y-1">
                                <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-teal-300">
                                    {stat.value}
                                </div>
                                <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Key Features Grid */}
                <section id="features" className="relative z-10 py-24 bg-neutral-900/40 border-b border-neutral-800/50 backdrop-blur-md">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16 space-y-4">
                            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                                Complete Personal Financial Management
                            </h2>
                            <p className="text-neutral-400 text-lg max-w-xl mx-auto">
                                Powerful modular features built to help you track spending, save consistently, and manage your net worth.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: <TbCurrencyDollar className="w-8 h-8 text-emerald-400" />,
                                    title: "Multi-Currency Transactions",
                                    desc: "Track income and expenses in USD, IDR, EUR, GBP or custom currencies with category tags and instant filtering."
                                },
                                {
                                    icon: <TbChartPie className="w-8 h-8 text-amber-400" />,
                                    title: "Category Budget Limits",
                                    desc: "Set monthly spending limits per category. Visual progress bars alert you before you exceed your planned budget."
                                },
                                {
                                    icon: <TbTarget className="w-8 h-8 text-blue-400" />,
                                    title: "Savings Goals & Milestones",
                                    desc: "Define financial targets for emergency funds, vacations, or major purchases with deadline tracking and progress bars."
                                },
                                {
                                    icon: <TbFileSpreadsheet className="w-8 h-8 text-teal-400" />,
                                    title: "One-Click Excel Export",
                                    desc: "Generate professional .xlsx spreadsheet reports of your complete transaction history filtered by date, currency, or category."
                                },
                                {
                                    icon: <TbWallet className="w-8 h-8 text-purple-400" />,
                                    title: "Net Balance Analytics",
                                    desc: "Overview cards displaying net balance, total income vs expenses, and budget utilization rates in real-time."
                                },
                                {
                                    icon: <TbShieldCheck className="w-8 h-8 text-rose-400" />,
                                    title: "Secure User Data Isolation",
                                    desc: "Enterprise-grade security using JWT token rotation, bcrypt password hashing, and user-isolated database records."
                                }
                            ].map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                                    className="p-8 rounded-3xl bg-neutral-950/70 border border-neutral-800/80 backdrop-blur-xl hover:border-emerald-500/50 hover:bg-neutral-900/90 transition-all group"
                                >
                                    <div className="p-4 rounded-2xl bg-neutral-800/60 w-fit mb-6 group-hover:scale-110 transition-transform">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                    <p className="text-neutral-400 text-sm leading-relaxed">{feature.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="relative z-10 py-24 px-6 text-center bg-linear-to-b from-neutral-900/50 via-emerald-950/30 to-neutral-950 border-t border-neutral-800/50">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <TbRocket className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
                        <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
                            Take Control of Your Finances Today
                        </h2>
                        <p className="text-neutral-400 text-lg max-w-xl mx-auto">
                            Start tracking expenses, setting budgets, and achieving your savings goals now.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link
                                to="/panel/dashboard"
                                className="px-8 py-4 rounded-2xl bg-white text-black font-extrabold text-sm hover:bg-neutral-200 transition-all shadow-xl"
                            >
                                Go to Personal Finance App
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
