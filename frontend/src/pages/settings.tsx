import { TbUser, TbShieldCheck, TbLogout, TbActivity, TbSettings } from 'react-icons/tb';
import { useEffect, useState } from 'react';
import AccountMenu from '@/components/settings/account';
import PermissionsMenu from '@/components/settings/permissions';
import ActivitiesMenu from '@/components/settings/activities';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectAuth, signOut } from '@/store/authSlice';
import { useNavigate } from 'react-router-dom';
import AppConfig from '@/config/AppConfig';

const MENU_ITEMS = [
    { icon: TbUser, label: 'Account', id: 'account', description: 'Manage your personal information and profile picture' },
    { icon: TbShieldCheck, label: 'Permissions', id: 'permissions', description: 'View assigned access control roles and security permissions' },
    { icon: TbActivity, label: 'Activities', id: 'activities', description: 'Audit your login history and system action logs' },
];

const MENU_COMPONENTS = {
    account: <AccountMenu />,
    permissions: <PermissionsMenu />,
    activities: <ActivitiesMenu />,
};

export default function Settings() {
    const dispatch = useAppDispatch();
    const { accessToken } = useAppSelector(selectAuth);
    const navigate = useNavigate();
    const [activeMenu, setActiveMenu] = useState('account');

    const currentMenuItem = MENU_ITEMS.find((item) => item.id === activeMenu);
    const CurrentIcon = currentMenuItem?.icon || TbSettings;

    useEffect(() => {
        document.title = `Settings ${AppConfig.exTitle}`;
    }, []);

    const handleLogout = () => {
        dispatch(signOut(accessToken)).then(() => {
            navigate("/signin");
        });
    };

    return (
        <div className="p-6 relative min-h-screen space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900/80 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800/80 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-2xl text-blue-600 dark:text-blue-400">
                        <TbSettings className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Settings</h1>
                        <p className="text-sm text-gray-500 dark:text-neutral-400 mt-0.5">Manage user preferences, active permissions, and activity logs</p>
                    </div>
                </div>
            </div>

            {/* Layout Grid */}
            <div className="bg-white dark:bg-neutral-900/80 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800/80 shadow-xs min-h-[70vh]">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar Menu */}
                    <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-100 dark:border-neutral-800/80 pb-6 md:pb-0 md:pr-6">
                        <nav className="space-y-1.5">
                            {MENU_ITEMS.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeMenu === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveMenu(item.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all text-left ${
                                            isActive
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs'
                                                : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800/60 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <Icon className="w-5 h-5 shrink-0" />
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-neutral-800/80">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all text-left"
                            >
                                <TbLogout className="w-5 h-5 shrink-0" />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </aside>

                    {/* Content Area */}
                    <main className="flex-1 md:pl-2">
                        {currentMenuItem && (
                            <div className="mb-6 pb-4 border-b border-gray-100 dark:border-neutral-800/80">
                                <div className="flex items-center gap-2.5 mb-1">
                                    <CurrentIcon className="w-5 h-5 text-emerald-500" />
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {currentMenuItem.label}
                                    </h2>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-neutral-400">
                                    {currentMenuItem.description}
                                </p>
                            </div>
                        )}
                        {MENU_COMPONENTS[activeMenu as keyof typeof MENU_COMPONENTS]}
                    </main>
                </div>
            </div>
        </div>
    );
}
