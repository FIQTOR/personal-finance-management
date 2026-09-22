

import { TbUser, TbMail, TbLock, TbShieldCheck, TbKey, TbCheck, TbX, TbPencil, TbPlus, TbArrowLeft } from 'react-icons/tb'
import { useState, useEffect, useRef } from 'react'
import AppConfig from '@/config/AppConfig'
import ReactCrop from 'react-image-crop'
import type { Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { useNavigate } from 'react-router-dom'
import apiClient from '@/services/apiClient';
import { getErrorData } from '@/utils/error';

interface ApiResponse {
    success: boolean;
    message: string;
}

export default function AddUserPage() {
    const navigate = useNavigate();
    const [roles, setRoles] = useState<Array<{ id: number; name: string }>>([]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        roleId: '',
        isBlocked: false,
        isVerified: false
    });
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isLoading, setLoading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [response, setResponse] = useState<ApiResponse | null>(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [crop, setCrop] = useState<Crop>({
        unit: '%',
        width: 100,
        height: 100,
        x: 0,
        y: 0,
    });
    const [tempImage, setTempImage] = useState<string | null>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);

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

    // Replace handleImagePreview with this updated version
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
    // Update handleCropComplete to handle the cropped image
    const handleCropComplete = async () => {
        if (!imageRef.current || !crop.width || !crop.height) {
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
    const getRoles = async () => {
        try {
            const resRole = await apiClient.get(`/roles`);
            setRoles(resRole.data.data.roles);
            if (resRole.data.data.roles.length > 0) {
                setFormData(prev => ({ ...prev, roleId: resRole.data.data.roles[0].id }));
            }
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        document.title = `Add New User ${AppConfig.exTitle}`
        getRoles();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('email', formData.email);
            submitData.append('password', formData.password);
            submitData.append('roleId', formData.roleId.toString());
            submitData.append('isBlocked', formData.isBlocked.toString());
            submitData.append('isVerified', formData.isVerified.toString());

            if (previewImage) {
                const base64Response = await fetch(previewImage);
                const blob = await base64Response.blob();
                submitData.append('avatar', blob, 'avatar.jpg');
            }

            const res = await apiClient.post(`/users`,
                submitData,
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
            setResponse(getErrorData<ApiResponse>(error, { success: false, message: 'Failed to create user' }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-8 relative">
            {/* Gradient Bubbles */}
            <div className='absolute w-125 h-125 bg-linear-to-r from-blue-400 to-purple-500 rounded-full blur-3xl opacity-20 -top-60 -left-20 animate-pulse'></div>
            <div className='absolute w-100 h-100 bg-linear-to-r from-pink-400 to-orange-500 rounded-full blur-3xl opacity-20 bottom-0 right-0 animate-pulse delay-700'></div>

            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Add New User</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column - Profile Picture */}
                    <div className="md:col-span-1">
                        <div className="backdrop-blur-xl bg-white/70 dark:bg-neutral-800/70 p-6 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl border border-white/50 dark:border-neutral-700/50">
                            <div className="relative group md:aspect-square">
                                <div className="relative w-full mx-auto">
                                    <img
                                        src={previewImage || "/img/default-profile.png"}
                                        alt="Profile Preview"
                                        className='rounded-full aspect-square w-full max-w-50 md:max-w-none mx-auto border-4 border-blue-200 dark:border-neutral-600 transition-all duration-300 group-hover:scale-105 group-hover:border-blue-300 dark:group-hover:border-blue-400 shadow-lg'
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

                            {uploadError && <p className="text-red-400 dark:text-red-400 mt-4 text-center">{uploadError}</p>}
                            {response && response.message &&
                                <p className={`mt-4 text-center ${response.success ? 'text-green-400 dark:text-green-400' : 'text-red-400 dark:text-red-400'}`}>
                                    {response.message}
                                </p>
                            }
                        </div>
                    </div>

                    {/* Right Column - User Information */}
                    <div className="md:col-span-2">
                        <div className="backdrop-blur-xl bg-white/70 dark:bg-neutral-800/70 p-6 rounded-2xl shadow-lg border border-white/50 dark:border-neutral-700/50">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative group">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                                            <TbUser className="text-blue-600" />
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-black/50 dark:border-neutral-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 text-gray-900 dark:text-neutral-200 transition"
                                        />
                                    </div>

                                    <div className="relative group">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                                            <TbMail className="text-blue-600" />
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-black/50 dark:border-neutral-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 text-gray-900 dark:text-neutral-200 transition"
                                        />
                                    </div>

                                    <div className="relative group">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                                            <TbKey className="text-blue-600" />
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-black/50 dark:border-neutral-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 text-gray-900 dark:text-neutral-200 transition"
                                        />
                                    </div>

                                    <div className="relative group">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                                            <TbShieldCheck className="text-blue-600" />
                                            Role
                                        </label>
                                        <select
                                            required
                                            value={formData.roleId}
                                            onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-black/50 dark:border-neutral-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 text-gray-900 dark:text-neutral-200 transition"
                                        >
                                            {roles.map(role => (
                                                <option key={role.id} value={role.id}>
                                                    {role.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="relative group">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                                            <TbLock className="text-blue-600" />
                                            Account Status
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <label className="inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isBlocked}
                                                    onChange={(e) => setFormData({ ...formData, isBlocked: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="relative w-11 h-6 bg-gray-200 dark:bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600 dark:peer-checked:bg-red-700"></div>
                                                <span className="ms-3 text-sm font-medium text-gray-700 dark:text-neutral-300">
                                                    {formData.isBlocked ? 'Blocked' : 'Active'}
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="relative group">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                                            <TbCheck className="text-blue-600" />
                                            Email Verification
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <label className="inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isVerified}
                                                    onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="relative w-11 h-6 bg-gray-200 dark:bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 dark:peer-checked:bg-green-700"></div>
                                                <span className="ms-3 text-sm font-medium text-gray-700 dark:text-neutral-300">
                                                    {formData.isVerified ? 'Verified' : 'Not Verified'}
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                {(!response || (response && !response.success)) && <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex items-center gap-2 px-6 py-3 text-white bg-linear-to-r from-purple-500 to-pink-500 rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 transition-all shadow-lg hover:shadow-purple-500/25"
                                    >
                                        <TbPlus className="w-5 h-5" />
                                        {isLoading ? 'Creating...' : 'Create Role'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigate(-1)}
                                        className="flex items-center gap-2 px-6 py-3 text-gray-700 dark:text-neutral-300 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm rounded-xl hover:bg-white/60 dark:hover:bg-neutral-800/70 focus:outline-none focus:ring-2 focus:ring-gray-500/30 transition-all border border-white/30 dark:border-neutral-600/30"
                                    >
                                        <TbArrowLeft className="w-5 h-5" />
                                        Cancel
                                    </button>
                                </div>}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            {/* Add Crop Modal */}
            {showCropModal && tempImage && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-neutral-800 p-8 rounded-2xl w-full max-w-2xl">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-neutral-200">Crop Profile Picture</h3>
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
                                    className="max-h-125 w-full object-contain"
                                />
                            </ReactCrop>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCropModal(false);
                                    setTempImage(null);
                                }}
                                className="flex items-center gap-2 px-6 py-3 text-gray-700 bg-white/50 backdrop-blur-sm rounded-xl hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-gray-500/30 transition-all border border-white/30"
                            >
                                <TbArrowLeft className="w-5 h-5" />
                                Cancel
                            </button>
                            <button
                                type="submit"
                                onClick={handleCropComplete}
                                className="flex items-center gap-2 px-6 py-3 text-white bg-linear-to-r from-purple-500 to-pink-500 rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 transition-all shadow-lg hover:shadow-purple-500/25"
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