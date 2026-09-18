import Loading from '@/components/Loading'
import Notification from '@/components/PanelNotification'
import AppConfig from '@/config/AppConfig'
import { selectAuth } from '@/store/authSlice'
import { useAppSelector } from '@/store/hooks'
import axiosJWT from '@/utils/axiosJWT'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { TbUser, TbPlus, TbEdit, TbShieldCheck, TbTrash, TbTrashOff } from 'react-icons/tb'
import * as XLSX from "xlsx";
import StaticDataTable from '@/components/StaticDataTable'

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
    status: 'success' | 'error';
    message: string;
    data?: {
        users: User[];
        total: number;
    };
}

export default function UserManagement() {
    const { user } = useAppSelector(selectAuth)
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
    const [response, setResponse] = useState<ApiResponse | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
    const [fetchTime, setFetchTime] = useState<number | null>(null);

    useEffect(() => {
        document.title = `User Management ${AppConfig.exTitle}`
        GetUsers()
    }, [searchTerm, searchRole, orderBy, order, limit, page])

    const GetUsers = async () => {
        const startTime = performance.now();
        try {
            setLoading(true)
            const res = await axiosJWT.get<{ data: { users: User[]; total: number } }>(`${AppConfig.baseApiUrl}/users`, {
                params: {
                    search: searchTerm,
                    role: searchRole,
                    orderBy,
                    order,
                    limit,
                    page
                }
            })
            const resRole = await axiosJWT.get<{ data: Role[] }>(`${AppConfig.baseApiUrl}/roles`);

            const endTime = performance.now();
            setFetchTime(Math.round(endTime - startTime));

            setRoles(resRole.data.data)
            setUsers(res.data.data.users)
            setTotal(res.data.data.total)
            setLoading(false)
        } catch (error: any) {
            setLoading(false)
            console.error(error)
        }
    }

    const handleDelete = async (id: number) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;

        try {
            const res = await axiosJWT.delete(`${AppConfig.baseApiUrl}/users/${deleteId}`);
            await GetUsers();
            setResponse(res.data);
        } catch (error: any) {
            setResponse(error.response?.data || {
                status: 'error',
                message: 'Failed to delete user'
            });
        }
        setDeleteId(null);
    };

    const handleBulkDeleteConfirm = () => {
        if (selectedUsers.length === 0) return;
        setDeleteId(-1);
    };

    const handleBulkDelete = async () => {
        if (selectedUsers.length === 0) return;

        try {
            setLoading(true);
            const res = await axiosJWT.delete(`${AppConfig.baseApiUrl}/users/bulk-delete`, {
                data: { userIds: selectedUsers }
            });
            if (res.data.status === 'success') {
                setSelectedUsers([]);
                setBulkDeleteMode(false);
            }
            await GetUsers();
            setResponse(res.data);
        } catch (error: any) {
            setResponse(error.response?.data || {
                status: 'error',
                message: 'Failed to delete users'
            });
        }
        setLoading(false);
        setDeleteId(null);
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

    const [isDownloading, setIsDownloading] = useState(false)
    const handleDownloadAllUserData = async () => {
        setIsDownloading(true)
        try {
            const res = await axiosJWT.get<{ data: User[] }>(`${AppConfig.baseApiUrl}/all-users`);
            const data = res.data.data.map((user) => ({
                name: user.name,
                email: user.email,
                role: user.role.name,
                permissions: user.role.permissions.map((p: any) => p.name).join(', '),
                is_blocked: user.is_blocked,
                last_password_change: user.last_password_change,
                updated_by: user.updater ? user.updater.name : null,
                updated_at: user.updated_at,
                created_by: user.creator ? user.creator.name : null,
                created_at: user.created_at,
            }))

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
            XLSX.writeFile(workbook, `users_${new Date().toISOString()}.xlsx`);
        } catch {
            console.error('Failed to download all user data')
        } finally {
            setIsDownloading(false)
        }
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
                        <button
                            onClick={handleDownloadAllUserData}
                            disabled={isDownloading}
                            className="flex items-center gap-2 bg-white/10 dark:bg-neutral-800/50 backdrop-blur-sm border border-white/20 text-gray-700 dark:text-neutral-200 px-3 py-2 rounded-lg hover:bg-white/20 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            <div className="flex items-center gap-2">
                                {isDownloading ? (
                                    <>
                                        <div className="w-5 h-5 flex items-center justify-center">
                                            <Loading size={20} />
                                        </div>
                                        <span className="hidden sm:inline transition-all duration-300">Downloading...</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-5 h-5 flex items-center justify-center">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                        </div>
                                        <span className="hidden sm:inline transition-all duration-300">Download XLSX</span>
                                    </>
                                )}
                            </div>
                        </button>
                        <button
                            onClick={() => {
                                setBulkDeleteMode(!bulkDeleteMode);
                                setSelectedUsers([]);
                            }}
                            className={`flex items-center gap-2 backdrop-blur-sm border px-3 py-2 rounded-lg transition-all duration-300 shadow-lg text-sm ${bulkDeleteMode
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
                        {bulkDeleteMode && selectedUsers.length > 0 && (
                            <button
                                onClick={handleBulkDeleteConfirm}
                                disabled={loading}
                                className="flex items-center gap-2 bg-red-500 dark:bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {loading ? (
                                    <>
                                        <Loading size={16} />
                                        <span className="hidden sm:inline">Deleting...</span>
                                    </>
                                ) : (
                                    <>
                                        <TbTrash className="w-4 h-4" />
                                        <span className="hidden sm:inline">Delete ({selectedUsers.length})</span>
                                    </>
                                )}
                            </button>
                        )}
                        <Link to={'/panel/users/add'} className="flex items-center gap-2 bg-white/10 dark:border-neutral-600 dark:bg-neutral-800/50 dark:text-neutral-200 backdrop-blur-sm border border-white/20 text-gray-700 px-3 py-2 rounded-lg hover:bg-white/20 transition-all duration-300 shadow-lg text-sm">
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

                    <div className="relative">
                        <select
                            className="pl-3 pr-8 py-2 w-full rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 dark:border-neutral-600 dark:bg-neutral-800/50 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 dark:text-neutral-200 appearance-none cursor-pointer text-sm min-w-30"
                            value={searchRole}
                            onChange={(e) => {
                                setSearchRole(e.target.value)
                                setPage(1)
                            }}
                        >
                            <option value="">All Roles</option>
                            {roles.map((role) => (
                                <option key={role.id} value={role.name}>
                                    {role.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-700 dark:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
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

            <StaticDataTable
                data={users.map(u => ({ ...u, currentUserEmail: user?.email }))}
                columns={[
                    {
                        key: 'name',
                        label: 'Name',
                        sortable: true,
                        minWidth: '150px',
                        render: (value: any, item: any) => (
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
                        render: (value: any) => (
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
                        render: (value: any) => value ? (
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
                        render: (value: any, item: any) => (
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
                        render: (value: any) => (
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
                        render: (value: any) => (
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
                        href: (item: any) => `/panel/users/${item.id}`,
                        title: 'Edit user',
                        hoverClassName: 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    },
                    {
                        key: 'delete',
                        icon: <TbTrash size={16} />,
                        onClick: (item: any) => handleDelete(item.id),
                        disabled: (item: any) => item.id === 1 || item.email === user?.email,
                        hide: () => bulkDeleteMode,
                        title: (item: any) => item.id === 1 || item.email === user?.email ? 'Cannot delete this user' : 'Delete user',
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

            {deleteId && deleteId !== -1 && (
                <Notification
                    message="Are you sure you want to delete this user?"
                    type="action"
                    onConfirm={confirmDelete}
                    onClose={() => setDeleteId(null)}
                />
            )}

            {deleteId === -1 && (
                <Notification
                    message={`Are you sure you want to delete ${selectedUsers.length} selected user${selectedUsers.length > 1 ? 's' : ''}? This action cannot be undone.`}
                    type="action"
                    onConfirm={handleBulkDelete}
                    onClose={() => {
                        setDeleteId(null);
                        setSelectedUsers([]);
                    }}
                />
            )}
        </div>
    )
}
