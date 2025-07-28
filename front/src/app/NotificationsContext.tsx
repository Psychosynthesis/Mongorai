import { createContext, useContext, ReactNode, useCallback, useState, useEffect } from 'react';

export type NotificationType = 'error' | 'warning' | 'success' | 'info';

type Notification = {
  id: string;
  type: NotificationType;
  message: string;
  show: boolean;
};

type NotificationsContextType = {
  notifications: Notification[];
  notify: (message: string, type?: NotificationType, timeout?: number) => void;
  dismiss: (id: string) => void;
};

const NotificationsContext = createContext<NotificationsContextType | null>(null);

/*
Пример вывода успешного сообщения без скрытия:
notify('Данные сохранены', 'success', 0);
*/

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    );
  }, []);

  const notify = useCallback((
    message: string,
    type: NotificationType = 'error',
    timeout: number = 15000
  ) => {
    const id = Math.random().toString(36).substr(2, 9);

    setNotifications(prev => [
      ...prev,
      { id, type, message, show: true }
    ]);

    if (timeout > 0) {
      setTimeout(() => dismiss(id), timeout);
    }
  }, [dismiss]);

  const value = {
    notifications,
    notify,
    dismiss
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <NotificationsList />
    </NotificationsContext.Provider>
  );
}

// Компонент для отображения уведомлений
const NotificationsList = () => {
  const { notifications, dismiss } = useContext(NotificationsContext)!;

  return (
    <div className="notifications-manager">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`notification ${notification.type} ${notification.show ? 'show' : ''}`}
        >
          <div className="content">{notification.message}</div>
          <button
            className="popup-close"
            onClick={() => dismiss(notification.id)}
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
};

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
