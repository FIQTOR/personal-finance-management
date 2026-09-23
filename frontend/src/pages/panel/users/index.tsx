import Loading from '@/components/Loading'
import AppConfig from '@/config/AppConfig'
import { selectAuth } from '@/store/authSlice'
import { useAppSelector } from '@/store/hooks'
import apiClient from '@/services/apiClient';
import { Link } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { TbUser, TbPlus, TbEdit, TbShieldCheck, TbTrash, TbTrashOff, TbFileUpload, TbUpload } from 'react-icons/tb'
import StaticDataTable from '@/components/StaticDataTable'
import PanelSelect from '@/components/PanelSelect'
import ExportMenu from '@/components/ExportMenu'
import BulkInsertModal from '@/components/BulkInsertModal'
import ImportModal from '@/components/ImportModal'
import { useNotification } from '@/context/useNotification'
import { getErrorMessage } from '@/utils/error'
import type { ExportColumn } from '@/utils/export'

export interface CreatorUpdater {
    id: number;
    name: string;
}

export interface Role {
    id: number;
    name: string;
    permissions: Permission[];
}

export interface Permission {
    id: number;
    name: string;
    description: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    google_id: string | null;
    is_blocked: boolean;
    blocked_at: string | null;
    last_password_change: string | null;
    created_at: string;
    updated_at: string;
    creator: CreatorUpdater | null;
    updater: CreatorUpdater | null;
    role: Role;
}

interface ApiResponse {
    success: boolean;
    message: string;
    data?: {
        users: User[];
        total: number;
    };
}

type UserRecord = User & { currentUserEmail?: string };

export default function UserManagement() {
    const { user } = useAppSelector(selectAuth)
    const { notify, confirm } = useNotification()
    const [users, setUsers] = useState<User[]>([])
    const [roles, setRoles] = useState<Role[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [searchRole, setSearchRole] = useState('')
    const [orderBy, setOrderBy] = useState<keyof User>('created_at')
    const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC')
    const [limit, setLimit] = useState(10)
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)
    const [selectedUsers, setSelectedUsers] = useState<number[]>([])
    const [bulkDeleteMode, setBulkDeleteMode] = useState(false)
    const [fetchTime, setFetchTime] = useState<number | null>(null);
    const [showBulk, setShowBulk] = useState(false)
    const [showImport, setShowImport] = useState(false)

    const GetUsers = useCallback(async () => {
        const startTime = performance.now();
        try {
            setLoading(true)
            const res = await apiClient.get<{ data: { users: User[]; total: number } }>(`/users`, {
                params: {
                    search: searchTerm,
                    role: searchRole,
                    orderBy,
                    order,
                    limit,
                    page
                }
            })
            const resRole = await apiClient.get<{ data: { roles: Role[] } }>(`/roles`);

            const endTime = performance.now();
            setFetchTime(Math.round(endTime - startTime));

            setRoles(resRole.data.data.roles)
            setUsers(res.data.data.users)
            setTotal(res.data.data.total)
            setLoading(false)
        } catch (error: unknown) {
            setLoading(false)
            notify(getErrorMessage(error, 'Failed to fetch users'), 'error')
        }
    }, [searchTerm, searchRole, orderBy, order, limit, page, notify])

    useEffect(() => {
        document.title = `User Management ${AppConfig.exTitle}`
        GetUsers()
    }, [GetUsers])

    const handleDelete = (id: number) => {
        confirm('Are you sure you want to delete this user? This action cannot be undone.', async () => {
            try {
                const res = await apiClient.delete(`/users/${id}`);
                await GetUsers();
                notify(res.data.message || 'User deleted successfully', 'success');
            } catch (error: unknown) {
                notify(getErrorMessage(error, 'Failed to delete user'), 'error');
            }
        }, { actions: [{ label: 'Delete', variant: 'danger', onClick: () => {} }, { label: 'Cancel', onClick: () => {} }] });
    };

    const handleBulkDelete = () => {
        if (selectedUsers.length === 0) { notify('Please select at least one record', 'warning'); return; }
        confirm(`Are you sure you want to delete ${selectedUsers.length} selected user${selectedUsers.length > 1 ? 's' : ''}? This action cannot be undone.`, async () => {
            try {
                setLoading(true);
                const res = await apiClient.delete(`/users/bulk-delete`, { data: { userIds: selectedUsers } });
                setSelectedUsers([]);
                setBulkDeleteMode(false);
                await GetUsers();
                notify(res.data.message || `${selectedUsers.length} users deleted`, 'success');
            } catch (error: unknown) {
                notify(getErrorMessage(error, 'Failed to delete users'), 'error');
            } finally {
                setLoading(false);
            }
        }, { actions: [{ label: 'Delete All', variant: 'danger', onClick: () => {} }, { label: 'Cancel', onClick: () => {} }] });
    };

    const toggleUserSelection = (userId: number) => {
        if (!bulkDeleteMode) return;

        const userItem = users.find(u => u.id === userId);
        if (!userItem || userItem.id === 1 || userItem.email === user?.email) return;

        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    const toggleAllUsersSelection = () => {
        if (!bulkDeleteMode) return;

        const selectableUsers = users.filter(userItem => userItem.id !== 1 && userItem.email !== user?.email);
        const currentlySelectedSelectable = selectedUsers.filter(id => {
            const userItem = users.find(u => u.id === id);
            return userItem && userItem.id !== 1 && userItem.email !== user?.email;
        });

        if (currentlySelectedSelectable.length === selectableUsers.length) {
            setSelectedUsers(selectedUsers.filter(id => {
                const selectedUser = users.find(u => u.id === id);
                return !selectedUser || selectedUser.id === 1 || selectedUser.email === user?.email;
            }));
        } else {
            const newSelection = [...selectedUsers.filter(id => {
                const selectedUser = users.find(u => u.id === id);
                return selectedUser && (selectedUser.id === 1 || selectedUser.email === user?.email);
            }), ...selectableUsers.map(userItem => userItem.id)];
            setSelectedUsers(newSelection);
        }
    };

    const handleCheckboxChange = (userId: number) => {
        const userItem = users.find(u => u.id === userId);
        if (!userItem || userItem.id === 1 || userItem.email === user?.email) return;

        toggleUserSelection(userId);
    };

    const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.max(1, Number(e.target.value))
        setLimit(value)
        setPage(1)
    }

    const handleSort = (field: keyof User | string | number | symbol) => {
        if (typeof field === 'string') {
            const userField = field as keyof User
            if (orderBy === userField) {
                setOrder(order === 'ASC' ? 'DESC' : 'ASC')
            } else {
                setOrderBy(userField)
                setOrder('ASC')
            }
        }
    }

    const exportColumns: ExportColumn<User>[] = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name' },
        { key: 'email', header: 'Email' },
        { key: 'role', header: 'Role', value: (u) => u.role?.name || '-' },
        { key: 'permissions', header: 'Permissions', value: (u) => (u.role?.permissions || []).map((p) => p.name).join(', ') },
        { key: 'is_blocked', header: 'Blocked', value: (u) => (u.is_blocked ? 'Yes' : 'No') },
        { key: 'last_password_change', header: 'Last Password Change', value: (u) => u.last_password_change || '' },
        { key: 'created_at', header: 'Created At' },
    ];

    const [isDownloading, setIsDownloading] = useState(false)
    const handleDownloadAllUserData = async () => {
        setIsDownloading(true)
        try {
            await exportDataSafe()
        } catch (error: unknown) {
            notify(getErrorMessage(error, 'Failed to download all user data'), 'error')
        } finally {
            setIsDownloading(false)
        }
    }

    const exportDataSafe = async () => {
        const res = await apiClient.get<{ data: User[] }>(`/all-users`);
        const data: User[] = res.data.data;
        const { exportData } = await import('@/utils/export');
        await exportData('xlsx', data, exportColumns, 'users');
        notify('Exported users to Excel', 'success');
    }


    return (
        <div className="p-6 relative h-full flex flex-col">
            <div className="flex flex-col gap-3 mb-4 sm:mb-6 relative z-10 shrink-0">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <h1 className="text-lg sm:text-xl font-bold text-gray-700 dark:text-neutral-100 flex items-center gap-2 drop-shadow-lg">
                            <TbUser className="text-gray-700 dark:text-neutral-300" />
                            User Management
                        </h1>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 flex items-center gap-2">
                            <span>Showing {users.length} users</span>
                            {fetchTime !== null && (
                                <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-neutral-800 text-xs font-mono text-gray-500 dark:text-neutral-400">
                                    {fetchTime} ms
                                </span>
                            )}
                        </div>
                    </div>
                    <div className='flex flex-wrap gap-2 sm:gap-4'>
                        <button type="button" onClick={() => setShowImport(true)}
                            className="flex items-center gap-2 bg-indigo-600/90 backdrop-blur-md border border-indigo-400/40 text-white px-3 py-2 rounded-xl hover:bg-indigo-500 transition-all duration-300 shadow-lg text-sm">
                            <TbFileUpload /><span className="hidden sm:inline">Import</span>
                        </button>
                        <button type="button" onClick={() => setShowBulk(true)}
                            className="flex items-center gap-2 bg-blue-600/90 backdrop-blur-md border border-blue-400/40 text-white px-3 py-2 rounded-xl hover:bg-blue-500 transition-all duration-300 shadow-lg text-sm">
                            <TbUpload /><span className="hidden sm:inline">Bulk Insert</span>
                        </button>
                        <ExportMenu rows={users} columns={exportColumns} filename="users" tableName="users" />
                        <button
                            type="button"
                            onClick={handleDownloadAllUserData}
                            disabled={isDownloading}
                            className="flex items-center gap-2 bg-white/10 dark:bg-neutral-800/50 backdrop-blur-sm border border-white/20 text-gray-700 dark:text-neutral-200 px-3 py-2 rounded-xl hover:bg-white/20 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            {isDownloading ? (
                                <>
                                    <Loading size={20} />
                                    <span className="hidden lg:inline transition-all duration-300">Downloading...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    <span className="hidden lg:inline transition-all duration-300">Download XLSX</span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => {
                                setBulkDeleteMode(!bulkDeleteMode);
                                setSelectedUsers([]);
                            }}
                            className={`flex items-center gap-2 backdrop-blur-sm border px-3 py-2 rounded-xl transition-all duration-300 shadow-lg text-sm font-medium ${bulkDeleteMode
                                ? 'bg-red-500/20 dark:bg-red-500/30 border-red-200/50 dark:border-red-700/50 text-red-700 dark:text-red-300'
                                : 'bg-white/10 dark:bg-neutral-800/50 border-white/20 text-gray-700 dark:text-neutral-200 hover:bg-white/20'
                                }`}
                        >
                            {bulkDeleteMode ? (
                                <>
                                    <TbTrashOff className="w-4 h-4" />
                                    <span className="hidden sm:inline">Cancel Bulk</span>
                                </>
                            ) : (
                                <>
                                    <TbTrash className="w-4 h-4" />
                                    <span className="hidden sm:inline">Bulk Delete</span>
                                </>
                            )}
                        </button>
                        {bulkDeleteMode && (
                            <button
                                onClick={handleBulkDelete}
                                disabled={loading}
                                className="flex items-center gap-2 bg-red-500 dark:bg-red-600 text-white px-3 py-2 rounded-xl hover:bg-red-600 dark:hover:bg-red-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                                <TbTrash className="w-4 h-4" />
                                <span className="hidden sm:inline">Delete Selected ({selectedUsers.length})</span>
                            </button>
                        )}
                        <Link to={'/panel/users/add'} className="flex items-center gap-2 bg-white/10 dark:border-neutral-600 dark:bg-neutral-800/50 dark:text-neutral-200 backdrop-blur-sm border border-white/20 text-gray-700 px-3 py-2 rounded-xl hover:bg-white/20 transition-all duration-300 shadow-lg text-sm">
                            <TbPlus />
                            <span className="hidden sm:inline">Add User</span>
                        </Link>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
                    <div className="flex-1 flex gap-2">
                        <input
                            type="search"
                            placeholder="Search users..."
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

                    <PanelSelect
                        value={searchRole}
                        onChange={(v) => { setSearchRole(v); setPage(1); }}
                        placeholder="All Roles"
                        compact
                        className="min-w-30"
                        options={[{ value: '', label: 'All Roles' }, ...roles.map((role) => ({ value: role.name, label: role.name }))]}
                    />
                </div>
            </div>

            <StaticDataTable
                data={users.map(u => ({ ...u, currentUserEmail: user?.email }))}
                columns={[
                    {
                        key: 'name',
                        label: 'Name',
                        sortable: true,
                        minWidth: '150px',
                        render: (value: string, item: UserRecord) => (
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-800 dark:text-neutral-200 text-xs truncate">
                                        {value}
                                    </span>
                                    {item.email === user?.email && (
                                        <span className="px-1 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full whitespace-nowrap">
                                            You
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-gray-500 dark:text-neutral-400 sm:hidden truncate">
                                    {item.email}
                                </span>
                            </div>
                        )
                    },
                    {
                        key: 'email',
                        label: 'Email',
                        sortable: true,
                        minWidth: '200px',
                        hideOnMobile: true,
                        render: (value: string) => (
                            <span className="text-xs text-gray-700 dark:text-neutral-300 truncate">
                                {value}
                            </span>
                        )
                    },
                    {
                        key: 'google_id',
                        label: 'Google',
                        sortable: true,
                        width: '64px',
                        align: 'center',
                        render: (value: string | null) => value ? (
                            <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
                                <TbShieldCheck className="w-4 h-4" />
                                <span className="hidden sm:inline text-xs">Connected</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-1 text-gray-400 dark:text-neutral-500">
                                <TbShieldCheck className="w-4 h-4" />
                                <span className="hidden sm:inline text-xs">Not</span>
                            </div>
                        )
                    },
                    {
                        key: 'is_blocked',
                        label: 'Status',
                        sortable: true,
                        width: '80px',
                        align: 'center',
                        render: (value: string, item: UserRecord) => (
                            <div className='flex flex-col items-center gap-1'>
                                <span className={`px-2 py-0.5 rounded-full text-xs w-fit ${value
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                    }`}>
                                    {value ? 'Blocked' : 'Active'}
                                </span>
                                <span className='text-xs text-gray-400 dark:text-neutral-500 hidden lg:block'>
                                    {item.blocked_at ? new Date(item.blocked_at).toLocaleDateString() : ''}
                                </span>
                            </div>
                        )
                    },
                    {
                        key: 'role',
                        label: 'Role',
                        sortable: true,
                        width: '80px',
                        render: (value: Role | null) => (
                            <span className="text-xs text-gray-700 dark:text-neutral-300">
                                {value?.name || '-'}
                            </span>
                        )
                    },
                    {
                        key: 'last_password_change',
                        label: 'Password',
                        sortable: true,
                        width: '112px',
                        render: (value: string | null) => (
                            <span className="text-xs text-gray-700 dark:text-neutral-300">
                                {value ? new Date(value).toLocaleDateString() : 'Never'}
                            </span>
                        )
                    },
                    {
                        key: 'updater',
                        label: 'Updated By',
                        sortable: true,
                        width: '96px',
                        hideOnMobile: true,
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
                        href: (item: UserRecord) => `/panel/users/${item.id}`,
                        title: 'Edit user',
                        hoverClassName: 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    },
                    {
                        key: 'delete',
                        icon: <TbTrash size={16} />,
                        onClick: (item: UserRecord) => handleDelete(item.id),
                        disabled: (item: UserRecord) => item.id === 1 || item.email === user?.email,
                        hide: () => bulkDeleteMode,
                        title: (item: UserRecord) => item.id === 1 || item.email === user?.email ? 'Cannot delete this user' : 'Delete user',
                        hoverClassName: 'hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                    }
                ]}
                selectable={bulkDeleteMode}
                selectedItems={users.filter(u => selectedUsers.includes(u.id))}
                onSelectItem={(item) => handleCheckboxChange(item.id)}
                onSelectAll={toggleAllUsersSelection}
                isItemSelected={(item) => selectedUsers.includes(item.id)}
                isAllSelected={(() => {
                    const selectableUsers = users.filter(u => u.id !== 1 && u.email !== user?.email);
                    return selectableUsers.length > 0 && selectableUsers.every(u => selectedUsers.includes(u.id));
                })()}
                disabledItems={(item) => item.id === 1 || item.email === user?.email}
                onSort={handleSort}
                orderBy={orderBy}
                order={order}
                idKey="id"
                minTableWidth="800px"
                stickyHeader={true}
                hoverRows={true}
                loading={loading}
                pagination={true}
                total={total}
                currentPage={page}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={setLimit}
            />

            <ImportModal isOpen={showImport} onClose={() => setShowImport(false)} resource="users" title="Import Users" onSuccess={GetUsers} />
            <BulkInsertModal isOpen={showBulk} onClose={() => setShowBulk(false)} resource="users" title="Bulk Insert Users" onSuccess={GetUsers}
                columns={[
                    { key: 'name', label: 'Name', required: true, example: 'John Doe' },
                    { key: 'email', label: 'Email', required: true, example: 'john@example.com' },
                    { key: 'password', label: 'Password', required: true, example: 'secret123' },
                    { key: 'roleId', label: 'Role ID', example: '1' },
                ]} />
        </div>
    )
}
