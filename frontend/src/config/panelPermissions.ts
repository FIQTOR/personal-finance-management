/**
 * Panel permission helpers — thin facade over the central route config
 * (`config/routes.ts`). Kept for backwards compatibility with existing imports.
 */
import {
    ROUTE_RULES,
    getRequiredPermissionForPath,
    isValidPanelRoute,
    hasPermission,
} from '@/config/routes';
import type { RouteRule } from '@/config/routes';

export { getRequiredPermissionForPath, isValidPanelRoute, hasPermission };

export interface RoutePermissionRule {
    pathPrefix: string;
    permission: string;
}

/** Panel route → required permission (derived from the central rules). */
export const PANEL_ROUTE_PERMISSIONS: RoutePermissionRule[] = ROUTE_RULES
    .filter((rule: RouteRule) => rule.permission)
    .map((rule: RouteRule) => ({ pathPrefix: rule.pathPrefix, permission: rule.permission as string }));

/**
 * Whether a `/panel/*` path should render the 404 page for the given role.
 * Permission failures render Forbidden, not NotFound, so they are not handled
 * here. The system's single role is named `user` (System Owner) and is valid.
 */
export const isPanelNotFound = (
    pathname: string,
    role?: string
): boolean => {
    if (!pathname.startsWith('/panel')) return false;
    if (!isValidPanelRoute(pathname)) return true;
    return !role;
};
