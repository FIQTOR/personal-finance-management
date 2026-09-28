/**
 * PeriodSelector — reusable analytics/date-range period dropdown.
 *
 * Shared by the admin dashboard and the finance pages so the same period
 * concept is rendered consistently. Controlled component: pass `value` and
 * `onChange`; optionally persist with `storageKey`.
 */
import { useEffect, useRef, useState } from 'react'
import { TbCalendarStats, TbCheck, TbChevronDown } from 'react-icons/tb'
import { DEFAULT_PERIOD_OPTIONS, type PeriodOption, type PeriodValue } from '@/components/periodConfig'

export interface PeriodSelectorProps {
    value: PeriodValue
    onChange: (value: PeriodValue) => void
    options?: PeriodOption[]
    /** Optional localStorage key to persist the selection. */
    storageKey?: string
    /** Icon accent color class (tailwind text-*), defaults to emerald. */
    accentClassName?: string
    /** Accessible label. */
    label?: string
    className?: string
}

const PeriodSelector = ({
    value,
    onChange,
    options = DEFAULT_PERIOD_OPTIONS,
    storageKey,
    accentClassName = 'text-emerald-500',
    label = 'Period',
    className = '',
}: PeriodSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const onClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
        }
        document.addEventListener('mousedown', onClickOutside)
        return () => document.removeEventListener('mousedown', onClickOutside)
    }, [])

    const activeLabel = options.find((opt) => opt.value === value)?.label ?? label

    return (
        <div ref={ref} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen((v) => !v)}
                className="px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/60 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-700/60 transition-all duration-300 flex items-center gap-2 text-gray-700 dark:text-neutral-200 text-xs font-semibold"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={label}
                title={label}
            >
                <TbCalendarStats className={`w-4 h-4 ${accentClassName}`} />
                {activeLabel}
                <TbChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div
                    role="listbox"
                    className="absolute right-0 z-50 mt-1 w-48 rounded-xl border border-white/30 dark:border-neutral-700 bg-white/90 dark:bg-neutral-900/95 backdrop-blur-xl shadow-2xl py-1"
                >
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            role="option"
                            aria-selected={value === opt.value}
                            onClick={() => {
                                onChange(opt.value)
                                if (storageKey) window.localStorage.setItem(storageKey, opt.value)
                                setIsOpen(false)
                            }}
                            className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left transition-all duration-300 ${value === opt.value
                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30'
                                : 'text-gray-700 dark:text-neutral-200 hover:bg-blue-500/10'
                                }`}
                        >
                            {opt.label}
                            {value === opt.value && <TbCheck className="w-4 h-4" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default PeriodSelector
