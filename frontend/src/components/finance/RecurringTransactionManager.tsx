import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Upload, FileUp, Search, RefreshCw, Repeat, CheckCircle2, XCircle } from 'lucide-react';
import { TbTrashOff } from 'react-icons/tb';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  fetchRecurringTransactions,
  generateDueRecurring,
} from '@/store/financeSlice';
import { SkeletonCardGrid } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import type { RecurringTransaction, TransactionType, RecurringFrequency } from '@/types/finance';
import PanelSelect from '@/components/PanelSelect';
import ExportMenu from '@/components/ExportMenu';
import BulkInsertModal from '@/components/BulkInsertModal';
import ImportModal from '@/components/ImportModal';
import { useNotification } from '@/context/useNotification';
import { getErrorMessage } from '@/utils/error';
import { formatAmountWithCurrency } from '@/utils/currency';
import apiClient from '@/services/apiClient';
import type { ExportColumn } from '@/utils/export';

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  daily: 'day',
  weekly: 'week',
  monthly: 'month',
  yearly: 'year',
};

const describeFrequency = (frequency: RecurringFrequency, intervalCount?: number) => {
  const count = Math.max(1, Number(intervalCount) || 1);
  const unit = FREQUENCY_LABELS[frequency] || frequency;
  return count === 1 ? `Every ${unit}` : `Every ${count} ${unit}s`;
};

export const RecurringTransactionManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { notify, confirm } = useNotification();
  const { recurringTransactions, categories, defaultCurrency, loading } = useAppSelector((state) => state.finance);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [showBulk, setShowBulk] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [generating, setGenerating] = useState(false);

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>(defaultCurrency || 'USD');
  const [categoryId, setCategoryId] = useState<number | string>('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [intervalCount, setIntervalCount] = useState<string>('1');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  const refresh = () => dispatch(fetchRecurringTransactions());

  const openCreateModal = () => {
    setEditing(null);
    setType('expense');
    setAmount('');
    setCurrency(defaultCurrency || 'USD');
    setCategoryId('');
    setFrequency('monthly');
    setIntervalCount('1');
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate('');
    setNotes('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (r: RecurringTransaction) => {
    setEditing(r);
    setType(r.type);
    setAmount(String(r.amount));
    setCurrency(r.currency);
    setCategoryId(r.category_id || '');
    setFrequency(r.frequency);
    setIntervalCount(String(r.interval_count ?? 1));
    setStartDate(r.start_date);
    setEndDate(r.end_date || '');
    setNotes(r.notes || '');
    setIsActive(r.is_active);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (endDate && startDate && endDate < startDate) {
      notify('End date must be on or after the start date', 'error');
      return;
    }
    const payload = {
      type,
      amount: parseFloat(amount),
      currency,
      category_id: categoryId ? Number(categoryId) : undefined,
      frequency,
      interval_count: Math.max(1, parseInt(intervalCount, 10) || 1),
      start_date: startDate,
      end_date: endDate || undefined,
      notes,
      is_active: isActive,
    };

    try {
      if (editing) {
        await dispatch(updateRecurringTransaction({ id: editing.id, data: payload })).unwrap();
        notify('Recurring transaction updated successfully', 'success');
      } else {
        await dispatch(createRecurringTransaction(payload)).unwrap();
        notify('Recurring transaction created successfully', 'success');
      }
      setIsModalOpen(false);
    } catch (error: unknown) {
      notify(typeof error === 'string' ? error : 'Failed to save recurring transaction', 'error');
    }
  };

  const handleToggleActive = async (r: RecurringTransaction) => {
    try {
      await dispatch(updateRecurringTransaction({ id: r.id, data: { is_active: !r.is_active } })).unwrap();
      notify(r.is_active ? 'Recurring rule paused' : 'Recurring rule activated', 'success');
    } catch (error: unknown) {
      notify(typeof error === 'string' ? error : 'Failed to update recurring transaction', 'error');
    }
  };

  const handleDelete = (id: number) => {
    confirm('Are you sure you want to delete this recurring rule? This action cannot be undone.', async () => {
      await dispatch(deleteRecurringTransaction(id));
      notify('Recurring transaction deleted successfully', 'success');
    }, { actions: [{ label: 'Delete', variant: 'danger', onClick: () => {} }, { label: 'Cancel', onClick: () => {} }] });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) { notify('Please select at least one record', 'warning'); return; }
    confirm(`Are you sure you want to delete ${selectedIds.length} recurring rules? This action cannot be undone.`, async () => {
      try {
        const res = await apiClient.delete(`/recurring-transactions/bulk-delete`, { data: { ids: selectedIds } });
        notify(res.data.message || `${selectedIds.length} records deleted`, 'success');
        setSelectedIds([]); setBulkDeleteMode(false); refresh();
      } catch (error: unknown) {
        notify(getErrorMessage(error, 'Failed to delete records'), 'error');
      }
    }, { actions: [{ label: 'Delete All', variant: 'danger', onClick: () => {} }, { label: 'Cancel', onClick: () => {} }] });
  };

  const handleGenerateDue = async () => {
    try {
      setGenerating(true);
      const result = await dispatch(generateDueRecurring()).unwrap();
      const count = result?.createdCount ?? 0;
      notify(count > 0 ? `Generated ${count} transaction(s)` : 'No recurring transactions were due', count > 0 ? 'success' : 'info');
    } catch (error: unknown) {
      notify(typeof error === 'string' ? error : 'Failed to generate due transactions', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const exportColumns: ExportColumn<RecurringTransaction>[] = [
    { key: 'id', header: 'ID' },
    { key: 'type', header: 'Type', value: (r) => r.type.toUpperCase() },
    { key: 'category', header: 'Category', value: (r) => r.category?.name || 'Uncategorized' },
    { key: 'amount', header: 'Amount', value: (r) => formatAmountWithCurrency(r.amount, r.currency) },
    { key: 'currency', header: 'Currency' },
    { key: 'frequency', header: 'Frequency', value: (r) => describeFrequency(r.frequency, r.interval_count) },
    { key: 'next_run_date', header: 'Next Run' },
    { key: 'start_date', header: 'Start Date' },
    { key: 'end_date', header: 'End Date', value: (r) => r.end_date || '' },
    { key: 'is_active', header: 'Active', value: (r) => (r.is_active ? 'Yes' : 'No') },
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recurringTransactions;
    return recurringTransactions.filter((r) =>
      [r.category?.name, r.type, r.frequency, r.currency, r.next_run_date, r.notes, String(r.amount)]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    );
  }, [recurringTransactions, search]);

  const categoryOptions = useMemo(() => {
    const typed = categories.filter((c) => c.type === type);
    const list = typed.length > 0 ? typed : categories;
    return [
      { value: '', label: 'Uncategorized' },
      ...list.map((c) => ({ value: c.id, label: c.name })),
    ];
  }, [categories, type]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Repeat className="w-5 h-5 text-blue-500" /> Recurring Transactions
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400">Automate repeating income and expenses on a schedule</p>
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
          <ExportMenu rows={recurringTransactions} columns={exportColumns} filename="recurring-transactions" tableName="recurring-transactions" />
          <button type="button" onClick={handleGenerateDue} disabled={generating}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-emerald-600/90 backdrop-blur-md border border-emerald-400/40 text-white hover:bg-emerald-500 transition-all duration-300 shadow-lg disabled:opacity-60">
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{generating ? 'Generating…' : 'Generate due'}</span>
          </button>
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
            <Plus className="w-4 h-4" /> Add Rule
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-1">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search recurring transactions…"
          className="w-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 dark:border-neutral-600 dark:bg-neutral-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 dark:text-neutral-200 text-sm px-3 py-2"
        />
      </div>

      {loading && recurringTransactions.length === 0 ? (
        <SkeletonCardGrid count={6} cols="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" />
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-neutral-800/60 rounded-2xl border border-gray-100 dark:border-neutral-800">
          <EmptyState
            icon={<Repeat className="w-7 h-7" />}
            title="No recurring transactions yet"
            description="Create a rule to automatically generate transactions on a schedule."
            action={
              <button onClick={openCreateModal}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600/90 border border-blue-400/40 text-white hover:bg-blue-500 shadow-lg transition-all duration-300">
                <Plus className="w-4 h-4" /> Add Rule
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => {
            const isIncome = r.type === 'income';
            return (
              <div key={r.id}
                className={`bg-white dark:bg-neutral-800/60 p-5 rounded-2xl border shadow-xs space-y-4 transition-all duration-300 ${bulkDeleteMode && selectedIds.includes(r.id) ? 'border-red-400/60 bg-red-50/40 dark:bg-red-900/10' : 'border-gray-100 dark:border-neutral-800'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {bulkDeleteMode && (
                      <button
                        onClick={() => setSelectedIds((prev) => prev.includes(r.id) ? prev.filter((i) => i !== r.id) : [...prev, r.id])}
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selectedIds.includes(r.id) ? 'bg-red-500 border-red-500 text-white' : 'border-gray-400'}`}>
                        {selectedIds.includes(r.id) && '✓'}
                      </button>
                    )}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                      style={{ backgroundColor: r.category?.color || (isIncome ? '#10B981' : '#F43F5E') }}>
                      {r.category?.name.charAt(0) || (isIncome ? 'I' : 'E')}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{r.category?.name || 'Uncategorized'}</h4>
                      <p className="text-xs text-gray-400">{describeFrequency(r.frequency, r.interval_count)}</p>
                    </div>
                  </div>
                  {!bulkDeleteMode && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleToggleActive(r)} title={r.is_active ? 'Pause' : 'Activate'}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 transition-all duration-300">
                        {r.is_active ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4" />}
                      </button>
                      <button onClick={() => openEditModal(r)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-all duration-300">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-all duration-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className={`text-lg font-bold ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {isIncome ? '+' : '-'} {formatAmountWithCurrency(r.amount, r.currency)}
                    </p>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">
                      Next run: {r.next_run_date}
                      {r.end_date ? ` • until ${r.end_date}` : ''}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${r.is_active
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                    : 'bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-neutral-400'}`}>
                    {r.is_active ? 'Active' : 'Paused'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-lg border border-gray-100 dark:border-neutral-800 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {editing ? 'Edit Recurring Rule' : 'New Recurring Rule'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-neutral-800 rounded-xl">
                <button type="button" onClick={() => setType('expense')}
                  className={`py-2 text-sm font-medium rounded-lg transition-colors ${type === 'expense' ? 'bg-red-500 text-white shadow-xs' : 'text-gray-600 dark:text-neutral-400'}`}>
                  Expense
                </button>
                <button type="button" onClick={() => setType('income')}
                  className={`py-2 text-sm font-medium rounded-lg transition-colors ${type === 'income' ? 'bg-green-500 text-white shadow-xs' : 'text-gray-600 dark:text-neutral-400'}`}>
                  Income
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Amount</label>
                  <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/50 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 text-gray-900 dark:text-neutral-200 transition-all duration-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Currency</label>
                  <PanelSelect value={currency} onChange={(val) => setCurrency(String(val))} compact
                    options={[{ value: 'USD', label: 'USD ($)' }, { value: 'IDR', label: 'IDR (Rp)' }, { value: 'EUR', label: 'EUR (€)' }, { value: 'GBP', label: 'GBP (£)' }]} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Category</label>
                <PanelSelect value={categoryId} onChange={(val) => setCategoryId(val)} placeholder="Uncategorized" options={categoryOptions} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Frequency</label>
                  <PanelSelect value={frequency} onChange={(val) => setFrequency(String(val) as RecurringFrequency)} compact
                    options={[
                      { value: 'daily', label: 'Daily' },
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'monthly', label: 'Monthly' },
                      { value: 'yearly', label: 'Yearly' },
                    ]} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Every (interval)</label>
                  <input type="number" min="1" step="1" required value={intervalCount} onChange={(e) => setIntervalCount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/50 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 text-gray-900 dark:text-neutral-200 transition-all duration-300" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Start Date</label>
                  <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/50 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 text-gray-900 dark:text-neutral-200 text-xs transition-all duration-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">End Date (optional)</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/50 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 text-gray-900 dark:text-neutral-200 text-xs transition-all duration-300" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Notes</label>
                <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add details…"
                  className="w-full px-4 py-2.5 rounded-xl border border-black/50 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 text-gray-900 dark:text-neutral-200 transition-all duration-300" />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-600 dark:text-neutral-300">Active</span>
              </label>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-neutral-300 rounded-xl border dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all duration-300">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2 text-sm bg-blue-600/90 backdrop-blur-md border border-blue-400/40 text-white rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-500/30 transition-all duration-300">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ImportModal isOpen={showImport} onClose={() => setShowImport(false)} resource="recurring-transactions" title="Import Recurring Transactions" onSuccess={refresh} />
      <BulkInsertModal isOpen={showBulk} onClose={() => setShowBulk(false)} resource="recurring-transactions" title="Bulk Insert Recurring Transactions" onSuccess={refresh}
        columns={[
          { key: 'type', label: 'Type', required: true, example: 'expense' },
          { key: 'amount', label: 'Amount', required: true, example: '25.50' },
          { key: 'currency', label: 'Currency', example: 'USD' },
          { key: 'category_id', label: 'Category ID', example: '1' },
          { key: 'frequency', label: 'Frequency', required: true, example: 'monthly' },
          { key: 'interval_count', label: 'Interval Count', example: '1' },
          { key: 'start_date', label: 'Start Date', required: true, example: new Date().toISOString().slice(0, 10) },
          { key: 'end_date', label: 'End Date', example: '' },
          { key: 'notes', label: 'Notes', example: 'Monthly subscription' },
        ]} />
    </div>
  );
};
