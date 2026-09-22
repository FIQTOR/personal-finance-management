import { motion, AnimatePresence } from 'framer-motion';
import { TbCheck, TbX, TbAlertTriangle, TbInfoCircle } from 'react-icons/tb';
import { useNotification } from '@/context/useNotification';

const NotificationItem = ({ id, message, type }: { id: string; message: string; type: string }) => {
    const { removeNotification } = useNotification();

    const icons = {
        success: <TbCheck className="text-emerald-500" />,
        error: <TbX className="text-rose-500" />,
        warning: <TbAlertTriangle className="text-amber-500" />,
        info: <TbInfoCircle className="text-blue-500" />,
    };

    const colors = {
        success: 'border-emerald-500/20 bg-emerald-50/80 dark:bg-emerald-500/10',
        error: 'border-rose-500/20 bg-rose-50/80 dark:bg-rose-500/10',
        warning: 'border-amber-500/20 bg-amber-50/80 dark:bg-amber-500/10',
        info: 'border-blue-500/20 bg-blue-50/80 dark:bg-blue-500/10',
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className={`flex items-center gap-3 px-5 py-4 rounded-4xl border backdrop-blur-2xl shadow-2xl min-w-[320px] max-w-105 pointer-events-auto mb-3 last:mb-0 ${colors[type as keyof typeof colors]}`}
        >
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-neutral-900 flex items-center justify-center shadow-sm shrink-0">
                <span className="text-xl">{icons[type as keyof typeof icons]}</span>
            </div>
            <div className="flex-1 overflow-hidden">
                <p className="text-[13px] font-bold text-gray-800 dark:text-gray-100 leading-snug">
                    {message}
                </p>
            </div>
            <button
                onClick={() => removeNotification(id)}
                className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors shrink-0"
            >
                <TbX className="text-gray-400" />
            </button>
        </motion.div>
    );
};

export const NotificationContainer = () => {
    const { notifications } = useNotification();

    return (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-10000 pointer-events-none flex flex-col items-center">
            <AnimatePresence>
                {notifications.map((n) => (
                    <NotificationItem key={n.id} {...n} />
                ))}
            </AnimatePresence>
        </div>
    );
};
