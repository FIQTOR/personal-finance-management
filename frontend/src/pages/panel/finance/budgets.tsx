import FinanceWrapper from '@/components/finance/FinanceWrapper';
import { BudgetManager } from '@/components/finance/BudgetManager';

export default function BudgetsPage() {
  return (
    <FinanceWrapper>
      <BudgetManager />
    </FinanceWrapper>
  );
}
