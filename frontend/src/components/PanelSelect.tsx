import { useEffect, useRef, useState, type ReactNode } from 'react'
import { TbChevronDown, TbCheck } from 'react-icons/tb'

export interface PanelSelectOption { value: string | number; label: string | ReactNode }

interface PanelSelectProps {
    value: string | number
    options: PanelSelectOption[]
    onChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    dropdownClassName?: string
    compact?: boolean
    id?: string
}

const PanelSelect = ({ value, options, onChange, placeholder = 'Select...', disabled = false,
    className = '', dropdownClassName = '', compact = false, id }: PanelSelectProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false)
        }
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false) }
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEsc)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEsc)
        }
    }, [])

    const selected = options.find((opt) => String(opt.value) === String(value))
    const buttonClass = compact
        ? 'pl-3 pr-8 py-2 w-full rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 dark:border-neutral-600 dark:bg-neutral-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 dark:text-neutral-200 text-sm min-w-30'
        : 'w-full px-4 py-2.5 rounded-xl border border-black/50 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 text-gray-900 dark:text-neutral-200 transition'

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <button type="button" id={id} disabled={disabled}
                onClick={() => !disabled && setIsOpen((prev) => !prev)}
                className={`${buttonClass} flex items-center justify-between text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}>
                <span className={`truncate ${selected ? '' : 'text-gray-400 dark:text-neutral-500'}`}>
                    {selected ? selected.label : placeholder}
                </span>
                <TbChevronDown className={`w-4 h-4 shrink-0 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className={`absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border border-white/30 dark:border-neutral-700 bg-white/90 dark:bg-neutral-900/95 backdrop-blur-xl shadow-2xl py-1 ${dropdownClassName}`}>
                    {options.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-400 dark:text-neutral-500">No options</div>
                    ) : (
                        options.map((opt) => {
                            const isSelected = String(opt.value) === String(value)
                            return (
                                <button key={opt.value} type="button"
                                    onClick={() => { onChange(String(opt.value)); setIsOpen(false) }}
                                    className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left transition-colors ${isSelected ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-neutral-200 hover:bg-blue-500/10'}`}>
                                    <span className="truncate">{opt.label}</span>
                                    {isSelected && <TbCheck className="w-4 h-4 shrink-0" />}
                                </button>
                            )
                        })
                    )}
                </div>
            )}
        </div>
    )
}
export default PanelSelect
