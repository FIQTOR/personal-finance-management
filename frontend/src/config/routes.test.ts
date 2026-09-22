import { describe, it, expect } from 'vitest';
import { resolveRouteAccess, getRequiredPermissionForPath, isValidPanelRoute } from '@/config/routes';
import type { User } from '@/types';

const guest: User | null = null;
const user: User = { id: 1, name: 'U', email: 'u@x.com', role: { name: 'user' }, is_verified: true };
const unverified: User = { id: 2, name: 'U', email: 'u@x.com', role: { name: 'user' }, is_verified: false };

describe('config/routes.resolveRouteAccess', () => {
    it('redirects guests from protected routes to /signin', () => {
        const access = resolveRouteAccess('/profile', guest);
        expect(access).toEqual({ action: 'redirect', to: '/signin' });
    });

    it('allows verified users on protected routes', () => {
        expect(resolveRouteAccess('/profile', user).action).toBe('allow');
    });

    it('redirects unverified users to /email-verification', () => {
        const access = resolveRouteAccess('/profile', unverified);
        expect(access).toEqual({ action: 'redirect', to: '/email-verification' });
    });

    it('sends authenticated users away from guest pages', () => {
        const access = resolveRouteAccess('/signin', user);
        expect(access).toEqual({ action: 'redirect', to: '/profile' });
    });

    it('exposes permissions for panel routes', () => {
        expect(getRequiredPermissionForPath('/panel/users')).toBe('manage_users');
        expect(getRequiredPermissionForPath('/panel/finance/transactions')).toBe('view_dashboard');
        expect(isValidPanelRoute('/panel/dashboard')).toBe(true);
        expect(isValidPanelRoute('/panel/unknown')).toBe(false);
    });

    it('allows unknown routes', () => {
        expect(resolveRouteAccess('/some-public-page', guest).action).toBe('allow');
    });
});
