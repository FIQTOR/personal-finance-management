import { useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { selectUserPermissions, selectUserRole } from '@/store/authSlice';
import { getRequiredPermissionForPath, hasPermission, isValidPanelRoute } from '@/config/panelPermissions';
import Forbidden from '@/components/Forbidden';
import NotFound from '@/components/NotFound';

interface AdminGuardProps {
    children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
    const location = useLocation();
    const role = useAppSelector(selectUserRole);
    const permissions = useAppSelector(selectUserPermissions);

    // Rule 1: If the user has no role at all -> return 404 NotFound.
    // Note: the system ships a single role named `user` (the "Personal Finance
    // System Owner"), so a role *name* of `user` is a valid panel role and must
    // not be rejected here.
    if (!role) {
        return <NotFound />;
    }

    // Rule 2: If route does not exist -> return 404 NotFound
    if (!isValidPanelRoute(location.pathname)) {
        return <NotFound />;
    }

    // Rule 3: If the user lacks permission for this panel page -> return Forbidden
    const requiredPermission = getRequiredPermissionForPath(location.pathname);
    if (!hasPermission(permissions, requiredPermission)) {
        return <Forbidden />;
    }

    return <>{children}</>;
}
