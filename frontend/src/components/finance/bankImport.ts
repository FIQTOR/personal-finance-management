/**
 * Pure helpers for the guided bank-CSV importer (`BankImportModal`).
 *
 * Everything here is side-effect free so it can be unit tested in isolation:
 *  - `suggestMapping`     heuristic source-column → target-field detection
 *  - `normalizeRow`       string row → typed transaction draft (+ row errors)
 *  - `detectDuplicates`   in-file and existing-transaction duplicate detection
 *  - `matchCategoryId`    category name → id using the user's category list
 */
import type { Category, Transaction, TransactionType } from '@/types/finance'

/** Target fields the importer can map a source column onto. */
export type TargetField = 'date' | 'amount' | 'type' | 'currency' | 'notes' | 'category'

/** All target fields in display order. */
export const TARGET_FIELDS: TargetField[] = ['date', 'amount', 'type', 'currency', 'notes', 'category']

/** Fields that must be mapped before the import can continue. */
export const REQUIRED_FIELDS: TargetField[] = ['date', 'amount']

/** A map of target field → source column name (or `''` for "— none —"). */
export type ColumnMapping = Record<TargetField, string>

/** A normalized transaction draft ready to be committed. */
export interface NormalizedRow {
  /** 1-based index of the source row (header excluded). */
  index: number
  date: string
  amount: number
  type: TransactionType
  currency: string
  notes: string
  category: string
  category_id?: number
  /** Duplicate key used by `detectDuplicates`. */
  key: string
  errors: string[]
}

/** Human readable label for a target field. */
export const FIELD_LABELS: Record<TargetField, string> = {
  date: 'Date',
  amount: 'Amount',
  type: 'Type',
  currency: 'Currency',
  notes: 'Notes',
  category: 'Category',
}

/** Case-insensitive substring keywords that hint a source column belongs to a field. */
const FIELD_KEYWORDS: Record<TargetField, string[]> = {
  date: ['date', 'tanggal', 'tgl', 'waktu', 'time', 'posted'],
  amount: ['amount', 'jumlah', 'total', 'nominal', 'value', 'debit', 'credit', 'mutasi'],
  type: ['type', 'tipe', 'jenis', 'kategori transaksi', 'direction', 'flow'],
  currency: ['currency', 'mata uang', 'curr', 'ccy'],
  notes: ['desc', 'note', 'keterangan', 'memo', 'remark', 'detail', 'uraian'],
  category: ['category', 'kategori', 'group', 'grup'],
}

/**
 * Heuristically match each source column header to a target field.
 *
 * A source column is never assigned to more than one target field and a target
 * field is only filled once (first matching source column wins).
 */
export const suggestMapping = (sourceColumns: string[]): ColumnMapping => {
  const mapping = emptyMapping()
  const used = new Set<string>()
  for (const field of TARGET_FIELDS) {
    const keywords = FIELD_KEYWORDS[field]
    const match = sourceColumns.find((col) => {
      if (used.has(col)) return false
      const lower = col.toLowerCase().trim()
      return keywords.some((kw) => lower.includes(kw))
    })
    if (match) {
      mapping[field] = match
      used.add(match)
    }
  }
  return mapping
}

/** An empty mapping (all fields unmapped). */
export const emptyMapping = (): ColumnMapping => ({
  date: '', amount: '', type: '', currency: '', notes: '', category: '',
})

const pad = (n: number): string => String(n).padStart(2, '0')
const toDateString = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/**
 * Parse a free-form date value into `YYYY-MM-DD`.
 *
 * Supports ISO strings (`2024-01-31`), ISO datetimes, `DD/MM/YYYY` and
 * `MM/DD/YYYY` (disambiguated: a first part > 12 is treated as the day).
 * Returns `null` when the value is not a valid date.
 */
export const normalizeDate = (value: unknown): string | null => {
  const raw = String(value ?? '').trim()
  if (!raw) return null

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) {
    const d = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T00:00:00`)
    return Number.isNaN(d.getTime()) ? null : `${iso[1]}-${iso[2]}-${iso[3]}`
  }

  const slash = raw.match(/^(\d{1,4})[/.-](\d{1,2})[/.-](\d{1,4})$/)
  if (slash) {
    const [, a, b, c] = slash
    let year: number, month: number, day: number
    if (a.length === 4) {
      year = Number(a); month = Number(b); day = Number(c)
    } else {
      year = Number(c)
      if (year < 100) year += 2000
      if (Number(a) > 12) { day = Number(a); month = Number(b) }
      else { month = Number(a); day = Number(b) }
    }
    const d = new Date(year, month - 1, day)
    if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null
    return toDateString(d)
  }

  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : toDateString(parsed)
}

/**
 * Parse an amount value into a finite, positive number.
 * Handles thousands separators, currency symbols and `1.234,56` (EU) style.
 */
export const normalizeAmount = (value: unknown): number | null => {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  let cleaned = raw.replace(/[^0-9.,-]/g, '')
  if (!/\d/.test(cleaned)) return null
  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')
  if (lastComma !== -1 && lastDot !== -1) {
    // The rightmost separator is the decimal separator; strip the other.
    if (lastComma > lastDot) cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    else cleaned = cleaned.replace(/,/g, '')
  } else if (lastComma !== -1) {
    const decimals = cleaned.length - lastComma - 1
    cleaned = decimals === 3 && cleaned.split(',').length === 2 ? cleaned.replace(',', '') : cleaned.replace(',', '.')
  } else if (lastDot !== -1) {
    // Only dots: a single group of exactly 3 trailing digits is a thousands
    // separator (e.g. `15.000` → 15000), otherwise treat it as a decimal point.
    const decimals = cleaned.length - lastDot - 1
    const groups = cleaned.split('.')
    if (decimals === 3 && groups.length === 2) cleaned = groups.join('')
    else if (groups.length > 2) cleaned = groups.join('')
  }
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

/**
 * Normalize a type value.
 *
 * `in` / `income` / `credit` / `pemasukan` → `income`;
 * `out` / `expense` / `debit` / `pengeluaran` → `expense`.
 * Returns `null` when the value doesn't match a known keyword.
 */
export const normalizeType = (value: unknown): TransactionType | null => {
  const raw = String(value ?? '').trim().toLowerCase()
  if (!raw) return null
  if (['in', 'income', 'credit', 'cr', 'pemasukan', 'masuk', '+'].includes(raw)) return 'income'
  if (['out', 'expense', 'debit', 'dr', 'pengeluaran', 'keluar', '-'].includes(raw)) return 'expense'
  if (raw.includes('income') || raw.includes('pemasukan') || raw.includes('credit')) return 'income'
  if (raw.includes('expense') || raw.includes('pengeluaran') || raw.includes('debit')) return 'expense'
  return null
}

/** Compute the duplicate key for a transaction draft. */
export const duplicateKey = (date: string, amount: number, type: TransactionType, notes: string): string =>
  `${date}|${amount}|${type}|${notes.trim().toLowerCase()}`

/**
 * Match a free-form category name to one of the user's categories (case and
 * whitespace insensitive). Returns `undefined` when there is no match.
 */
export const matchCategoryId = (name: string, categories: Category[]): number | undefined => {
  const target = name.trim().toLowerCase()
  if (!target) return undefined
  const found = categories.find((c) => c.name.trim().toLowerCase() === target)
  return found?.id
}

/** Normalize a type value that should fall back to a default. */
export const resolveType = (value: unknown, fallback: TransactionType): TransactionType =>
  normalizeType(value) ?? fallback

export interface NormalizeOptions {
  /** Source column name for each target field. */
  mapping: ColumnMapping
  /** Type used when no type column is mapped / the value is unrecognized. */
  defaultType: TransactionType
  /** Currency used when no currency column is mapped / the value is empty. */
  defaultCurrency: string
  /** Categories used to resolve the `category` name to an id. */
  categories: Category[]
  /** 1-based index offset applied to the produced `index` value. */
  startIndex?: number
}

/**
 * Normalize a raw source row into a typed draft, collecting per-row errors.
 * `index` is 0-based relative to the provided rows (add `startIndex` to align
 * with the original file rows).
 */
export const normalizeRow = (
  row: Record<string, unknown>,
  options: NormalizeOptions,
  index = 0,
): NormalizedRow => {
  const { mapping, defaultType, defaultCurrency, categories, startIndex = 0 } = options
  const read = (field: TargetField): unknown => (mapping[field] ? row[mapping[field]] : undefined)

  const errors: string[] = []

  const date = normalizeDate(read('date'))
  if (!date) errors.push('Invalid or missing date')

  const amount = normalizeAmount(read('amount'))
  if (amount === null) errors.push('Invalid amount')
  else if (amount <= 0) errors.push('Amount must be greater than 0')

  const type = resolveType(read('type'), defaultType)

  const currencyRaw = String(read('currency') ?? '').trim()
  const currency = currencyRaw || defaultCurrency

  const notes = String(read('notes') ?? '').trim()

  const category = String(read('category') ?? '').trim()
  const category_id = matchCategoryId(category, categories)

  const safeDate = date ?? ''
  const safeAmount = amount ?? 0

  return {
    index: index + startIndex,
    date: safeDate,
    amount: safeAmount,
    type,
    currency,
    notes,
    category,
    category_id,
    key: duplicateKey(safeDate, safeAmount, type, notes),
    errors,
  }
}

export interface DuplicateResult {
  /** Keys that appear more than once (existing or in-file). */
  duplicateKeys: Set<string>
  /** Indices (into the normalized rows array) that are duplicates. */
  duplicateIndexes: number[]
  newCount: number
  duplicateCount: number
}

/**
 * Detect duplicates.
 *
 * A row is a duplicate when a key already exists among the user's existing
 * transactions OR when it repeats an earlier row within the same file.
 */
export const detectDuplicates = (
  rows: NormalizedRow[],
  existingTransactions: Transaction[],
): DuplicateResult => {
  const existingKeys = new Set(
    existingTransactions.map((t) => duplicateKey(t.date, Number(t.amount), t.type, String(t.notes ?? ''))),
  )
  const seen = new Set<string>()
  const duplicateKeys = new Set<string>()
  const duplicateIndexes: number[] = []

  rows.forEach((row, i) => {
    if (existingKeys.has(row.key) || seen.has(row.key)) {
      duplicateKeys.add(row.key)
      duplicateIndexes.push(i)
    }
    seen.add(row.key)
  })

  return {
    duplicateKeys,
    duplicateIndexes,
    newCount: rows.length - duplicateIndexes.length,
    duplicateCount: duplicateIndexes.length,
  }
}

/** Payload shape expected by `POST /transactions/bulk`. */
export interface BulkTransactionItem {
  date: string
  amount: number
  type: TransactionType
  currency: string
  notes: string
  category_id?: number
}

/** Map normalized rows to the bulk endpoint payload (dropping internal fields). */
export const toBulkItems = (rows: NormalizedRow[]): BulkTransactionItem[] =>
  rows.map((row) => ({
    date: row.date,
    amount: row.amount,
    type: row.type,
    currency: row.currency,
    notes: row.notes,
    ...(row.category_id !== undefined ? { category_id: row.category_id } : {}),
  }))
