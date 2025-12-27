// Notification types and utilities
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  dismissed: boolean;
}

export class NotificationService {
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  addNotification(type: NotificationType, title: string, message: string, duration = 5000) {
    const notification: Notification = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
      timestamp: new Date(),
      dismissed: false,
    };

    this.notifications.push(notification);
    this.notify();

    if (duration > 0) {
      setTimeout(() => {
        this.dismissNotification(notification.id);
      }, duration);
    }

    return notification.id;
  }

  dismissNotification(id: string) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.dismissed = true;
      this.notify();
      setTimeout(() => {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.notify();
      }, 300);
    }
  }

  getNotifications() {
    return this.notifications;
  }
}

export const notificationService = new NotificationService();
