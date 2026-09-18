

import { TbLock, TbArrowLeft, TbCheck } from 'react-icons/tb'
import { useState } from 'react'
import Forbidden from '@/components/Forbidden'
import { useAppSelector } from '@/store/hooks'
import { selectAuth } from '@/store/authSlice'
import axiosJWT from '@/utils/axiosJWT'
import { useNavigate, useParams } from 'react-router-dom';
import AppConfig from '@/config/AppConfig'

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const { id } = useParams()
    const { user } = useAppSelector(selectAuth);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [response, setResponse] = useState<any>(null);
    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const permissions = new Set(user?.role?.permissions?.map((p: any) => p.name))
    if (!permissions.has('manage_users')) return <Forbidden />

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate passwords
        if (password !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        setLoading(true);
        try {
            const res = await axiosJWT.put(
                `${AppConfig.baseApiUrl}/users/${id}/reset-password`,
                { password }
            );

            setResponse(res.data);
            if (res.data.status === 'success') {
                setTimeout(() => {
                    navigate(`/panel/users/${id}`);
                }, 2000);
            }
        } catch (error: any) {
            setResponse(error.response?.data || {
                status: 'error',
                message: 'Failed to reset password'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-8 relative">
            {/* Gradient Bubbles */}
            <div className='absolute w-125 h-125 bg-linear-to-r from-blue-400 to-purple-500 rounded-full blur-3xl opacity-20 -top-60 -left-20 animate-pulse'></div>
            <div className='absolute w-100 h-100 bg-linear-to-r from-pink-400 to-orange-500 rounded-full blur-3xl opacity-20 bottom-0 right-0 animate-pulse delay-700'></div>

            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Reset User Password
                </h1>

                <div className="backdrop-blur-xl bg-white/70 dark:bg-neutral-800/70 p-6 rounded-2xl shadow-lg border border-white/50 dark:border-neutral-700/50">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div className="relative group">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                                    <TbLock className="text-blue-600" />
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-black/50 dark:border-neutral-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 text-gray-900 dark:text-neutral-200 transition"
                                    placeholder="Enter new password"
                                />
                            </div>

                            <div className="relative group">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                                    <TbLock className="text-blue-600" />
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-black/50 dark:border-neutral-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 text-gray-900 dark:text-neutral-200 transition"
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-500 dark:text-red-400 text-sm">{error}</div>
                        )}

                        {response && response.status && response.message && (
                            <div className={`text-sm ${response.status === 'success' ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                {response.message}
                            </div>
                        )}

                        <div className="flex justify-between gap-3 pt-4">
                            {(!response || (response && response.status !== 'success')) && (
                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex items-center gap-2 px-6 py-3 text-white bg-linear-to-r from-purple-500 to-pink-500 rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 transition-all shadow-lg hover:shadow-purple-500/25"
                                    >
                                        <TbCheck className="w-5 h-5" />
                                        {isLoading ? 'Resetting...' : 'Reset Password'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigate(-1)}
                                        className="flex items-center gap-2 px-6 py-3 text-gray-700 bg-white/50 backdrop-blur-sm rounded-xl hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-gray-500/30 transition-all border border-white/30"
                                    >
                                        <TbArrowLeft className="w-5 h-5" />
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}