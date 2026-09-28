/**
 * EmptyState — consistent empty/placeholder UI for lists, tables and cards.
 *
 * Replaces the ad-hoc "No data" text scattered across the panel so every empty
 * list shares the same look and can offer a call-to-action.
 */
import type { ReactNode } from 'react'

export interface EmptyStateProps {
    /** Icon element (e.g. a react-icons component rendered). */
    icon?: ReactNode
    title?: string
    description?: string
    /** Optional action (button/link). */
    action?: ReactNode
    /** Use the compact variant inside table cells / small cards. */
    compact?: boolean
    className?: string
}

const EmptyState = ({
    icon,
    title = 'Nothing here yet',
    description,
    action,
    compact = false,
    className = '',
}: EmptyStateProps) => {
    if (compact) {
        return (
            <div className={`flex flex-col items-center justify-center gap-2 py-6 text-center ${className}`}>
                {icon && <div className="text-gray-300 dark:text-neutral-600">{icon}</div>}
                <p className="text-sm font-medium text-gray-500 dark:text-neutral-400">{title}</p>
                {description && <p className="text-xs text-gray-400 dark:text-neutral-500 max-w-sm">{description}</p>}
                {action && <div className="mt-1">{action}</div>}
            </div>
        )
    }

    return (
        <div className={`flex flex-col items-center justify-center gap-3 py-14 px-6 text-center ${className}`}>
            {icon && (
                <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-neutral-800/70 flex items-center justify-center text-gray-400 dark:text-neutral-500">
                    {icon}
                </div>
            )}
            <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-700 dark:text-neutral-200">{title}</h3>
                {description && (
                    <p className="text-sm text-gray-500 dark:text-neutral-400 max-w-md mx-auto">{description}</p>
                )}
            </div>
            {action && <div className="mt-1">{action}</div>}
        </div>
    )
}

export default EmptyState
