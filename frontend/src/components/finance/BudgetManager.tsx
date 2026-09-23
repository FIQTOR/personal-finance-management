import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, AlertCircle, PieChart, Upload, FileUp, Search } from 'lucide-react';
import { TbTrashOff } from 'react-icons/tb';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createBudget, updateBudget, deleteBudget, fetchBudgets } from '@/store/financeSlice';
import type { Budget } from '@/types/finance';
import PanelSelect from '@/components/PanelSelect';
import ExportMenu from '@/components/ExportMenu';
import BulkInsertModal from '@/components/BulkInsertModal';
import ImportModal from '@/components/ImportModal';
import { useNotification } from '@/context/useNotification';
import { getErrorMessage } from '@/utils/error';
import { formatAmountWithCurrency } from '@/utils/currency';
import apiClient from '@/services/apiClient';
import type { ExportColumn } from '@/utils/export';

export const BudgetManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { notify, confirm } = useNotification();
  const { budgets, categories, transactions, defaultCurrency } = useAppSelector((state) => state.finance);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [showBulk, setShowBulk] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');

  const [categoryId, setCategoryId] = useState<number | string>('');
  const [limitAmount, setLimitAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>(defaultCurrency || 'USD');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 7) + '-01');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const refresh = () => dispatch(fetchBudgets());

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

    try {
      if (editingBudget) {
        await dispatch(updateBudget({ id: editingBudget.id, data: payload })).unwrap();
        notify('Budget updated successfully', 'success');
      } else {
        await dispatch(createBudget(payload)).unwrap();
        notify('Budget created successfully', 'success');
      }
      setIsModalOpen(false);
    } catch (error: unknown) {
      notify(typeof error === 'string' ? error : 'Failed to save budget', 'error');
    }
  };

  const handleDelete = (id: number) => {
    confirm('Are you sure you want to delete this budget limit? This action cannot be undone.', async () => {
      await dispatch(deleteBudget(id));
      notify('Budget deleted successfully', 'success');
    }, { actions: [{ label: 'Delete', variant: 'danger', onClick: () => {} }, { label: 'Cancel', onClick: () => {} }] });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) { notify('Please select at least one record', 'warning'); return; }
    confirm(`Are you sure you want to delete ${selectedIds.length} budgets? This action cannot be undone.`, async () => {
      try {
        const res = await apiClient.delete(`/budgets/bulk-delete`, { data: { ids: selectedIds } });
        notify(res.data.message || `${selectedIds.length} records deleted`, 'success');
        setSelectedIds([]); setBulkDeleteMode(false); refresh();
      } catch (error: unknown) {
        notify(getErrorMessage(error, 'Failed to delete records'), 'error');
      }
    }, { actions: [{ label: 'Delete All', variant: 'danger', onClick: () => {} }, { label: 'Cancel', onClick: () => {} }] });
  };

  const getSpentAmount = (b: Budget) => {
    if (!b.category_id) return 0;
    return transactions
      .filter((t) => t.category_id === b.category_id && t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  };

  const exportColumns: ExportColumn<Budget>[] = [
    { key: 'id', header: 'ID' },
    { key: 'category', header: 'Category', value: (b) => b.category?.name || 'General' },
    { key: 'limit_amount', header: 'Limit', value: (b) => formatAmountWithCurrency(b.limit_amount, b.currency) },
    { key: 'currency', header: 'Currency' },
    { key: 'start_date', header: 'Start Date' },
    { key: 'end_date', header: 'End Date' },
  ];

  const filteredBudgets = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return budgets;
    return budgets.filter((b) =>
      [b.category?.name, b.currency, b.start_date, b.end_date, String(b.limit_amount)]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    );
  }, [budgets, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-500" /> Budget Manager
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400">Set monthly spending limits for each category</p>
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
          <ExportMenu rows={budgets} columns={exportColumns} filename="budgets" tableName="budgets" />
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
            <Plus className="w-4 h-4" /> Add Budget
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-1">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search budgets…"
          className="w-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 dark:border-neutral-600 dark:bg-neutral-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 dark:text-neutral-200 text-sm px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBudgets.map((b) => {
          const spent = getSpentAmount(b);
          const limit = Number(b.limit_amount);
          const percentage = Math.min(Math.round((spent / limit) * 100), 100);
          const isOver = spent > limit;

          return (
            <div key={b.id}
              className={`bg-white dark:bg-neutral-800/60 p-5 rounded-2xl border shadow-xs space-y-4 transition-all duration-300 ${bulkDeleteMode && selectedIds.includes(b.id) ? 'border-red-400/60 bg-red-50/40 dark:bg-red-900/10' : 'border-gray-100 dark:border-neutral-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {bulkDeleteMode && (
                    <button
                      onClick={() => setSelectedIds((prev) => prev.includes(b.id) ? prev.filter((i) => i !== b.id) : [...prev, b.id])}
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selectedIds.includes(b.id) ? 'bg-red-500 border-red-500 text-white' : 'border-gray-400'}`}>
                      {selectedIds.includes(b.id) && '✓'}
                    </button>
                  )}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                    style={{ backgroundColor: b.category?.color || '#3B82F6' }}>
                    {b.category?.name.charAt(0) || 'B'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{b.category?.name || 'General Budget'}</h4>
                    <p className="text-xs text-gray-400">{b.start_date} - {b.end_date}</p>
                  </div>
                </div>
                {!bulkDeleteMode && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditModal(b)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-all duration-300">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(b.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-all duration-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-500 dark:text-neutral-400">
                    Spent: <strong className={isOver ? 'text-rose-500 font-bold' : 'text-gray-900 dark:text-white'}>{formatAmountWithCurrency(spent, b.currency)}</strong>
                  </span>
                  <span className="text-gray-500 dark:text-neutral-400">Limit: {formatAmountWithCurrency(limit, b.currency)}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-neutral-700 h-2.5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${isOver ? 'bg-rose-500' : percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${percentage}%` }} />
                </div>
              </div>

              {isOver && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Budget limit exceeded by {formatAmountWithCurrency(spent - limit, b.currency)}!
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-md border border-gray-100 dark:border-neutral-800 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {editingBudget ? 'Edit Budget Limit' : 'New Category Budget'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Category</label>
                <PanelSelect
                  value={categoryId}
                  onChange={(val) => setCategoryId(val)}
                  placeholder="Select Expense Category"
                  options={(() => {
                    const expenseCats = categories.filter((c) => !c.type || c.type.toLowerCase() === 'expense');
                    const list = expenseCats.length > 0 ? expenseCats : categories;
                    return list.map((c) => ({ value: c.id, label: c.name }));
                  })()}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Limit Amount</label>
                  <input type="number" step="0.01" required value={limitAmount} onChange={(e) => setLimitAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/50 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 text-gray-900 dark:text-neutral-200 transition-all duration-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Currency</label>
                  <PanelSelect value={currency} onChange={(val) => setCurrency(String(val))} compact
                    options={[{ value: 'USD', label: 'USD ($)' }, { value: 'IDR', label: 'IDR (Rp)' }, { value: 'EUR', label: 'EUR (€)' }, { value: 'GBP', label: 'GBP (£)' }]} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Start Date</label>
                  <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/50 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 text-gray-900 dark:text-neutral-200 text-xs transition-all duration-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">End Date</label>
                  <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/50 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 text-gray-900 dark:text-neutral-200 text-xs transition-all duration-300" />
                </div>
              </div>

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

      <ImportModal isOpen={showImport} onClose={() => setShowImport(false)} resource="budgets" title="Import Budgets" onSuccess={refresh} />
      <BulkInsertModal isOpen={showBulk} onClose={() => setShowBulk(false)} resource="budgets" title="Bulk Insert Budgets" onSuccess={refresh}
        columns={[
          { key: 'category_id', label: 'Category ID', example: '1' },
          { key: 'limit_amount', label: 'Limit Amount', required: true, example: '500' },
          { key: 'currency', label: 'Currency', example: 'USD' },
          { key: 'start_date', label: 'Start Date', required: true, example: new Date().toISOString().slice(0, 7) + '-01' },
          { key: 'end_date', label: 'End Date', required: true, example: new Date().toISOString().slice(0, 10) },
        ]} />
    </div>
  );
};
