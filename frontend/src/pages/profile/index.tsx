import { useState, useEffect } from 'react';
import { TbPencil, TbSettings, TbCopy, TbCheck, TbUser } from 'react-icons/tb';
import { useAppSelector } from '@/store/hooks';
import { selectAuth } from '@/store/authSlice';
import { Link, useNavigate } from 'react-router-dom';

const Profile = () => {
    const { user }: any = useAppSelector(selectAuth);
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!user) navigate('/signin');
    }, [user, navigate]);

    const handleCopyEmail = (email: string) => {
        navigator.clipboard.writeText(email);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!user) return null;

    return (
        <div className="p-6 relative min-h-screen space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900/80 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800/80 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-2xl text-blue-600 dark:text-blue-400">
                        <TbUser className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Profile Overview</h1>
                        <p className="text-sm text-gray-500 dark:text-neutral-400 mt-0.5">Manage your personal information and account credentials</p>
                    </div>
                </div>
                <Link
                    to="/settings"
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-neutral-200 text-xs font-semibold rounded-xl border border-gray-200 dark:border-neutral-700/60 hover:bg-gray-100 dark:hover:bg-neutral-700/60 transition-all"
                >
                    <TbSettings className="w-4 h-4 text-emerald-500" />
                    Account Settings
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Avatar & Basic Info */}
                <div className="lg:col-span-4 bg-white dark:bg-neutral-900/80 p-8 rounded-3xl border border-gray-100 dark:border-neutral-800/80 shadow-xs flex flex-col items-center text-center space-y-4">
                    <div
                        className="relative"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        <div className="w-36 h-36 rounded-full overflow-hidden ring-4 ring-emerald-500/20 shadow-lg relative bg-neutral-100 dark:bg-neutral-800">
                            <img
                                src={user.avatar_url || "./img/default-profile.png"}
                                alt={user.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).src = "./img/default-profile.png"; }}
                            />
                            {isHovered && (
                                <button
                                    onClick={() => navigate('/settings')}
                                    className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center text-white transition-all"
                                >
                                    <TbPencil size={22} />
                                </button>
                            )}
                        </div>
                        {user.is_verified && (
                            <div className="absolute bottom-1 right-1 bg-emerald-500 text-white p-1.5 rounded-full border-2 border-white dark:border-neutral-900 shadow-md">
                                <TbCheck size={14} strokeWidth={3} />
                            </div>
                        )}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
                        <span className="inline-block mt-1 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold rounded-full text-xs uppercase tracking-wider border border-emerald-500/20">
                            {user.role?.name || 'Owner'}
                        </span>
                    </div>
                </div>

                {/* Right Column: Detailed Specs */}
                <div className="lg:col-span-8 bg-white dark:bg-neutral-900/80 p-8 rounded-3xl border border-gray-100 dark:border-neutral-800/80 shadow-xs space-y-6">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Account Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div className="space-y-1.5 p-4 rounded-2xl bg-gray-50 dark:bg-neutral-800/50 border border-gray-100 dark:border-neutral-800/60">
                            <label className="text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Email Address</label>
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-gray-800 dark:text-neutral-200 truncate pr-2">{user.email}</p>
                                <button
                                    onClick={() => handleCopyEmail(user.email)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                                >
                                    {copied ? <TbCheck size={16} className="text-emerald-500" /> : <TbCopy size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5 p-4 rounded-2xl bg-gray-50 dark:bg-neutral-800/50 border border-gray-100 dark:border-neutral-800/60">
                            <label className="text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Full Name</label>
                            <p className="text-sm font-bold text-gray-800 dark:text-neutral-200">{user.name}</p>
                        </div>

                        <div className="space-y-1.5 p-4 rounded-2xl bg-gray-50 dark:bg-neutral-800/50 border border-gray-100 dark:border-neutral-800/60">
                            <label className="text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Role & Access Tier</label>
                            <p className="text-sm font-bold text-gray-800 dark:text-neutral-200 uppercase">{user.role?.name || 'Owner'}</p>
                        </div>

                        <div className="space-y-1.5 p-4 rounded-2xl bg-gray-50 dark:bg-neutral-800/50 border border-gray-100 dark:border-neutral-800/60">
                            <label className="text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Account Status</label>
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${!user.is_blocked ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'}`}>
                                    <span className={`w-2 h-2 rounded-full ${!user.is_blocked ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                                    {!user.is_blocked ? 'Active & Verified' : 'Suspended'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
