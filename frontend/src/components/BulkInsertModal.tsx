import { useMemo, useState } from 'react'
import { TbUpload, TbX, TbCheck, TbFileText, TbDownload } from 'react-icons/tb'
import apiClient from '@/services/apiClient'
import { useNotification } from '@/context/useNotification'
import { useLanguage } from '@/context/useLanguage'
import { getErrorMessage } from '@/utils/error'
import { downloadFailedRows, validateBulkRows, type ImportRowError } from '@/utils/transfer'

export interface BulkColumn {
    key: string
    label: string
    required?: boolean
    example?: string
}

interface BulkInsertModalProps {
    isOpen: boolean
    onClose: () => void
    resource: string
    title: string
    columns: BulkColumn[]
    onSuccess?: () => void
}

interface BulkResult {
    createdCount: number
    failedCount: number
    errors: ImportRowError[]
}

const parseDelimited = (raw: string, columns: BulkColumn[]): Record<string, string>[] => {
    const trimmed = raw.trim()
    if (!trimmed) return []
    const firstLine = trimmed.split(/\r?\n/)[0]
    const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ','
    const splitLine = (line: string): string[] => {
        const result: string[] = []
        let current = ''
        let inQuotes = false
        for (let i = 0; i < line.length; i++) {
            const char = line[i]
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') { current += '"'; i++ } else inQuotes = !inQuotes
            } else if (char === delimiter && !inQuotes) { result.push(current); current = '' }
            else { current += char }
        }
        result.push(current)
        return result.map((c) => c.trim())
    }
    const allLines = trimmed.split(/\r?\n/).filter((l) => l.trim() !== '')
    const headerCells = splitLine(allLines[0])
    const hasHeader = columns.every((c) => headerCells.some((h) => h.toLowerCase() === c.key.toLowerCase() || h.toLowerCase() === c.label.toLowerCase()))
    const keys = hasHeader ? headerCells : columns.map((c) => c.key)
    const dataLines = hasHeader ? allLines.slice(1) : allLines
    return dataLines.map((line) => {
        const cells = splitLine(line)
        const row: Record<string, string> = {}
        keys.forEach((k, idx) => {
            const matched = columns.find((c) => c.key.toLowerCase() === k.toLowerCase() || c.label.toLowerCase() === k.toLowerCase())
            const fieldKey = matched ? matched.key : k
            row[fieldKey] = cells[idx] ?? ''
        })
        return row
    })
}

const validateRows = (rows: Record<string, string>[], columns: BulkColumn[]) =>
    validateBulkRows(rows, columns)

const BulkInsertModal = ({ isOpen, onClose, resource, title, columns, onSuccess }: BulkInsertModalProps) => {
    const { notify } = useNotification()
    const { t } = useLanguage()
    const [raw, setRaw] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<BulkResult | null>(null)

    const rows = useMemo(() => parseDelimited(raw, columns), [raw, columns])
    const validation = useMemo(() => validateRows(rows, columns), [rows, columns])

    if (!isOpen) return null

    const fillTemplate = () => {
        const header = columns.map((c) => c.key).join(',')
        const example = columns.map((c) => c.example ?? (c.required ? 'value' : '')).join(',')
        setRaw(`${header}\n${example}`)
    }

    const handleSubmit = async () => {
        setResult(null)
        if (rows.length === 0) { notify('No data to insert. Paste rows or load the template.', 'warning'); return }
        const { items, errors } = validation
        if (items.length === 0) {
            setResult({ createdCount: 0, failedCount: errors.length, errors })
            notify('All rows failed validation', 'error')
            return
        }
        setIsLoading(true)
        try {
            const res = await apiClient.post(`/${resource}/bulk`, { items })
            const data = res.data?.data as BulkResult | undefined
            setResult({ createdCount: data?.createdCount ?? 0, failedCount: (data?.failedCount ?? 0) + errors.length, errors: [...(data?.errors ?? []), ...errors] })
            notify(res.data?.message || 'Bulk insert finished', 'success')
            onSuccess?.()
        } catch (error: unknown) {
            notify(getErrorMessage(error, 'Failed to bulk insert'), 'error')
        } finally {
            setIsLoading(false)
        }
    }

    const close = () => { setRaw(''); setResult(null); onClose() }

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border dark:border-neutral-800 flex flex-col max-h-[90vh]">
                <div className="p-5 border-b dark:border-neutral-800 flex justify-between items-center bg-gray-50/50 dark:bg-neutral-800/50 shrink-0">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><TbUpload /> {title}</h3>
                    <button onClick={close} className="text-gray-400 hover:text-red-500 transition-colors"><TbX size={24} /></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div className="text-xs text-gray-500 dark:text-neutral-400">
                        Paste rows from Excel/CSV. Delimiters <code>, ; tab</code> supported. Header row is optional.
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={fillTemplate}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border border-white/30 dark:border-neutral-600/30 text-gray-700 dark:text-neutral-300 hover:bg-white/60 dark:hover:bg-neutral-800/70 transition-all duration-300">
                            <TbFileText /> Fill example template
                        </button>
                    </div>
                    <textarea
                        value={raw}
                        onChange={(e) => setRaw(e.target.value)}
                        rows={8}
                        placeholder={columns.map((c) => c.key).join(',')}
                        className="w-full px-4 py-2.5 rounded-xl border border-black/50 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 text-gray-900 dark:text-neutral-200 transition-all duration-300 font-mono text-xs"
                    />
                    <div className="flex flex-wrap gap-2 text-xs">
                        {columns.map((c) => (
                            <span key={c.key} className={`px-2 py-1 rounded-full ${c.required ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400'}`}>
                                {c.key}{c.required ? ' *' : ''}
                            </span>
                        ))}
                    </div>

                    {/* Client-side validation summary */}
                    {rows.length > 0 && (
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                            <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 font-semibold">
                                {rows.length} {t('rowsDetected')}
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                                {validation.validCount} {t('valid')}
                            </span>
                            <span className={`px-2.5 py-1 rounded-full font-semibold ${validation.invalidCount > 0 ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400'}`}>
                                {validation.invalidCount} {t('invalid')}
                            </span>
                        </div>
                    )}

                    {result && (
                        <div className="p-3 rounded-xl border border-white/30 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50 text-sm space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <div className="font-medium text-gray-700 dark:text-neutral-200">
                                    <span className="text-emerald-600 dark:text-emerald-400">{result.createdCount}</span> {t('imported')},{' '}
                                    <span className="text-rose-600 dark:text-rose-400">{result.failedCount}</span> {t('failed')}
                                </div>
                                {result.errors.length > 0 && (
                                    <button type="button" onClick={() => downloadFailedRows(result.errors, `${resource}_failed`)}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors">
                                        <TbDownload className="w-3.5 h-3.5" /> {t('downloadFailedRows')}
                                    </button>
                                )}
                            </div>
                            {result.errors.length > 0 && (
                                <div className="max-h-40 overflow-y-auto rounded-lg border border-white/20 dark:border-neutral-700/60">
                                    <table className="w-full text-xs">
                                        <thead className="bg-white/50 dark:bg-neutral-800/50 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-1.5 text-left text-gray-500 dark:text-neutral-400 w-14">Row</th>
                                                <th className="px-3 py-1.5 text-left text-gray-500 dark:text-neutral-400 w-28">Name</th>
                                                <th className="px-3 py-1.5 text-left text-gray-500 dark:text-neutral-400">Message</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.errors.map((err, i) => (
                                                <tr key={i} className="border-t border-white/20 dark:border-neutral-700/50">
                                                    <td className="px-3 py-1.5 text-rose-600 dark:text-rose-400 font-mono">{err.row}</td>
                                                    <td className="px-3 py-1.5 text-gray-600 dark:text-neutral-400 truncate max-w-28">{err.name ?? '-'}</td>
                                                    <td className="px-3 py-1.5 text-rose-600 dark:text-rose-400">{err.message}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="p-4 border-t dark:border-neutral-800 flex gap-3 shrink-0">
                    <button onClick={close}
                        className="flex-1 py-2.5 rounded-xl border dark:border-neutral-700 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all duration-300">
                        Close
                    </button>
                    <button onClick={handleSubmit} disabled={isLoading} aria-busy={isLoading}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600/90 backdrop-blur-md border border-blue-400/40 text-white text-sm font-bold hover:bg-blue-500 shadow-lg shadow-blue-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {isLoading ? <span className="loader" style={{ width: 18, height: 18 }}></span> : <TbCheck />}
                        Insert
                    </button>
                </div>
            </div>
        </div>
    )
}
export default BulkInsertModal
