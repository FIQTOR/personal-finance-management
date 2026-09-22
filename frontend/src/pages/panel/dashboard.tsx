import { useCallback, useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import AnimatedNumber from '@/components/AnimatedNumber';
import { TbRefresh, TbDownload, TbChartBar, TbWallet, TbArrowUpRight, TbArrowDownRight, TbChartPie, TbTarget, TbActivity, TbUsers } from 'react-icons/tb';
import { useAppSelector } from '@/store/hooks';
import { selectAuth } from '@/store/authSlice';
import apiClient from '@/services/apiClient';
import AppConfig from '@/config/AppConfig';
import { useLanguage } from '@/context/useLanguage';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

interface MonthlyTrend {
    month: string;
    income: number;
    expense: number;
}

interface RecentActivity {
    id: number;
    activity_type: string;
    description?: string;
    created_at?: string;
    user?: { name?: string };
}

interface DashboardSummary {
    totalIncome?: number;
    totalExpense?: number;
    netBalance?: number;
    budgetUsagePercent?: number;
    currentSavedAmount?: number;
    totalTargetSavings?: number;
    totalUsers?: number;
}

interface DashboardAnalytics {
    summary?: DashboardSummary;
    monthlyTrends?: MonthlyTrend[];
    expensesByCategory?: Record<string, number>;
    recentActivities?: RecentActivity[];
}

export default function Dashboard() {
    const { user } = useAppSelector(selectAuth);
    const { t } = useLanguage();
    const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/analytics/dashboard`);
            setAnalytics(response.data?.data || null);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        document.title = `Dashboard ${AppConfig.exTitle}`;
        fetchAnalytics();
    }, [fetchAnalytics]);

    const refreshData = async () => {
        setIsRefreshing(true);
        await fetchAnalytics();
        setIsRefreshing(false);
    };

    const exportData = () => {
        const data = JSON.stringify(analytics, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading || !analytics) {
        return (
            <div className="p-6 min-h-screen space-y-6 animate-pulse">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900/80 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800/80 shadow-xs">
                    <div className="space-y-2">
                        <div className="h-7 w-48 rounded-lg bg-gray-200 dark:bg-neutral-800" />
                        <div className="h-4 w-72 max-w-full rounded bg-gray-200 dark:bg-neutral-800" />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-28 rounded-xl bg-gray-200 dark:bg-neutral-800" />
                        <div className="h-10 w-28 rounded-xl bg-gray-200 dark:bg-neutral-800" />
                    </div>
                </div>

                {/* Welcome Banner */}
                <div className="p-6 rounded-3xl bg-emerald-500/5 border border-gray-100 dark:border-neutral-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="h-6 w-56 rounded bg-gray-200 dark:bg-neutral-800" />
                        <div className="h-4 w-64 max-w-full rounded bg-gray-200 dark:bg-neutral-800" />
                    </div>
                    <div className="h-8 w-28 rounded-full bg-gray-200 dark:bg-neutral-800" />
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900/80 p-5 rounded-2xl border border-gray-100 dark:border-neutral-800/80 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="h-3 w-20 rounded bg-gray-200 dark:bg-neutral-800" />
                                <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-neutral-800" />
                            </div>
                            <div className="h-6 w-24 rounded bg-gray-200 dark:bg-neutral-800" />
                        </div>
                    ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white dark:bg-neutral-900/80 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800/80 space-y-4">
                        <div className="h-5 w-40 rounded bg-gray-200 dark:bg-neutral-800" />
                        <div className="h-64 w-full rounded-2xl bg-gray-200 dark:bg-neutral-800" />
                    </div>
                    <div className="bg-white dark:bg-neutral-900/80 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800/80 space-y-4">
                        <div className="h-5 w-32 rounded bg-gray-200 dark:bg-neutral-800" />
                        <div className="h-64 w-full rounded-2xl bg-gray-200 dark:bg-neutral-800" />
                    </div>
                </div>
            </div>
        );
    }

    const summary = analytics.summary || {};
    const monthlyTrends = analytics.monthlyTrends || [];
    const expensesByCategory = analytics.expensesByCategory || {};
    const recentActivities = analytics.recentActivities || [];

    const trendChartData = {
        labels: monthlyTrends.map((trend) => trend.month),
        datasets: [
            {
                label: t('income'),
                data: monthlyTrends.map((trend) => trend.income),
                borderColor: 'rgba(16, 185, 129, 0.8)',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                tension: 0.4,
                fill: true
            },
            {
                label: t('expense'),
                data: monthlyTrends.map((trend) => trend.expense),
                borderColor: 'rgba(239, 68, 68, 0.8)',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                tension: 0.4,
                fill: true
            }
        ]
    };

    const categoryDoughnutData = {
        labels: Object.keys(expensesByCategory).length > 0 ? Object.keys(expensesByCategory) : ['No Expenses'],
        datasets: [
            {
                data: Object.keys(expensesByCategory).length > 0 ? Object.values(expensesByCategory) : [1],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(236, 72, 153, 0.8)',
                    'rgba(59, 130, 246, 0.8)'
                ]
            }
        ]
    };

    return (
        <div className="p-6 relative min-h-screen space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900/80 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800/80 shadow-xs">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                        <TbChartBar className="text-emerald-500" />
                        {t('dashboard')}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
                        System Overview, User Activities & Personal Finance Insights
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={refreshData}
                        disabled={isRefreshing}
                        className="px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/60 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-700/60 transition-all flex items-center gap-2 text-gray-700 dark:text-neutral-200 text-xs font-semibold"
                    >
                        <TbRefresh className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <button
                        onClick={exportData}
                        className="px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/60 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-700/60 transition-all flex items-center gap-2 text-gray-700 dark:text-neutral-200 text-xs font-semibold"
                    >
                        <TbDownload className="w-4 h-4" />
                        JSON Report
                    </button>
                </div>
            </div>

            {/* Welcome Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-blue-500/10 backdrop-blur-md border border-gray-100 dark:border-neutral-800/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {t('welcomeBack')}, {user?.name}! 👋
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-neutral-400">
                        System Operational • {summary.totalUsers || 1} Registered System User{(summary.totalUsers || 1) > 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold rounded-full text-xs uppercase tracking-wider border border-emerald-500/20">
                        {user?.role?.name || 'System Owner'}
                    </span>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-neutral-900/80 p-5 rounded-2xl border border-gray-100 dark:border-neutral-800/80 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 dark:text-neutral-400">{t('netBalance')}</span>
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center">
                            <TbWallet className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        $<AnimatedNumber value={summary.netBalance || 0} />
                    </h3>
                </div>

                <div className="bg-white dark:bg-neutral-900/80 p-5 rounded-2xl border border-gray-100 dark:border-neutral-800/80 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 dark:text-neutral-400">{t('totalIncome')}</span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center">
                            <TbArrowUpRight className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        $<AnimatedNumber value={summary.totalIncome || 0} />
                    </h3>
                </div>

                <div className="bg-white dark:bg-neutral-900/80 p-5 rounded-2xl border border-gray-100 dark:border-neutral-800/80 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 dark:text-neutral-400">{t('totalExpenses')}</span>
                        <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 flex items-center justify-center">
                            <TbArrowDownRight className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                        $<AnimatedNumber value={summary.totalExpense || 0} />
                    </h3>
                </div>

                <div className="bg-white dark:bg-neutral-900/80 p-5 rounded-2xl border border-gray-100 dark:border-neutral-800/80 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 dark:text-neutral-400">{t('budgetUsage')}</span>
                        <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 flex items-center justify-center">
                            <TbChartPie className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        <AnimatedNumber value={summary.budgetUsagePercent || 0} />%
                    </h3>
                </div>

                <div className="bg-white dark:bg-neutral-900/80 p-5 rounded-2xl border border-gray-100 dark:border-neutral-800/80 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 dark:text-neutral-400">System Users</span>
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 flex items-center justify-center">
                            <TbUsers className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        <AnimatedNumber value={summary.totalUsers || 1} />
                    </h3>
                </div>
            </div>

            {/* Charts & System User Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-neutral-900/80 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800/80 shadow-xs space-y-4">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Income vs Expense Trends</h3>
                    <div className="h-72">
                        <Line data={trendChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-900/80 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800/80 shadow-xs flex flex-col items-center">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <TbChartPie className="text-amber-500" /> Expense Breakdown
                    </h3>
                    <div className="h-60 w-60">
                        <Doughnut data={categoryDoughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>

            {/* System Users Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent User Activity */}
                <div className="bg-white dark:bg-neutral-900/80 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <TbActivity className="text-blue-500" /> Recent User Activity Logs
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {recentActivities.length === 0 ? (
                            <p className="text-xs text-gray-400 dark:text-neutral-500 py-4 text-center">No recent activities recorded.</p>
                        ) : (
                            recentActivities.map((act) => (
                                <div key={act.id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-neutral-800/50 border border-gray-100 dark:border-neutral-800/60 text-xs">
                                    <div className="space-y-0.5 min-w-0 pr-2">
                                        <div className="font-semibold text-gray-900 dark:text-white truncate">
                                            {act.user?.name || 'System User'} <span className="text-gray-400 font-normal">({act.activity_type})</span>
                                        </div>
                                        <p className="text-gray-500 dark:text-neutral-400 truncate">{act.description || 'Action performed'}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-400 shrink-0 font-mono">
                                        {act.created_at ? new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Savings Goals Overview */}
                <div className="bg-white dark:bg-neutral-900/80 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800/80 shadow-xs space-y-4">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <TbTarget className="text-emerald-500" /> {t('goals')} Overview
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-neutral-400">
                        Active Savings Progress: ${summary.currentSavedAmount?.toLocaleString()} / ${summary.totalTargetSavings?.toLocaleString()}
                    </p>
                    <div className="w-full bg-gray-100 dark:bg-neutral-800 h-3 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                            style={{
                                width: (summary.totalTargetSavings ?? 0) > 0
                                    ? `${Math.min(Math.round(((summary.currentSavedAmount ?? 0) / (summary.totalTargetSavings ?? 1)) * 100), 100)}%`
                                    : '0%'
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
