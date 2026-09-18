import { useState, useEffect } from 'react';
import { Download, Filter, Plus, Edit2, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTransactions, deleteTransaction } from '@/store/financeSlice';
import type { Transaction, TransactionFilter } from '@/types/finance';
import axiosJWT from '@/utils/axiosJWT';
import AppConfig from '@/config/AppConfig';

interface TransactionListProps {
  onAddClick: () => void;
  onEditClick: (transaction: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ onAddClick, onEditClick }) => {
  const dispatch = useAppDispatch();
  const { transactions, categories, loading } = useAppSelector((state) => state.finance);

  const [filters, setFilters] = useState<TransactionFilter>({
    category_id: '',
    currency: '',
    type: '',
    start_date: '',
    end_date: '',
  });

  const [isExporting, setIsExporting] = useState<boolean>(false);

  useEffect(() => {
    dispatch(fetchTransactions(filters));
  }, [dispatch, filters]);

  const handleFilterChange = (key: keyof TransactionFilter, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      dispatch(deleteTransaction(id));
    }
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

      const response = await axiosJWT.get(`${AppConfig.baseApiUrl}/transactions/export?${queryParams.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Failed to export transactions');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transaction History</h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400">View, filter, and export all financial records</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            {isExporting ? 'Exporting...' : 'Export to Excel'}
          </button>
          <button
            onClick={onAddClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Transaction
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-neutral-800/60 p-4 rounded-2xl border border-gray-100 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category
          </label>
          <select
            value={filters.category_id}
            onChange={(e) => handleFilterChange('category_id', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-white"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1">Type</label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-white"
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1">Currency</label>
          <select
            value={filters.currency}
            onChange={(e) => handleFilterChange('currency', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-white"
          >
            <option value="">All Currencies</option>
            <option value="USD">USD</option>
            <option value="IDR">IDR</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1">From Date</label>
          <input
            type="date"
            value={filters.start_date || ''}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1">To Date</label>
          <input
            type="date"
            value={filters.end_date || ''}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-neutral-800/60 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-neutral-300">
            <thead className="bg-gray-50 dark:bg-neutral-900 text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Transaction</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            t.type === 'income'
                              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                              : 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                          }`}
                        >
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
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${t.category.color || '#3B82F6'}20`,
                            color: t.category.color || '#3B82F6',
                          }}
                        >
                          {t.category.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Uncategorized</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-neutral-400">{t.date}</td>
                    <td className="px-6 py-4 font-semibold">
                      <span className={t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                        {t.type === 'income' ? '+' : '-'} {t.currency} {Number(t.amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEditClick(t)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
