import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { selectAuth } from '@/store/authSlice';

const AuthMiddleware = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAppSelector(selectAuth);
    const location = useLocation();

    // 1. DAFTAR RUTE TERPROTEKSI (Hanya bisa diakses jika sudah Login)
    const authPaths = [
        '/profile',
        '/settings',
        '/my-transaction',
        '/email-verification',
        '/panel'
    ];
    // Rute yang khusus untuk orang yang BELUM login saja
    const guestOnlyPaths = ['/signin', '/signup'];

    // Identifikasi posisi user saat ini
    const isTryingToAccessAuth = authPaths.some(path => location.pathname.startsWith(path));
    const isAtGuestPage = guestOnlyPaths.includes(location.pathname);
    const isAtVerificationPage = location.pathname === '/email-verification';

    // ==========================================
    // LOGIKA FILTERING (DENGAN FIX INFINITE LOOP)
    // ==========================================

    // CASE 1: Belum Login
    if (!user) {
        if (isTryingToAccessAuth) {
            // console.log(location)
            // Hanya redirect jika BELUM di halaman signin (mencegah loop)
            return <Navigate to="/signin" state={{ from: location }} replace />;
        }
        return <>{children}</>;
    }

    // CASE 2: Sudah Login
    if (user) {
        // A. Cegah user login masuk ke page login/register
        if (isAtGuestPage) {
            return <Navigate to="/profile" replace />;
        }

        // B. Logika Verifikasi (Hanya jika mencoba akses rute terproteksi)
        if (isTryingToAccessAuth) {
            if (user.is_verified || user.isVerified) {
                // Jika sudah verified tapi di page verifikasi -> buang ke profile
                if (isAtVerificationPage) {
                    return <Navigate to="/profile" replace />;
                }
            } else {
                // Jika BELUM verified dan mencoba akses rute auth selain page verifikasi
                // CRITICAL FIX: Cek isAtVerificationPage agar tidak redirect ke diri sendiri
                if (!isAtVerificationPage) {
                    return <Navigate to="/email-verification" replace />;
                }
            }
        }
    }

    return <>{children}</>;
};

export default AuthMiddleware;