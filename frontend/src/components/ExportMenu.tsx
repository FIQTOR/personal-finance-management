import { useEffect, useRef, useState } from 'react'
import { TbDownload, TbChevronDown, TbFileTypeXls, TbFileTypeCsv, TbFileTypeSql, TbJson } from 'react-icons/tb'
import { exportData, type ExportColumn, type ExportFormat } from '@/utils/export'
import { useNotification } from '@/context/useNotification'

interface ExportMenuProps<T> { rows: T[]; columns: ExportColumn<T>[]; filename: string; tableName?: string; label?: string }

const FORMATS: { format: ExportFormat; label: string; icon: React.ReactNode }[] = [
    { format: 'xlsx', label: 'Excel (.xlsx)', icon: <TbFileTypeXls className="text-emerald-500" /> },
    { format: 'csv', label: 'CSV (.csv)', icon: <TbFileTypeCsv className="text-blue-500" /> },
    { format: 'json', label: 'JSON (.json)', icon: <TbJson className="text-amber-500" /> },
    { format: 'sql', label: 'SQL (.sql)', icon: <TbFileTypeSql className="text-purple-500" /> },
]

const ExportMenu = <T,>({ rows, columns, filename, tableName, label = 'Export' }: ExportMenuProps<T>) => {
    const { notify } = useNotification()
    const [isOpen, setIsOpen] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const onClickOutside = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false) }
        document.addEventListener('mousedown', onClickOutside)
        return () => document.removeEventListener('mousedown', onClickOutside)
    }, [])

    const handleExport = async (format: ExportFormat) => {
        if (rows.length === 0) { notify('No data to export', 'warning'); return }
        setIsExporting(true)
        try { await exportData(format, rows, columns, filename, tableName); notify(`Exported as ${format.toUpperCase()}`, 'success') }
        catch { notify('Failed to export data', 'error') }
        finally { setIsExporting(false); setIsOpen(false) }
    }

    return (
        <div ref={ref} className="relative">
            <button type="button" onClick={() => setIsOpen((v) => !v)} disabled={isExporting}
                className="flex items-center gap-2 bg-emerald-600/90 backdrop-blur-md border border-emerald-400/40 text-white px-3 py-2 rounded-xl hover:bg-emerald-500 transition-all duration-300 shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {isExporting ? <span className="loader" style={{ width: 16, height: 16 }}></span> : <TbDownload />}
                <span className="hidden sm:inline">{label}</span>
                <TbChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute right-0 z-50 mt-1 w-48 rounded-xl border border-white/30 dark:border-neutral-700 bg-white/90 dark:bg-neutral-900/95 backdrop-blur-xl shadow-2xl py-1">
                    {FORMATS.map((f) => (
                        <button key={f.format} type="button" onClick={() => handleExport(f.format)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left text-gray-700 dark:text-neutral-200 hover:bg-blue-500/10 transition-all duration-300">
                            {f.icon}{f.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
export default ExportMenu
