
import { selectAuth } from '@/store/authSlice'
import { useAppSelector } from '@/store/hooks'
import { TbLock, TbKey, TbUser, TbWorld, TbSettings, TbDatabase } from 'react-icons/tb'

const PermissionsMenu = () => {
    const { user } = useAppSelector(selectAuth);
    return (
        <div className="space-y-6">
            {/* Role Info Card */}
            <div className="p-5 bg-gray-50/60 dark:bg-neutral-800/40 rounded-2xl border border-gray-100 dark:border-neutral-800/80">
                <div className="flex items-center gap-3 mb-1">
                    <TbUser className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Assigned Role</span>
                </div>
                <p className="ml-7 text-lg font-bold text-gray-900 dark:text-white capitalize">{user?.role?.name || 'Owner'}</p>
            </div>

            {/* Permissions Grid */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <TbKey className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">Active Permissions</span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-mono font-bold border border-emerald-500/20">
                        {user?.role?.permissions?.length || 0}
                    </span>
                </div>

                {user?.role?.permissions && user.role.permissions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {user.role.permissions.map((permission, index: number) => {
                            const getPermissionIcon = (name: string) => {
                                const lowerName = name.toLowerCase();
                                if (lowerName.includes('user')) return <TbUser className="w-4 h-4" />;
                                if (lowerName.includes('admin')) return <TbSettings className="w-4 h-4" />;
                                if (lowerName.includes('data')) return <TbDatabase className="w-4 h-4" />;
                                if (lowerName.includes('system')) return <TbWorld className="w-4 h-4" />;
                                return <TbLock className="w-4 h-4" />;
                            };

                            return (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 p-3.5 bg-gray-50/60 dark:bg-neutral-800/40 rounded-2xl border border-gray-100 dark:border-neutral-800/80 hover:border-emerald-500/40 transition-all text-xs sm:text-sm font-semibold text-gray-800 dark:text-neutral-200"
                                >
                                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                                        {getPermissionIcon(permission.name)}
                                    </div>
                                    <span className="capitalize">
                                        {permission.name.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-gray-50/60 dark:bg-neutral-800/40 rounded-2xl border border-gray-100 dark:border-neutral-800/80">
                        <TbLock className="w-10 h-10 text-gray-400 dark:text-neutral-500 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-gray-600 dark:text-neutral-400">No permissions assigned</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PermissionsMenu