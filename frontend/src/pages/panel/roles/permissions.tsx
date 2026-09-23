import { useCallback, useEffect, useState } from 'react'
import { TbKey, TbEdit, TbTrash, TbPlus, TbX, TbTrashOff, TbFileUpload, TbUpload } from 'react-icons/tb'
import StaticDataTable from '@/components/StaticDataTable'
import ExportMenu from '@/components/ExportMenu'
import BulkInsertModal from '@/components/BulkInsertModal'
import ImportModal from '@/components/ImportModal'
import AppConfig from '@/config/AppConfig'
import apiClient from '@/services/apiClient';
import { getErrorMessage } from '@/utils/error';
import { useNotification } from '@/context/useNotification'
import type { ExportColumn } from '@/utils/export'

interface CreatorUpdater {
    id: number
    name: string
}

interface Permission {
    id: number
    name: string
    description: string
    created_at: string
    updated_at: string
    creator: CreatorUpdater | null
    updater: CreatorUpdater | null
}

export default function PermissionManagement() {
    const { notify, confirm } = useNotification()
    const [selectedIds, setSelectedIds] = useState<number[]>([])
    const [bulkDeleteMode, setBulkDeleteMode] = useState(false)
    const [showBulk, setShowBulk] = useState(false)
    const [showImport, setShowImport] = useState(false)

    const [permissions, setPermissions] = useState<Permission[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [orderBy, setOrderBy] = useState<keyof Permission>('created_at')
    const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC')
    const [limit, setLimit] = useState(10)
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [fetchTime, setFetchTime] = useState<number | null>(null)

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
    const [editingPermission, setEditingPermission] = useState<Permission | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    })
    const [modalLoading, setModalLoading] = useState(false)
    const [modalError, setModalError] = useState<string | null>(null)

    const GetPermissions = useCallback(async () => {
        try {
            setLoading(true)
            const startTime = performance.now()
            const res = await apiClient.get<{ success: boolean; message: string; data: { permissions: Permission[]; total: number }; time?: number }>(`/permissions`, {
                params: {
                    search: searchTerm,
                    orderBy,
                    order,
                    limit,
                    page
                }
            })
            const endTime = performance.now()
            const duration = res.data.time ?? Math.round(endTime - startTime)

            setPermissions(res.data.data.permissions)
            setTotal(res.data.data.total)
            setFetchTime(duration)
            setLoading(false)
        } catch {
            setLoading(false)
        }
    }, [searchTerm, orderBy, order, limit, page])

    useEffect(() => {
        document.title = `Permission Management ${AppConfig.exTitle}`
        GetPermissions()
    }, [GetPermissions])

    const handleOpenAddModal = () => {
        setModalMode('add')
        setEditingPermission(null)
        setFormData({ name: '', description: '' })
        setModalError(null)
        setIsModalOpen(true)
    }

    const handleOpenEditModal = (item: Permission) => {
        setModalMode('edit')
        setEditingPermission(item)
        setFormData({
            name: item.name || '',
            description: item.description || ''
        })
        setModalError(null)
        setIsModalOpen(true)
    }

    const handleModalSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setModalError(null)

        if (!formData.name.trim()) {
            setModalError('Permission name is required')
            return
        }

        setModalLoading(true)
        try {
            if (modalMode === 'add') {
                const res = await apiClient.post(`/permissions`, formData)
                notify(res.data.message || 'Permission created successfully', 'success')
            } else if (modalMode === 'edit' && editingPermission) {
                const res = await apiClient.put(`/permissions/${editingPermission.id}`, formData)
                notify(res.data.message || 'Permission updated successfully', 'success')
            }
            setIsModalOpen(false)
            GetPermissions()
        } catch (err: unknown) {
            setModalError(getErrorMessage(err, 'Failed to save permission'))
        } finally {
            setModalLoading(false)
        }
    }

    const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.max(1, Number(e.target.value))
        setLimit(value)
        setPage(1)
    }

    const handleSort = (key: string | number | symbol) => {
        const field = key as keyof Permission
        if (orderBy === field) {
            setOrder(order === 'ASC' ? 'DESC' : 'ASC')
        } else {
            setOrderBy(field)
            setOrder('ASC')
        }
    }

    const handleDelete = (id: number) => {
        confirm('Are you sure you want to delete this permission? This action cannot be undone.', async () => {
            try {
                const res = await apiClient.delete(`/permissions/${id}`)
                notify(res.data.message || 'Permission deleted successfully', 'success')
                GetPermissions()
            } catch (error: unknown) {
                notify(getErrorMessage(error, 'Failed to delete permission'), 'error')
            }
        }, { actions: [{ label: 'Delete', variant: 'danger', onClick: () => {} }, { label: 'Cancel', onClick: () => {} }] })
    }

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) { notify('Please select at least one record', 'warning'); return }
        confirm(`Are you sure you want to delete ${selectedIds.length} permissions? This action cannot be undone.`, async () => {
            try {
                const res = await apiClient.delete(`/permissions/bulk-delete`, { data: { ids: selectedIds } })
                notify(res.data.message || `${selectedIds.length} permissions deleted`, 'success')
                setSelectedIds([]); setBulkDeleteMode(false); GetPermissions()
            } catch (error: unknown) {
                notify(getErrorMessage(error, 'Failed to delete permissions'), 'error')
            }
        }, { actions: [{ label: 'Delete All', variant: 'danger', onClick: () => {} }, { label: 'Cancel', onClick: () => {} }] })
    }

    const exportColumns: ExportColumn<Permission>[] = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name' },
        { key: 'description', header: 'Description' },
        { key: 'created_at', header: 'Created At' },
    ]

    const toggleAllSelection = () => {
        if (selectedIds.length === permissions.length && permissions.length > 0) {
            setSelectedIds([])
        } else {
            setSelectedIds(permissions.map(p => p.id))
        }
    }

    return (
        <div className="p-6 relative h-full flex flex-col">

            {/* Header Section */}
            <div className="flex flex-col gap-3 mb-4 sm:mb-6 relative z-10 shrink-0">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <h1 className="text-lg sm:text-xl font-bold text-gray-700 dark:text-neutral-100 flex items-center gap-2 drop-shadow-lg">
                            <TbKey className="text-gray-700 dark:text-neutral-300" />
                            Permission Management
                        </h1>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 flex items-center gap-2">
                            <span>Showing {permissions.length} permissions</span>
                            {fetchTime !== null && (
                                <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-neutral-800 text-xs font-mono text-gray-500 dark:text-neutral-400">
                                    {fetchTime} ms
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-4">
                        <button type="button" onClick={() => setShowImport(true)}
                            className="flex items-center gap-2 bg-indigo-600/90 backdrop-blur-md border border-indigo-400/40 text-white px-3 py-2 rounded-xl hover:bg-indigo-500 transition-all duration-300 shadow-lg text-sm">
                            <TbFileUpload /><span className="hidden sm:inline">Import</span>
                        </button>
                        <button type="button" onClick={() => setShowBulk(true)}
                            className="flex items-center gap-2 bg-blue-600/90 backdrop-blur-md border border-blue-400/40 text-white px-3 py-2 rounded-xl hover:bg-blue-500 transition-all duration-300 shadow-lg text-sm">
                            <TbUpload /><span className="hidden sm:inline">Bulk Insert</span>
                        </button>
                        <ExportMenu rows={permissions} columns={exportColumns} filename="permissions" tableName="permissions" />
                        <button
                            onClick={() => { setBulkDeleteMode(!bulkDeleteMode); setSelectedIds([]); }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 text-sm border font-medium ${bulkDeleteMode
                                ? 'bg-red-500/20 text-red-700 border-red-200/50 dark:border-red-700/50'
                                : 'bg-white/10 text-gray-700 dark:bg-neutral-800/20 dark:text-neutral-300 border-white/20 hover:bg-white/20 dark:hover:bg-neutral-800/30'}`}>
                            {bulkDeleteMode ? <TbTrashOff className="w-4 h-4" /> : <TbTrash className="w-4 h-4" />}
                            <span className="hidden sm:inline">Bulk Delete</span>
                        </button>
                        {bulkDeleteMode && (
                            <button onClick={handleBulkDelete}
                                className="flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-xl hover:bg-red-600 transition-all duration-300 text-sm shadow-lg font-medium">
                                <TbTrash className="w-4 h-4" /> Delete Selected ({selectedIds.length})
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleOpenAddModal}
                            className="flex items-center gap-2 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border border-white/30 dark:border-neutral-600/30 text-gray-700 dark:text-neutral-200 px-3 py-2 rounded-xl hover:bg-white/60 dark:hover:bg-neutral-800/70 transition-all duration-300 shadow-lg text-sm cursor-pointer"
                        >
                            <TbPlus />
                            <span className="hidden sm:inline">Add Permission</span>
                        </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
                    <div className="flex-1 flex gap-2">
                        <input
                            type="search"
                            placeholder="Search permissions..."
                            className="flex-1 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 dark:border-neutral-600 dark:bg-neutral-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 dark:text-neutral-200 text-sm transition-all duration-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <input
                            type="number"
                            className="w-16 sm:w-20 px-2 sm:px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 dark:border-neutral-600 dark:bg-neutral-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 dark:text-neutral-200 text-sm transition-all duration-300"
                            value={limit}
                            onChange={handleLimitChange}
                            min="1"
                            max="100"
                            step="1"
                            placeholder="Rows"
                            onBlur={(e) => {
                                if (!e.target.value || Number(e.target.value) < 1) {
                                    setLimit(1)
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-auto relative z-10">
                <StaticDataTable
                    data={permissions}
                    columns={[
                        {
                            key: 'name',
                            label: 'Name',
                            sortable: true,
                            minWidth: '150px',
                            render: (value: string) => (
                                <span className="font-medium text-gray-800 dark:text-neutral-200 text-xs truncate">{value}</span>
                            )
                        },
                        {
                            key: 'description',
                            label: 'Description',
                            sortable: true,
                            minWidth: '300px'
                        },
                        {
                            key: 'updater',
                            label: 'Updated By',
                            sortable: true,
                            width: '96px',
                            hideOnMobile: true,
                            render: (updater: CreatorUpdater) => (
                                <span className="text-xs text-gray-700 dark:text-neutral-300">
                                    {updater?.name || '-'}
                                </span>
                            )
                        },
                        {
                            key: 'updated_at',
                            label: 'Updated',
                            sortable: true,
                            width: '96px',
                            hideOnMobile: true,
                            render: (value: string) => new Date(value).toLocaleString()
                        },
                        {
                            key: 'creator',
                            label: 'Created By',
                            sortable: true,
                            width: '96px',
                            hideOnMobile: true,
                            render: (creator: CreatorUpdater) => (
                                <span className="text-xs text-gray-700 dark:text-neutral-300">
                                    {creator?.name || '-'}
                                </span>
                            )
                        },
                        {
                            key: 'created_at',
                            label: 'Created',
                            sortable: true,
                            width: '96px',
                            hideOnMobile: true,
                            render: (value: string) => new Date(value).toLocaleString()
                        }
                    ]}
                    actions={[
                        {
                            key: 'edit',
                            icon: <TbEdit size={16} />,
                            onClick: (item: Permission) => handleOpenEditModal(item),
                            title: 'Edit permission',
                            hoverClassName: 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        },
                        {
                            key: 'delete',
                            icon: <TbTrash size={16} />,
                            onClick: (item: Permission) => handleDelete(item.id),
                            hide: () => bulkDeleteMode,
                            title: 'Delete permission',
                            hoverClassName: 'hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                        }
                    ]}
                    selectable={bulkDeleteMode}
                    onSelectItem={(item: Permission) => setSelectedIds(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id])}
                    onSelectAll={toggleAllSelection}
                    isItemSelected={(item: Permission) => selectedIds.includes(item.id)}
                    isAllSelected={permissions.length > 0 && permissions.every(p => selectedIds.includes(p.id))}
                    loading={loading}
                    emptyMessage="No permissions found"
                    onSort={handleSort}
                    orderBy={orderBy}
                    order={order}
                    total={total}
                    currentPage={page}
                    limit={limit}
                    onPageChange={setPage}
                    onLimitChange={(newLimit: number) => {
                        setLimit(newLimit)
                        setPage(1)
                    }}
                    pagination={true}
                />
            </div>

            {/* Permission Modal (Add & Edit) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                                <TbKey className="w-5 h-5 text-blue-600" />
                                {modalMode === 'add' ? 'Add New Permission' : 'Edit Permission'}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            >
                                <TbX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleModalSubmit} className="flex flex-col p-6 space-y-4">
                            {modalError && (
                                <div className="p-3 text-sm bg-red-500/10 text-red-600 border border-red-200 dark:border-red-900/50 rounded-xl">
                                    {modalError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                                    Permission Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. manage_users"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                                    Description
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Brief description of this permission"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={modalLoading}
                                    className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600/90 backdrop-blur-md border border-blue-400/40 hover:bg-blue-500 disabled:opacity-50 rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-300 cursor-pointer"
                                >
                                    {modalLoading && <span className="loader" style={{ width: 16, height: 16 }}></span>}
                                    {modalMode === 'add' ? 'Create Permission' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ImportModal isOpen={showImport} onClose={() => setShowImport(false)} resource="permissions" title="Import Permissions" onSuccess={GetPermissions} />
            <BulkInsertModal isOpen={showBulk} onClose={() => setShowBulk(false)} resource="permissions" title="Bulk Insert Permissions" onSuccess={GetPermissions}
                columns={[
                    { key: 'name', label: 'Name', required: true, example: 'manage_reports' },
                    { key: 'description', label: 'Description', example: 'Can manage reports' },
                ]} />
        </div>
    )
}
