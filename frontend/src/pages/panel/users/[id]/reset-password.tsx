

import { TbLock, TbArrowLeft, TbCheck } from 'react-icons/tb'
import { useState } from 'react'
import apiClient from '@/services/apiClient';
import { useNavigate, useParams } from 'react-router-dom';
import { getErrorData } from '@/utils/error';

interface ApiResponse {
    success: boolean;
    message: string;
}

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const { id } = useParams()
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [response, setResponse] = useState<ApiResponse | null>(null);
    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            const res = await apiClient.put(`/users/${id}/reset-password`,
                { password }
            );

            setResponse(res.data);
            if (res.data.success) {
                setTimeout(() => {
                    navigate(`/panel/users/${id}`);
                }, 2000);
            }
        } catch (error: unknown) {
            setResponse(getErrorData<ApiResponse>(error, { success: false, message: 'Failed to reset password' }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 relative h-full">
            <div className="w-full">
                <h1 className="text-2xl sm:text-3xl font-bold mb-8 bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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

                        {response && response.message && (
                            <div className={`text-sm ${response.success ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                {response.message}
                            </div>
                        )}

                        <div className="flex justify-between gap-3 pt-4">
                            {(!response || (response && !response.success)) && (
                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex items-center justify-center gap-2 px-6 py-3 text-white bg-blue-600/90 backdrop-blur-md border border-blue-400/40 rounded-xl hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-blue-500/30"
                                    >
                                        {isLoading ? <span className="loader" style={{ width: 18, height: 18 }}></span> : <TbCheck className="w-5 h-5" />}
                                        {isLoading ? 'Resetting...' : 'Reset Password'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigate(-1)}
                                        className="flex items-center justify-center gap-2 px-6 py-3 text-gray-700 dark:text-neutral-300 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm rounded-xl hover:bg-white/60 dark:hover:bg-neutral-800/70 focus:outline-none focus:ring-2 focus:ring-gray-500/30 transition-all duration-300 border border-white/30 dark:border-neutral-600/30"
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