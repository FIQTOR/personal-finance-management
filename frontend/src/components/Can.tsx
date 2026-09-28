import type { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

export interface CanProps {
    /** Permission(s) required. Any-of by default, all-of when `requireAll`. */
    permission: string | string[];
    /** Rendered when the user is allowed. */
    children: ReactNode;
    /** Rendered when the user is not allowed (default: nothing). */
    fallback?: ReactNode;
    /** Require every listed permission (AND) instead of any (OR). */
    requireAll?: boolean;
}

/**
 * Declarative permission gate. Renders `children` when the current user holds
 * the required permission(s), otherwise `fallback` (default `null`).
 *
 * `<Can permission="manage_users"><button .../></Can>`
 */
export default function Can({
    permission,
    children,
    fallback = null,
    requireAll = false,
}: CanProps) {
    const { can } = usePermissions();
    return <>{can(permission, requireAll) ? children : fallback}</>;
}
