/**
 * Registry of every searchable panel page.
 *
 * Each entry maps a real route under `src/pages/panel/**` to a label, category
 * and (optional) required permission so the command palette can show pages a
 * user is allowed to open. Param routes (`[id]`) are intentionally skipped.
 */
import { getRequiredPermissionForPath } from '@/config/routes';

export interface PanelPage {
    /** Human label shown in the palette (plain, no i18n). */
    label: string;
    /** Route to navigate to. */
    href: string;
    /** Grouping used to build palette sections. */
    category: string;
    /** Permission required to view the page (from the central route config). */
    permission?: string;
    /** Extra search terms (Indonesian + English where natural). */
    keywords?: string[];
    /** `action` marks "add/create" style routes. */
    kind?: 'page' | 'action';
}

/**
 * Every panel route. `permission` values mirror `config/routes.ts`; the helper
 * below resolves them from the single source of truth to avoid drift.
 */
export const PANEL_PAGES: PanelPage[] = [
    // Dashboard
    {
        label: 'Dashboard',
        href: '/panel/dashboard',
        category: 'General',
        permission: 'view_dashboard',
        keywords: ['home', 'beranda', 'ringkasan', 'overview', 'summary'],
        kind: 'page',
    },

    // Personal Finance
    {
        label: 'Finance',
        href: '/panel/finance',
        category: 'Finance',
        permission: 'view_dashboard',
        keywords: ['keuangan', 'finance', 'money', 'uang'],
        kind: 'page',
    },
    {
        label: 'Finance Overview',
        href: '/panel/finance/overview',
        category: 'Finance',
        permission: 'view_dashboard',
        keywords: ['overview', 'ringkasan', 'keuangan', 'dashboard'],
        kind: 'page',
    },
    {
        label: 'Transactions',
        href: '/panel/finance/transactions',
        category: 'Finance',
        permission: 'view_dashboard',
        keywords: ['transaksi', 'transaction', 'income', 'expense', 'pemasukan', 'pengeluaran'],
        kind: 'page',
    },
    {
        label: 'Budgets',
        href: '/panel/finance/budgets',
        category: 'Finance',
        permission: 'view_dashboard',
        keywords: ['budget', 'anggaran', 'limit', 'batas'],
        kind: 'page',
    },
    {
        label: 'Financial Goals',
        href: '/panel/finance/goals',
        category: 'Finance',
        permission: 'view_dashboard',
        keywords: ['goals', 'goal', 'target', 'tujuan', 'tabungan', 'savings'],
        kind: 'page',
    },

    // Users
    {
        label: 'Users',
        href: '/panel/users',
        category: 'Users',
        permission: 'manage_users',
        keywords: ['user', 'pengguna', 'members', 'anggota'],
        kind: 'page',
    },
    {
        label: 'Add User',
        href: '/panel/users/add',
        category: 'Actions',
        permission: 'manage_users',
        keywords: ['add', 'create', 'new', 'tambah', 'buat', 'pengguna baru'],
        kind: 'action',
    },

    // Access control
    {
        label: 'Roles',
        href: '/panel/roles',
        category: 'Access Control',
        permission: 'manage_roles',
        keywords: ['role', 'peran', 'akses', 'access'],
        kind: 'page',
    },
    {
        label: 'Permissions',
        href: '/panel/roles/permissions',
        category: 'Access Control',
        permission: 'manage_roles',
        keywords: ['permission', 'izin', 'hak akses', 'roles', 'peran'],
        kind: 'page',
    },
];

// Re-derive permissions from the central route config where a rule exists so
// the registry cannot silently drift from `ROUTE_RULES`.
PANEL_PAGES.forEach((page) => {
    const derived = getRequiredPermissionForPath(page.href);
    if (derived) page.permission = derived;
});

/**
 * Whether the current user's permission set grants access to a panel page.
 * Pages without a permission requirement are always accessible.
 */
export const canAccessPanelPage = (
    page: PanelPage,
    permissionSet: Set<string | undefined>
): boolean => {
    if (!page.permission) return true;
    return permissionSet.has(page.permission);
};
