/**
 * Panel permission helpers — thin facade over the central route config
 * (`config/routes.ts`). Kept for backwards compatibility with existing imports.
 */
import {
    ROUTE_RULES,
    getRequiredPermissionForPath,
    isValidPanelRoute,
} from '@/config/routes';

export { getRequiredPermissionForPath, isValidPanelRoute };

export interface RoutePermissionRule {
    pathPrefix: string;
    permission: string;
}

/** Panel route → required permission (derived from the central rules). */
export const PANEL_ROUTE_PERMISSIONS: RoutePermissionRule[] = ROUTE_RULES
    .filter((rule) => rule.permission)
    .map((rule) => ({ pathPrefix: rule.pathPrefix, permission: rule.permission as string }));

export const isPanelNotFound = (
    pathname: string,
    role?: string,
    permissions?: Set<string>
): boolean => {
    if (!pathname.startsWith('/panel')) return false;
    if (!isValidPanelRoute(pathname)) return true;
    if (role && role !== 'user') {
        const required = getRequiredPermissionForPath(pathname);
        if (required && permissions && !permissions.has(required)) {
            return true;
        }
    }
    return false;
};
