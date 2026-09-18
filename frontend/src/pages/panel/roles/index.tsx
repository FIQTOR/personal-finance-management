import { useEffect, useState } from 'react'
import { TbShieldCheck, TbEdit, TbTrash, TbPlus, TbX, TbLoader } from 'react-icons/tb'
import Notification from '@/components/PanelNotification'
import StaticDataTable from '@/components/StaticDataTable'
import AppConfig from '@/config/AppConfig'
import axiosJWT from '@/utils/axiosJWT'

interface Role {
    id: number
    name: string
    description: string
    permissions: Permission[]
    created_at: string
    updated_at: string
    creator: any
    updater: any
}

interface Permission {
    id: number
    name: string
    description: string
}

export default function RoleManagement() {
    const [roles, setRoles] = useState<Role[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [orderBy, setOrderBy] = useState<keyof Role>('created_at')
    const [order, setOrder] = useState<'DESC' | 'ASC'>('DESC')
    const [limit, setLimit] = useState(10)
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [response, setResponse] = useState<any>(null)
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [selectedRoles, setSelectedRoles] = useState<number[]>([])
    const [fetchTime, setFetchTime] = useState<number | null>(null)

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
    const [editingRole, setEditingRole] = useState<Role | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: [] as number[]
    })
    const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([])
    const [modalLoading, setModalLoading] = useState(false)
    const [modalError, setModalError] = useState<string | null>(null)

    const GetRoles = async () => {
        try {
            setLoading(true)
            const startTime = performance.now()
            const res = await axiosJWT.get(`${AppConfig.baseApiUrl}/roles`, {
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
            setRoles(res.data.data)
            setTotal(res.data.total || res.data.data.length)
            setFetchTime(duration)
            setLoading(false)
        } catch {
            setLoading(false)
        }
    }

    const fetchAvailablePermissions = async () => {
        try {
            const res = await axiosJWT.get(`${AppConfig.baseApiUrl}/permissions`)
            setAvailablePermissions(res.data.data || res.data)
        } catch (err) {
            console.error('Failed to fetch permissions:', err)
        }
    }

    useEffect(() => {
        document.title = `Role Management ${AppConfig.exTitle}`
        GetRoles()
    }, [searchTerm, orderBy, order, limit, page])

    const handleOpenAddModal = () => {
        setModalMode('add')
        setEditingRole(null)
        setFormData({ name: '', description: '', permissions: [] })
        setModalError(null)
        fetchAvailablePermissions()
        setIsModalOpen(true)
    }

    const handleOpenEditModal = (role: Role) => {
        setModalMode('edit')
        setEditingRole(role)
        setFormData({
            name: role.name || '',
            description: role.description || '',
            permissions: (role.permissions || []).map(p => p.id)
        })
        setModalError(null)
        fetchAvailablePermissions()
        setIsModalOpen(true)
    }

    const handlePermissionToggle = (permId: number) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permId)
                ? prev.permissions.filter(id => id !== permId)
                : [...prev.permissions, permId]
        }))
    }

    const handleModalSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setModalError(null)

        if (!formData.name.trim()) {
            setModalError('Role name is required')
            return
        }

        setModalLoading(true)
        try {
            if (modalMode === 'add') {
                const res = await axiosJWT.post(`${AppConfig.baseApiUrl}/roles`, formData)
                setResponse(res.data)
            } else if (modalMode === 'edit' && editingRole) {
                const res = await axiosJWT.put(`${AppConfig.baseApiUrl}/roles/${editingRole.id}`, formData)
                setResponse(res.data)
            }
            setIsModalOpen(false)
            GetRoles()
        } catch (err: any) {
            setModalError(err.response?.data?.message || 'Failed to save role')
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
        const field = key as keyof Role
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
            const res = await axiosJWT.delete(`${AppConfig.baseApiUrl}/roles/${deleteId}`)
            await GetRoles()
            setResponse(res.data)
        } catch (error: any) {
            setResponse(error.response?.data || {
                status: 'error',
                message: 'Failed to delete role'
            })
        }
        setDeleteId(null)
    }

    const toggleAllRolesSelection = () => {
        if (selectedRoles.length === roles.filter(role => role.id !== 1 && role.id !== 2).length) {
            setSelectedRoles([])
        } else {
            setSelectedRoles(roles.filter(role => role.id !== 1 && role.id !== 2).map(role => role.id))
        }
    }

    return (
        <div className="px-6 pt-4 pb-6 relative h-full flex flex-col">

            {/* Header Section */}
            <div className="flex flex-col gap-3 mb-4 sm:mb-6 relative z-10 shrink-0">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <h1 className="text-lg sm:text-xl font-bold text-gray-700 dark:text-neutral-100 flex items-center gap-2 drop-shadow-lg">
                            <TbShieldCheck className="text-gray-700 dark:text-neutral-300" />
                            Role Management
                        </h1>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 flex items-center gap-2">
                            <span>Showing {roles.length} roles</span>
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
                            <span className="hidden sm:inline">Add Role</span>
                        </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
                    <div className="flex-1 flex gap-2">
                        <input
                            type="search"
                            placeholder="Search roles..."
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
                    data={roles}
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
                            key: 'permissions',
                            label: 'Permissions',
                            minWidth: '200px',
                            render: (perms: Permission[]) => (
                                <div
                                    className="flex flex-wrap gap-1"
                                    title={(perms || []).map((p) => p.name).join(', ')}
                                >
                                    {(perms || []).map((permission) => (
                                        <span
                                            key={permission.id}
                                            className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                            title={permission.name}
                                        >
                                            {permission.name.length > 10 ? permission.name.substring(0, 10) + '...' : permission.name}
                                        </span>
                                    ))}
                                    {(!perms || perms.length === 0) && (
                                        <span className="text-xs text-gray-400 dark:text-neutral-500">-</span>
                                    )}
                                </div>
                            )
                        },
                        {
                            key: 'updater',
                            label: 'Updated By',
                            sortable: true,
                            width: '96px',
                            hideOnMobile: true,
                            render: (updater: any) => (
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
                            render: (creator: any) => (
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
                            onClick: (role: Role) => handleOpenEditModal(role),
                            title: 'Edit role',
                            hoverClassName: 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        },
                        {
                            key: 'delete',
                            icon: <TbTrash size={16} />,
                            onClick: (role: Role) => handleDelete(role.id),
                            title: 'Delete role',
                            hoverClassName: 'hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                        }
                    ]}
                    selectedItems={roles.filter(role => selectedRoles.includes(role.id))}
                    onSelectAll={toggleAllRolesSelection}
                    isItemSelected={(role: Role) => selectedRoles.includes(role.id)}
                    isAllSelected={selectedRoles.length === roles.filter(role => role.id !== 1).length}
                    onSort={handleSort}
                    orderBy={orderBy}
                    order={order}
                    loading={loading}
                    emptyMessage="No roles found"
                    total={total}
                    currentPage={page}
                    limit={limit}
                    onPageChange={setPage}
                    pagination={true}
                />
            </div>

            {/* Role Modal (Add & Edit) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                                <TbShieldCheck className="w-5 h-5 text-purple-600" />
                                {modalMode === 'add' ? 'Add New Role' : 'Edit Role'}
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
                        <form onSubmit={handleModalSubmit} className="flex flex-col flex-1 overflow-y-auto p-6 space-y-4">
                            {modalError && (
                                <div className="p-3 text-sm bg-red-500/10 text-red-600 border border-red-200 dark:border-red-900/50 rounded-xl">
                                    {modalError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                                    Role Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Manager"
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
                                    placeholder="Brief description of role capabilities"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                                    Assign Permissions
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-800">
                                    {availablePermissions.map((perm) => {
                                        const isChecked = formData.permissions.includes(perm.id)
                                        return (
                                            <button
                                                type="button"
                                                key={perm.id}
                                                onClick={() => handlePermissionToggle(perm.id)}
                                                className={`flex items-center justify-between p-2 rounded-lg border text-xs text-left transition-all cursor-pointer ${isChecked
                                                    ? 'bg-purple-500/10 border-purple-500/40 text-purple-700 dark:text-purple-300 font-semibold'
                                                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                                                    }`}
                                            >
                                                <span className="truncate">{perm.name}</span>
                                                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isChecked ? 'bg-purple-600 border-purple-600 text-white' : 'border-neutral-400'}`}>
                                                    {isChecked && '✓'}
                                                </span>
                                            </button>
                                        )
                                    })}
                                    {availablePermissions.length === 0 && (
                                        <p className="text-xs text-neutral-400 col-span-2 text-center py-2">No permissions found</p>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800 mt-auto">
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
                                    {modalMode === 'add' ? 'Create Role' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteId && deleteId !== -1 && (
                <Notification
                    message="Are you sure you want to delete this role?"
                    type="action"
                    onConfirm={confirmDelete}
                    onClose={() => setDeleteId(null)}
                />
            )}
        </div>
    )
}
