export type TransactionType = 'income' | 'expense';

export interface Category {
  id: number;
  user_id: number;
  name: string;
  type: TransactionType;
  icon?: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  category_id?: number | null;
  amount: number | string;
  currency: string;
  type: TransactionType;
  date: string;
  notes?: string;
  category?: Category;
  created_at?: string;
  updated_at?: string;
}

export interface Budget {
  id: number;
  user_id: number;
  category_id?: number | null;
  limit_amount: number | string;
  currency: string;
  start_date: string;
  end_date: string;
  category?: Category;
  created_at?: string;
  updated_at?: string;
}

export interface Goal {
  id: number;
  user_id: number;
  name: string;
  target_amount: number | string;
  current_amount: number | string;
  currency: string;
  deadline: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface TransactionFilter {
  category_id?: number | string;
  currency?: string;
  type?: TransactionType | '';
  start_date?: string;
  end_date?: string;
}
