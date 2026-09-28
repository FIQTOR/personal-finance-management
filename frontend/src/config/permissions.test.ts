import { describe, it, expect } from 'vitest';
import { hasPermission, SUPER_PERMISSION } from '@/config/permissions';

// The system ships a single role (literally named `user`) that owns every
// permission below. Tests exercise the permission *set*, never the role name.
const SYSTEM_ROLE_PERMISSIONS = ['view_dashboard', 'manage_users', 'manage_roles', 'all_access'];
const SYSTEM_ROLE_SET = new Set(SYSTEM_ROLE_PERMISSIONS);

describe('config/permissions.hasPermission', () => {
    describe('empty / undefined inputs', () => {
        it('returns false when permissions are undefined and something is required', () => {
            expect(hasPermission(undefined, 'view_dashboard')).toBe(false);
        });

        it('returns false for an empty set when something is required', () => {
            expect(hasPermission(new Set<string>(), 'manage_users')).toBe(false);
        });

        it('returns true when the permission set is empty but nothing is required', () => {
            expect(hasPermission(new Set<string>(), undefined)).toBe(true);
            expect(hasPermission(new Set<string>(), [])).toBe(true);
        });

        it('returns true when permissions are undefined but nothing is required', () => {
            expect(hasPermission(undefined, undefined)).toBe(true);
            expect(hasPermission(undefined, [])).toBe(true);
        });
    });

    describe('OR semantics (default)', () => {
        const owned = new Set(['view_dashboard']);

        it('matches a single required permission', () => {
            expect(hasPermission(owned, 'view_dashboard')).toBe(true);
        });

        it('fails a single missing permission', () => {
            expect(hasPermission(owned, 'manage_users')).toBe(false);
        });

        it('passes when any one of several required permissions is held', () => {
            expect(hasPermission(owned, ['manage_users', 'view_dashboard'])).toBe(true);
        });

        it('fails when none of several required permissions are held', () => {
            expect(hasPermission(owned, ['manage_users', 'manage_roles'])).toBe(false);
        });
    });

    describe('AND semantics (requireAll)', () => {
        const owned = new Set(['view_dashboard', 'manage_users']);

        it('passes when every required permission is held', () => {
            expect(hasPermission(owned, ['view_dashboard', 'manage_users'], true)).toBe(true);
        });

        it('fails when any required permission is missing', () => {
            expect(hasPermission(owned, ['view_dashboard', 'manage_roles'], true)).toBe(false);
        });

        it('treats a single permission the same under AND', () => {
            expect(hasPermission(owned, 'manage_users', true)).toBe(true);
            expect(hasPermission(owned, 'manage_roles', true)).toBe(false);
        });
    });

    describe('all_access super-permission', () => {
        it('grants any single permission', () => {
            expect(hasPermission(new Set([SUPER_PERMISSION]), 'manage_roles')).toBe(true);
        });

        it('grants an arbitrary unknown permission', () => {
            expect(hasPermission(new Set([SUPER_PERMISSION]), 'totally_made_up')).toBe(true);
        });

        it('grants AND requirements for permissions the user does not hold', () => {
            expect(
                hasPermission(new Set([SUPER_PERMISSION]), ['manage_users', 'manage_roles'], true)
            ).toBe(true);
        });

        it('still treats an empty requirement as satisfied', () => {
            expect(hasPermission(new Set([SUPER_PERMISSION]), [])).toBe(true);
        });

        it('exposes the super-permission constant', () => {
            expect(SUPER_PERMISSION).toBe('all_access');
        });
    });

    describe('system role permission matrix', () => {
        it('resolves each declared permission of the single system role', () => {
            expect(hasPermission(SYSTEM_ROLE_SET, 'view_dashboard')).toBe(true);
            expect(hasPermission(SYSTEM_ROLE_SET, 'manage_users')).toBe(true);
            expect(hasPermission(SYSTEM_ROLE_SET, 'manage_roles')).toBe(true);
            expect(hasPermission(SYSTEM_ROLE_SET, SUPER_PERMISSION)).toBe(true);
        });

        it('grants everything via the role because it owns all_access', () => {
            expect(hasPermission(SYSTEM_ROLE_SET, 'anything_at_all')).toBe(true);
        });

        it('accepts any Iterable, not just a Set', () => {
            expect(hasPermission(SYSTEM_ROLE_PERMISSIONS, 'manage_users')).toBe(true);
        });
    });
});
