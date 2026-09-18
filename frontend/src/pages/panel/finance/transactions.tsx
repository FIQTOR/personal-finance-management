import { useState } from 'react';
import FinanceWrapper from '@/components/finance/FinanceWrapper';
import { TransactionList } from '@/components/finance/TransactionList';
import { TransactionForm } from '@/components/finance/TransactionForm';
import type { Transaction } from '@/types/finance';
import { TbReceipt } from 'react-icons/tb';
import { useLanguage } from '@/context/LanguageContext';
import { useAppSelector } from '@/store/hooks';

export default function TransactionsPage() {
  const { t } = useLanguage();
  const { transactions } = useAppSelector((state) => state.finance);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleOpenNewTransaction = () => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  };

  const handleOpenEditTransaction = (tr: Transaction) => {
    setEditingTransaction(tr);
    setIsFormOpen(true);
  };

  return (
    <FinanceWrapper>
      <div className="flex flex-col gap-3 mb-4 sm:mb-6 relative z-10 shrink-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h1 className="text-lg sm:text-xl font-bold text-gray-700 dark:text-neutral-100 flex items-center gap-2 drop-shadow-lg">
              <TbReceipt className="text-gray-700 dark:text-neutral-300" />
              {t('transactions')}
            </h1>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 flex items-center gap-2">
              <span>Showing {transactions.length} records</span>
            </div>
          </div>
        </div>
      </div>
      <TransactionList onAddClick={handleOpenNewTransaction} onEditClick={handleOpenEditTransaction} />
      <TransactionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={editingTransaction}
      />
    </FinanceWrapper>
  );
}
