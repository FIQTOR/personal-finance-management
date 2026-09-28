/**
 * Shared helpers for the import/export progress + validation feedback UI.
 *
 * Kept in a plain module (no React) so the components that consume it can stay
 * component-only for fast-refresh, and so the logic is unit-testable.
 */

export type TransferStep = 'idle' | 'parsing' | 'preview' | 'importing' | 'done'

export interface ImportRowError {
    row: number
    name?: string
    message: string
}

/** Localised step labels resolved via the `t()` helper. */
export const transferStepLabels = (t: (key: string) => string): Record<TransferStep, string> => ({
    idle: '',
    parsing: t('parsing'),
    preview: t('preview'),
    importing: t('importing'),
    done: t('done'),
})

/** Ordered stepper steps (idle excluded). */
export const TRANSFER_STEPS: TransferStep[] = ['parsing', 'preview', 'importing', 'done']

/** Download a set of failed rows + their error message as a CSV file. */
export const downloadFailedRows = (errors: ImportRowError[], filename = 'failed_rows'): void => {
    if (errors.length === 0) return
    const headers = ['row', 'name', 'message']
    const escape = (val: unknown) => `"${('' + (val ?? '')).replace(/"/g, '""')}"`
    const lines = [
        headers.map(escape).join(','),
        ...errors.map((e) => [e.row, e.name ?? '', e.message].map(escape).join(',')),
    ]
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
}

export interface BulkField {
    key: string
    label: string
    required?: boolean
}

export interface BulkValidationSummary<T> {
    validCount: number
    invalidCount: number
    items: T[]
    errors: ImportRowError[]
}

/**
 * Split candidate rows into valid items + per-row validation errors, checking
 * that every `required` field is non-empty. Used by BulkInsertModal to surface
 * valid/invalid counts before submit.
 */
export const validateBulkRows = <T extends Record<string, unknown>>(
    rows: T[],
    fields: BulkField[]
): BulkValidationSummary<T> => {
    const items: T[] = []
    const errors: ImportRowError[] = []
    const firstKey = fields[0]?.key

    rows.forEach((row, idx) => {
        const missing = fields.filter((f) => f.required && !String(row[f.key] ?? '').trim())
        if (missing.length > 0) {
            const name = firstKey ? String(row[firstKey] ?? '') : ''
            errors.push({
                row: idx + 1,
                name: name || '-',
                message: `Missing required: ${missing.map((m) => m.label).join(', ')}`,
            })
            return
        }
        items.push(row)
    })

    return { validCount: items.length, invalidCount: errors.length, items, errors }
}
