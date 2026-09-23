import { useState, useEffect, useMemo } from 'react';
import { Download, Filter, Plus, Edit2, Trash2, ArrowUpRight, ArrowDownRight, Upload, FileUp, Trash, Search } from 'lucide-react';
import { TbTrashOff } from 'react-icons/tb';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTransactions, deleteTransaction } from '@/store/financeSlice';
import type { Transaction, TransactionFilter } from '@/types/finance';
import apiClient from '@/services/apiClient';
import PanelSelect from '@/components/PanelSelect';
import ExportMenu from '@/components/ExportMenu';
import BulkInsertModal from '@/components/BulkInsertModal';
import ImportModal from '@/components/ImportModal';
import { useNotification } from '@/context/useNotification';
import { getErrorMessage } from '@/utils/error';
import { formatAmountWithCurrency } from '@/utils/currency';
import type { ExportColumn } from '@/utils/export';

interface TransactionListProps {
  onAddClick: () => void;
  onEditClick: (transaction: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ onAddClick, onEditClick }) => {
  const dispatch = useAppDispatch();
  const { notify, confirm } = useNotification();
  const { transactions, categories } = useAppSelector((state) => state.finance);

  const [filters, setFilters] = useState<TransactionFilter>({
    category_id: '',
    currency: '',
    type: '',
    start_date: '',
    end_date: '',
  });
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchTransactions(filters));
  }, [dispatch, filters]);

  const handleFilterChange = (key: keyof TransactionFilter, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const refresh = () => dispatch(fetchTransactions(filters));

  const handleDelete = (id: number) => {
    confirm('Are you sure you want to delete this transaction? This action cannot be undone.', async () => {
      await dispatch(deleteTransaction(id));
      notify('Transaction deleted successfully', 'success');
    }, { actions: [{ label: 'Delete', variant: 'danger', onClick: () => {} }, { label: 'Cancel', onClick: () => {} }] });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) { notify('Please select at least one record', 'warning'); return; }
    confirm(`Are you sure you want to delete ${selectedIds.length} transactions? This action cannot be undone.`, async () => {
      try {
        const res = await apiClient.delete(`/transactions/bulk-delete`, { data: { ids: selectedIds } });
        notify(res.data.message || `${selectedIds.length} records deleted`, 'success');
        setSelectedIds([]); setBulkDeleteMode(false); refresh();
      } catch (error: unknown) {
        notify(getErrorMessage(error, 'Failed to delete records'), 'error');
      }
    }, { actions: [{ label: 'Delete All', variant: 'danger', onClick: () => {} }, { label: 'Cancel', onClick: () => {} }] });
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const queryParams = new URLSearchParams();
      if (filters.category_id) queryParams.append('category_id', String(filters.category_id));
      if (filters.currency) queryParams.append('currency', filters.currency);
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.start_date) queryParams.append('start_date', filters.start_date);
      if (filters.end_date) queryParams.append('end_date', filters.end_date);

      const response = await apiClient.get(`/transactions/export?${queryParams.toString()}`, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      notify('Exported transactions to Excel', 'success');
    } catch (error: unknown) {
      notify(getErrorMessage(error, 'Failed to export transactions'), 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const exportColumns: ExportColumn<Transaction>[] = [
    { key: 'id', header: 'ID' },
    { key: 'date', header: 'Date' },
    { key: 'type', header: 'Type', value: (t) => t.type.toUpperCase() },
    { key: 'category', header: 'Category', value: (t) => t.category?.name || 'Uncategorized' },
    { key: 'amount', header: 'Amount', value: (t) => formatAmountWithCurrency(t.amount, t.currency) },
    { key: 'currency', header: 'Currency' },
    { key: 'notes', header: 'Notes', value: (t) => t.notes || '' },
  ];

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  const filteredTransactions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter((t) =>
      [t.notes, t.category?.name, t.type, t.currency, t.date, String(t.amount)]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    );
  }, [transactions, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transaction History</h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400">View, filter, and export all financial records</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-indigo-600/90 backdrop-blur-md border border-indigo-400/40 text-white px-3 py-2 rounded-xl hover:bg-indigo-500 transition-all duration-300 shadow-lg text-sm"
          >
            <FileUp className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button
            type="button"
            onClick={() => setShowBulk(true)}
            className="flex items-center gap-2 bg-blue-600/90 backdrop-blur-md border border-blue-400/40 text-white px-3 py-2 rounded-xl hover:bg-blue-500 transition-all duration-300 shadow-lg text-sm"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Bulk Insert</span>
          </button>
          <ExportMenu rows={transactions} columns={exportColumns} filename="transactions" tableName="transactions" />
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border border-white/30 dark:border-neutral-600/30 text-gray-700 dark:text-neutral-200 hover:bg-white/60 dark:hover:bg-neutral-800/70 transition-all duration-300 text-sm"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span className="hidden lg:inline">{isExporting ? 'Exporting...' : 'Excel'}</span>
          </button>
          <button
            onClick={() => { setBulkDeleteMode(!bulkDeleteMode); setSelectedIds([]); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 text-sm border font-medium ${bulkDeleteMode
              ? 'bg-red-500/20 text-red-700 border-red-200/50 dark:border-red-700/50'
              : 'bg-white/10 text-gray-700 dark:bg-neutral-800/20 dark:text-neutral-300 border-white/20 hover:bg-white/20 dark:hover:bg-neutral-800/30'}`}
          >
            {bulkDeleteMode ? <TbTrashOff className="w-4 h-4" /> : <Trash className="w-4 h-4" />}
            <span className="hidden sm:inline">Bulk Delete</span>
          </button>
          {bulkDeleteMode && (
            <button onClick={handleBulkDelete}
              className="flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-xl hover:bg-red-600 transition-all duration-300 text-sm shadow-lg font-medium">
              <Trash className="w-4 h-4" /> Delete Selected ({selectedIds.length})
            </button>
          )}
          <button
            onClick={onAddClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-700 dark:text-neutral-300 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border border-white/30 dark:border-neutral-600/30 hover:bg-white/60 dark:hover:bg-neutral-800/70 transition-all duration-300 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> New Transaction
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-neutral-800/60 p-4 rounded-2xl border border-gray-100 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category
          </label>
          <PanelSelect value={filters.category_id ?? ''} options={categoryOptions} onChange={(v) => handleFilterChange('category_id', v)} compact />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1">Type</label>
          <PanelSelect value={filters.type ?? ''} onChange={(v) => handleFilterChange('type', v)} compact
            options={[{ value: '', label: 'All Types' }, { value: 'income', label: 'Income' }, { value: 'expense', label: 'Expense' }]} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1">Currency</label>
          <PanelSelect value={filters.currency ?? ''} onChange={(v) => handleFilterChange('currency', v)} compact
            options={[{ value: '', label: 'All Currencies' }, { value: 'USD', label: 'USD' }, { value: 'IDR', label: 'IDR' }, { value: 'EUR', label: 'EUR' }, { value: 'GBP', label: 'GBP' }]} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1">From Date</label>
          <input type="date" value={filters.start_date || ''} onChange={(e) => handleFilterChange('start_date', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-black/50 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 text-gray-900 dark:text-neutral-200 transition-all duration-300" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1">To Date</label>
          <input type="date" value={filters.end_date || ''} onChange={(e) => handleFilterChange('end_date', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-black/50 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 text-gray-900 dark:text-neutral-200 transition-all duration-300" />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-neutral-800/60 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden shadow-xs">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions…"
            className="w-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 dark:border-neutral-600 dark:bg-neutral-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 dark:text-neutral-200 text-sm px-3 py-2"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-neutral-300">
            <thead className="bg-gray-50 dark:bg-neutral-900 text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
              <tr>
                {bulkDeleteMode && <th className="px-3 py-4 w-8"></th>}
                <th className="px-6 py-4">Transaction</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={bulkDeleteMode ? 6 : 5} className="px-6 py-8 text-center text-gray-400">No transactions found.</td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id}
                    className={`hover:bg-gray-50/50 dark:hover:bg-neutral-800/50 transition-colors ${bulkDeleteMode && selectedIds.includes(t.id) ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                    {bulkDeleteMode && (
                      <td className="px-3 py-4 text-center">
                        <button
                          onClick={() => setSelectedIds((prev) => prev.includes(t.id) ? prev.filter((i) => i !== t.id) : [...prev, t.id])}
                          className={`w-4 h-4 rounded border flex items-center justify-center ${selectedIds.includes(t.id) ? 'bg-red-500 border-red-500 text-white' : 'border-gray-400'}`}
                        >
                          {selectedIds.includes(t.id) && '✓'}
                        </button>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          t.type === 'income'
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                            : 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                        }`}>
                          {t.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{t.notes || 'No description'}</p>
                          <span className="text-xs text-gray-400 uppercase">{t.type}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {t.category ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: `${t.category.color || '#3B82F6'}20`, color: t.category.color || '#3B82F6' }}>
                          {t.category.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Uncategorized</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-neutral-400">{t.date}</td>
                    <td className="px-6 py-4 font-semibold">
                      <span className={t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                        {t.type === 'income' ? '+' : '-'} {formatAmountWithCurrency(t.amount, t.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!bulkDeleteMode && (
                          <>
                            <button onClick={() => onEditClick(t)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all duration-300">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(t.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all duration-300">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ImportModal isOpen={showImport} onClose={() => setShowImport(false)} resource="transactions" title="Import Transactions" onSuccess={refresh} />
      <BulkInsertModal isOpen={showBulk} onClose={() => setShowBulk(false)} resource="transactions" title="Bulk Insert Transactions" onSuccess={refresh}
        columns={[
          { key: 'date', label: 'Date', required: true, example: new Date().toISOString().split('T')[0] },
          { key: 'type', label: 'Type', required: true, example: 'expense' },
          { key: 'amount', label: 'Amount', required: true, example: '25.50' },
          { key: 'currency', label: 'Currency', example: 'USD' },
          { key: 'notes', label: 'Notes', example: 'Groceries' },
        ]} />
    </div>
  );
};
