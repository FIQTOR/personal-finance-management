import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface NotificationProps {
    message: string
    type?: 'success' | 'error' | 'info' | 'action'
    duration?: number
    onClose?: () => void
    onConfirm?: () => void
}

const Notification = ({
    message,
    type = 'info',
    duration = 3000,
    onClose,
    onConfirm
}: NotificationProps) => {
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        if (type !== 'action') {
            const timer = setTimeout(() => {
                setIsVisible(false)
                onClose?.()
            }, duration)

            return () => clearTimeout(timer)
        }
    }, [duration, onClose, type])

    const getTextColor = () => {
        switch (type) {
            case 'success':
                return 'text-green-700'
            case 'error':
                return 'text-red-700'
            case 'action':
                return 'text-yellow-700'
            default:
                return 'text-blue-700'
        }
    }

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose?.();
        }, 300); // Delay to match animation duration
    };

    const handleConfirm = () => {
        setIsVisible(false);
        setTimeout(() => {
            onConfirm?.();
        }, 300); // Delay to match animation duration
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ duration: 0.3, ease: "linear" }}
                    className={`fixed bottom-4 right-4 p-6 rounded-2xl shadow-xl
                        backdrop-blur-md backdrop-saturate-150
                        border border-white/30
                        bg-white/80 hover:bg-white/90
                         duration-300
                        ${getTextColor()}`}
                >
                    <div className="flex flex-col gap-3">
                        <div className="font-medium">{message}</div>
                        {type === 'action' && (
                            <div className="flex gap-3 justify-end mt-1">
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-2 rounded-xl
                                        bg-gray-100 hover:bg-gray-200
                                        border border-gray-200
                                        backdrop-blur-sm
                                        transition-all duration-200
                                        text-gray-700 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="px-4 py-2 rounded-xl
                                        bg-linear-to-r from-purple-500 to-pink-500
                                        hover:opacity-90
                                        text-white font-medium
                                        transition-all duration-200
                                        shadow-lg hover:shadow-purple-500/25"
                                >
                                    Confirm
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default Notification
