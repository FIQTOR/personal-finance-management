

import { TbUser, TbMail, TbTrash, TbPencil, TbX, TbShieldCheck, TbLock, TbActivity, TbCheck, TbArrowLeft, TbUpload, TbKey } from 'react-icons/tb'
import { useCallback, useEffect, useState } from 'react'
import Notification from '@/components/PanelNotification';
import AppConfig from '@/config/AppConfig'
import { useRef } from 'react'
import ReactCrop from 'react-image-crop'
import type { Crop } from 'react-image-crop'
import apiClient from '@/services/apiClient';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getErrorData } from '@/utils/error';

interface EditableUser {
    id: number;
    name: string;
    username?: string;
    email: string;
    avatar_url?: string | null;
    role_id: number;
    is_blocked: boolean;
    is_verified: boolean;
    isVerified?: boolean;
}

interface ApiResponse {
    success: boolean;
    message: string;
}

export default function UserEditPage() {
    const navigate = useNavigate()
    const { id } = useParams()
    const [roles, setRoles] = useState<Array<{ id: number; name: string }>>([]);
    const [user_, setUser] = useState<EditableUser | null>(null)
    const [response, setResponse] = useState<ApiResponse | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isLoading, setLoading] = useState(true);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const [showCropModal, setShowCropModal] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [crop, setCrop] = useState<Crop | undefined>(undefined);
    const imageRef = useRef<HTMLImageElement | null>(null);

    // Add onImageLoad handler
    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        const cropWidth = Math.min(width, height);
        const x = (width - cropWidth) / 2;
        const y = (height - cropWidth) / 2;

        setCrop({
            unit: 'px',
            width: cropWidth,
            height: cropWidth,
            x: x,
            y: y
        });
    };

    // Replace handleImagePreview with handleFileSelect
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setUploadError('Please select an image file');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                setUploadError('Image size should be less than 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                setTempImage(reader.result as string);
                setShowCropModal(true);
                setUploadError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    // Add handleCropComplete function
    const handleCropComplete = async () => {
        if (!imageRef.current || !crop?.width || !crop?.height) {
            setUploadError('Please select an area to crop');
            return;
        }

        const canvas = document.createElement('canvas');
        const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
        const scaleY = imageRef.current.naturalHeight / imageRef.current.height;

        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            ctx.drawImage(
                imageRef.current,
                crop.x * scaleX,
                crop.y * scaleY,
                crop.width * scaleX,
                crop.height * scaleY,
                0,
                0,
                crop.width,
                crop.height
            );

            const croppedImage = canvas.toDataURL('image/jpeg');
            setPreviewImage(croppedImage);
            setShowCropModal(false);
            setTempImage(null);
        }
    };

    const getUser = useCallback(async () => {
        try {
            const res = await apiClient.get(`/users/${id}`);
            const resRole = await apiClient.get(`/roles`);

            setRoles(resRole.data.data.roles);
            setUser(res.data.data.user);
            setLoading(false)
        } catch (error) {
            console.error(error);
        }
    }, [id])

    useEffect(() => {
        document.title = `Edit User ${AppConfig.exTitle}`
        getUser();
    }, [getUser]);

    if (!user_) return (
        <div className="p-4 sm:p-6 md:p-8 min-h-screen animate-pulse">
            <div className="max-w-6xl mx-auto">
                <div className="h-8 w-64 rounded-lg bg-neutral-200 dark:bg-neutral-800 mb-6 sm:mb-8" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <div className="backdrop-blur-xl bg-white/70 dark:bg-neutral-800/70 p-6 rounded-2xl shadow-lg border border-white/50 dark:border-neutral-700/50 space-y-4">
                            <div className="aspect-square w-full max-w-50 md:max-w-none mx-auto rounded-full bg-neutral-200 dark:bg-neutral-800" />
                            <div className="h-10 w-full rounded-xl bg-neutral-200 dark:bg-neutral-800" />
                        </div>
                    </div>
                    <div className="md:col-span-2 space-y-4">
                        <div className="backdrop-blur-xl bg-white/70 dark:bg-neutral-800/70 p-6 rounded-2xl shadow-lg border border-white/50 dark:border-neutral-700/50 space-y-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="h-4 w-28 rounded bg-neutral-200 dark:bg-neutral-800" />
                                    <div className="h-12 w-full rounded-xl bg-neutral-200 dark:bg-neutral-800" />
                                </div>
                            ))}
                            <div className="h-12 w-40 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    // Add handleSubmit function
    // In the handleSubmit function, add is_blocked to formData
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', user_.name);
            formData.append('email', user_.email);
            formData.append('roleId', String(user_.role_id));
            formData.append('is_blocked', user_.is_blocked.toString());  // Add this line
            formData.append('is_verified', user_.is_verified.toString());  // Add this line

            // If there's a new image, convert base64 to blob and append to form data
            if (previewImage) {
                const base64Response = await fetch(previewImage);
                const blob = await base64Response.blob();
                formData.append('avatar', blob, 'avatar.jpg');
            }

            const res = await apiClient.put(`/users/${id}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            setResponse(res.data);
            if (res.data.success) {
                setTimeout(() => {
                    navigate('/panel/users');
                }, 2000);
            }
        } catch (error: unknown) {
            setResponse(getErrorData<ApiResponse>(error, { success: false, message: 'Failed to update user' }));
        } finally {
            setLoading(false);
        }
    };
    // Add handleDelete function
    const handleDelete = () => {
        setDeleteId(user_.id);
    };
    const confirmDelete = async () => {
        if (!deleteId) return;
        setLoading(true);
        try {
            const res = await apiClient.delete(`/users/${deleteId}`);
            setResponse(res.data);
            if (res.data.success) {
                setTimeout(() => {
                    navigate('/panel/users');
                }, 2000);
            }
        } catch (error: unknown) {
            setResponse(getErrorData<ApiResponse>(error, { success: false, message: 'Failed to delete user' }));
        } finally {
            setLoading(false);
            setDeleteId(null);
        }
    };
    return (
        <div className="p-4 sm:p-6 md:p-8 relative min-h-screen">
            {/* Gradient Bubbles */}
            <div className='absolute w-75 h-75 sm:w-125 sm:h-125 bg-linear-to-r from-blue-400 to-purple-500 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full blur-3xl opacity-20 -top-20 sm:-top-60 -left-10 sm:-left-20 animate-pulse'></div>
            <div className='absolute w-62.5 h-62.5 sm:w-100 sm:h-100 bg-linear-to-r from-pink-400 to-orange-500 dark:from-pink-900/20 dark:to-orange-900/20 rounded-full blur-3xl opacity-20 bottom-0 right-0 animate-pulse delay-700'></div>

            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">Edit User Profile</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column - Profile Picture */}
                    <div className="md:col-span-1">
                        <div className="backdrop-blur-xl bg-white/70 dark:bg-neutral-800/70 p-6 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl border border-white/50 dark:border-neutral-700/50">
                            <div className="relative group md:aspect-square">
                                <div className="relative w-fit md:w-full mx-auto">
                                    <img
                                        src={previewImage ||
                                            (user_.avatar_url?.startsWith('https://')
                                                ? user_.avatar_url
                                                : user_.avatar_url
                                                    ? `${(AppConfig.baseApiUrl)?.replace('/api', '')}/${user_.avatar_url}`
                                                    : "/img/default-profile.png"
                                            )
                                        }
                                        alt={`${user_.username}'s Profile Picture`}
                                        className='rounded-full aspect-square w-full max-w-50 md:max-w-none mx-auto border-4 border-blue-200 dark:border-blue-800 transition-all duration-300 group-hover:scale-105 group-hover:border-blue-300 dark:group-hover:border-blue-600 shadow-lg'
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = "/img/default-profile.png";
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                                <div className="absolute bottom-2 right-2 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                                    {previewImage ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setPreviewImage(null);
                                                    setShowCropModal(true); // Show crop modal again
                                                    setTempImage(tempImage); // Keep the temp image
                                                }}
                                                className="bg-red-500 text-white p-2.5 rounded-full hover:bg-red-600 transition-all duration-300 shadow-lg hover:shadow-red-300/50"
                                                title="Cancel"
                                            >
                                                <TbX className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label
                                            htmlFor="avatar-upload"
                                            className="cursor-pointer bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-blue-300/50 flex items-center justify-center"
                                            title="Change profile picture"
                                        >
                                            <TbPencil className="h-5 w-5" />
                                        </label>
                                    )}
                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        aria-label="Upload profile picture"
                                        onChange={handleFileSelect}
                                    />
                                </div>
                            </div>

                            {uploadError && <p className="text-red-400 dark:text-red-300 mt-4 text-center">{uploadError}</p>}
                            {response && response.message &&
                                <p className={`mt-4 text-center ${response.success ? 'text-green-400 dark:text-green-300' : 'text-red-400 dark:text-red-300'}`}>
                                    {response.message}
                                </p>
                            }
                        </div>
                    </div>

                    {/* Right Column - User Information */}
                    <div className="md:col-span-2">
                        <div className="backdrop-blur-xl bg-white/70 dark:bg-neutral-800/70 p-6 rounded-2xl shadow-lg border border-white/50 dark:border-neutral-700/50">
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative group">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                                            <TbUser className="text-blue-600 dark:text-blue-400" />
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={user_.name}
                                            onChange={(e) => setUser({ ...user_, name: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-black/50 dark:border-neutral-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 text-neutral-800 dark:text-neutral-200 transition"
                                        />
                                    </div>

                                    <div className="relative group">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                                            <TbMail className="text-blue-600 dark:text-blue-400" />
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={user_.email}
                                            onChange={(e) => setUser({ ...user_, email: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-black/50 dark:border-neutral-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 text-neutral-800 dark:text-neutral-200 transition"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                                            <TbLock className="text-blue-600 dark:text-blue-400" />
                                            Account Status
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <label className="inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={user_.is_blocked}
                                                    onChange={(e) => setUser({ ...user_, is_blocked: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="relative w-11 h-6 bg-gray-200 dark:bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600 dark:peer-checked:bg-red-700"></div>
                                                <span className="ms-3 text-sm font-medium text-gray-700 dark:text-neutral-300">
                                                    {user_.is_blocked ? 'Blocked' : 'Active'}
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="relative group">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                                            <TbCheck className="text-blue-600 dark:text-blue-400" />
                                            Email Verification
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <label className="inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={user_.is_verified}
                                                    onChange={(e) => setUser({ ...user_, is_verified: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="relative w-11 h-6 bg-gray-200 dark:bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 dark:peer-checked:bg-green-700"></div>
                                                <span className="ms-3 text-sm font-medium text-gray-700 dark:text-neutral-300">
                                                    {user_.isVerified ? 'Verified' : 'Not Verified'}
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="relative group">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                                            <TbShieldCheck className="text-blue-600 dark:text-blue-400" />
                                            Role
                                        </label>
                                        <select
                                            defaultValue={user_.role_id}
                                            onChange={(e) => setUser({ ...user_, role_id: Number(e.target.value) })}
                                            className="w-full px-4 py-2 rounded-lg border border-black/50 dark:border-neutral-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 text-neutral-800 dark:text-neutral-200 transition"
                                        >
                                            {roles.map(role => (
                                                <option key={role.id} value={role.id}>
                                                    {role.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 pt-4">
                                    {(!response || (response && !response.success)) && <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="flex items-center gap-2 px-6 py-3 text-white bg-linear-to-r from-purple-500 to-pink-500 rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 transition-all shadow-lg hover:shadow-purple-500/25"
                                        >
                                            <TbUpload className="w-5 h-5" />
                                            {isLoading ? 'Updating...' : 'Update User'}
                                        </button>
                                        <Link
                                            to={'/panel/users'}
                                            className="flex items-center gap-2 px-6 py-3 text-gray-700 dark:text-neutral-300 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm rounded-xl hover:bg-white/60 dark:hover:bg-neutral-800/70 focus:outline-none focus:ring-2 focus:ring-gray-500/30 dark:focus:ring-gray-500/30 transition-all border border-white/30 dark:border-neutral-600/30"
                                        >
                                            <TbArrowLeft className="w-5 h-5" />
                                            Cancel
                                        </Link>
                                    </div>}
                                    <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center'>
                                        <Link to={`/panel/users/${user_.id}/reset-password`}
                                            className='flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300'
                                        >
                                            <TbKey size={20} />
                                            Reset Password
                                        </Link>
                                        <Link to={`/panel/users/${user_.id}/activities`}
                                            className='flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300'
                                        >
                                            <TbActivity size={20} />
                                            User Activities
                                        </Link>
                                        {(!response || (response && !response.success)) && <>
                                            <button
                                                type="button"
                                                onClick={handleDelete}
                                                disabled={isLoading}
                                                className="flex items-center gap-2 px-6 py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-300"
                                            >
                                                <TbTrash className="h-4 w-4" />
                                                Delete
                                            </button>
                                        </>}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Add Notification component */}
                {deleteId && (
                    <Notification
                        message="Are you sure you want to delete this role?"
                        type="action"
                        onConfirm={confirmDelete}
                        onClose={() => setDeleteId(null)}
                    />
                )}
            </div>
            {/* Add Crop Modal */}
            {showCropModal && tempImage && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-neutral-800 p-4 sm:p-6 md:p-8 rounded-2xl w-full max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-neutral-200">Crop Profile Picture</h3>
                        <div className="relative aspect-square w-full overflow-hidden rounded-xl">
                            <ReactCrop
                                crop={crop}
                                onChange={c => setCrop(c)}
                                aspect={1}
                                circularCrop
                            >
                                <img
                                    ref={imageRef}
                                    src={tempImage}
                                    onLoad={onImageLoad}
                                    alt="Crop preview"
                                    className="max-h-100 sm:max-h-125 w-full object-contain"
                                />
                            </ReactCrop>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCropModal(false);
                                    setTempImage(null);
                                }}
                                className="flex items-center justify-center gap-2 px-6 py-3 text-gray-700 bg-white/50 backdrop-blur-sm rounded-xl hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-gray-500/30 transition-all border border-white/30"
                            >
                                <TbArrowLeft className="w-5 h-5" />
                                Cancel
                            </button>
                            <button
                                type="submit"
                                onClick={handleCropComplete}
                                className="flex items-center justify-center gap-2 px-6 py-3 text-white bg-linear-to-r from-purple-500 to-pink-500 rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 transition-all shadow-lg hover:shadow-purple-500/25"
                            >
                                <TbCheck className="w-5 h-5" />
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
