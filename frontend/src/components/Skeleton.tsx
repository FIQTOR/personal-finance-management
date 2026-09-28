/**
 * Reusable skeleton primitives for loading states across panel pages.
 *
 * All primitives share the same neutral palette + pulse animation so cards,
 * tables and charts stay visually consistent while data is loading.
 */
import type { CSSProperties, ReactNode } from 'react'

/** Base shimmering block. */
export const SkeletonBlock = ({
    className = '',
    style,
}: {
    className?: string
    style?: CSSProperties
}) => (
    <div
        className={`animate-pulse rounded-lg bg-gray-200 dark:bg-neutral-800 ${className}`}
        style={style}
    />
)

/** A single metric card (icon + label + value). */
export const SkeletonCard = ({ className = '' }: { className?: string }) => (
    <div className={`bg-white dark:bg-neutral-900/80 p-5 rounded-2xl border border-gray-100 dark:border-neutral-800/80 space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="w-8 h-8 rounded-xl" />
        </div>
        <SkeletonBlock className="h-6 w-24" />
        <SkeletonBlock className="h-3 w-16" />
    </div>
)

/** A responsive grid of metric cards. */
export const SkeletonCardGrid = ({
    count = 4,
    cols = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}: {
    count?: number
    cols?: string
}) => (
    <div className={`grid ${cols} gap-4`}>
        {Array.from({ length: count }).map((_, i) => (
            <SkeletonCard key={i} />
        ))}
    </div>
)

/** Placeholder rows for a static data table body. */
export const SkeletonTableRows = ({
    rows = 6,
    cols = 5,
    compact = false,
    withActions = true,
}: {
    rows?: number
    cols?: number
    compact?: boolean
    withActions?: boolean
}) => (
    <>
        {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={`sk-${rowIndex}`} className="animate-pulse">
                {Array.from({ length: cols }).map((_, colIndex) => {
                    const widthClass = colIndex % 3 === 0 ? 'w-3/4' : colIndex % 3 === 1 ? 'w-1/2' : 'w-2/3'
                    return (
                        <td key={`sk-${rowIndex}-${colIndex}`} className={`px-3 ${compact ? 'py-2' : 'py-3'}`}>
                            <div className={`h-4 bg-gray-200 dark:bg-neutral-700/60 rounded ${widthClass}`} />
                        </td>
                    )
                })}
                {withActions && (
                    <td className={`w-24 px-3 ${compact ? 'py-2' : 'py-3'} text-center`}>
                        <div className="w-12 h-4 mx-auto bg-gray-200 dark:bg-neutral-700/60 rounded" />
                    </td>
                )}
            </tr>
        ))}
    </>
)

/** Full standalone table skeleton (header + body) for pages that render their own table. */
export const SkeletonTable = ({
    rows = 6,
    cols = 5,
    className = '',
}: {
    rows?: number
    cols?: number
    className?: string
}) => (
    <div className={`w-full rounded-2xl border border-gray-100 dark:border-neutral-800/80 bg-white/60 dark:bg-neutral-900/40 overflow-hidden ${className}`}>
        <div className="flex gap-4 px-4 py-3 bg-gray-50 dark:bg-neutral-800/60">
            {Array.from({ length: cols }).map((_, i) => (
                <SkeletonBlock key={i} className="h-3 flex-1" />
            ))}
        </div>
        <div className="divide-y divide-gray-100/60 dark:divide-neutral-800/60">
            {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="flex gap-4 px-4 py-4">
                    {Array.from({ length: cols }).map((_, c) => (
                        <SkeletonBlock key={c} className="h-4 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    </div>
)

/** A list of skeleton cards (for activity feeds / list layouts). */
export const SkeletonList = ({
    count = 5,
    className = '',
}: {
    count?: number
    className?: string
}) => (
    <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
            <div
                key={i}
                className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-neutral-900/60 border border-gray-100 dark:border-neutral-800/70"
            >
                <div className="flex-1 space-y-2">
                    <SkeletonBlock className="h-4 w-1/3" />
                    <SkeletonBlock className="h-3 w-2/3" />
                </div>
                <SkeletonBlock className="h-3 w-16" />
            </div>
        ))}
    </div>
)

/** Generic wrapper to render a skeleton layout while loading. */
export const SkeletonContainer = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
    <div className={`space-y-6 ${className}`}>{children}</div>
)
