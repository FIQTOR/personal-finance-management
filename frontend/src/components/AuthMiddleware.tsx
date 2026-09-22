import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { selectAuth } from '@/store/authSlice';
import { resolveRouteAccess } from '@/config/routes';

const AuthMiddleware = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAppSelector(selectAuth);
    const location = useLocation();

    const access = resolveRouteAccess(location.pathname, user);

    if (access.action === 'redirect' && access.to) {
        return <Navigate to={access.to} state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default AuthMiddleware;
