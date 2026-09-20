import { useEffect, useState } from 'react'
import { TbKey, TbEdit, TbTrash, TbPlus, TbX, TbLoader } from 'react-icons/tb'
import Notification from '@/components/PanelNotification'
import StaticDataTable from '@/components/StaticDataTable'
import AppConfig from '@/config/AppConfig'
import axiosJWT from '@/utils/axiosJWT'

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

interface ApiResponse {
    status: 'success' | 'error'
    message: string
    data?: Permission[]
    total?: number
}

export default function PermissionManagement() {
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [response, setResponse] = useState<ApiResponse | null>(null)

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

    const GetPermissions = async () => {
        try {
            setLoading(true)
            const startTime = performance.now()
            const res = await axiosJWT.get<{ time?: number; data: Permission[]; total: number }>(`${AppConfig.baseApiUrl}/permissions`, {
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

            setPermissions(res.data.data)
            setTotal(res.data.total)
            setFetchTime(duration)
            setLoading(false)
        } catch {
            setLoading(false)
        }
    }

    useEffect(() => {
        document.title = `Permission Management ${AppConfig.exTitle}`
        GetPermissions()
    }, [searchTerm, orderBy, order, limit, page])

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
                const res = await axiosJWT.post(`${AppConfig.baseApiUrl}/permissions`, formData)
                setResponse(res.data)
            } else if (modalMode === 'edit' && editingPermission) {
                const res = await axiosJWT.put(`${AppConfig.baseApiUrl}/permissions/${editingPermission.id}`, formData)
                setResponse(res.data)
            }
            setIsModalOpen(false)
            GetPermissions()
        } catch (err: any) {
            setModalError(err.response?.data?.message || 'Failed to save permission')
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

    const handleDelete = async (id: number) => {
        setDeleteId(id)
    }

    const confirmDelete = async () => {
        if (!deleteId) return

        try {
            const res = await axiosJWT.delete(`${AppConfig.baseApiUrl}/permissions/${deleteId}`)
            setResponse(res.data)
            if (res.data.status === 'success') {
                GetPermissions()
                setTimeout(() => {
                    setResponse(null)
                }, 3000)
            }
        } catch (error: any) {
            setResponse(error.response?.data || {
                status: 'error',
                message: 'Failed to delete permission'
            })
            setTimeout(() => {
                setResponse(null)
            }, 3000)
        }
        setDeleteId(null)
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
                        <button
                            type="button"
                            onClick={handleOpenAddModal}
                            className="flex items-center gap-2 bg-white/10 dark:border-neutral-600 dark:bg-neutral-800/50 dark:text-neutral-200 backdrop-blur-sm border border-white/20 text-gray-700 px-3 py-2 rounded-lg hover:bg-white/20 transition-all duration-300 shadow-lg text-sm cursor-pointer"
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
                            className="flex-1 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 dark:border-neutral-600 dark:bg-neutral-800/50 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 dark:text-neutral-200 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <input
                            type="number"
                            className="w-16 sm:w-20 px-2 sm:px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 dark:border-neutral-600 dark:bg-neutral-800/50 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 dark:text-neutral-200 text-sm"
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

                {response && (
                    <div className={`p-3 rounded-lg backdrop-blur-sm transition-all duration-300 text-sm ${response.status === 'success'
                        ? 'bg-green-500/10 text-green-700 border border-green-200/50'
                        : 'bg-red-500/10 text-red-700 border border-red-200/50'
                        }`}>
                        {response.message}
                    </div>
                )}
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
                            title: 'Delete permission',
                            hoverClassName: 'hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                        }
                    ]}
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
                                <TbKey className="w-5 h-5 text-purple-600" />
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
                                    className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl transition-all shadow-md cursor-pointer"
                                >
                                    {modalLoading && <TbLoader className="w-4 h-4 animate-spin" />}
                                    {modalMode === 'add' ? 'Create Permission' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteId && deleteId !== -1 && (
                <Notification
                    message="Are you sure you want to delete this permission?"
                    type="action"
                    onConfirm={confirmDelete}
                    onClose={() => setDeleteId(null)}
                />
            )}
        </div>
    )
}
