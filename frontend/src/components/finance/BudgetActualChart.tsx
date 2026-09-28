/**
 * BudgetActualChart — grouped bar chart comparing Budgeted vs Spent per category.
 *
 * Chart.js elements/scales are registered locally in this file to stay
 * self-contained (registration is idempotent, so it is safe alongside the
 * global registration in the dashboard page).
 */
import { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useAppSelector } from '@/store/hooks';
import { useLanguage } from '@/context/useLanguage';
import EmptyState from '@/components/EmptyState';
import { SkeletonBlock } from '@/components/Skeleton';
import { getCurrencySymbol } from '@/utils/currency';
import { TbChartBar } from 'react-icons/tb';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/** Maximum number of categories rendered to keep the chart readable. */
const MAX_CATEGORIES = 8;

export interface BudgetActualChartProps {
    /** Optional extra classes on the outer card. */
    className?: string;
}

interface BudgetSlice {
    label: string;
    budgeted: number;
    spent: number;
}

export const BudgetActualChart: React.FC<BudgetActualChartProps> = ({ className = '' }) => {
    const { t } = useLanguage();
    const { budgets, transactions, defaultCurrency, loading } = useAppSelector((state) => state.finance);
    const currencySymbol = getCurrencySymbol(defaultCurrency);

    const isLoading = loading && budgets.length === 0 && transactions.length === 0;

    const { slices, totalBudgeted, totalSpent, utilisationPercent } = useMemo(() => {
        const rows: BudgetSlice[] = budgets.map((b) => {
            const spent = b.category_id
                ? transactions
                    .filter((tx) => tx.category_id === b.category_id && tx.type === 'expense')
                    .reduce((sum, tx) => sum + Number(tx.amount), 0)
                : 0;
            return {
                label: b.category?.name || 'General',
                budgeted: Number(b.limit_amount) || 0,
                spent,
            };
        });

        // Top categories by spend (fall back to budget size when nothing spent).
        rows.sort((a, b) => (b.spent - a.spent) || (b.budgeted - a.budgeted));
        const top = rows.slice(0, MAX_CATEGORIES);

        const budgeted = rows.reduce((sum, r) => sum + r.budgeted, 0);
        const spent = rows.reduce((sum, r) => sum + r.spent, 0);
        const utilisation = budgeted > 0 ? Math.round((spent / budgeted) * 100) : 0;

        return { slices: top, totalBudgeted: budgeted, totalSpent: spent, utilisationPercent: utilisation };
    }, [budgets, transactions]);

    const hasData = budgets.some((b) => Number(b.limit_amount) > 0);

    const chartData = useMemo(() => ({
        labels: slices.map((s) => s.label),
        datasets: [
            {
                label: t('budgeted'),
                data: slices.map((s) => s.budgeted),
                backgroundColor: 'rgba(139, 92, 246, 0.75)', // violet-500
                borderColor: 'rgba(139, 92, 246, 1)',
                borderWidth: 1,
                borderRadius: 6,
            },
            {
                label: t('spent'),
                data: slices.map((s) => s.spent),
                backgroundColor: 'rgba(244, 63, 94, 0.75)', // rose-500
                borderColor: 'rgba(244, 63, 94, 1)',
                borderWidth: 1,
                borderRadius: 6,
            },
        ],
    }), [slices, t]);

    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' as const, labels: { boxWidth: 12, usePointStyle: true } },
            tooltip: {
                callbacks: {
                    label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) =>
                        `${ctx.dataset.label}: ${currencySymbol}${(ctx.parsed.y ?? 0).toLocaleString()}`,
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value: string | number) => `${currencySymbol}${Number(value).toLocaleString()}`,
                },
            },
        },
    }), [currencySymbol]);

    return (
        <div className={`bg-white dark:bg-neutral-800/60 p-6 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-xs space-y-4 ${className}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <TbChartBar className="w-5 h-5 text-violet-500" /> {t('budgetVsActual')}
                </h3>
                {hasData && (
                    <div className="flex items-center gap-3 text-xs">
                        <div className="text-right">
                            <p className="text-gray-400 dark:text-neutral-500">{t('budgetUtilisation')}</p>
                            <p className={`font-bold text-lg ${utilisationPercent > 100 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {utilisationPercent}%
                            </p>
                        </div>
                        <div className="hidden sm:block text-right border-l border-gray-100 dark:border-neutral-800 pl-3">
                            <p className="text-gray-400 dark:text-neutral-500">
                                {currencySymbol}{totalSpent.toLocaleString()} / {currencySymbol}{totalBudgeted.toLocaleString()}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {isLoading ? (
                <SkeletonBlock className="h-64 w-full" />
            ) : !hasData ? (
                <EmptyState
                    compact
                    icon={<TbChartBar className="w-8 h-8" />}
                    title={t('budgetVsActual')}
                    description="Create a category budget to compare budgeted vs actual spending."
                />
            ) : (
                <div className="h-64">
                    <Bar data={chartData} options={options} />
                </div>
            )}
        </div>
    );
};

export default BudgetActualChart;
