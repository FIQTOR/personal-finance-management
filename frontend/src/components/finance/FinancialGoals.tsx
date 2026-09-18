import { useState } from 'react';
import { Target, Plus, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createGoal, updateGoal, deleteGoal } from '@/store/financeSlice';
import type { Goal } from '@/types/finance';

export const FinancialGoals: React.FC = () => {
  const dispatch = useAppDispatch();
  const { goals, defaultCurrency } = useAppSelector((state) => state.finance);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency || 'USD');
  const [deadline, setDeadline] = useState(new Date().toISOString().split('T')[0]);

  const openCreateModal = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setCurrency(defaultCurrency || 'USD');
    setIsModalOpen(true);
  };

  const openEditModal = (g: Goal) => {
    setEditingGoal(g);
    setName(g.name);
    setTargetAmount(String(g.target_amount));
    setCurrentAmount(String(g.current_amount));
    setCurrency(g.currency);
    setDeadline(g.deadline);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      target_amount: parseFloat(targetAmount),
      current_amount: parseFloat(currentAmount || '0'),
      currency,
      deadline,
    };

    if (editingGoal) {
      await dispatch(updateGoal({ id: editingGoal.id, data: payload }));
    } else {
      await dispatch(createGoal(payload));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Delete this financial goal?')) {
      dispatch(deleteGoal(id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" /> Financial Goals
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400">Track savings targets and milestone progress</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((g) => {
          const target = Number(g.target_amount);
          const current = Number(g.current_amount);
          const percentage = Math.min(Math.round((current / target) * 100), 100);
          const isCompleted = current >= target;

          return (
            <div
              key={g.id}
              className="bg-white dark:bg-neutral-800/60 p-5 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-xs space-y-4 relative overflow-hidden"
            >
              {isCompleted && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white px-3 py-1 rounded-bl-xl text-xs font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Achieved
                </div>
              )}

              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{g.name}</h4>
                  <p className="text-xs text-gray-400">Deadline: {g.deadline}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditModal(g)} className="p-1.5 text-gray-400 hover:text-blue-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(g.id)} className="p-1.5 text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1.5 font-medium">
                  <span className="text-gray-600 dark:text-neutral-300">
                    Saved: {g.currency} {current.toLocaleString()}
                  </span>
                  <span className="text-gray-400">
                    Target: {g.currency} {target.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-neutral-700 h-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-emerald-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex justify-end mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  {percentage}% Completed
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-md border border-gray-100 dark:border-neutral-800 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {editingGoal ? 'Edit Financial Goal' : 'New Financial Goal'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Goal Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Emergency Savings"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Target Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Current Saved</label>
                  <input
                    type="number"
                    step="0.01"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                  >
                    <option value="USD">USD</option>
                    <option value="IDR">IDR</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Target Deadline</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
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
                <button type="submit" className="px-5 py-2 text-sm bg-emerald-600 text-white rounded-xl">
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
