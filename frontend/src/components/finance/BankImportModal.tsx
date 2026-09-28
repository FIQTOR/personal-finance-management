import { useMemo, useRef, useState } from 'react'
import { TbCloudUpload, TbX, TbCheck, TbAlertTriangle, TbArrowRight, TbArrowLeft, TbDownload, TbFileSpreadsheet, TbCopy } from 'react-icons/tb'
import apiClient from '@/services/apiClient'
import { useNotification } from '@/context/useNotification'
import { getErrorMessage } from '@/utils/error'
import { parseImportFile } from '@/utils/export'
import PanelSelect from '@/components/PanelSelect'
import EmptyState from '@/components/EmptyState'
import { SkeletonBlock } from '@/components/Skeleton'
import type { Category, Transaction, TransactionType } from '@/types/finance'
import {
    emptyMapping,
    suggestMapping,
    normalizeRow,
    detectDuplicates,
    toBulkItems,
    FIELD_LABELS,
    TARGET_FIELDS,
    REQUIRED_FIELDS,
    type ColumnMapping,
    type NormalizedRow,
} from './bankImport'

interface BankImportModalProps {
    isOpen: boolean
    onClose: () => void
    categories: Category[]
    existingTransactions: Transaction[]
    defaultCurrency?: string
    defaultType?: TransactionType
    onSuccess?: () => void
}

interface ImportResult {
    createdCount: number
    failedCount: number
    errors: { row: number; name?: string; message: string }[]
}

type Step = 1 | 2 | 3

const STEP_TITLES: Record<Step, string> = {
    1: 'Upload file',
    2: 'Map columns',
    3: 'Review & import',
}

const BankImportModal = ({
    isOpen,
    onClose,
    categories,
    existingTransactions,
    defaultCurrency = 'USD',
    defaultType = 'expense',
    onSuccess,
}: BankImportModalProps) => {
    const { notify } = useNotification()
    const inputRef = useRef<HTMLInputElement>(null)
    const fileRef = useRef<File | null>(null)

    const [step, setStep] = useState<Step>(1)
    const [fileName, setFileName] = useState('')
    const [rows, setRows] = useState<Record<string, unknown>[]>([])
    const [firstRowIsHeader, setFirstRowIsHeader] = useState(true)
    const [isParsing, setIsParsing] = useState(false)
    const [mapping, setMapping] = useState<ColumnMapping>(emptyMapping())
    const [importType, setImportType] = useState<TransactionType>(defaultType)
    const [importCurrency, setImportCurrency] = useState<string>(defaultCurrency)
    const [skipDuplicates, setSkipDuplicates] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<ImportResult | null>(null)

    const sourceColumns = useMemo(() => {
        if (rows.length === 0) return [] as string[]
        return Object.keys(rows[0])
    }, [rows])

    const normalizedRows = useMemo<NormalizedRow[]>(
        () =>
            rows.map((row, i) =>
                normalizeRow(row, { mapping, defaultType: importType, defaultCurrency: importCurrency, categories }, i),
            ),
        [rows, mapping, importType, importCurrency, categories],
    )

    const validRows = useMemo(() => normalizedRows.filter((r) => r.errors.length === 0), [normalizedRows])
    const invalidCount = normalizedRows.length - validRows.length

    const duplicates = useMemo(
        () => detectDuplicates(normalizedRows, existingTransactions),
        [normalizedRows, existingTransactions],
    )

    const rowsToImport = useMemo(() => {
        if (!skipDuplicates) return validRows
        return validRows.filter((r) => !duplicates.duplicateKeys.has(r.key))
    }, [validRows, skipDuplicates, duplicates])

    if (!isOpen) return null

    const reset = () => {
        setStep(1); setFileName(''); setRows([]); setMapping(emptyMapping())
        setFirstRowIsHeader(true); setIsParsing(false)
        setImportType(defaultType); setImportCurrency(defaultCurrency)
        setSkipDuplicates(true); setResult(null); setIsLoading(false)
        fileRef.current = null
    }

    const close = () => { reset(); onClose() }

    /**
     * (Re)key the parsed `rawRows` according to the header setting.
     *
     * `parseImportFile` always treats the first line as headers, so when the
     * user says "first row is NOT a header" we prepend those header names back
     * as the first data row before numbering all columns by position.
     */
    const applyRows = (rawRows: Record<string, unknown>[], hasHeader: boolean) => {
        if (rawRows.length === 0) { setRows([]); setMapping(emptyMapping()); return }
        const headerNames = Object.keys(rawRows[0])
        if (hasHeader) {
            setRows(rawRows)
            setMapping(suggestMapping(headerNames))
            return
        }
        const allCells = [headerNames, ...rawRows.map((r) => headerNames.map((h) => r[h]))]
        const numbered = allCells.map((cells) =>
            Object.fromEntries(cells.map((c, i) => [`Column ${i + 1}`, c])) as Record<string, unknown>,
        )
        setRows(numbered)
        setMapping(emptyMapping())
    }

    const parseFile = async (file: File, hasHeader: boolean) => {
        setIsParsing(true)
        try {
            const { rows: parsed, error } = await parseImportFile(file)
            if (error) { notify(error, 'error'); setRows([]); return }
            applyRows(parsed, hasHeader)
        } finally {
            setIsParsing(false)
        }
    }

    const handleFile = async (file?: File) => {
        if (!file) return
        fileRef.current = file
        setResult(null)
        setFileName(file.name)
        setStep(1)
        await parseFile(file, firstRowIsHeader)
    }

    const toggleHeader = () => {
        const next = !firstRowIsHeader
        setFirstRowIsHeader(next)
        if (fileRef.current) void parseFile(fileRef.current, next)
    }

    const requiredMapped = REQUIRED_FIELDS.every((f) => mapping[f])

    const handleCommit = async () => {
        if (rowsToImport.length === 0) { notify('No new rows to import', 'warning'); return }
        setIsLoading(true)
        try {
            const res = await apiClient.post(`/transactions/bulk`, { items: toBulkItems(rowsToImport) })
            const data = res.data?.data as ImportResult | undefined
            setResult({ createdCount: data?.createdCount ?? 0, failedCount: data?.failedCount ?? 0, errors: data?.errors ?? [] })
            notify(res.data?.message || 'Bank import finished', 'success')
            onSuccess?.()
        } catch (error: unknown) {
            notify(getErrorMessage(error, 'Failed to import transactions'), 'error')
        } finally {
            setIsLoading(false)
        }
    }

    const previewRows = normalizedRows.slice(0, 5)
    const duplicateSet = duplicates.duplicateKeys

    const fieldOptions = () => [
        { value: '', label: '— none —' },
        ...sourceColumns.map((c) => ({ value: c, label: c })),
    ]

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border dark:border-neutral-800 flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="p-5 border-b dark:border-neutral-800 flex justify-between items-center bg-gray-50/50 dark:bg-neutral-800/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <TbFileSpreadsheet className="text-blue-500" /> Import Bank CSV
                        </h3>
                        <div className="hidden sm:flex items-center gap-1 text-xs">
                            {([1, 2, 3] as Step[]).map((s) => (
                                <span key={s} className="flex items-center gap-1">
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-semibold ${
                                        step === s ? 'bg-blue-600 text-white' : step > s ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-neutral-700 text-gray-500 dark:text-neutral-400'
                                    }`}>{step > s ? <TbCheck size={12} /> : s}</span>
                                    <span className={step === s ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-400'}>{STEP_TITLES[s]}</span>
                                    {s < 3 && <TbArrowRight className="text-gray-300 dark:text-neutral-600" />}
                                </span>
                            ))}
                        </div>
                    </div>
                    <button onClick={close} className="text-gray-400 hover:text-red-500 transition-colors"><TbX size={24} /></button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 overflow-y-auto">
                    {/* STEP 1 — Upload */}
                    {step === 1 && (
                        <>
                            <div
                                onClick={() => inputRef.current?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]) }}
                                className="border-2 border-dashed border-white/30 dark:border-neutral-600 rounded-2xl p-8 text-center cursor-pointer hover:bg-blue-500/5 transition-all duration-300"
                            >
                                <TbCloudUpload className="w-10 h-10 mx-auto text-blue-500 mb-2" />
                                <p className="text-sm font-medium text-gray-700 dark:text-neutral-200">
                                    {fileName || 'Click or drop a bank .csv / .json file here'}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">Supported: .csv, .json</p>
                            </div>
                            <input ref={inputRef} type="file" accept=".csv,.json,text/csv,application/json" className="hidden"
                                onChange={(e) => handleFile(e.target.files?.[0] ?? undefined)} />

                            {fileName && (
                                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-300 cursor-pointer select-none">
                                    <input type="checkbox" checked={firstRowIsHeader} onChange={toggleHeader}
                                        className="w-4 h-4 rounded border-gray-400 text-blue-600 focus:ring-blue-500" />
                                    First row is header
                                </label>
                            )}

                            {isParsing ? (
                                <div className="space-y-2">
                                    <SkeletonBlock className="h-4 w-1/3" />
                                    <SkeletonBlock className="h-24 w-full" />
                                </div>
                            ) : rows.length > 0 ? (
                                <p className="text-xs text-gray-500 dark:text-neutral-400">
                                    {rows.length} data rows detected across {sourceColumns.length} columns.
                                </p>
                            ) : fileName ? (
                                <EmptyState compact title="No rows detected" description="Check the header toggle or try another file." />
                            ) : null}
                        </>
                    )}

                    {/* STEP 2 — Mapping */}
                    {step === 2 && (
                        <>
                            <p className="text-xs text-gray-500 dark:text-neutral-400">
                                Match each target field to a column from your file. <span className="font-medium text-blue-600 dark:text-blue-400">Date</span> and <span className="font-medium text-blue-600 dark:text-blue-400">Amount</span> are required.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {TARGET_FIELDS.map((field) => {
                                    const required = REQUIRED_FIELDS.includes(field)
                                    return (
                                        <div key={field}>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1">
                                                {FIELD_LABELS[field]}{required && <span className="text-rose-500"> *</span>}
                                            </label>
                                            <PanelSelect
                                                compact
                                                value={mapping[field]}
                                                options={fieldOptions()}
                                                onChange={(v) => setMapping((prev) => ({ ...prev, [field]: v }))}
                                                placeholder="— none —"
                                            />
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1">Default type (when unmapped)</label>
                                    <PanelSelect compact value={importType} onChange={(v) => setImportType(v as TransactionType)}
                                        options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }]} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1">Fallback currency</label>
                                    <PanelSelect compact value={importCurrency} onChange={setImportCurrency}
                                        options={[{ value: 'USD', label: 'USD ($)' }, { value: 'IDR', label: 'IDR (Rp)' }, { value: 'EUR', label: 'EUR (€)' }, { value: 'GBP', label: 'GBP (£)' }]} />
                                </div>
                                <div className="flex items-end">
                                    <div className="text-xs text-gray-500 dark:text-neutral-400">
                                        {invalidCount > 0
                                            ? <span className="text-rose-600 dark:text-rose-400">{invalidCount} row(s) have errors</span>
                                            : <span className="text-emerald-600 dark:text-emerald-400">{normalizedRows.length} rows valid</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Live preview */}
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-gray-500 dark:text-neutral-400">Preview (first 5 mapped rows)</p>
                                {previewRows.length === 0 ? (
                                    <EmptyState compact title="Nothing to preview" description="Map a date and amount column to see rows." />
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-white/30 dark:border-neutral-700">
                                        <table className="w-full text-xs">
                                            <thead className="bg-white/50 dark:bg-neutral-800/50">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-gray-500 dark:text-neutral-400">Date</th>
                                                    <th className="px-3 py-2 text-left text-gray-500 dark:text-neutral-400">Amount</th>
                                                    <th className="px-3 py-2 text-left text-gray-500 dark:text-neutral-400">Type</th>
                                                    <th className="px-3 py-2 text-left text-gray-500 dark:text-neutral-400">Currency</th>
                                                    <th className="px-3 py-2 text-left text-gray-500 dark:text-neutral-400">Notes</th>
                                                    <th className="px-3 py-2 text-left text-gray-500 dark:text-neutral-400">Category</th>
                                                    <th className="px-3 py-2 text-left text-gray-500 dark:text-neutral-400"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewRows.map((r) => (
                                                    <tr key={r.index} className={`border-t border-white/20 dark:border-neutral-700/50 ${r.errors.length > 0 ? 'bg-rose-500/5' : ''}`}>
                                                        <td className="px-3 py-2 text-gray-700 dark:text-neutral-300">{r.date || <span className="text-rose-500">—</span>}</td>
                                                        <td className="px-3 py-2 text-gray-700 dark:text-neutral-300">{r.amount || <span className="text-rose-500">—</span>}</td>
                                                        <td className="px-3 py-2">{r.type === 'income' ? <span className="text-emerald-600 dark:text-emerald-400">income</span> : <span className="text-rose-600 dark:text-rose-400">expense</span>}</td>
                                                        <td className="px-3 py-2 text-gray-700 dark:text-neutral-300">{r.currency}</td>
                                                        <td className="px-3 py-2 text-gray-700 dark:text-neutral-300 truncate max-w-40">{r.notes}</td>
                                                        <td className="px-3 py-2 text-gray-700 dark:text-neutral-300">{r.category || <span className="text-gray-400">—</span>}</td>
                                                        <td className="px-3 py-2">
                                                            {r.errors.length > 0 && (
                                                                <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400" title={r.errors.join(', ')}>
                                                                    <TbAlertTriangle className="w-3.5 h-3.5" /> {r.errors[0]}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* STEP 3 — Duplicates + commit */}
                    {step === 3 && (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="p-3 rounded-xl border border-white/30 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50">
                                    <div className="text-xs text-gray-500 dark:text-neutral-400">Total rows</div>
                                    <div className="text-lg font-bold text-gray-800 dark:text-white">{normalizedRows.length}</div>
                                </div>
                                <div className="p-3 rounded-xl border border-white/30 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50">
                                    <div className="text-xs text-gray-500 dark:text-neutral-400">New</div>
                                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{duplicates.newCount}</div>
                                </div>
                                <div className="p-3 rounded-xl border border-white/30 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50">
                                    <div className="text-xs text-gray-500 dark:text-neutral-400">Duplicates</div>
                                    <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{duplicates.duplicateCount}</div>
                                </div>
                                <div className="p-3 rounded-xl border border-white/30 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50">
                                    <div className="text-xs text-gray-500 dark:text-neutral-400">Invalid</div>
                                    <div className="text-lg font-bold text-rose-600 dark:text-rose-400">{invalidCount}</div>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50 text-sm flex items-center gap-2">
                                <TbCopy className="w-4 h-4 shrink-0" />
                                <span>
                                    {duplicates.newCount} new, {duplicates.duplicateCount} duplicates
                                    {duplicates.duplicateCount > 0 && ' (matching existing transactions or repeated in this file)'}.
                                </span>
                            </div>

                            {duplicates.duplicateCount > 0 && (
                                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-300 cursor-pointer select-none">
                                    <input type="checkbox" checked={skipDuplicates} onChange={(e) => setSkipDuplicates(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-400 text-blue-600 focus:ring-blue-500" />
                                    Skip duplicates (import anyway when unchecked)
                                </label>
                            )}

                            <p className="text-xs text-gray-500 dark:text-neutral-400">
                                Will import <span className="font-semibold text-gray-700 dark:text-neutral-200">{rowsToImport.length}</span> transaction(s).
                            </p>

                            {duplicates.duplicateCount > 0 && (
                                <div className="overflow-x-auto rounded-xl border border-white/30 dark:border-neutral-700">
                                    <table className="w-full text-xs">
                                        <thead className="bg-white/50 dark:bg-neutral-800/50">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-gray-500 dark:text-neutral-400">Date</th>
                                                <th className="px-3 py-2 text-left text-gray-500 dark:text-neutral-400">Amount</th>
                                                <th className="px-3 py-2 text-left text-gray-500 dark:text-neutral-400">Notes</th>
                                                <th className="px-3 py-2 text-left text-gray-500 dark:text-neutral-400">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {normalizedRows.filter((r) => duplicateSet.has(r.key) && r.errors.length === 0).slice(0, 5).map((r) => (
                                                <tr key={r.index} className="border-t border-white/20 dark:border-neutral-700/50">
                                                    <td className="px-3 py-2 text-gray-700 dark:text-neutral-300">{r.date}</td>
                                                    <td className="px-3 py-2 text-gray-700 dark:text-neutral-300">{r.amount}</td>
                                                    <td className="px-3 py-2 text-gray-700 dark:text-neutral-300 truncate max-w-40">{r.notes}</td>
                                                    <td className="px-3 py-2 text-amber-600 dark:text-amber-400">Duplicate</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {result && (
                                <div className="p-3 rounded-xl border border-white/30 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50 text-sm space-y-2">
                                    <div className="font-medium text-gray-700 dark:text-neutral-200">
                                        {result.createdCount} created, {result.failedCount} failed
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
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t dark:border-neutral-800 flex gap-3 shrink-0">
                    <button onClick={step === 1 ? close : () => setStep((s) => (s - 1) as Step)}
                        className="flex-1 py-2.5 rounded-xl border dark:border-neutral-700 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all duration-300 flex items-center justify-center gap-2">
                        {step === 1 ? 'Close' : <><TbArrowLeft /> Back</>}
                    </button>
                    {step === 1 && (
                        <button onClick={() => setStep(2)} disabled={rows.length === 0 || isParsing}
                            className="flex-1 py-2.5 rounded-xl bg-blue-600/90 backdrop-blur-md border border-blue-400/40 text-white text-sm font-bold hover:bg-blue-500 shadow-lg shadow-blue-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            Continue <TbArrowRight />
                        </button>
                    )}
                    {step === 2 && (
                        <button onClick={() => setStep(3)} disabled={!requiredMapped || rows.length === 0}
                            className="flex-1 py-2.5 rounded-xl bg-blue-600/90 backdrop-blur-md border border-blue-400/40 text-white text-sm font-bold hover:bg-blue-500 shadow-lg shadow-blue-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            Continue <TbArrowRight />
                        </button>
                    )}
                    {step === 3 && (
                        <button onClick={handleCommit} disabled={isLoading || rowsToImport.length === 0}
                            className="flex-1 py-2.5 rounded-xl bg-indigo-600/90 backdrop-blur-md border border-indigo-400/40 text-white text-sm font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            {isLoading ? <span className="loader" style={{ width: 18, height: 18 }}></span> : <TbDownload />}
                            Import {rowsToImport.length} transaction(s)
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default BankImportModal
