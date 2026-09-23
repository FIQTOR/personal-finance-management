import React, { createContext, useState, useCallback, useRef } from 'react';

type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'action';

export interface NotificationAction {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'danger' | 'secondary';
}

export interface Notification {
    id: string;
    message: string;
    type: NotificationType;
    title?: string;
    actions?: NotificationAction[];
}

export interface NotificationOptions { title?: string; duration?: number; actions?: NotificationAction[] }

export interface NotificationContextType {
    addNotification: (message: string, type: NotificationType, options?: NotificationOptions) => string;
    notify: (message: string, type?: NotificationType, options?: NotificationOptions) => string;
    confirm: (message: string, onConfirm: () => void, options?: NotificationOptions) => string;
    removeNotification: (id: string) => void;
    notifications: Notification[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export { NotificationContext };

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const removeNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        const timer = timers.current.get(id);
        if (timer) { clearTimeout(timer); timers.current.delete(id); }
    }, []);

    const addNotification = useCallback((message: string, type: NotificationType, options: NotificationOptions = {}) => {
        const id = Math.random().toString(36).substring(2, 9);
        setNotifications((prev) => [...prev, { id, message, type, title: options.title, actions: options.actions }]);
        const duration = options.duration ?? (options.actions?.length ? 0 : 5000);
        if (duration > 0) {
            const timer = setTimeout(() => {
                setNotifications((prev) => prev.filter((n) => n.id !== id));
                timers.current.delete(id);
            }, duration);
            timers.current.set(id, timer);
        }
        return id;
    }, []);

    const notify = useCallback((message: string, type: NotificationType = 'info', options?: NotificationOptions) =>
        addNotification(message, type, options), [addNotification]);

    const confirm = useCallback((message: string, onConfirm: () => void, options?: NotificationOptions) =>
        addNotification(message, 'action', {
            title: options?.title,
            actions: [
                { label: options?.actions?.[0]?.label ?? 'Confirm', variant: options?.actions?.[0]?.variant ?? 'danger', onClick: () => { onConfirm(); } },
                { label: options?.actions?.[1]?.label ?? 'Cancel', variant: 'secondary', onClick: () => { } },
            ],
        }), [addNotification]);

    return (
        <NotificationContext.Provider value={{ addNotification, notify, confirm, removeNotification, notifications }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = (): NotificationContextType => {
    const context = React.useContext(NotificationContext);
    if (!context) throw new Error('useNotification must be used within a NotificationProvider');
    return context;
};
