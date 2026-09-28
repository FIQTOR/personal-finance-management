import { describe, it, expect } from 'vitest';
import { validateBulkRows, transferStepLabels, TRANSFER_STEPS } from '@/utils/transfer';
import type { BulkField } from '@/utils/transfer';

const fields: BulkField[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'roleId', label: 'Role ID', required: false },
];

describe('transfer.validateBulkRows', () => {
  it('splits rows into valid items and per-row errors', () => {
    const rows = [
      { name: 'Alice', email: 'a@x.com', roleId: '1' },
      { name: '', email: 'b@x.com', roleId: '2' },
      { name: 'Carol', email: '', roleId: '' },
    ];
    const summary = validateBulkRows(rows, fields);
    expect(summary.validCount).toBe(1);
    expect(summary.invalidCount).toBe(2);
    expect(summary.items).toHaveLength(1);
    expect(summary.items[0]).toMatchObject({ name: 'Alice' });
    expect(summary.errors[0]).toMatchObject({ row: 2, message: 'Missing required: Name' });
    expect(summary.errors[1]).toMatchObject({ row: 3, message: 'Missing required: Email' });
  });

  it('returns an empty summary when nothing is provided', () => {
    const summary = validateBulkRows([], fields);
    expect(summary).toEqual({ validCount: 0, invalidCount: 0, items: [], errors: [] });
  });

  it('treats whitespace-only required values as missing', () => {
    const summary = validateBulkRows([{ name: '   ', email: 'x@y.com' }], fields);
    expect(summary.validCount).toBe(0);
    expect(summary.invalidCount).toBe(1);
  });
});

describe('transfer.transferStepLabels', () => {
  it('resolves labels via the t() helper and keeps a stable step order', () => {
    const labels = transferStepLabels((key) => `T:${key}`);
    expect(labels.parsing).toBe('T:parsing');
    expect(labels.done).toBe('T:done');
    expect(TRANSFER_STEPS).toEqual(['parsing', 'preview', 'importing', 'done']);
  });
});
