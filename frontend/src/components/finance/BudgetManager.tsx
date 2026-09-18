import { useState } from 'react';
import { Plus, Trash2, Edit2, AlertCircle, PieChart } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createBudget, updateBudget, deleteBudget } from '@/store/financeSlice';
import type { Budget } from '@/types/finance';
import { CustomSelect } from '@/components/CustomSelect';

export const BudgetManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { budgets, categories, transactions, defaultCurrency } = useAppSelector((state) => state.finance);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const [categoryId, setCategoryId] = useState<number | string>('');
  const [limitAmount, setLimitAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>(defaultCurrency || 'USD');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 7) + '-01');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const openCreateModal = () => {
    setEditingBudget(null);
    setCategoryId('');
    setLimitAmount('');
    setCurrency(defaultCurrency || 'USD');
    setIsModalOpen(true);
  };

  const openEditModal = (b: Budget) => {
    setEditingBudget(b);
    setCategoryId(b.category_id || '');
    setLimitAmount(String(b.limit_amount));
    setCurrency(b.currency);
    setStartDate(b.start_date);
    setEndDate(b.end_date);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      category_id: categoryId ? Number(categoryId) : undefined,
      limit_amount: parseFloat(limitAmount),
      currency,
      start_date: startDate,
      end_date: endDate,
    };

    if (editingBudget) {
      await dispatch(updateBudget({ id: editingBudget.id, data: payload }));
    } else {
      await dispatch(createBudget(payload));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Delete this budget limit?')) {
      dispatch(deleteBudget(id));
    }
  };

  // Calculate actual spending per category budget
  const getSpentAmount = (b: Budget) => {
    if (!b.category_id) return 0;
    return transactions
      .filter((t) => t.category_id === b.category_id && t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-500" /> Budget Manager
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400">Set monthly spending limits for each category</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Budget
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((b) => {
          const spent = getSpentAmount(b);
          const limit = Number(b.limit_amount);
          const percentage = Math.min(Math.round((spent / limit) * 100), 100);
          const isOver = spent > limit;

          return (
            <div
              key={b.id}
              className="bg-white dark:bg-neutral-800/60 p-5 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                    style={{ backgroundColor: b.category?.color || '#3B82F6' }}
                  >
                    {b.category?.name.charAt(0) || 'B'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{b.category?.name || 'General Budget'}</h4>
                    <p className="text-xs text-gray-400">
                      {b.start_date} - {b.end_date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditModal(b)} className="p-1.5 text-gray-400 hover:text-blue-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(b.id)} className="p-1.5 text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-500 dark:text-neutral-400">
                    Spent: <strong className={isOver ? 'text-rose-500 font-bold' : 'text-gray-900 dark:text-white'}>{b.currency} {spent.toLocaleString()}</strong>
                  </span>
                  <span className="text-gray-500 dark:text-neutral-400">Limit: {b.currency} {limit.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-neutral-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isOver ? 'bg-rose-500' : percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              {isOver && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Budget limit exceeded by {b.currency} {(spent - limit).toLocaleString()}!
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-md border border-gray-100 dark:border-neutral-800 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {editingBudget ? 'Edit Budget Limit' : 'New Category Budget'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Category</label>
                <CustomSelect
                  value={categoryId}
                  onChange={(val) => setCategoryId(val)}
                  placeholder="Select Expense Category"
                  options={(() => {
                    const expenseCats = categories.filter((c) => !c.type || c.type.toLowerCase() === 'expense');
                    const list = expenseCats.length > 0 ? expenseCats : categories;
                    return list.map((c) => ({
                      value: c.id,
                      label: c.name,
                      color: c.color
                    }));
                  })()}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Limit Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={limitAmount}
                    onChange={(e) => setLimitAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Currency</label>
                  <CustomSelect
                    value={currency}
                    onChange={(val) => setCurrency(String(val))}
                    options={[
                      { value: 'USD', label: 'USD ($)' },
                      { value: 'IDR', label: 'IDR (Rp)' },
                      { value: 'EUR', label: 'EUR (€)' },
                      { value: 'GBP', label: 'GBP (£)' }
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-neutral-300 rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
