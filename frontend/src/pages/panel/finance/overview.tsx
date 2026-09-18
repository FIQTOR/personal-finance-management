import FinanceWrapper from '@/components/finance/FinanceWrapper';
import { FinanceDashboard } from '@/components/finance/FinanceDashboard';
import { TbLayoutDashboard } from 'react-icons/tb';
import { useLanguage } from '@/context/LanguageContext';

export default function OverviewPage() {
  const { t } = useLanguage();

  return (
    <FinanceWrapper>
      <div className="flex flex-col gap-3 mb-4 sm:mb-6 relative z-10 shrink-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h1 className="text-lg sm:text-xl font-bold text-gray-700 dark:text-neutral-100 flex items-center gap-2 drop-shadow-lg">
              <TbLayoutDashboard className="text-gray-700 dark:text-neutral-300" />
              {t('overview')}
            </h1>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 flex items-center gap-2">
              <span>Personal Finance Dashboard</span>
            </div>
          </div>
        </div>
      </div>
      <FinanceDashboard />
    </FinanceWrapper>
  );
}
