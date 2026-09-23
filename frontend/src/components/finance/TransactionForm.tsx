import { useState } from 'react';
import { X, PlusCircle, Save } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createTransaction, updateTransaction } from '@/store/financeSlice';
import type { Transaction, TransactionType } from '@/types/finance';
import PanelSelect from '@/components/PanelSelect';
import { useNotification } from '@/context/useNotification';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Transaction | null;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ isOpen, onClose, initialData }) => {
  const dispatch = useAppDispatch();
  const { notify } = useNotification();
  const { categories, defaultCurrency } = useAppSelector((state) => state.finance);

  const [type, setType] = useState<TransactionType>('expense');
  const [categoryId, setCategoryId] = useState<number | string>('');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>(defaultCurrency || 'USD');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [prevInitialData, setPrevInitialData] = useState<Transaction | null | undefined>(undefined);

  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    if (initialData) {
      setType(initialData.type);
      setCategoryId(initialData.category_id || '');
      setAmount(String(initialData.amount));
      setCurrency(initialData.currency);
      setDate(initialData.date);
      setNotes(initialData.notes || '');
    } else {
      setType('expense');
      setCategoryId('');
      setAmount('');
      setCurrency(defaultCurrency || 'USD');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      type,
      category_id: categoryId ? Number(categoryId) : undefined,
      amount: parseFloat(amount),
      currency,
      date,
      notes,
    };

    try {
      if (initialData) {
        await dispatch(updateTransaction({ id: initialData.id, data: payload })).unwrap();
        notify('Transaction updated successfully', 'success');
      } else {
        await dispatch(createTransaction(payload)).unwrap();
        notify('Transaction created successfully', 'success');
      }
      onClose();
    } catch (error: unknown) {
      notify(typeof error === 'string' ? error : 'Failed to save transaction', 'error');
    }
  };

  const defaultCategories = type === 'income'
    ? [{ id: -1, name: 'Salary' }, { id: -2, name: 'Freelance' }, { id: -3, name: 'Investment' }]
    : [{ id: -4, name: 'Food & Dining' }, { id: -5, name: 'Bills & Utilities' }, { id: -6, name: 'Entertainment' }, { id: -7, name: 'Shopping' }];

  const availableCategories = categories.filter((c) => c.type === type).length > 0
    ? categories.filter((c) => c.type === type)
    : defaultCategories;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-neutral-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-neutral-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            {initialData ? <Save className="w-5 h-5 text-blue-500" /> : <PlusCircle className="w-5 h-5 text-green-500" />}
            {initialData ? 'Edit Transaction' : 'New Transaction'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-neutral-800 rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 text-sm font-medium rounded-lg transition-colors ${
                type === 'expense' ? 'bg-red-500 text-white shadow-xs' : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 text-sm font-medium rounded-lg transition-colors ${
                type === 'income' ? 'bg-green-500 text-white shadow-xs' : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900'
              }`}
            >
              Income
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Currency</label>
              <PanelSelect
                value={currency}
                onChange={(v) => setCurrency(v)}
                compact
                options={[
                  { value: 'USD', label: 'USD ($)' },
                  { value: 'IDR', label: 'IDR (Rp)' },
                  { value: 'EUR', label: 'EUR (€)' },
                  { value: 'GBP', label: 'GBP (£)' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Category</label>
            <PanelSelect
              value={categoryId}
              onChange={(v) => setCategoryId(v)}
              placeholder="Uncategorized"
              options={[
                { value: '', label: 'Uncategorized' },
                ...availableCategories.map((c) => ({ value: c.id > 0 ? c.id : '', label: c.name })),
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium rounded-xl bg-blue-600/90 backdrop-blur-md border border-blue-400/40 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/30 transition-all duration-300"
            >
              {initialData ? 'Save Changes' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
