/**
 * useDataTransfer — flexible export/import orchestration for any panel resource.
 *
 * Wraps the low-level `utils/export` helpers and the bulk-insert endpoint into a
 * single hook so pages don't duplicate:
 *   - export-format dropdown state + loading flag + notifications
 *   - import-modal state, file parsing result and submission to `/{resource}/bulk`
 *
 * Usage:
 *   const transfer = useDataTransfer<User>({
 *     resource: 'users',
 *     filename: 'users',
 *     tableName: 'users',
 *     columns: exportColumns,
 *     getRows: () => users,
 *   })
 *   <ExportMenu {...transfer.exportProps} />
 *   <ImportModal {...transfer.importProps} onSuccess={reload} />
 */
import { useCallback, useState } from 'react'
import { exportData, type ExportColumn, type ExportFormat } from '@/utils/export'
import { useNotification } from '@/context/useNotification'

export interface UseDataTransferOptions<T> {
    /** Backend resource segment, e.g. "users" → POST /users/bulk */
    resource: string
    /** Download filename base (without extension). */
    filename: string
    /** SQL table name used by the SQL exporter. */
    tableName?: string
    /** Column definitions used to serialise rows for export. */
    columns: ExportColumn<T>[]
    /** Returns the current rows to export (lazy so it always sees fresh data). */
    getRows: () => T[]
    /** Optional label for the export trigger. */
    exportLabel?: string
}

export interface DataTransfer<T> {
    /** Spread into `<ExportMenu />`. */
    exportProps: {
        rows: T[]
        columns: ExportColumn<T>[]
        filename: string
        tableName?: string
        label?: string
    }
    /** Spread into `<ImportModal />`. (caller adds onSuccess) */
    importProps: {
        isOpen: boolean
        onClose: () => void
        resource: string
        title: string
    }
    /** Run an export programmatically in a given format. */
    exportAs: (format: ExportFormat) => Promise<void>
    isExporting: boolean
    /** Open/close the import modal. */
    openImport: () => void
    closeImport: () => void
}

export const useDataTransfer = <T,>({
    resource,
    filename,
    tableName,
    columns,
    getRows,
    exportLabel = 'Export',
}: UseDataTransferOptions<T>): DataTransfer<T> => {
    const { notify } = useNotification()
    const [isExporting, setIsExporting] = useState(false)
    const [isImportOpen, setImportOpen] = useState(false)

    const exportAs = useCallback(
        async (format: ExportFormat) => {
            const rows = getRows()
            if (rows.length === 0) {
                notify('No data to export', 'warning')
                return
            }
            setIsExporting(true)
            try {
                await exportData(format, rows, columns, filename, tableName ?? filename)
                notify(`Exported as ${format.toUpperCase()}`, 'success')
            } catch {
                notify('Failed to export data', 'error')
            } finally {
                setIsExporting(false)
            }
        },
        [columns, filename, getRows, notify, tableName]
    )

    const openImport = useCallback(() => setImportOpen(true), [])
    const closeImport = useCallback(() => setImportOpen(false), [])

    return {
        exportProps: { rows: getRows(), columns, filename, tableName, label: exportLabel },
        importProps: {
            isOpen: isImportOpen,
            onClose: closeImport,
            resource,
            title: `Import ${resource}`,
        },
        exportAs,
        isExporting,
        openImport,
        closeImport,
    }
}

export default useDataTransfer
