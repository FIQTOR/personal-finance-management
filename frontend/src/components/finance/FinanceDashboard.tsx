import { Wallet, ArrowUpRight, ArrowDownRight, PieChart, Target } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import AnimatedNumber from '@/components/AnimatedNumber';
import { getCurrencySymbol } from '@/utils/currency';

export const FinanceDashboard: React.FC = () => {
  const { transactions, budgets, goals, defaultCurrency } = useAppSelector((state) => state.finance);
  const currencySymbol = getCurrencySymbol(defaultCurrency);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalBalance = totalIncome - totalExpense;

  const totalBudgetLimit = budgets.reduce((acc, b) => acc + Number(b.limit_amount), 0);
  const budgetSpent = budgets.reduce((acc, b) => {
    const spent = transactions
      .filter((t) => t.category_id === b.category_id && t.type === 'expense')
      .reduce((s, t) => s + Number(t.amount), 0);
    return acc + spent;
  }, 0);

  const budgetUsagePercent = totalBudgetLimit > 0 ? Math.min(Math.round((budgetSpent / totalBudgetLimit) * 100), 100) : 0;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance */}
        <div className="bg-white dark:bg-neutral-800/60 p-5 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-neutral-400">Total Net Balance</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{currencySymbol}<AnimatedNumber value={totalBalance} /></h3>
          <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Updated realtime
          </p>
        </div>

        {/* Total Income */}
        <div className="bg-white dark:bg-neutral-800/60 p-5 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-neutral-400">Total Income</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{currencySymbol}<AnimatedNumber value={totalIncome} /></h3>
          <p className="text-xs text-gray-400 font-medium">Income records</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white dark:bg-neutral-800/60 p-5 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-neutral-400">Total Expenses</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400">{currencySymbol}<AnimatedNumber value={totalExpense} /></h3>
          <p className="text-xs text-gray-400 font-medium">Expense records</p>
        </div>

        {/* Budget Progress */}
        <div className="bg-white dark:bg-neutral-800/60 p-5 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-neutral-400">Budget Usage</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400"><AnimatedNumber value={budgetUsagePercent} />%</h3>
          <div className="w-full bg-gray-100 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${budgetUsagePercent}%` }} />
          </div>
        </div>
      </div>

      {/* Overview Card */}
      <div className="bg-white dark:bg-neutral-800/60 p-6 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" /> Active Financial Goals
          </h4>
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            You have {goals.length} active savings goals set.
          </p>
        </div>
        <div className="flex gap-2">
          {goals.slice(0, 3).map((g) => (
            <div key={g.id} className="px-3 py-1.5 bg-gray-50 dark:bg-neutral-900 rounded-xl text-xs font-medium border border-gray-100 dark:border-neutral-800 text-gray-700 dark:text-neutral-300">
              {g.name}: {g.currency || defaultCurrency} {Number(g.current_amount).toLocaleString()} / {g.currency || defaultCurrency} {Number(g.target_amount).toLocaleString()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
