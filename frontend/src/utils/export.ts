export interface ExportColumn<T> {
    key: string
    header: string
    value?: (row: T) => string | number | null | undefined
}
export type ExportFormat = 'xlsx' | 'csv' | 'json' | 'sql'

const slugDate = () => new Date().toISOString().slice(0, 10)

const triggerDownload = (content: string | Blob, filename: string, mime: string) => {
    const blob = typeof content === 'string' ? new Blob([content], { type: mime }) : content
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
}

const toRecords = <T,>(rows: T[], columns: ExportColumn<T>[]): Record<string, unknown>[] =>
    rows.map((row) => {
        const record: Record<string, unknown> = {}
        columns.forEach((col) => { record[col.header] = col.value ? col.value(row) : (row as Record<string, unknown>)[col.key] })
        return record
    })

export const exportToExcel = async <T,>(rows: T[], columns: ExportColumn<T>[], filename: string, sheetName = 'Sheet1'): Promise<void> => {
    const data = toRecords(rows, columns)
    const XLSX = await import('xlsx') // lazy-load
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    XLSX.writeFile(workbook, `${filename}_${slugDate()}.xlsx`)
}

export const exportToCsv = <T,>(rows: T[], columns: ExportColumn<T>[], filename: string): void => {
    const data = toRecords(rows, columns)
    const headers = columns.map((c) => c.header)
    const escape = (val: unknown) => `"${('' + (val ?? '')).replace(/"/g, '""')}"`
    const lines = [headers.map(escape).join(','), ...data.map((rec) => headers.map((h) => escape(rec[h])).join(','))]
    triggerDownload('\ufeff' + lines.join('\n'), `${filename}_${slugDate()}.csv`, 'text/csv;charset=utf-8;')
}

export const exportToJson = <T,>(rows: T[], columns: ExportColumn<T>[], filename: string): void => {
    triggerDownload(JSON.stringify(toRecords(rows, columns), null, 2), `${filename}_${slugDate()}.json`, 'application/json;charset=utf-8;')
}

const sqlValue = (val: unknown): string => {
    if (val === null || val === undefined) return 'NULL'
    if (typeof val === 'number' || typeof val === 'boolean') return String(val)
    if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`
    return `'${String(val).replace(/'/g, "''")}'`
}

export const exportToSql = <T,>(rows: T[], columns: ExportColumn<T>[], filename: string, tableName: string): void => {
    const data = toRecords(rows, columns)
    const cols = columns.map((c) => `\`${c.header}\``).join(', ')
    let sql = `-- ${tableName.toUpperCase()} EXPORT\n-- Exported At: ${new Date().toISOString()}\n\n`
    data.forEach((rec) => {
        const values = columns.map((c) => sqlValue(rec[c.header])).join(', ')
        sql += `INSERT INTO \`${tableName}\` (${cols}) VALUES (${values});\n`
    })
    triggerDownload(sql, `${filename}_${slugDate()}.sql`, 'text/plain;charset=utf-8;')
}

export const exportData = async <T,>(
    format: ExportFormat, rows: T[], columns: ExportColumn<T>[], filename: string, tableName?: string
): Promise<void> => {
    switch (format) {
        case 'xlsx': return exportToExcel(rows, columns, filename)
        case 'csv': return exportToCsv(rows, columns, filename)
        case 'json': return exportToJson(rows, columns, filename)
        case 'sql': return exportToSql(rows, columns, filename, tableName || filename)
    }
}

export const parseImportFile = async (file: File): Promise<{ rows: Record<string, unknown>[]; error: string | null }> => {
    const text = await file.text()
    const name = file.name.toLowerCase()
    if (name.endsWith('.json')) {
        try {
            const parsed = JSON.parse(text)
            const arr = Array.isArray(parsed) ? parsed : parsed?.data
            if (!Array.isArray(arr)) return { rows: [], error: 'JSON must be an array (or { data: [...] })' }
            return { rows: arr as Record<string, unknown>[], error: null }
        } catch { return { rows: [], error: 'Invalid JSON file' } }
    }
    const trimmed = text.trim()
    if (!trimmed) return { rows: [], error: 'File is empty' }
    const firstLine = trimmed.split(/\r?\n/)[0]
    const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ','
    const splitLine = (line: string): string[] => {
        const result: string[] = []; let current = ''; let inQuotes = false
        for (let i = 0; i < line.length; i++) {
            const char = line[i]
            if (char === '"') { if (inQuotes && line[i + 1] === '"') { current += '"'; i++ } else inQuotes = !inQuotes }
            else if (char === delimiter && !inQuotes) { result.push(current); current = '' }
            else { current += char }
        }
        result.push(current); return result.map((c) => c.trim())
    }
    const lines = trimmed.split(/\r?\n/).filter((l) => l.trim() !== '')
    const headers = splitLine(lines[0])
    const rows = lines.slice(1).map((line) => {
        const cells = splitLine(line)
        const row: Record<string, unknown> = {}
        headers.forEach((h, idx) => { row[h] = cells[idx] ?? '' })
        return row
    })
    if (rows.length === 0) return { rows: [], error: 'No data rows found (first line must be headers)' }
    return { rows, error: null }
}
