import { Link } from 'react-router-dom'
import { TbArrowsSort, TbSquareCheck, TbSquare } from 'react-icons/tb'
import type { ReactNode } from 'react'

// Generic interfaces for any data type
export interface ColumnConfig<T = any> {
    key: keyof T
    label: string
    sortable?: boolean
    width?: string
    minWidth?: string
    maxWidth?: string
    align?: 'left' | 'center' | 'right'
    hideOnMobile?: boolean
    hideOnTablet?: boolean
    hideOnDesktop?: boolean
    render?: (value: any, item: T, index: number) => ReactNode
    className?: string
    thClassName?: string
    tdClassName?: string
}

export interface ActionConfig<T = any> {
    key: string
    label?: string
    icon: ReactNode
    onClick?: (item: T, index: number) => void
    href?: (item: T) => string
    disabled?: (item: T) => boolean
    hide?: (item: T) => boolean
    title?: string | ((item: T) => string)
    className?: string
    hoverClassName?: string
    target?: '_blank' | '_self' | '_parent' | '_top'
}

export interface StaticDataTableProps<T = any> {
    data: T[]
    columns: ColumnConfig<T>[]
    actions?: ActionConfig<T>[]
    selectable?: boolean
    selectedItems?: T[]
    onSelectItem?: (item: T, index: number) => void
    onSelectAll?: () => void
    isItemSelected?: (item: T) => boolean
    isAllSelected?: boolean
    disabledItems?: (item: T) => boolean
    onSort?: (key: keyof T | string | number | symbol) => void
    orderBy?: keyof T
    order?: 'ASC' | 'DESC'
    loading?: boolean
    emptyMessage?: string
    className?: string
    tableClassName?: string
    wrapperClassName?: string
    rowClassName?: (item: T, index: number) => string
    idKey?: keyof T
    minTableWidth?: string
    stickyHeader?: boolean
    hoverRows?: boolean
    stripedRows?: boolean
    compact?: boolean
    borderless?: boolean
    // Pagination props
    total?: number
    currentPage?: number
    limit?: number
    onPageChange?: (page: number) => void
    onLimitChange?: (limit: number) => void
    pagination?: boolean
}

const StaticDataTable = <T extends Record<string, any>>({
    data,
    columns,
    actions = [],
    selectable = false,
    selectedItems = [],
    onSelectItem,
    onSelectAll,
    isItemSelected = (item) => selectedItems.includes(item),
    isAllSelected = false,
    disabledItems,
    onSort,
    orderBy,
    loading = false,
    emptyMessage = 'No data available',
    tableClassName = '',
    wrapperClassName = '',
    rowClassName,
    idKey = 'id' as keyof T,
    minTableWidth = '800px',
    stickyHeader = true,
    hoverRows = true,
    stripedRows = false,
    compact = false,
    borderless = false,
    total = 0,
    currentPage = 1,
    limit = 10,
    onPageChange,
    pagination = false
}: StaticDataTableProps<T>) => {

    const renderCellContent = (column: ColumnConfig<T>, item: T, index: number) => {
        const value = item[column.key]

        if (column.render) {
            return column.render(value, item, index)
        }

        // Default rendering based on value type
        if (value === null || value === undefined) {
            return <span className="text-gray-400 dark:text-neutral-500">-</span>
        }

        if (typeof value === 'boolean') {
            return (
                <span className={`px-2 py-0.5 rounded-full text-xs w-fit inline-block ${value
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}>
                    {value ? 'Active' : 'Inactive'}
                </span>
            )
        }

        if (typeof value === 'object' && value !== null) {
            // Handle nested objects (like role.name, creator.name, etc.)
            if ('name' in value && typeof value.name === 'string') {
                return <span>{value.name}</span>
            }
            if ('toString' in value && typeof value.toString === 'function') {
                return <span>{value.toString()}</span>
            }
        }

        if (typeof value === 'string') {
            // Handle date strings
            const dateValue = new Date(value)
            if (!isNaN(dateValue.getTime())) {
                return <span>{dateValue.toLocaleDateString()}</span>
            }

            // Handle long strings
            if (value.length > 50) {
                return <span title={value}>{value.substring(0, 50)}...</span>
            }
        }

        return <span>{value}</span>
    }

    const getHeaderCellClasses = (column: ColumnConfig<T>) => {
        const baseClasses = `px-3 py-3 text-left ${compact ? 'py-2' : 'py-3'}`
        const widthClasses = column.width || ''
        const minWidthClasses = column.minWidth || ''
        const maxWidthClasses = column.maxWidth || ''
        const alignClasses = {
            left: 'text-left',
            center: 'text-center',
            right: 'text-right'
        }[column.align || 'left']
        const hideClasses = [
            column.hideOnMobile ? 'hidden sm:table-cell' : '',
            column.hideOnTablet ? 'hidden lg:table-cell' : '',
            column.hideOnDesktop ? 'hidden xl:table-cell' : ''
        ].filter(Boolean).join(' ')

        return `${baseClasses} ${widthClasses} ${minWidthClasses} ${maxWidthClasses} ${alignClasses} ${hideClasses} ${column.thClassName || ''}`.trim()
    }

    const getDataCellClasses = (column: ColumnConfig<T>) => {
        const baseClasses = `px-3 py-3 ${compact ? 'py-2' : 'py-3'}`
        const widthClasses = column.width || ''
        const minWidthClasses = column.minWidth || ''
        const maxWidthClasses = column.maxWidth || ''
        const alignClasses = {
            left: 'text-left',
            center: 'text-center',
            right: 'text-right'
        }[column.align || 'left']
        const hideClasses = [
            column.hideOnMobile ? 'hidden sm:table-cell' : '',
            column.hideOnTablet ? 'hidden lg:table-cell' : '',
            column.hideOnDesktop ? 'hidden xl:table-cell' : ''
        ].filter(Boolean).join(' ')

        return `${baseClasses} ${widthClasses} ${minWidthClasses} ${maxWidthClasses} ${alignClasses} ${hideClasses} ${column.tdClassName || ''}`.trim()
    }

    const getRowClasses = (item: T, index: number) => {
        const isSelected = isItemSelected(item)
        const baseClasses = hoverRows ? 'hover:bg-gray-50/50 dark:hover:bg-neutral-700/30' : ''
        const selectedClasses = isSelected ? 'bg-red-50/50 dark:bg-red-900/10' : ''
        const stripedClasses = stripedRows && index % 2 === 1 ? 'bg-gray-50/20 dark:bg-neutral-800/50' : ''
        const customClasses = rowClassName ? rowClassName(item, index) : ''

        return `${baseClasses} ${selectedClasses} ${stripedClasses} ${customClasses}`.trim()
    }

    const isRowDisabled = (item: T) => {
        return disabledItems ? disabledItems(item) : false
    }

    return (
        <div className="flex-1 overflow-auto relative z-10">
            <div className="h-full flex flex-col min-h-0">
                <div className={`overflow-x-auto ${wrapperClassName}`}>
                    <table className={`w-full ${borderless ? '' : 'border border-white/20 dark:border-neutral-600'
                        } rounded-2xl bg-white/10 dark:bg-neutral-800/50 backdrop-blur-lg min-w-[${minTableWidth}] ${tableClassName}`}>

                        {/* Table Header */}
                        <thead className={`bg-white dark:bg-neutral-800 ${borderless ? '' : 'border-b border-gray-100/20 dark:border-neutral-600/20'
                            } ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
                            <tr>
                                {selectable && (
                                    <th className={`w-8 px-2 py-3 text-center ${compact ? 'py-2' : 'py-3'}`}>
                                        <button
                                            onClick={onSelectAll}
                                            disabled={data.length === 0}
                                            className="flex items-center justify-center w-5 h-5 text-gray-600 dark:text-neutral-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title={isAllSelected ? 'Deselect all' : 'Select all'}
                                        >
                                            {isAllSelected ? (
                                                <TbSquareCheck className="w-4 h-4" />
                                            ) : (
                                                <TbSquare className="w-4 h-4" />
                                            )}
                                        </button>
                                    </th>
                                )}

                                {columns.map((column, index) => (
                                    <th key={`${String(column.key)}-${index}`} className={getHeaderCellClasses(column)}>
                                        {column.sortable && onSort ? (
                                            <div className="flex items-center gap-1 cursor-pointer" onClick={() => onSort(column.key)}>
                                                <span className="text-xs font-medium text-gray-700 dark:text-neutral-300">
                                                    {column.label}
                                                </span>
                                                <TbArrowsSort className={`w-3 h-3 hover:text-purple-600 dark:hover:text-purple-400 ${orderBy === column.key ? 'text-purple-600 dark:text-purple-400' : ''
                                                    }`} />
                                            </div>
                                        ) : (
                                            <span className="text-xs font-medium text-gray-700 dark:text-neutral-300">
                                                {column.label}
                                            </span>
                                        )}
                                    </th>
                                ))}

                                {actions.length > 0 && (
                                    <th className={`w-24 px-3 py-3 text-center ${compact ? 'py-2' : 'py-3'}`}>
                                        <span className="text-xs font-medium text-gray-700 dark:text-neutral-300">Actions</span>
                                    </th>
                                )}
                            </tr>
                        </thead>

                        {/* Table Body */}
                        <tbody className={borderless ? '' : 'divide-y divide-gray-100/50 dark:divide-neutral-600/50'}>
                            {loading ? (
                                Array.from({ length: Math.min(limit || 5, 8) }).map((_, rowIndex) => (
                                    <tr key={`skeleton-${rowIndex}`} className="animate-pulse">
                                        {selectable && (
                                            <td className={`px-2 py-3 text-center ${compact ? 'py-2' : 'py-3'}`}>
                                                <div className="w-4 h-4 mx-auto bg-gray-200 dark:bg-neutral-700/60 rounded"></div>
                                            </td>
                                        )}
                                        {columns.map((column, colIndex) => {
                                            const hideClasses = [
                                                column.hideOnMobile ? 'hidden sm:table-cell' : '',
                                                column.hideOnTablet ? 'hidden lg:table-cell' : '',
                                                column.hideOnDesktop ? 'hidden xl:table-cell' : ''
                                            ].filter(Boolean).join(' ');
                                            const widthClass = colIndex % 3 === 0 ? 'w-3/4' : colIndex % 3 === 1 ? 'w-1/2' : 'w-2/3';
                                            return (
                                                <td key={`skeleton-col-${colIndex}`} className={`px-3 py-3 ${compact ? 'py-2' : 'py-3'} ${hideClasses}`}>
                                                    <div className={`h-4 bg-gray-200 dark:bg-neutral-700/60 rounded ${widthClass}`}></div>
                                                </td>
                                            );
                                        })}
                                        {actions.length > 0 && (
                                            <td className={`w-24 px-3 py-3 text-center ${compact ? 'py-2' : 'py-3'}`}>
                                                <div className="w-12 h-4 mx-auto bg-gray-200 dark:bg-neutral-700/60 rounded"></div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="text-center py-12">
                                        <span className="text-sm text-gray-500 dark:text-neutral-400">{emptyMessage}</span>
                                    </td>
                                </tr>
                            ) : (
                                data.map((item, index) => {
                                    const isDisabled = isRowDisabled(item)
                                    const itemId = item[idKey]

                                    return (
                                        <tr
                                            key={String(itemId)}
                                            className={`${getRowClasses(item, index)} transition-colors duration-200 text-xs text-gray-700 dark:text-neutral-300`}
                                        >
                                            {selectable && (
                                                <td className={`px-2 py-3 text-center ${compact ? 'py-2' : 'py-3'}`}>
                                                    {isDisabled ? (
                                                        <div className="flex items-center justify-center w-5 h-5">
                                                            <div className="w-4 h-4 border-2 border-dashed border-gray-300 dark:border-neutral-600 rounded"></div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => onSelectItem && onSelectItem(item, index)}
                                                            className={`flex items-center justify-center w-5 h-5 rounded transition-colors ${isItemSelected(item)
                                                                ? 'text-purple-600 dark:text-purple-400'
                                                                : 'text-gray-400 dark:text-neutral-500 hover:text-purple-600 dark:hover:text-purple-400'
                                                                }`}
                                                            title={isItemSelected(item) ? 'Deselect item' : 'Select item'}
                                                        >
                                                            {isItemSelected(item) ? (
                                                                <TbSquareCheck className="w-4 h-4" />
                                                            ) : (
                                                                <TbSquare className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    )}
                                                </td>
                                            )}

                                            {columns.map((column, colIndex) => (
                                                <td key={`${String(column.key)}-${colIndex}`} className={getDataCellClasses(column)}>
                                                    {renderCellContent(column, item, index)}
                                                </td>
                                            ))}

                                            {actions.length > 0 && (
                                                <td className={`w-24 px-3 py-3 text-center ${compact ? 'py-2' : 'py-3'}`}>
                                                    <div className="flex justify-center gap-1">
                                                        {actions.map((action) => {
                                                            if (action.hide && action.hide(item)) return null

                                                            const isActionDisabled = action.disabled ? action.disabled(item) : false

                                                            if (action.href) {
                                                                return (
                                                                    <Link
                                                                        key={action.key}
                                                                        to={action.href(item)}
                                                                        target={action.target || '_self'}
                                                                        className={`p-1 rounded transition-all duration-200 ${isActionDisabled || isDisabled
                                                                            ? ''
                                                                            : action.hoverClassName
                                                                                ? `text-gray-700 dark:text-neutral-300 ${action.hoverClassName}`
                                                                                : 'text-gray-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                                                            } ${action.className || ''}`}
                                                                        title={typeof action.title === 'function' ? action.title(item) : action.title || action.label}
                                                                    >
                                                                        {action.icon}
                                                                    </Link>
                                                                )
                                                            }

                                                            return (
                                                                <button
                                                                    key={action.key}
                                                                    onClick={() => action.onClick && action.onClick(item, index)}
                                                                    disabled={isActionDisabled || isDisabled}
                                                                    className={`p-1 rounded transition-all duration-200 ${isActionDisabled || isDisabled
                                                                        ? 'text-gray-400 dark:text-neutral-600 cursor-not-allowed'
                                                                        : action.hoverClassName
                                                                            ? `text-gray-700 dark:text-neutral-300 ${action.hoverClassName}`
                                                                            : 'text-gray-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                                                        } ${action.className || ''}`}
                                                                    title={typeof action.title === 'function' ? action.title(item) : action.title || action.label}
                                                                >
                                                                    {action.icon}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Component */}
                {pagination && (
                    <div className="sticky bottom-0 backdrop-blur-sm border-t border-white/20 dark:border-neutral-600 p-2 mt-2 shrink-0">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                            <div className="flex items-center gap-1 text-xs text-gray-700 dark:text-neutral-300">
                                <span>
                                    {total > 0
                                        ? `${((currentPage - 1) * limit) + 1}-${Math.min(currentPage * limit, total)} of ${total}`
                                        : `0 of 0`
                                    }
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => onPageChange && onPageChange(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className={`px-2 py-1 rounded text-xs ${currentPage === 1
                                        ? 'bg-gray-100 dark:bg-neutral-700 text-gray-400 dark:text-neutral-500 cursor-not-allowed'
                                        : 'bg-white/10 backdrop-blur-sm dark:bg-neutral-800/50 text-gray-700 dark:text-neutral-200 hover:bg-white/20 dark:hover:bg-neutral-700/50'
                                        } transition-all duration-300`}
                                >
                                    Prev
                                </button>
                                {(() => {
                                    const totalPages = Math.max(1, Math.ceil(total / limit));
                                    const maxButtons = Math.min(3, totalPages);
                                    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
                                    const end = Math.min(totalPages, start + maxButtons - 1);

                                    if (end - start + 1 < maxButtons) {
                                        start = Math.max(1, end - maxButtons + 1);
                                    }

                                    return Array.from({ length: end - start + 1 }, (_, i) => {
                                        const pageNumber = start + i;
                                        return (
                                            <button
                                                key={pageNumber}
                                                onClick={() => onPageChange && onPageChange(pageNumber)}
                                                className={`px-2 py-1 rounded text-xs ${currentPage === pageNumber
                                                    ? 'bg-purple-500/20 dark:bg-purple-500/30 text-purple-700 dark:text-purple-300'
                                                    : 'bg-white/10 backdrop-blur-sm dark:bg-neutral-800/50 text-gray-700 dark:text-neutral-200 hover:bg-white/20 dark:hover:bg-neutral-700/50'
                                                    } transition-all duration-300`}
                                            >
                                                {pageNumber}
                                            </button>
                                        );
                                    });
                                })()}
                                <button
                                    onClick={() => onPageChange && onPageChange(Math.min(Math.max(1, Math.ceil(total / limit)), currentPage + 1))}
                                    disabled={currentPage >= Math.max(1, Math.ceil(total / limit))}
                                    className={`px-2 py-1 rounded text-xs ${currentPage >= Math.max(1, Math.ceil(total / limit))
                                        ? 'bg-gray-100 dark:bg-neutral-700 text-gray-400 dark:text-neutral-500 cursor-not-allowed'
                                        : 'bg-white/10 backdrop-blur-sm dark:bg-neutral-800/50 text-gray-700 dark:text-neutral-200 hover:bg-white/20 dark:hover:bg-neutral-700/50'
                                        } transition-all duration-300`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default StaticDataTable