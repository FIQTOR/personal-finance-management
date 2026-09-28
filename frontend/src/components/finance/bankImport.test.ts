import { describe, it, expect } from 'vitest';
import {
  suggestMapping,
  emptyMapping,
  normalizeDate,
  normalizeAmount,
  normalizeType,
  matchCategoryId,
  normalizeRow,
  detectDuplicates,
  toBulkItems,
} from '@/components/finance/bankImport';
import type { NormalizedRow } from '@/components/finance/bankImport';
import type { Category, Transaction } from '@/types/finance';

const categories: Category[] = [
  { id: 1, user_id: 1, name: 'Food & Dining', type: 'expense' },
  { id: 2, user_id: 1, name: 'Salary', type: 'income' },
  { id: 3, user_id: 1, name: 'Transport', type: 'expense' },
];

const existing: Transaction[] = [
  { id: 10, user_id: 1, amount: 25.5, currency: 'USD', type: 'expense', date: '2024-01-15', notes: 'Groceries' },
];

describe('bankImport.suggestMapping', () => {
  it('matches heuristic keywords to target fields', () => {
    const mapping = suggestMapping(['Date', 'Amount', 'Description', 'Type', 'Category', 'Currency']);
    expect(mapping).toEqual({
      date: 'Date',
      amount: 'Amount',
      type: 'Type',
      currency: 'Currency',
      notes: 'Description',
      category: 'Category',
    });
  });

  it('supports indonesian keywords', () => {
    const mapping = suggestMapping(['tanggal', 'jumlah', 'keterangan', 'tipe', 'kategori', 'mata uang']);
    expect(mapping).toEqual({
      date: 'tanggal',
      amount: 'jumlah',
      type: 'tipe',
      currency: 'mata uang',
      notes: 'keterangan',
      category: 'kategori',
    });
  });

  it('never assigns the same source column twice', () => {
    const mapping = suggestMapping(['transaction date', 'total amount', 'notes']);
    expect(mapping.date).toBe('transaction date');
    expect(mapping.amount).toBe('total amount');
    expect(mapping.notes).toBe('notes');
    // "total amount" also contains no other keyword collision
    const values = Object.values(mapping).filter(Boolean);
    expect(new Set(values).size).toBe(values.length);
  });

  it('returns an empty mapping when nothing matches', () => {
    expect(suggestMapping(['foo', 'bar'])).toEqual(emptyMapping());
  });
});

describe('bankImport.normalizeDate', () => {
  it('keeps ISO dates', () => {
    expect(normalizeDate('2024-01-31')).toBe('2024-01-31');
  });

  it('parses ISO datetimes', () => {
    expect(normalizeDate('2024-01-31T10:00:00Z')).toBe('2024-01-31');
  });

  it('parses DD/MM/YYYY when the day is > 12', () => {
    expect(normalizeDate('25/12/2024')).toBe('2024-12-25');
  });

  it('parses MM/DD/YYYY when the first part is <= 12', () => {
    expect(normalizeDate('01/31/2024')).toBe('2024-01-31');
  });

  it('returns null for invalid dates', () => {
    expect(normalizeDate('not-a-date')).toBeNull();
    expect(normalizeDate('')).toBeNull();
    expect(normalizeDate('2024-13-40')).toBeNull();
  });
});

describe('bankImport.normalizeAmount', () => {
  it('parses plain numbers', () => {
    expect(normalizeAmount('1234.56')).toBe(1234.56);
  });

  it('strips currency symbols and thousands separators', () => {
    expect(normalizeAmount('$1,234.56')).toBe(1234.56);
    expect(normalizeAmount('Rp 15.000')).toBe(15000);
  });

  it('handles comma decimals', () => {
    expect(normalizeAmount('1.234,56')).toBe(1234.56);
  });

  it('returns null for non-numeric values', () => {
    expect(normalizeAmount('abc')).toBeNull();
    expect(normalizeAmount('')).toBeNull();
  });
});

describe('bankImport.normalizeType', () => {
  it('normalizes income keywords', () => {
    expect(normalizeType('income')).toBe('income');
    expect(normalizeType('CREDIT')).toBe('income');
    expect(normalizeType('in')).toBe('income');
    expect(normalizeType('pemasukan')).toBe('income');
  });

  it('normalizes expense keywords', () => {
    expect(normalizeType('expense')).toBe('expense');
    expect(normalizeType('debit')).toBe('expense');
    expect(normalizeType('out')).toBe('expense');
    expect(normalizeType('pengeluaran')).toBe('expense');
  });

  it('returns null for unknown values', () => {
    expect(normalizeType('sideways')).toBeNull();
    expect(normalizeType('')).toBeNull();
  });
});

describe('bankImport.matchCategoryId', () => {
  it('matches category names case-insensitively', () => {
    expect(matchCategoryId('food & dining', categories)).toBe(1);
    expect(matchCategoryId('  TRANSPORT ', categories)).toBe(3);
  });

  it('returns undefined when there is no match', () => {
    expect(matchCategoryId('nope', categories)).toBeUndefined();
    expect(matchCategoryId('', categories)).toBeUndefined();
  });
});

describe('bankImport.normalizeRow', () => {
  const mapping = { ...emptyMapping(), date: 'Date', amount: 'Amount', type: 'Type', currency: 'Currency', notes: 'Desc', category: 'Category' };

  it('normalizes a full row', () => {
    const row = normalizeRow(
      { Date: '25/12/2024', Amount: '$1,234.56', Type: 'credit', Currency: 'EUR', Desc: ' Bonus ', Category: 'Salary' },
      { mapping, defaultType: 'expense', defaultCurrency: 'USD', categories },
    );
    expect(row.date).toBe('2024-12-25');
    expect(row.amount).toBe(1234.56);
    expect(row.type).toBe('income');
    expect(row.currency).toBe('EUR');
    expect(row.notes).toBe('Bonus');
    expect(row.category_id).toBe(2);
    expect(row.errors).toEqual([]);
  });

  it('falls back to defaults and flags invalid cells', () => {
    const row = normalizeRow(
      { Date: 'bad', Amount: '-5', Type: 'unknown' },
      { mapping, defaultType: 'expense', defaultCurrency: 'IDR', categories },
    );
    expect(row.date).toBe('');
    expect(row.amount).toBe(-5);
    expect(row.type).toBe('expense');
    expect(row.currency).toBe('IDR');
    expect(row.errors).toContain('Invalid or missing date');
    expect(row.errors).toContain('Amount must be greater than 0');
  });

  it('applies startIndex and builds a duplicate key', () => {
    const row = normalizeRow(
      { Date: '2024-01-15', Amount: '25.50', Type: 'expense', Desc: 'Groceries' },
      { mapping, defaultType: 'expense', defaultCurrency: 'USD', categories, startIndex: 1 },
      0,
    );
    expect(row.index).toBe(1);
    expect(row.key).toBe('2024-01-15|25.5|expense|groceries');
  });
});

describe('bankImport.detectDuplicates', () => {
  const base = (partial: Partial<NormalizedRow>): NormalizedRow => ({
    index: 0, date: '', amount: 0, type: 'expense', currency: 'USD', notes: '', category: '',
    category_id: undefined, key: '', errors: [], ...partial,
  });

  it('detects existing-transaction duplicates', () => {
    const rows = [base({ index: 1, date: '2024-01-15', amount: 25.5, type: 'expense', notes: 'groceries', key: '2024-01-15|25.5|expense|groceries' })];
    const result = detectDuplicates(rows, existing);
    expect(result.duplicateIndexes).toEqual([0]);
    expect(result.duplicateCount).toBe(1);
    expect(result.newCount).toBe(0);
  });

  it('detects in-file duplicates', () => {
    const rows = [
      base({ index: 1, date: '2024-02-01', amount: 10, type: 'expense', notes: 'coffee', key: '2024-02-01|10|expense|coffee' }),
      base({ index: 2, date: '2024-02-01', amount: 10, type: 'expense', notes: 'Coffee', key: '2024-02-01|10|expense|coffee' }),
      base({ index: 3, date: '2024-02-02', amount: 10, type: 'expense', notes: 'tea', key: '2024-02-02|10|expense|tea' }),
    ];
    const result = detectDuplicates(rows, existing);
    expect(result.duplicateIndexes).toEqual([1]);
    expect(result.newCount).toBe(2);
  });

  it('flags both rows of an in-file duplicate pair', () => {
    const rows = [base({ index: 1, key: 'k' }), base({ index: 2, key: 'k' }), base({ index: 3, key: 'k' })];
    const result = detectDuplicates(rows, existing);
    expect(result.duplicateIndexes).toEqual([1, 2]);
    expect(result.duplicateKeys.has('k')).toBe(true);
    expect(result.newCount).toBe(1);
  });
});

describe('bankImport.toBulkItems', () => {
  it('maps normalized rows to the bulk payload', () => {
    const rows: NormalizedRow[] = [
      { index: 1, date: '2024-01-15', amount: 25.5, type: 'expense', currency: 'USD', notes: 'Groceries', category: 'Food & Dining', category_id: 1, key: 'k', errors: [] },
      { index: 2, date: '2024-01-16', amount: 5, type: 'expense', currency: 'USD', notes: '', category: '', category_id: undefined, key: 'k2', errors: [] },
    ];
    const items = toBulkItems(rows);
    expect(items[0]).toEqual({ date: '2024-01-15', amount: 25.5, type: 'expense', currency: 'USD', notes: 'Groceries', category_id: 1 });
    expect(items[1]).toEqual({ date: '2024-01-16', amount: 5, type: 'expense', currency: 'USD', notes: '' });
  });
});
