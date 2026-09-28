import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    TbFilter, TbCalendar, TbSearch, TbHistory, TbWorld, TbDeviceLaptop,
} from 'react-icons/tb'
import apiClient from '@/services/apiClient'
import { useAppSelector } from '@/store/hooks'
import { selectAuth } from '@/store/authSlice'
import StaticDataTable, { type ColumnConfig } from '@/components/StaticDataTable'
import ExportMenu from '@/components/ExportMenu'
import EmptyState from '@/components/EmptyState'
import type { ExportColumn } from '@/utils/export'

interface Activity {
    id: number
    activity_type: string
    status: 'warning' | 'info' | 'danger'
    description: string
    ip_address: string
    user_agent: string
    created_at: string
}

const LIMIT_OPTIONS = [10, 25, 50]
const DEBOUNCE_MS = 400

const STATUS_STYLES: Record<Activity['status'], string> = {
    info: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    danger: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
}

const humanizeType = (type: string): string =>
    type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

const truncate = (value: string, max = 48): string =>
    value.length > max ? `${value.substring(0, max)}…` : value

const AuditLogMenu = () => {
    const { user } = useAppSelector(selectAuth)
    const navigate = useNavigate()

    const [activities, setActivities] = useState<Activity[]>([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        activity_type: '',
        status: 'all',
        start_date: '',
        end_date: '',
        search: '',
    })
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [showAll, setShowAll] = useState(false)
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 })

    // Debounce the free-text search box so we don't fire a request per keystroke.
    useEffect(() => {
        const id = setTimeout(() => { setDebouncedSearch(filters.search.trim()); setPage(1) }, DEBOUNCE_MS)
        return () => clearTimeout(id)
    }, [filters.search])

    const fetchActivities = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                showAll: showAll.toString(),
                ...(filters.activity_type && { activity_type: filters.activity_type }),
                ...(filters.status !== 'all' && { status: filters.status }),
                ...(filters.start_date && { start_date: filters.start_date }),
                ...(filters.end_date && { end_date: filters.end_date }),
                ...(debouncedSearch && { search: debouncedSearch }),
            })
            const response = await apiClient.get(`/activities?${params}`)
            setActivities(response.data.data.activities)
            setPagination({
                total: response.data.data.pagination.total,
                page: response.data.data.pagination.page,
                pages: response.data.data.pagination.pages,
            })
        } catch {
            setActivities([])
        } finally {
            setLoading(false)
        }
    }, [page, limit, showAll, filters.activity_type, filters.status, filters.start_date, filters.end_date, debouncedSearch])

    useEffect(() => {
        if (!user) { navigate('/signin'); return }
        fetchActivities()
    }, [user, navigate, fetchActivities])

    const updateFilter = (key: keyof typeof filters, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }))
        if (key !== 'search') setPage(1)
    }

    const columns = useMemo<ColumnConfig<Activity>[]>(() => [
        {
            key: 'status',
            label: 'Status',
            width: 'w-24',
            render: (value, item) => (
                <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${STATUS_STYLES[item.status]}`}>
                    {String(value)}
                </span>
            ),
        },
        {
            key: 'activity_type',
            label: 'Type',
            render: (_value, item) => <span className="font-semibold capitalize text-gray-800 dark:text-neutral-200">{humanizeType(item.activity_type)}</span>,
        },
        {
            key: 'description',
            label: 'Description',
            render: (_value, item) => <span className="text-gray-600 dark:text-neutral-400">{item.description || '-'}</span>,
        },
        {
            key: 'ip_address',
            label: 'IP Address',
            hideOnMobile: true,
            render: (_value, item) => <span className="font-mono text-gray-600 dark:text-neutral-400">{item.ip_address}</span>,
        },
        {
            key: 'user_agent',
            label: 'User Agent',
            hideOnTablet: true,
            render: (_value, item) => (
                <span className="text-gray-500 dark:text-neutral-500" title={item.user_agent}>{truncate(item.user_agent)}</span>
            ),
        },
        {
            key: 'created_at',
            label: 'Timestamp',
            render: (_value, item) => <span className="text-gray-600 dark:text-neutral-400 whitespace-nowrap">{new Date(item.created_at).toLocaleString()}</span>,
        },
    ], [])

    const exportColumns = useMemo<ExportColumn<Activity>[]>(() => [
        { key: 'id', header: 'ID' },
        { key: 'activity_type', header: 'Activity Type' },
        { key: 'status', header: 'Status' },
        { key: 'description', header: 'Description', value: (row) => row.description ?? '' },
        { key: 'ip_address', header: 'IP Address', value: (row) => row.ip_address ?? '' },
        { key: 'user_agent', header: 'User Agent', value: (row) => row.user_agent ?? '' },
        { key: 'created_at', header: 'Created At', value: (row) => new Date(row.created_at).toISOString() },
    ], [])

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-gray-50/60 dark:bg-neutral-800/40 rounded-2xl p-5 border border-gray-100 dark:border-neutral-800/80 space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <TbFilter className="w-4 h-4 text-emerald-500" />
                        <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Audit Filters</h3>
                    </div>
                    <ExportMenu rows={activities} columns={exportColumns} filename="audit-log" tableName="user_activities" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1 block">Activity Type</label>
                        <input
                            type="text"
                            value={filters.activity_type}
                            onChange={(e) => updateFilter('activity_type', e.target.value)}
                            placeholder="e.g. login, password"
                            className="w-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-2.5 text-xs text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1 block">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => updateFilter('status', e.target.value)}
                            className="w-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-2.5 text-xs text-gray-900 dark:text-white"
                        >
                            <option value="all">All</option>
                            <option value="info">Info</option>
                            <option value="warning">Warning</option>
                            <option value="danger">Danger</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1 flex items-center gap-1">
                            <TbSearch className="w-3.5 h-3.5" /> Search
                        </label>
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => updateFilter('search', e.target.value)}
                            placeholder="Description, type, user agent…"
                            className="w-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-2.5 text-xs text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1 flex items-center gap-1">
                            <TbCalendar className="w-3.5 h-3.5" /> Start Date
                        </label>
                        <input type="date" value={filters.start_date} onChange={(e) => updateFilter('start_date', e.target.value)}
                            className="w-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-2.5 text-xs text-gray-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1 flex items-center gap-1">
                            <TbCalendar className="w-3.5 h-3.5" /> End Date
                        </label>
                        <input type="date" value={filters.end_date} onChange={(e) => updateFilter('end_date', e.target.value)}
                            className="w-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-2.5 text-xs text-gray-900 dark:text-white" />
                    </div>
                    <div className="flex items-end">
                        <div className="flex items-center gap-2 p-2.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl w-full">
                            <input type="checkbox" id="audit-showAll" checked={showAll}
                                onChange={() => { setShowAll((v) => !v); setPage(1) }}
                                className="accent-emerald-500 w-4 h-4 rounded cursor-pointer" />
                            <label htmlFor="audit-showAll" className="text-xs font-semibold text-gray-700 dark:text-neutral-300 cursor-pointer">
                                Show all activities
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <StaticDataTable<Activity>
                data={activities}
                columns={columns}
                loading={loading}
                idKey="id"
                minTableWidth="900px"
                emptyMessage=""
                total={pagination.total}
                currentPage={page}
                limit={limit}
                pagination
                onPageChange={setPage}
                onLimitChange={(next) => { setLimit(next); setPage(1) }}
            />

            {!loading && activities.length === 0 && (
                <EmptyState
                    icon={<TbHistory className="w-8 h-8" />}
                    title="No audit entries found"
                    description="Try adjusting the filters above, widening the date range, or clearing the search term."
                    compact
                />
            )}

            {/* Limit selector (table exposes page nav; limit chosen here) */}
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-400">
                <span>Rows per page:</span>
                <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}
                    className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg px-2 py-1">
                    {LIMIT_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <span className="ml-auto hidden sm:flex items-center gap-3">
                    <span className="flex items-center gap-1"><TbWorld className="w-3.5 h-3.5 text-blue-500" /> IP captured</span>
                    <span className="flex items-center gap-1"><TbDeviceLaptop className="w-3.5 h-3.5 text-purple-500" /> Agent logged</span>
                </span>
            </div>
        </div>
    )
}

export default AuditLogMenu
