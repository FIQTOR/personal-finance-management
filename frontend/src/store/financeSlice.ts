import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axiosJWT from '@/utils/axiosJWT';
import AppConfig from '@/config/AppConfig';
import type { Category, Transaction, Budget, Goal, ApiResponse, TransactionFilter } from '@/types/finance';

interface FinanceState {
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  defaultCurrency: string;
  loading: boolean;
  error: string | null;
}

const initialState: FinanceState = {
  categories: [],
  transactions: [],
  budgets: [],
  goals: [],
  defaultCurrency: 'USD',
  loading: false,
  error: null
};

export const fetchAppSettings = createAsyncThunk('finance/fetchAppSettings', async () => {
  try {
    const res = await axiosJWT.get(`${AppConfig.baseApiUrl}/settings`);
    return res.data?.data?.default_currency || 'USD';
  } catch {
    return 'USD';
  }
});

// Categories Async Thunks
export const fetchCategories = createAsyncThunk('finance/fetchCategories', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosJWT.get<ApiResponse<Category[]>>(`${AppConfig.baseApiUrl}/categories`);
    return res.data.data;
  } catch (err: unknown) {
    const errorMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to fetch categories';
    return rejectWithValue(errorMsg);
  }
});

export const createCategory = createAsyncThunk('finance/createCategory', async (data: Partial<Category>, { rejectWithValue }) => {
  try {
    const res = await axiosJWT.post<ApiResponse<Category>>(`${AppConfig.baseApiUrl}/categories`, data);
    return res.data.data;
  } catch (err: unknown) {
    const errorMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to create category';
    return rejectWithValue(errorMsg);
  }
});

// Transactions Async Thunks
export const fetchTransactions = createAsyncThunk('finance/fetchTransactions', async (filter: TransactionFilter | void, { rejectWithValue }) => {
  try {
    const res = await axiosJWT.get<ApiResponse<Transaction[]>>(`${AppConfig.baseApiUrl}/transactions`, { params: filter || {} });
    return res.data.data;
  } catch (err: unknown) {
    const errorMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to fetch transactions';
    return rejectWithValue(errorMsg);
  }
});

export const createTransaction = createAsyncThunk('finance/createTransaction', async (data: Partial<Transaction>, { rejectWithValue }) => {
  try {
    const res = await axiosJWT.post<ApiResponse<Transaction>>(`${AppConfig.baseApiUrl}/transactions`, data);
    return res.data.data;
  } catch (err: unknown) {
    const errorMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to create transaction';
    return rejectWithValue(errorMsg);
  }
});

export const updateTransaction = createAsyncThunk('finance/updateTransaction', async ({ id, data }: { id: number; data: Partial<Transaction> }, { rejectWithValue }) => {
  try {
    const res = await axiosJWT.put<ApiResponse<Transaction>>(`${AppConfig.baseApiUrl}/transactions/${id}`, data);
    return res.data.data;
  } catch (err: unknown) {
    const errorMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update transaction';
    return rejectWithValue(errorMsg);
  }
});

export const deleteTransaction = createAsyncThunk('finance/deleteTransaction', async (id: number, { rejectWithValue }) => {
  try {
    await axiosJWT.delete<ApiResponse<{ id: number }>>(`${AppConfig.baseApiUrl}/transactions/${id}`);
    return id;
  } catch (err: unknown) {
    const errorMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to delete transaction';
    return rejectWithValue(errorMsg);
  }
});

// Budgets Async Thunks
export const fetchBudgets = createAsyncThunk('finance/fetchBudgets', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosJWT.get<ApiResponse<Budget[]>>(`${AppConfig.baseApiUrl}/budgets`);
    return res.data.data;
  } catch (err: unknown) {
    const errorMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to fetch budgets';
    return rejectWithValue(errorMsg);
  }
});

export const createBudget = createAsyncThunk('finance/createBudget', async (data: Partial<Budget>, { rejectWithValue }) => {
  try {
    const res = await axiosJWT.post<ApiResponse<Budget>>(`${AppConfig.baseApiUrl}/budgets`, data);
    return res.data.data;
  } catch (err: unknown) {
    const errorMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to create budget';
    return rejectWithValue(errorMsg);
  }
});

export const updateBudget = createAsyncThunk('finance/updateBudget', async ({ id, data }: { id: number; data: Partial<Budget> }, { rejectWithValue }) => {
  try {
    const res = await axiosJWT.put<ApiResponse<Budget>>(`${AppConfig.baseApiUrl}/budgets/${id}`, data);
    return res.data.data;
  } catch (err: unknown) {
    const errorMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update budget';
    return rejectWithValue(errorMsg);
  }
});

export const deleteBudget = createAsyncThunk('finance/deleteBudget', async (id: number, { rejectWithValue }) => {
  try {
    await axiosJWT.delete<ApiResponse<{ id: number }>>(`${AppConfig.baseApiUrl}/budgets/${id}`);
    return id;
  } catch (err: unknown) {
    const errorMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to delete budget';
    return rejectWithValue(errorMsg);
  }
});

// Goals Async Thunks
export const fetchGoals = createAsyncThunk('finance/fetchGoals', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosJWT.get<ApiResponse<Goal[]>>(`${AppConfig.baseApiUrl}/goals`);
    return res.data.data;
  } catch (err: unknown) {
    const errorMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to fetch goals';
    return rejectWithValue(errorMsg);
  }
});

export const createGoal = createAsyncThunk('finance/createGoal', async (data: Partial<Goal>, { rejectWithValue }) => {
  try {
    const res = await axiosJWT.post<ApiResponse<Goal>>(`${AppConfig.baseApiUrl}/goals`, data);
    return res.data.data;
  } catch (err: unknown) {
    const errorMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to create goal';
    return rejectWithValue(errorMsg);
  }
});

export const updateGoal = createAsyncThunk('finance/updateGoal', async ({ id, data }: { id: number; data: Partial<Goal> }, { rejectWithValue }) => {
  try {
    const res = await axiosJWT.put<ApiResponse<Goal>>(`${AppConfig.baseApiUrl}/goals/${id}`, data);
    return res.data.data;
  } catch (err: unknown) {
    const errorMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update goal';
    return rejectWithValue(errorMsg);
  }
});

export const deleteGoal = createAsyncThunk('finance/deleteGoal', async (id: number, { rejectWithValue }) => {
  try {
    await axiosJWT.delete<ApiResponse<{ id: number }>>(`${AppConfig.baseApiUrl}/goals/${id}`);
    return id;
  } catch (err: unknown) {
    const errorMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to delete goal';
    return rejectWithValue(errorMsg);
  }
});

const financeSlice = createSlice({
  name: 'finance',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Categories
      .addCase(fetchCategories.fulfilled, (state, action: PayloadAction<Category[]>) => {
        state.categories = action.payload;
      })
      .addCase(createCategory.fulfilled, (state, action: PayloadAction<Category>) => {
        state.categories.push(action.payload);
      })
      // Transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTransactions.fulfilled, (state, action: PayloadAction<Transaction[]>) => {
        state.loading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createTransaction.fulfilled, (state, action: PayloadAction<Transaction>) => {
        state.transactions.unshift(action.payload);
      })
      .addCase(updateTransaction.fulfilled, (state, action: PayloadAction<Transaction>) => {
        const index = state.transactions.findIndex(t => t.id === action.payload.id);
        if (index !== -1) state.transactions[index] = action.payload;
      })
      .addCase(deleteTransaction.fulfilled, (state, action: PayloadAction<number>) => {
        state.transactions = state.transactions.filter(t => t.id !== action.payload);
      })
      // Budgets
      .addCase(fetchBudgets.fulfilled, (state, action: PayloadAction<Budget[]>) => {
        state.budgets = action.payload;
      })
      .addCase(createBudget.fulfilled, (state, action: PayloadAction<Budget>) => {
        state.budgets.push(action.payload);
      })
      .addCase(updateBudget.fulfilled, (state, action: PayloadAction<Budget>) => {
        const index = state.budgets.findIndex(b => b.id === action.payload.id);
        if (index !== -1) state.budgets[index] = action.payload;
      })
      .addCase(deleteBudget.fulfilled, (state, action: PayloadAction<number>) => {
        state.budgets = state.budgets.filter(b => b.id !== action.payload);
      })
      // Goals
      .addCase(fetchGoals.fulfilled, (state, action: PayloadAction<Goal[]>) => {
        state.goals = action.payload;
      })
      .addCase(createGoal.fulfilled, (state, action: PayloadAction<Goal>) => {
        state.goals.push(action.payload);
      })
      .addCase(updateGoal.fulfilled, (state, action: PayloadAction<Goal>) => {
        const index = state.goals.findIndex(g => g.id === action.payload.id);
        if (index !== -1) state.goals[index] = action.payload;
      })
      .addCase(deleteGoal.fulfilled, (state, action: PayloadAction<number>) => {
        state.goals = state.goals.filter(g => g.id !== action.payload);
      })
      .addCase(fetchAppSettings.fulfilled, (state, action: PayloadAction<string>) => {
        state.defaultCurrency = action.payload;
      });
  }
});

export default financeSlice.reducer;
