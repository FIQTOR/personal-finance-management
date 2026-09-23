import { useState, useMemo } from 'react';
import { Target, Plus, Trash2, Edit2, CheckCircle2, Upload, FileUp, Search } from 'lucide-react';
import { TbTrashOff } from 'react-icons/tb';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createGoal, updateGoal, deleteGoal, fetchGoals } from '@/store/financeSlice';
import type { Goal } from '@/types/finance';
import PanelSelect from '@/components/PanelSelect';
import ExportMenu from '@/components/ExportMenu';
import BulkInsertModal from '@/components/BulkInsertModal';
import ImportModal from '@/components/ImportModal';
import { useNotification } from '@/context/useNotification';
import { getErrorMessage } from '@/utils/error';
import { formatAmountWithCurrency } from '@/utils/currency';
import apiClient from '@/services/apiClient';
import type { ExportColumn } from '@/utils/export';

export const FinancialGoals: React.FC = () => {
  const dispatch = useAppDispatch();
  const { notify, confirm } = useNotification();
  const { goals, defaultCurrency } = useAppSelector((state) => state.finance);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showBulk, setShowBulk] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency || 'USD');
  const [deadline, setDeadline] = useState(new Date().toISOString().split('T')[0]);

  const refresh = () => dispatch(fetchGoals());

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

    try {
      if (editingGoal) {
        await dispatch(updateGoal({ id: editingGoal.id, data: payload })).unwrap();
        notify('Goal updated successfully', 'success');
      } else {
        await dispatch(createGoal(payload)).unwrap();
        notify('Goal created successfully', 'success');
      }
      setIsModalOpen(false);
    } catch (error: unknown) {
      notify(typeof error === 'string' ? error : 'Failed to save goal', 'error');
    }
  };

  const handleDelete = (id: number) => {
    confirm('Are you sure you want to delete this financial goal? This action cannot be undone.', async () => {
      await dispatch(deleteGoal(id));
      notify('Goal deleted successfully', 'success');
    }, { actions: [{ label: 'Delete', variant: 'danger', onClick: () => {} }, { label: 'Cancel', onClick: () => {} }] });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) { notify('Please select at least one record', 'warning'); return; }
    confirm(`Are you sure you want to delete ${selectedIds.length} goals? This action cannot be undone.`, async () => {
      try {
        const res = await apiClient.delete(`/goals/bulk-delete`, { data: { ids: selectedIds } });
        notify(res.data.message || `${selectedIds.length} records deleted`, 'success');
        setSelectedIds([]); setBulkDeleteMode(false); refresh();
      } catch (error: unknown) {
        notify(getErrorMessage(error, 'Failed to delete records'), 'error');
      }
    }, { actions: [{ label: 'Delete All', variant: 'danger', onClick: () => {} }, { label: 'Cancel', onClick: () => {} }] });
  };

  const exportColumns: ExportColumn<Goal>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name' },
    { key: 'target_amount', header: 'Target', value: (g) => formatAmountWithCurrency(g.target_amount, g.currency) },
    { key: 'current_amount', header: 'Saved', value: (g) => formatAmountWithCurrency(g.current_amount, g.currency) },
    { key: 'currency', header: 'Currency' },
    { key: 'deadline', header: 'Deadline' },
  ];

  const filteredGoals = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return goals;
    return goals.filter((g) =>
      [g.name, g.currency, g.deadline, String(g.target_amount), String(g.current_amount)]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    );
  }, [goals, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" /> Financial Goals
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400">Track savings targets and milestone progress</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button type="button" onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-indigo-600/90 backdrop-blur-md border border-indigo-400/40 text-white px-3 py-2 rounded-xl hover:bg-indigo-500 transition-all duration-300 shadow-lg text-sm">
            <FileUp className="w-4 h-4" /><span className="hidden sm:inline">Import</span>
          </button>
          <button type="button" onClick={() => setShowBulk(true)}
            className="flex items-center gap-2 bg-blue-600/90 backdrop-blur-md border border-blue-400/40 text-white px-3 py-2 rounded-xl hover:bg-blue-500 transition-all duration-300 shadow-lg text-sm">
            <Upload className="w-4 h-4" /><span className="hidden sm:inline">Bulk Insert</span>
          </button>
          <ExportMenu rows={goals} columns={exportColumns} filename="goals" tableName="goals" />
          <button
            onClick={() => { setBulkDeleteMode(!bulkDeleteMode); setSelectedIds([]); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 text-sm border font-medium ${bulkDeleteMode
              ? 'bg-red-500/20 text-red-700 border-red-200/50 dark:border-red-700/50'
              : 'bg-white/10 text-gray-700 dark:bg-neutral-800/20 dark:text-neutral-300 border-white/20 hover:bg-white/20 dark:hover:bg-neutral-800/30'}`}>
            {bulkDeleteMode ? <TbTrashOff className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
            <span className="hidden sm:inline">Bulk Delete</span>
          </button>
          {bulkDeleteMode && (
            <button onClick={handleBulkDelete}
              className="flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-xl hover:bg-red-600 transition-all duration-300 text-sm shadow-lg font-medium">
              <Trash2 className="w-4 h-4" /> Delete Selected ({selectedIds.length})
            </button>
          )}
          <button onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-700 dark:text-neutral-300 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border border-white/30 dark:border-neutral-600/30 hover:bg-white/60 dark:hover:bg-neutral-800/70 transition-all duration-300 text-sm font-medium">
            <Plus className="w-4 h-4" /> New Goal
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-1">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search goals…"
          className="w-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 dark:border-neutral-600 dark:bg-neutral-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 dark:text-neutral-200 text-sm px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGoals.map((g) => {
          const target = Number(g.target_amount);
          const current = Number(g.current_amount);
          const percentage = Math.min(Math.round((current / target) * 100), 100);
          const isCompleted = current >= target;

          return (
            <div key={g.id}
              className={`bg-white dark:bg-neutral-800/60 p-5 rounded-2xl border shadow-xs space-y-4 relative overflow-hidden transition-all duration-300 ${bulkDeleteMode && selectedIds.includes(g.id) ? 'border-red-400/60 bg-red-50/40 dark:bg-red-900/10' : 'border-gray-100 dark:border-neutral-800'}`}>
              {isCompleted && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white px-3 py-1 rounded-bl-xl text-xs font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Achieved
                </div>
              )}

              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {bulkDeleteMode && (
                    <button
                      onClick={() => setSelectedIds((prev) => prev.includes(g.id) ? prev.filter((i) => i !== g.id) : [...prev, g.id])}
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-1 ${selectedIds.includes(g.id) ? 'bg-red-500 border-red-500 text-white' : 'border-gray-400'}`}>
                      {selectedIds.includes(g.id) && '✓'}
                    </button>
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{g.name}</h4>
                    <p className="text-xs text-gray-400">Deadline: {g.deadline}</p>
                  </div>
                </div>
                {!bulkDeleteMode && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditModal(g)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-all duration-300">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(g.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-all duration-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1.5 font-medium">
                  <span className="text-gray-600 dark:text-neutral-300">Saved: {formatAmountWithCurrency(current, g.currency)}</span>
                  <span className="text-gray-400">Target: {formatAmountWithCurrency(target, g.currency)}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-neutral-700 h-3 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-emerald-500'}`}
                    style={{ width: `${percentage}%` }} />
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
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-md border border-gray-100 dark:border-neutral-800 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {editingGoal ? 'Edit Financial Goal' : 'New Financial Goal'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Goal Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Emergency Savings"
                  className="w-full px-4 py-2.5 rounded-xl border border-black/50 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 text-gray-900 dark:text-neutral-200 transition-all duration-300" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Target Amount</label>
                  <input type="number" step="0.01" required value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/50 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 text-gray-900 dark:text-neutral-200 transition-all duration-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Current Saved</label>
                  <input type="number" step="0.01" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/50 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 text-gray-900 dark:text-neutral-200 transition-all duration-300" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Currency</label>
                  <PanelSelect value={currency} onChange={(v) => setCurrency(v)}
                    options={[{ value: 'USD', label: 'USD ($)' }, { value: 'IDR', label: 'IDR (Rp)' }, { value: 'EUR', label: 'EUR (€)' }, { value: 'GBP', label: 'GBP (£)' }]} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Target Deadline</label>
                  <input type="date" required value={deadline} onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-black/50 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 text-gray-900 dark:text-neutral-200 transition-all duration-300" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-neutral-300 rounded-xl border dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all duration-300">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2 text-sm bg-blue-600/90 backdrop-blur-md border border-blue-400/40 text-white rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-500/30 transition-all duration-300">
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ImportModal isOpen={showImport} onClose={() => setShowImport(false)} resource="goals" title="Import Goals" onSuccess={refresh} />
      <BulkInsertModal isOpen={showBulk} onClose={() => setShowBulk(false)} resource="goals" title="Bulk Insert Goals" onSuccess={refresh}
        columns={[
          { key: 'name', label: 'Name', required: true, example: 'Emergency Savings' },
          { key: 'target_amount', label: 'Target Amount', required: true, example: '10000' },
          { key: 'current_amount', label: 'Current Amount', example: '0' },
          { key: 'currency', label: 'Currency', example: 'USD' },
          { key: 'deadline', label: 'Deadline', required: true, example: new Date().toISOString().split('T')[0] },
        ]} />
    </div>
  );
};
