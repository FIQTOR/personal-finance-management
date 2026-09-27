import React, { createContext } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'action';

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

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = (): NotificationContextType => {
    const context = React.useContext(NotificationContext);
    if (!context) throw new Error('useNotification must be used within a NotificationProvider');
    return context;
};
