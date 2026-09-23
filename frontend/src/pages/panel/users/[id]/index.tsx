

import { TbUser, TbMail, TbTrash, TbPencil, TbX, TbShieldCheck, TbLock, TbActivity, TbCheck, TbArrowLeft, TbUpload, TbKey } from 'react-icons/tb'
import { useCallback, useEffect, useState } from 'react'
import AppConfig from '@/config/AppConfig'
import { useRef } from 'react'
import ReactCrop from 'react-image-crop'
import type { Crop } from 'react-image-crop'
import apiClient from '@/services/apiClient';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PanelSelect from '@/components/PanelSelect';
import PanelCheckbox from '@/components/PanelCheckbox';
import { useNotification } from '@/context/useNotification';
import { getErrorMessage } from '@/utils/error';

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

export default function UserEditPage() {
    const navigate = useNavigate()
    const { id } = useParams()
    const { notify, confirm } = useNotification()
    const [roles, setRoles] = useState<Array<{ id: number; name: string }>>([]);
    const [user_, setUser] = useState<EditableUser | null>(null)
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isLoading, setLoading] = useState(true);
    const [uploadError, setUploadError] = useState<string | null>(null);

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
            notify(getErrorMessage(error, 'Failed to load user'), 'error');
        }
    }, [id, notify])

    useEffect(() => {
        document.title = `Edit User ${AppConfig.exTitle}`
        getUser();
    }, [getUser]);

    if (!user_) return (
        <div className="p-4 sm:p-6 md:p-8 h-full animate-pulse">
            <div className="w-full">
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

            notify(res.data.message || 'User updated successfully', 'success');
            setTimeout(() => {
                navigate('/panel/users');
            }, 1200);
        } catch (error: unknown) {
            notify(getErrorMessage(error, 'Failed to update user'), 'error');
        } finally {
            setLoading(false);
        }
    };
    // Add handleDelete function
    const handleDelete = () => {
        if (!user_) return;
        confirm('Are you sure you want to delete this user? This action cannot be undone.', async () => {
            setLoading(true);
            try {
                const res = await apiClient.delete(`/users/${user_.id}`);
                notify(res.data.message || 'User deleted successfully', 'success');
                setTimeout(() => {
                    navigate('/panel/users');
                }, 1200);
            } catch (error: unknown) {
                notify(getErrorMessage(error, 'Failed to delete user'), 'error');
            } finally {
                setLoading(false);
            }
        }, { actions: [{ label: 'Delete', variant: 'danger', onClick: () => {} }, { label: 'Cancel', onClick: () => {} }] });
    };
    return (
        <div className="p-4 sm:p-6 md:p-8 relative h-full">
            <div className="w-full">
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
                                        <PanelCheckbox
                                            checked={user_.is_blocked}
                                            onChange={(checked) => setUser({ ...user_, is_blocked: checked })}
                                            label={user_.is_blocked ? 'Blocked' : 'Active'}
                                            activeColor="red"
                                        />
                                    </div>

                                    <div className="relative group">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                                            <TbCheck className="text-blue-600 dark:text-blue-400" />
                                            Email Verification
                                        </label>
                                        <PanelCheckbox
                                            checked={user_.is_verified}
                                            onChange={(checked) => setUser({ ...user_, is_verified: checked })}
                                            label={user_.is_verified ? 'Verified' : 'Not Verified'}
                                            activeColor="green"
                                        />
                                    </div>

                                    <div className="relative group">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                                            <TbShieldCheck className="text-blue-600 dark:text-blue-400" />
                                            Role
                                        </label>
                                        <PanelSelect
                                            value={user_.role_id}
                                            onChange={(v) => setUser({ ...user_, role_id: Number(v) })}
                                            placeholder="Select role"
                                            options={roles.map(role => ({ value: role.id, label: role.name }))}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 pt-4">
                                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="flex items-center justify-center gap-2 px-6 py-3 text-white bg-blue-600/90 backdrop-blur-md border border-blue-400/40 rounded-xl hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-blue-500/30"
                                        >
                                            {isLoading ? <span className="loader" style={{ width: 18, height: 18 }}></span> : <TbUpload className="w-5 h-5" />}
                                            {isLoading ? 'Updating...' : 'Update User'}
                                        </button>
                                        <Link
                                            to={'/panel/users'}
                                            className="flex items-center justify-center gap-2 px-6 py-3 text-gray-700 dark:text-neutral-300 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm rounded-xl hover:bg-white/60 dark:hover:bg-neutral-800/70 focus:outline-none focus:ring-2 focus:ring-gray-500/30 dark:focus:ring-gray-500/30 transition-all duration-300 border border-white/30 dark:border-neutral-600/30"
                                        >
                                            <TbArrowLeft className="w-5 h-5" />
                                            Cancel
                                        </Link>
                                    </div>
                                    <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center'>
                                        <Link to={`/panel/users/${user_.id}/reset-password`}
                                            className='flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300'
                                        >
                                            <TbKey size={20} />
                                            Reset Password
                                        </Link>
                                        <Link to={`/panel/users/${user_.id}/activities`}
                                            className='flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300'
                                        >
                                            <TbActivity size={20} />
                                            User Activities
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            disabled={isLoading}
                                            className="flex items-center gap-2 px-6 py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all duration-300"
                                        >
                                            <TbTrash className="h-4 w-4" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
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
                                type="button"
                                onClick={handleCropComplete}
                                className="flex items-center justify-center gap-2 px-6 py-3 text-white bg-blue-600/90 backdrop-blur-md border border-blue-400/40 rounded-xl hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-blue-500/30"
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
