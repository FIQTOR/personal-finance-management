/**
 * Centralised route access configuration.
 *
 * Single source of truth for:
 *  - which routes require authentication
 *  - which routes are guest-only (signin)
 *  - which routes require a verified email
 *  - which permission a `/panel/*` route needs
 *
 * `resolveRouteAccess` turns this metadata + the current user into an action
 * ("allow" | "redirect") so the AuthMiddleware stays declarative and there is
 * no duplicated path list across components.
 */
import type { User } from '@/types';

export interface RouteRule {
    /** Path prefix this rule applies to. */
    pathPrefix: string;
    /** Requires an authenticated user. */
    requiresAuth?: boolean;
    /** Only accessible to guests (redirects authenticated users away). */
    guestOnly?: boolean;
    /** Requires `is_verified` (or `isVerified`). */
    requiresVerified?: boolean;
    /** Permission required to view (panel routes). */
    permission?: string;
    /** Hidden from users whose role is `user` (returns 404 instead of 403). */
    panelOnly?: boolean;
    /** Where to send a guest that hits a protected route. */
    redirectTo?: string;
}

export const ROUTE_RULES: RouteRule[] = [
    // Guest-only (self-registration is disabled; /signup redirects to /signin).
    { pathPrefix: '/signin', guestOnly: true },
    { pathPrefix: '/signup', guestOnly: true },

    // Authenticated but always allowed (even if not verified)
    { pathPrefix: '/verify-email', requiresAuth: true },
    { pathPrefix: '/email-verification', requiresAuth: true },

    // Authenticated + verified
    { pathPrefix: '/profile', requiresAuth: true, requiresVerified: true },
    { pathPrefix: '/settings', requiresAuth: true, requiresVerified: true },

    // Panel routes (permission checked).
    { pathPrefix: '/panel/dashboard', requiresAuth: true, requiresVerified: true, panelOnly: true, permission: 'view_dashboard' },
    { pathPrefix: '/panel/finance', requiresAuth: true, requiresVerified: true, panelOnly: true, permission: 'view_dashboard' },
    { pathPrefix: '/panel/users/add', requiresAuth: true, requiresVerified: true, panelOnly: true, permission: 'manage_users' },
    { pathPrefix: '/panel/users', requiresAuth: true, requiresVerified: true, panelOnly: true, permission: 'manage_users' },
    { pathPrefix: '/panel/roles/permissions/add', requiresAuth: true, requiresVerified: true, panelOnly: true, permission: 'manage_roles' },
    { pathPrefix: '/panel/roles/permissions', requiresAuth: true, requiresVerified: true, panelOnly: true, permission: 'manage_roles' },
    { pathPrefix: '/panel/roles/add', requiresAuth: true, requiresVerified: true, panelOnly: true, permission: 'manage_roles' },
    { pathPrefix: '/panel/roles', requiresAuth: true, requiresVerified: true, panelOnly: true, permission: 'manage_roles' },
];

/** Find the rule whose prefix best matches the given pathname. */
export const matchRouteRule = (pathname: string): RouteRule | undefined => {
    return ROUTE_RULES
        .filter((rule) => pathname === rule.pathPrefix || pathname.startsWith(`${rule.pathPrefix}/`))
        .sort((a, b) => b.pathPrefix.length - a.pathPrefix.length)[0];
};

export const getRequiredPermissionForPath = (pathname: string): string | undefined =>
    matchRouteRule(pathname)?.permission;

export const isValidPanelRoute = (pathname: string): boolean =>
    ROUTE_RULES.some(
        (rule) =>
            rule.permission !== undefined &&
            (pathname === rule.pathPrefix || pathname.startsWith(`${rule.pathPrefix}/`))
    );

export interface RouteAccess {
    action: 'allow' | 'redirect';
    to?: string;
}

/**
 * Resolve what should happen for a given path + user.
 * @param pathname current location path
 * @param user current user (null when logged out)
 */
export const resolveRouteAccess = (pathname: string, user: User | null): RouteAccess => {
    const rule = matchRouteRule(pathname);

    // Unknown / unguarded route → allow.
    if (!rule) return { action: 'allow' };

    const isVerified = Boolean(user?.is_verified || user?.isVerified);

    // Guest-only routes.
    if (rule.guestOnly) {
        return user ? { action: 'redirect', to: '/profile' } : { action: 'allow' };
    }

    // Protected routes.
    if (rule.requiresAuth) {
        if (!user) return { action: 'redirect', to: '/signin' };

        if (rule.requiresVerified && !isVerified) {
            // Avoid redirecting the verification page to itself.
            if (pathname !== '/email-verification' && pathname !== '/verify-email') {
                return { action: 'redirect', to: '/email-verification' };
            }
        }
    }

    return { action: 'allow' };
};
