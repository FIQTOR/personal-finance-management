/**
 * Period configuration shared by the PeriodSelector component and consumers.
 *
 * Kept separate from `PeriodSelector.tsx` so that file only exports a React
 * component (satisfies react-refresh/only-export-components).
 */

export type PeriodValue = '7d' | '30d' | '90d' | '1y'

export interface PeriodOption {
    value: PeriodValue
    label: string
}

export const DEFAULT_PERIOD_OPTIONS: PeriodOption[] = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last 12 months' },
]

/** Read a persisted period (defaults to '30d') — for useState initialisers. */
export const readStoredPeriod = (
    storageKey: string,
    options: PeriodValue[] = DEFAULT_PERIOD_OPTIONS.map((o) => o.value)
): PeriodValue => {
    if (typeof window === 'undefined') return '30d'
    const saved = window.localStorage.getItem(storageKey) as PeriodValue | null
    return saved && options.includes(saved) ? saved : '30d'
}

/** Map a period value to a number of days (used for client-side date ranges). */
export const periodToDays = (period: PeriodValue): number => {
    switch (period) {
        case '7d': return 7
        case '90d': return 90
        case '1y': return 365
        case '30d':
        default: return 30
    }
}

/** Compute inclusive [start, end] ISO date strings for a period. */
export const periodToDateRange = (period: PeriodValue, now = new Date()): { start_date: string; end_date: string } => {
    const start = new Date(now)
    start.setDate(start.getDate() - periodToDays(period))
    return {
        start_date: start.toISOString().slice(0, 10),
        end_date: now.toISOString().slice(0, 10),
    }
}
