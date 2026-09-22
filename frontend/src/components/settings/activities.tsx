
import { selectAuth } from '@/store/authSlice';
import { useAppSelector } from '@/store/hooks';
import apiClient from '@/services/apiClient';
import { useCallback, useEffect, useState } from 'react'
import { TbActivity, TbCalendarTime, TbWorld, TbDeviceLaptop, TbFilter, TbSearch, TbCalendar, TbShield, TbUserCheck, TbLogin, TbLogout, TbArrowLeft } from 'react-icons/tb';
import { useNavigate } from 'react-router-dom';

interface Activity {
    id: number;
    activity_type: string;
    status: 'warning' | 'info' | 'danger';
    description: string;
    ip_address: string;
    user_agent: string;
    created_at: string;
}

const ActivitiesMenu = () => {
    const { user } = useAppSelector(selectAuth);
    const navigate = useNavigate();
    const [activities, setActivities] = useState<Activity[]>([]);
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
    const [showAll, setShowAll] = useState(false);

    const fetchActivities = useCallback(async () => {
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: '10',
                ...(dateRange.start_date && { start_date: dateRange.start_date }),
                ...(dateRange.end_date && { end_date: dateRange.end_date }),
                showAll: showAll.toString()
            });

            const response = await apiClient.get(`/activities?${params}`
            );

            setActivities(response.data.data.activities);
            setPagination({
                total: response.data.data.pagination.total,
                page: response.data.data.pagination.page,
                pages: response.data.data.pagination.pages
            });
        } catch (error) {
            console.error('Failed to fetch activities:', error);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, dateRange, showAll]);

    useEffect(() => {
        if (!user) {
            navigate('/signin');
            return;
        }

        fetchActivities();
    }, [user, navigate, fetchActivities]);

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                {/* Filters Skeleton */}
                <div className="bg-gray-50/60 dark:bg-neutral-800/40 rounded-2xl p-5 border border-gray-100 dark:border-neutral-800/80 space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gray-200 dark:bg-neutral-700" />
                        <div className="h-3 w-32 rounded bg-gray-200 dark:bg-neutral-700" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="space-y-1">
                                <div className="h-3 w-20 rounded bg-gray-200 dark:bg-neutral-700" />
                                <div className="h-10 w-full rounded-xl bg-gray-200 dark:bg-neutral-700" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Activities List Skeleton */}
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="bg-gray-50/60 dark:bg-neutral-800/40 rounded-2xl border border-gray-100 dark:border-neutral-800/80 p-4">
                            <div className="flex items-start gap-3">
                                <div className="rounded-xl p-2.5 bg-gray-200 dark:bg-neutral-700">
                                    <div className="w-5 h-5 rounded bg-gray-300 dark:bg-neutral-600" />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-3.5 w-40 rounded bg-gray-200 dark:bg-neutral-700" />
                                    <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-neutral-700" />
                                    <div className="flex flex-wrap gap-4 pt-2">
                                        {[0, 1, 2].map((j) => (
                                            <div key={j} className="h-3 w-24 rounded bg-gray-200 dark:bg-neutral-700" />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters Section */}
            <div className="bg-gray-50/60 dark:bg-neutral-800/40 rounded-2xl p-5 border border-gray-100 dark:border-neutral-800/80 space-y-4">
                <div className="flex items-center gap-2">
                    <TbFilter className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Activity Filters</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1 flex items-center gap-1">
                            <TbCalendar className="w-3.5 h-3.5" /> Start Date
                        </label>
                        <input
                            type="date"
                            value={dateRange.start_date}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                            className="w-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-2.5 text-xs text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1 flex items-center gap-1">
                            <TbCalendar className="w-3.5 h-3.5" /> End Date
                        </label>
                        <input
                            type="date"
                            value={dateRange.end_date}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                            className="w-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-2.5 text-xs text-gray-900 dark:text-white"
                        />
                    </div>
                    <div className="flex items-end">
                        <div className="flex items-center gap-2 p-2.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl w-full">
                            <input
                                type="checkbox"
                                id="showAll"
                                checked={showAll}
                                onChange={() => setShowAll(!showAll)}
                                className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                            />
                            <label htmlFor="showAll" className="text-xs font-semibold text-gray-700 dark:text-neutral-300 cursor-pointer">
                                Show All Activities
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activities List */}
            <div className="space-y-3">
                {activities.length > 0 ? (
                    activities.map((activity) => {
                        const getActivityIcon = () => {
                            const type = activity.activity_type.toLowerCase();
                            if (type.includes('login')) return <TbLogin className="w-5 h-5" />;
                            if (type.includes('logout')) return <TbLogout className="w-5 h-5" />;
                            if (type.includes('password')) return <TbShield className="w-5 h-5" />;
                            if (type.includes('profile')) return <TbUserCheck className="w-5 h-5" />;
                            return <TbActivity className="w-5 h-5" />;
                        };

                        return (
                            <div key={activity.id} className="bg-gray-50/60 dark:bg-neutral-800/40 rounded-2xl border border-gray-100 dark:border-neutral-800/80 p-4 space-y-2">
                                <div className="flex items-start gap-3">
                                    <div className={`rounded-xl p-2.5 shrink-0 ${activity.status === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' :
                                        activity.status === 'danger' ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' :
                                            'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                        }`}>
                                        {getActivityIcon()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white capitalize">
                                            {(activity.activity_type).split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5 truncate">{activity.description}</p>
                                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-400 dark:text-neutral-500 pt-2">
                                            <div className="flex items-center gap-1">
                                                <TbCalendarTime className="h-3.5 w-3.5 text-emerald-500" />
                                                <span>{new Date(activity.created_at).toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <TbWorld className="h-3.5 w-3.5 text-blue-500" />
                                                <span className="font-mono">{activity.ip_address}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <TbDeviceLaptop className="h-3.5 w-3.5 text-purple-500" />
                                                <span className="truncate max-w-[200px]" title={activity.user_agent}>
                                                    {activity.user_agent}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-10 bg-gray-50/60 dark:bg-neutral-800/40 rounded-2xl border border-gray-100 dark:border-neutral-800/80">
                        <TbSearch className="w-10 h-10 text-gray-400 dark:text-neutral-500 mx-auto mb-2" />
                        <p className="text-xs font-bold text-gray-700 dark:text-neutral-300">No activities recorded</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="mt-8 flex justify-center items-center gap-4">
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-600 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-105"
                    >
                        <TbArrowLeft className="w-4 h-4" />
                        Previous
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-medium">
                            Page {pagination.page} of {pagination.pages}
                        </span>
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            ({pagination.total} total activities)
                        </span>
                    </div>
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.pages}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-600 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-105"
                    >
                        Next
                        <TbArrowLeft className="w-4 h-4 rotate-180" />
                    </button>
                </div>
            )}
        </div>
    );
}

export default ActivitiesMenu