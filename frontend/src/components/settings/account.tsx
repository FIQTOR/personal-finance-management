

import AppConfig from '@/config/AppConfig'
import { selectAuth } from '@/store/authSlice'
import { useAppSelector } from '@/store/hooks'
import axiosJWT from '@/utils/axiosJWT'
import React, { useState, useRef, useEffect } from 'react'
import { TbArrowLeft, TbCheck, TbKey, TbUpload, TbUser, TbCamera } from 'react-icons/tb'
import ReactCrop, { type Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Link } from 'react-router-dom'

const AccountMenu = () => {
    const { user } = useAppSelector(selectAuth)

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [name, setName] = useState('');
    const [crop, setCrop] = useState<Crop | any>({
        unit: '%',
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        aspect: 1,
    });

    const [tempImage, setTempImage] = useState<string | null>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const [mounted, setMounted] = useState(false);

    // Use useEffect to set mounted state on client side
    useEffect(() => {
        setMounted(true);
        if (user?.name) {
            setName(user.name);
        }
    }, [user?.name]);

    // Return loading state during SSR or before client-side hydration
    if (!mounted) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-neutral-500 dark:text-neutral-400">Loading user data...</p>
                </div>
            </div>
        );
    }

    // Return null if user is not available after hydration
    if (!user) {
        return null;
    }

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        const containerWidth = 400; // Set a fixed container width
        const containerHeight = 400; // Set a fixed container height for square

        // Calculate scale to fit image within container
        const scale = Math.min(containerWidth / width, containerHeight / height);
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;

        // Calculate crop dimensions (always square)
        const cropSize = Math.min(scaledWidth, scaledHeight) * 0.8; // 80% of smaller dimension
        const x = (scaledWidth - cropSize) / 2;
        const y = (scaledHeight - cropSize) / 2;

        setCrop({
            unit: 'px',
            width: cropSize,
            height: cropSize,
            x: x,
            y: y,
            aspect: 1
        });
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                // Reset the file input
                event.target.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                setTempImage(reader.result as string);
                setShowCropModal(true);
            };
            reader.readAsDataURL(file);
        }
        // Reset the file input to allow selecting the same file again
        event.target.value = '';
    };

    const handleCropComplete = async () => {
        if (!imageRef.current || !crop.width || !crop.height) {
            setResponse({ status: 'error', message: 'Please select an area to crop' });
            return;
        }

        const canvas = document.createElement('canvas');
        const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
        const scaleY = imageRef.current.naturalHeight / imageRef.current.height;

        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            try {
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

                const formData = new FormData();
                const response = await fetch(croppedImage);
                const blob = await response.blob();
                formData.append('avatar', blob, 'avatar.jpg');

                const res = await axiosJWT.put(`${AppConfig.baseApiUrl}/profile/avatar`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });

                if (!res.data) {
                    throw new Error('Failed to update profile picture');
                }

                setPreviewImage(croppedImage);
                setShowCropModal(false);
                setTempImage(null);
                setResponse({ status: 'success', message: 'Profile picture updated successfully!' });
            } catch (error: any) {
                console.error('Error uploading avatar:', error);
                setResponse({
                    status: 'error',
                    message: error.response?.data?.message || 'Failed to update profile picture. Please try again.'
                });
                setShowCropModal(false);
                setTempImage(null);
            }
        }
    };

    const handleUpdateProfile = async () => {
        try {
            const res = await axiosJWT.put(`${AppConfig.baseApiUrl}/profile`, {
                name,
            });

            if (!res.data) {
                throw new Error('Failed to update profile');
            }

            setResponse({ status: 'success', message: 'Profile updated successfully!' });
        } catch (error: any) {
            console.error('Error updating profile:', error);
            setResponse({
                status: 'error',
                message: error.response?.data?.message || 'Failed to update profile. Please try again.'
            });
        }
    }

    return (
        <>
            {/* Crop Modal - Rendered outside the main container */}
            {showCropModal && tempImage && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-999999 p-4">
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative" style={{ transform: 'translateZ(0)' }}>
                        {/* Header */}
                        <div className="p-6 shrink-0 border-b border-gray-200 dark:border-neutral-700">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 flex items-center gap-2">
                                    <TbCamera className="text-blue-600 dark:text-blue-400" />
                                    Crop Profile Picture
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowCropModal(false);
                                        setTempImage(null);
                                    }}
                                    className="text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
                                >
                                    <TbArrowLeft className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    <strong>Crop Your Photo:</strong> Adjust the circular crop area to select the perfect profile picture.
                                </p>
                            </div>
                        </div>

                        {/* Image Container */}
                        <div className="flex-1 overflow-hidden flex items-center justify-center p-6">
                            <div className="relative w-100 h-100 flex items-center justify-center">
                                <ReactCrop
                                    crop={crop}
                                    onChange={c => setCrop(c)}
                                    aspect={1}
                                    circularCrop
                                    className="max-w-full max-h-full"
                                    keepSelection
                                >
                                    <img
                                        ref={imageRef}
                                        src={tempImage}
                                        onLoad={onImageLoad}
                                        alt="Crop preview"
                                        className="max-w-100 max-h-100 w-auto h-auto object-contain"
                                    />
                                </ReactCrop>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 shrink-0 border-t border-gray-200 dark:border-neutral-700">
                            <div className="flex gap-4 justify-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCropModal(false);
                                        setTempImage(null);
                                    }}
                                    className="flex items-center gap-2 px-6 py-3 text-gray-700 dark:text-neutral-300 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm rounded-xl hover:bg-white/60 dark:hover:bg-neutral-800/70 focus:outline-none focus:ring-2 focus:ring-gray-500/30 dark:focus:ring-gray-500/30 transition-all border border-white/30 dark:border-neutral-600/30"
                                >
                                    <TbArrowLeft className="w-5 h-5" />
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCropComplete}
                                    className="flex items-center gap-2 px-6 py-3 text-white bg-linear-to-r from-purple-500 to-pink-500 rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 transition-all shadow-lg hover:shadow-purple-500/25"
                                >
                                    <TbCheck className="w-5 h-5" />
                                    Apply Crop
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-2 space-y-6">
                {response && (
                    <div className={`p-4 rounded-2xl ${response.status === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                        }`}>
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                            <TbCheck className="w-5 h-5 shrink-0" />
                            <span>{response.message}</span>
                        </div>
                    </div>
                )}

                {/* Profile Picture Card */}
                <div className="bg-gray-50/60 dark:bg-neutral-800/40 rounded-2xl p-6 border border-gray-100 dark:border-neutral-800/80">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-emerald-500/20 shadow-md">
                                <img
                                    src={previewImage ||
                                        (user?.avatar_url?.startsWith('https://')
                                            ? user?.avatar_url
                                            : user?.avatar_url
                                                ? `${(AppConfig.baseApiUrl)?.replace('/api', '')}/${user?.avatar_url}`
                                                : "./img/default-profile.png"
                                        )
                                    }
                                    alt={`${user?.name || 'User'}'s Profile Picture`}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "./img/default-profile.png";
                                    }}
                                />
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                                onClick={() => {
                                    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                                    fileInput?.click();
                                }}>
                                <TbCamera className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="flex-1 text-center sm:text-left space-y-1">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Profile Photo</h3>
                            <p className="text-xs text-gray-500 dark:text-neutral-400">Update your account avatar image</p>
                            <div className="pt-2">
                                <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer text-xs font-semibold shadow-2xs transition-all">
                                    <TbCamera className="w-4 h-4" />
                                    <span>Change Photo</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileSelect}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Profile Form */}
                <div className="bg-gray-50/60 dark:bg-neutral-800/40 rounded-2xl p-6 border border-gray-100 dark:border-neutral-800/80 space-y-4">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <TbUser className="w-4 h-4 text-emerald-500" /> Personal Details
                    </h3>
                    <div className="space-y-4 pt-1">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-neutral-400 mb-1">Full Name</label>
                            <input
                                defaultValue={name}
                                type="text"
                                className="w-full px-4 py-2.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                                placeholder="Enter your full name..."
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-neutral-400 mb-1">Email Address</label>
                            <input
                                disabled
                                readOnly
                                type="email"
                                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-neutral-800/60 border border-gray-200 dark:border-neutral-700/60 rounded-xl cursor-not-allowed text-xs sm:text-sm text-gray-500 dark:text-neutral-400"
                                defaultValue={user?.email || ''}
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-2">
                    {user?.email && !user.email.startsWith('admin') && (
                        <Link
                            to={'/forgot-password'}
                            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all"
                        >
                            <TbKey className="h-4 w-4 text-emerald-500" />
                            Change Password
                        </Link>
                    )}
                    <button
                        onClick={handleUpdateProfile}
                        disabled={(!previewImage && name === user?.name)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-2xs ${(!previewImage && name === user?.name)
                            ? 'bg-gray-300 dark:bg-neutral-700 text-gray-500 dark:text-neutral-500 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'}`}
                    >
                        <TbUpload className="h-4 w-4" />
                        Save Changes
                    </button>
                </div>
            </div>
        </>
    )
}

export default AccountMenu