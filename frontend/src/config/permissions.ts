/**
 * Pure permission helpers.
 *
 * Single source of truth for "does this permission set satisfy this
 * requirement?" logic. Kept free of React/Redux so it is trivially testable and
 * reusable from guards, hooks and config.
 */

/**
 * Super-permission. A user holding it is granted *every* permission.
 * The application ships a single role (literally named `user`) that owns it,
 * but nothing here ever depends on the role *name*.
 */
export const SUPER_PERMISSION = 'all_access';

/**
 * Whether a permission set satisfies a requirement.
 *
 * @param permissions the permissions the user currently holds (may be undefined)
 * @param required    permission(s) needed; a single name (OR over an array, or
 *                    AND when `requireAll` is true). Empty/undefined → always true.
 * @param requireAll  when true, every requested permission is required (AND);
 *                    otherwise any one of them is enough (OR).
 */
export const hasPermission = (
    permissions: Iterable<string> | undefined,
    required: string | string[] | undefined,
    requireAll = false
): boolean => {
    // No requirement → always satisfied.
    if (required === undefined) return true;

    const requiredList = Array.isArray(required) ? required : [required];

    // Nothing required → always satisfied.
    if (requiredList.length === 0) return true;

    // No permissions held → nothing can be satisfied (unless empty above).
    if (!permissions) return false;

    const owned = permissions instanceof Set
        ? permissions
        : new Set<string>(permissions);

    // The super-permission grants everything.
    if (owned.has(SUPER_PERMISSION)) return true;

    return requireAll
        ? requiredList.every((permission) => owned.has(permission))
        : requiredList.some((permission) => owned.has(permission));
};
