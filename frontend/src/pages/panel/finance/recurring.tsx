import FinanceWrapper from '@/components/finance/FinanceWrapper';
import { RecurringTransactionManager } from '@/components/finance/RecurringTransactionManager';
import { TbRepeat } from 'react-icons/tb';
import { useLanguage } from '@/context/useLanguage';
import { useAppSelector } from '@/store/hooks';

export default function RecurringPage() {
  const { t } = useLanguage();
  const { recurringTransactions } = useAppSelector((state) => state.finance);

  return (
    <FinanceWrapper>
      <div className="flex flex-col gap-3 mb-4 sm:mb-6 relative z-10 shrink-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h1 className="text-lg sm:text-xl font-bold text-gray-700 dark:text-neutral-100 flex items-center gap-2 drop-shadow-lg">
              <TbRepeat className="text-gray-700 dark:text-neutral-300" />
              {t('recurring')}
            </h1>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 flex items-center gap-2">
              <span>Showing {recurringTransactions.length} records</span>
            </div>
          </div>
        </div>
      </div>
      <RecurringTransactionManager />
    </FinanceWrapper>
  );
}
