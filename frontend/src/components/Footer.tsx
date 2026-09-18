import {
    TbBrandInstagram,
    TbBrandTiktok,
    TbBrandWhatsapp,
    TbMail,
    TbPhone,
    TbHeart,
    TbArrowUp,
    TbShield,
    TbArrowRight,
    TbBrandYoutube,
    TbWorld,
    TbWallet
} from "react-icons/tb";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";

const Footer = () => {
    const [currentYear] = useState(() => new Date().getFullYear());

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const quickLinks = [
        { name: 'Home', href: "/" },
        { name: 'Finance App', href: "/finance" },
    ];

    const legalLinks = [
        { name: 'Privacy Policy', href: "/privacy" },
        { name: 'Terms of Service', href: "/terms" },
    ];

    const socialLinks = [
        {
            name: "WhatsApp",
            href: "https://wa.me/6281617262908",
            icon: TbBrandWhatsapp,
            color: "hover:text-green-600",
            label: 'WhatsApp',
        },
        {
            name: "Instagram",
            href: "https://instagram.com/iarichty.academy",
            icon: TbBrandInstagram,
            color: "hover:text-pink-600",
            label: 'Instagram',
        },
        {
            name: "TikTok",
            href: "https://tiktok.com/@iarichty",
            icon: TbBrandTiktok,
            color: "hover:text-gray-900",
            label: 'TikTok',
        },
        {
            name: "Youtube",
            href: "https://www.youtube.com/@iarichty",
            icon: TbBrandYoutube,
            color: "hover:text-gray-900",
            label: 'Youtube',
        },
        {
            name: "Email",
            href: "mailto:support@iarty.id",
            icon: TbMail,
            color: "hover:text-blue-600",
            label: 'Email',
        },
    ];

    return (
        <footer className="w-full mt-auto bg-linear-to-b from-white to-gray-50 dark:from-neutral-950 dark:to-neutral-900 border-t border-gray-200 dark:border-neutral-800 z-0">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand */}
                    <motion.div
                        className="space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-lg border border-emerald-500/30">
                                <TbWallet className="w-6 h-6" />
                            </div>
                            <span className="text-xl font-bold">Personal Finance App</span>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-neutral-400">
                            Comprehensive personal finance management solution. Track income and expenses, monitor category budgets, manage savings goals, and export multi-currency reports seamlessly.
                        </p>

                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <TbHeart className="text-red-500" />
                            <span>Powered by IARTY</span>
                        </div>
                    </motion.div>

                    {/* Quick Links */}
                    <motion.div
                        className="space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <TbArrowRight className="text-emerald-600" />
                            Quick Links
                        </h3>
                        <ul className="space-y-2">
                            {quickLinks.map((link, i) => (
                                <li key={i}>
                                    <Link
                                        to={link.href}
                                        className="text-sm text-gray-600 dark:text-neutral-400 dark:hover:text-emerald-500 hover:text-emerald-600 flex items-center gap-2"
                                    >
                                        <span className="w-1 h-1 bg-gray-400 rounded-full" />
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Legal */}
                    <motion.div
                        className="space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <TbShield className="text-blue-600" />
                            Legal
                        </h3>
                        <ul className="space-y-2">
                            {legalLinks.map((link, i) => (
                                <li key={i}>
                                    <Link
                                        to={link.href}
                                        className="text-sm text-gray-600 dark:text-neutral-400 dark:hover:text-blue-600 hover:text-blue-600 flex items-center gap-2"
                                    >
                                        <span className="w-1 h-1 bg-gray-400 rounded-full" />
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Contact */}
                    <motion.div
                        className="space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <TbPhone className="text-green-600" />
                            Contact
                        </h3>

                        <div className="space-y-3 text-sm text-gray-600 dark:text-neutral-400">
                            <div className="flex items-center gap-3">
                                <TbWorld className="text-emerald-600" />
                                <a href="https://iarty.id" target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    https://iarty.id
                                </a>
                            </div>
                            <div className="flex items-center gap-3">
                                <TbMail className="text-blue-600" />
                                <a href="mailto:support@iarty.id" className="hover:underline">
                                    support@iarty.id
                                </a>
                            </div>
                            <div className="flex items-center gap-3">
                                <TbBrandWhatsapp className="text-green-600" />
                                <span>+62 816-1726-2908</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Social */}
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-neutral-800 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div>
                        <h4 className="text-sm font-semibold mb-3">
                            Social
                        </h4>
                        <div className="flex gap-3">
                            {socialLinks.map((social, i) => {
                                const Icon = social.icon;
                                return (
                                    <Link
                                        key={i}
                                        to={social.href}
                                        target="_blank"
                                        className={`p-3 rounded-xl bg-gray-100 dark:bg-neutral-800 ${social.color}`}
                                        title={social.label}
                                    >
                                        <Icon size={20} />
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        onClick={scrollToTop}
                        className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:opacity-90 transition-opacity"
                    >
                        <TbArrowUp />
                        Back to Top
                    </button>
                </div>
            </div>

            {/* Bottom */}
            <div className="bg-gray-100 dark:bg-neutral-800 border-t border-gray-200 dark:border-neutral-700">
                <div className="container mx-auto px-4 py-4 text-xs sm:text-sm text-gray-600 dark:text-neutral-400 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                    <span>© {currentYear} Personal Finance Management App. All rights reserved.</span>
                    <div className="flex items-center gap-4">
                        <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full font-mono text-xs font-semibold">
                            v1.X.X
                        </span>
                        <span className="flex items-center gap-1.5">
                            <TbHeart className="text-red-500" />
                            Designed by IARTY
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
