import { useEffect, useState } from 'react';
import LoadingPage from '@/components/LoadingPage';
import { TbActivity, TbCalendarTime, TbDeviceLaptop, TbWorld } from 'react-icons/tb';
import AppConfig from '@/config/AppConfig';
import NotFound from '@/components/NotFound';
import axiosJWT from '@/utils/axiosJWT';
import { useParams } from 'react-router-dom';

interface Activity {
    id: number;
    activity_type: string;
    status: 'warning' | 'info' | 'danger';
    description: string;
    ip_address: string;
    user_agent: string;
    created_at: string;
}

const MyActivity = () => {
    const { id } = useParams()
    const [activities, setActivities] = useState<Activity[]>([]);
    const [user, setUser] = useState<any>(null)
    const [isLoading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        pages: 1
    });
    const [dateRange, setDateRange] = useState({
        start_date: '',
        end_date: ''
    });

    useEffect(() => {
        document.title = `User Activities ${AppConfig.exTitle}`
        getUser()
        fetchActivities();
    }, [pagination.page, dateRange]);


    const getUser = async () => {
        try {
            const res = await axiosJWT.get(`${AppConfig.baseApiUrl}/users/${id}`);

            setUser(res.data.user);
        } catch (error) {
            console.log(error);
        }
    }

    const fetchActivities = async () => {
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: '10',
                ...(dateRange.start_date && { start_date: dateRange.start_date }),
                ...(dateRange.end_date && { end_date: dateRange.end_date })
            });

            const response = await axiosJWT.get(
                `${AppConfig.baseApiUrl}/users/${id}/activities?${params}`
            );

            setActivities(response.data.data);
            setPagination({
                total: response.data.pagination.total,
                page: response.data.pagination.page,
                pages: response.data.pagination.pages
            });
        } catch (error) {
            console.error('Failed to fetch activities:', error);
        } finally {
            setLoading(false);
        }
    };

    if (isLoading) return <LoadingPage />;

    if (!user) return <NotFound />

    return (
        <div className="p-4 sm:p-6 relative min-h-screen">
            {/* Decorative bubbles */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -left-32 w-64 h-64 bg-linear-to-r from-blue-400/30 to-purple-400/30 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/3 -right-32 w-96 h-96 bg-linear-to-r from-pink-400/20 to-blue-400/20 dark:from-pink-900/15 dark:to-blue-900/15 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-32 left-1/3 w-72 h-72 bg-linear-to-r from-purple-400/20 to-blue-400/20 dark:from-purple-900/15 dark:to-blue-900/15 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-6xl mx-auto relative">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    User Activities
                </h1>

                {user && (
                    <div className="backdrop-blur-xl bg-white/70 dark:bg-neutral-800/70 p-4 sm:p-6 rounded-2xl shadow-lg border border-white/50 dark:border-neutral-700/50 mb-6">
                        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">

                            <img
                                src={(user.avatar_url?.startsWith('https://')
                                    ? user.avatar_url
                                    : user.avatar_url
                                        ? `${(AppConfig.baseApiUrl)?.replace('/api', '')}/${user.avatar_url}`
                                        : "/img/default-profile.png"
                                )
                                }
                                alt={`${user.username}'s Profile Picture`}
                                className='border border-white/20 dark:border-neutral-600 rounded-full w-16 sm:w-20 aspect-square'
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/img/default-profile.png";
                                }}
                            />
                            <div className="text-center sm:text-left">
                                <h2 className="text-lg sm:text-xl font-semibold text-neutral-800 dark:text-neutral-200">{user.name}</h2>
                                <p className="text-gray-600 dark:text-neutral-400 text-sm sm:text-base">{user.email}</p>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-500">Role: {user.role.name}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="backdrop-blur-xl bg-white/70 dark:bg-neutral-800/70 p-4 sm:p-6 rounded-2xl shadow-lg border border-white/50 dark:border-neutral-700/50 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm text-gray-600 dark:text-neutral-400 mb-2">Start Date</label>
                            <input
                                type="date"
                                value={dateRange.start_date}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                                className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all duration-300 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 dark:text-neutral-400 mb-2">End Date</label>
                            <input
                                type="date"
                                value={dateRange.end_date}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                                className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all duration-300 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {activities.length > 0 ? (
                            activities.map((activity) => (
                                <div key={activity.id} className="backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 p-3 sm:p-4 rounded-lg border border-white/50 dark:border-neutral-700/50 hover:shadow-md transition-all duration-300">
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        <div className={`rounded-full p-2 sm:p-3 shrink-0 ${activity.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                                            activity.status === 'danger' ? 'bg-red-100 dark:bg-red-900/30' :
                                                'bg-blue-100 dark:bg-blue-900/30'
                                            }`}>
                                            <TbActivity className={`h-5 w-5 sm:h-6 sm:w-6 ${activity.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                                                activity.status === 'danger' ? 'text-red-600 dark:text-red-400' :
                                                    'text-blue-600 dark:text-blue-400'
                                                }`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium capitalize text-neutral-800 dark:text-neutral-200 text-sm sm:text-base">{(activity.activity_type).split('_').map((w) => ` ${w}`)}</h3>
                                            <p className="text-gray-600 dark:text-neutral-400 mt-1 text-xs sm:text-sm">{activity.description}</p>
                                            <div className="mt-2 space-y-1 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-3 gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 dark:text-neutral-500">
                                                <div className="flex items-center gap-2">
                                                    <TbCalendarTime className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                                    <span className="truncate">{new Date(activity.created_at).toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <TbWorld className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                                    <span className="truncate">{activity.ip_address}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <TbDeviceLaptop className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                                    <span title={activity.user_agent} className="truncate">
                                                        {activity.user_agent}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500 dark:text-neutral-500">
                                No activities found
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors duration-300 text-sm sm:text-base"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 text-gray-600 dark:text-neutral-400 text-sm sm:text-base">
                                Page {pagination.page} of {pagination.pages}
                            </span>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page === pagination.pages}
                                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors duration-300 text-sm sm:text-base"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyActivity;