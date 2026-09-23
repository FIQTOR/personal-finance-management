import { motion, AnimatePresence } from 'framer-motion';
import { TbCheck, TbX, TbAlertTriangle, TbInfoCircle } from 'react-icons/tb';
import { useNotification, type NotificationAction } from '@/context/useNotification';

const NotificationItem = ({ id, message, type, title, actions }:
    { id: string; message: string; type: string; title?: string; actions?: NotificationAction[] }) => {
    const { removeNotification } = useNotification();
    const icons = {
        success: <TbCheck className="text-emerald-500" />, error: <TbX className="text-rose-500" />,
        warning: <TbAlertTriangle className="text-amber-500" />, info: <TbInfoCircle className="text-blue-500" />,
        action: <TbAlertTriangle className="text-amber-500" />,
    };
    const colors = {
        success: 'border-emerald-500/20 bg-emerald-50/80 dark:bg-emerald-500/10',
        error: 'border-rose-500/20 bg-rose-50/80 dark:bg-rose-500/10',
        warning: 'border-amber-500/20 bg-amber-50/80 dark:bg-amber-500/10',
        info: 'border-blue-500/20 bg-blue-50/80 dark:bg-blue-500/10',
        action: 'border-amber-500/20 bg-amber-50/80 dark:bg-amber-500/10',
    };
    const actionVariants: Record<string, string> = {
        primary: 'bg-blue-600/90 backdrop-blur-md border border-blue-400/40 text-white hover:bg-blue-500',
        danger: 'bg-rose-500/90 backdrop-blur-md border border-rose-400/40 text-white hover:bg-rose-500',
        secondary: 'bg-white/70 dark:bg-neutral-800/70 text-gray-700 dark:text-neutral-300 border border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-700',
    };
    const handleAction = (action: NotificationAction) => { action.onClick(); removeNotification(id); };

    return (
        <motion.div layout
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className={`flex items-center gap-3 px-5 py-4 rounded-4xl border backdrop-blur-2xl shadow-2xl min-w-[320px] max-w-105 pointer-events-auto mb-3 last:mb-0 ${colors[type as keyof typeof colors] ?? colors.info}`}>
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-neutral-900 flex items-center justify-center shadow-sm shrink-0">
                <span className="text-xl">{icons[type as keyof typeof icons] ?? icons.info}</span>
            </div>
            <div className="flex-1 overflow-hidden text-center">
                {title && <p className="text-[13px] font-black text-gray-900 dark:text-white leading-snug mb-0.5">{title}</p>}
                <p className="text-[13px] font-bold text-gray-800 dark:text-gray-100 leading-snug">{message}</p>
                {actions && actions.length > 0 && (
                    <div className="flex gap-2 mt-3 justify-center">
                        {actions.map((action, i) => (
                            <button key={i} onClick={() => handleAction(action)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${actionVariants[action.variant ?? 'secondary']}`}>
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <button onClick={() => removeNotification(id)}
                className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors shrink-0">
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
                {notifications.map((n) => <NotificationItem key={n.id} {...n} />)}
            </AnimatePresence>
        </div>
    );
};
