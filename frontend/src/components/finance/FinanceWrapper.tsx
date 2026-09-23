import { useEffect, type ReactNode } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { fetchCategories, fetchTransactions, fetchBudgets, fetchGoals, fetchAppSettings } from '@/store/financeSlice';

interface FinanceWrapperProps {
  children?: ReactNode;
}

export default function FinanceWrapper({ children }: FinanceWrapperProps) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchAppSettings());
    dispatch(fetchCategories());
    dispatch(fetchTransactions());
    dispatch(fetchBudgets());
    dispatch(fetchGoals());
  }, [dispatch]);

  return (
    <div className="p-6 relative h-full space-y-6">

      {/* Main View */}
      {children}
    </div>
  );
}
