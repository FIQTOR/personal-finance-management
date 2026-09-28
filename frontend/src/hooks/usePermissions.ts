import { useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectUserPermissions, selectUserRole } from '@/store/authSlice';
import { hasPermission } from '@/config/permissions';

export interface UsePermissionsResult {
    /** Every permission name the current user holds. */
    permissions: Set<string>;
    /** The current user's role name (undefined when logged out). */
    role: string | undefined;
    /** Whether the held permissions satisfy a requirement. */
    can: (permission: string | string[], requireAll?: boolean) => boolean;
}

/**
 * Read the current user's permissions/role from the store and expose a `can`
 * checker. Never inspects the role *name* — access is purely permission based.
 */
export const usePermissions = (): UsePermissionsResult => {
    const permissions = useAppSelector(selectUserPermissions);
    const role = useAppSelector(selectUserRole);

    const can = useCallback(
        (permission: string | string[], requireAll = false) =>
            hasPermission(permissions, permission, requireAll),
        [permissions]
    );

    return { permissions, role, can };
};
