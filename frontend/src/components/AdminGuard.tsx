import { useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { selectUserPermissions, selectUserRole } from '@/store/authSlice';
import { getRequiredPermissionForPath, isValidPanelRoute } from '@/config/panelPermissions';
import Forbidden from '@/components/Forbidden';
import NotFound from '@/components/NotFound';

interface AdminGuardProps {
    children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
    const location = useLocation();
    const role = useAppSelector(selectUserRole);
    const permissions = useAppSelector(selectUserPermissions);

    // Rule 1: If user has no role or role === "user" -> return 404 NotFound
    if (!role || role === 'user') {
        return <NotFound />;
    }

    // Rule 2: If route does not exist -> return 404 NotFound
    if (!isValidPanelRoute(location.pathname)) {
        return <NotFound />;
    }

    // Rule 3: If user role !== "user" BUT user lacks permission for this panel page -> return Forbidden
    const requiredPermission = getRequiredPermissionForPath(location.pathname);
    if (requiredPermission && !permissions.has(requiredPermission)) {
        return <Forbidden />;
    }

    return <>{children}</>;
}
