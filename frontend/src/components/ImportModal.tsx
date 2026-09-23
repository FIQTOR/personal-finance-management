import { useRef, useState } from 'react'
import { TbFileUpload, TbX, TbCheck, TbAlertTriangle, TbCloudUpload } from 'react-icons/tb'
import apiClient from '@/services/apiClient'
import { useNotification } from '@/context/useNotification'
import { getErrorMessage } from '@/utils/error'
import { parseImportFile } from '@/utils/export'

interface ImportModalProps {
    isOpen: boolean
    onClose: () => void
    resource: string
    title: string
    onSuccess?: () => void
}

interface ImportResult {
    createdCount: number
    failedCount: number
    errors: { row: number; name?: string; message: string }[]
}

const ImportModal = ({ isOpen, onClose, resource, title, onSuccess }: ImportModalProps) => {
    const { notify } = useNotification()
    const inputRef = useRef<HTMLInputElement>(null)
    const [fileName, setFileName] = useState('')
    const [rows, setRows] = useState<Record<string, unknown>[]>([])
    const [parseError, setParseError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<ImportResult | null>(null)

    if (!isOpen) return null

    const handleFile = async (file?: File) => {
        if (!file) return
        setResult(null)
        setFileName(file.name)
        const { rows: parsed, error } = await parseImportFile(file)
        setParseError(error)
        setRows(parsed)
    }

    const handleSubmit = async () => {
        if (rows.length === 0) { notify('No valid rows to import', 'warning'); return }
        setIsLoading(true)
        try {
            const res = await apiClient.post(`/${resource}/bulk`, { items: rows })
            const data = res.data?.data as ImportResult | undefined
            setResult({ createdCount: data?.createdCount ?? 0, failedCount: data?.failedCount ?? 0, errors: data?.errors ?? [] })
            notify(res.data?.message || 'Import finished', 'success')
            onSuccess?.()
        } catch (error: unknown) {
            notify(getErrorMessage(error, 'Failed to import data'), 'error')
        } finally {
            setIsLoading(false)
        }
    }

    const close = () => { setFileName(''); setRows([]); setParseError(null); setResult(null); onClose() }
    const previewKeys = rows.length > 0 ? Object.keys(rows[0]).slice(0, 6) : []

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border dark:border-neutral-800 flex flex-col max-h-[90vh]">
                <div className="p-5 border-b dark:border-neutral-800 flex justify-between items-center bg-gray-50/50 dark:bg-neutral-800/50 shrink-0">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><TbFileUpload /> {title}</h3>
                    <button onClick={close} className="text-gray-400 hover:text-red-500 transition-colors"><TbX size={24} /></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div
                        onClick={() => inputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]) }}
                        className="border-2 border-dashed border-white/30 dark:border-neutral-600 rounded-2xl p-8 text-center cursor-pointer hover:bg-blue-500/5 transition-all duration-300"
                    >
                        <TbCloudUpload className="w-10 h-10 mx-auto text-blue-500 mb-2" />
                        <p className="text-sm font-medium text-gray-700 dark:text-neutral-200">
                            {fileName || 'Click or drop a .csv / .json file here'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">Supported: .csv, .json</p>
                    </div>
                    <input ref={inputRef} type="file" accept=".csv,.json,text/csv,application/json" className="hidden"
                        onChange={(e) => handleFile(e.target.files?.[0] ?? undefined)} />

                    {parseError && (
                        <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/50 text-sm flex items-center gap-2">
                            <TbAlertTriangle className="w-4 h-4 shrink-0" /> {parseError}
                        </div>
                    )}

                    {rows.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs text-gray-500 dark:text-neutral-400">{rows.length} rows detected. Preview (first 3):</p>
                            <div className="overflow-x-auto rounded-xl border border-white/30 dark:border-neutral-700">
                                <table className="w-full text-xs">
                                    <thead className="bg-white/50 dark:bg-neutral-800/50">
                                        <tr>{previewKeys.map((k) => <th key={k} className="px-3 py-2 text-left text-gray-500 dark:text-neutral-400">{k}</th>)}</tr>
                                    </thead>
                                    <tbody>
                                        {rows.slice(0, 3).map((row, i) => (
                                            <tr key={i} className="border-t border-white/20 dark:border-neutral-700/50">
                                                {previewKeys.map((k) => <td key={k} className="px-3 py-2 text-gray-700 dark:text-neutral-300 truncate max-w-40">{String(row[k] ?? '')}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {result && (
                        <div className="p-3 rounded-xl border border-white/30 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50 text-sm space-y-2">
                            <div className="font-medium text-gray-700 dark:text-neutral-200">
                                {result.createdCount} berhasil, {result.failedCount} gagal
                            </div>
                            {result.errors.length > 0 && (
                                <ul className="space-y-1 max-h-32 overflow-y-auto">
                                    {result.errors.map((err, i) => (
                                        <li key={i} className="flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400">
                                            <TbAlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                            Row {err.row}{err.name ? ` (${err.name})` : ''}: {err.message}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
                <div className="p-4 border-t dark:border-neutral-800 flex gap-3 shrink-0">
                    <button onClick={close}
                        className="flex-1 py-2.5 rounded-xl border dark:border-neutral-700 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all duration-300">
                        Close
                    </button>
                    <button onClick={handleSubmit} disabled={isLoading || rows.length === 0}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600/90 backdrop-blur-md border border-indigo-400/40 text-white text-sm font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {isLoading ? <span className="loader" style={{ width: 18, height: 18 }}></span> : <TbCheck />}
                        Import
                    </button>
                </div>
            </div>
        </div>
    )
}
export default ImportModal
