export interface RoutePermissionRule {
    pathPrefix: string;
    permission: string;
}

export const PANEL_ROUTE_PERMISSIONS: RoutePermissionRule[] = [
    { pathPrefix: '/panel/dashboard', permission: 'view_dashboard' },
    { pathPrefix: '/panel/users/add', permission: 'manage_users' },
    { pathPrefix: '/panel/users', permission: 'manage_users' },
    { pathPrefix: '/panel/roles/permissions/add', permission: 'manage_roles' },
    { pathPrefix: '/panel/roles/permissions', permission: 'manage_roles' },
    { pathPrefix: '/panel/roles/add', permission: 'manage_roles' },
    { pathPrefix: '/panel/roles', permission: 'manage_roles' },
    { pathPrefix: '/panel/products/categories', permission: 'manage_products' },
    { pathPrefix: '/panel/products', permission: 'manage_products' },
    { pathPrefix: '/panel/portfolios', permission: 'manage_portfolios' },
    { pathPrefix: '/panel/transactions', permission: 'manage_transactions' },
    { pathPrefix: '/panel/courses', permission: 'manage_courses' },
    { pathPrefix: '/panel/invest-plan-users', permission: 'manage_invest_plans' },
];

export const getRequiredPermissionForPath = (pathname: string): string | undefined => {
    const matchedRule = PANEL_ROUTE_PERMISSIONS.find((rule) =>
        pathname === rule.pathPrefix || pathname.startsWith(`${rule.pathPrefix}/`)
    );
    return matchedRule?.permission;
};

export const isValidPanelRoute = (pathname: string): boolean => {
    return PANEL_ROUTE_PERMISSIONS.some((rule) =>
        pathname === rule.pathPrefix || pathname.startsWith(`${rule.pathPrefix}/`)
    );
};

export const isPanelNotFound = (pathname: string, role?: string, permissions?: Set<string>): boolean => {
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
