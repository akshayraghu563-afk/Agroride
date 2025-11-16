'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSocket } from './SocketContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  relatedId?: string;
  relatedType?: 'booking' | 'payment' | 'vehicle' | 'user';
  actionUrl?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Listen for real-time notifications
    socket.on('notification', (data) => {
      addNotification({
        ...data,
        id: data.id || Date.now().toString(),
      });
    });

    // Listen for booking updates
    socket.on('booking:status:updated', (data) => {
      addNotification({
        id: data.bookingId,
        title: 'Booking Status Updated',
        message: `Your booking status has been changed to ${data.status}`,
        type: 'info',
        relatedId: data.bookingId,
        relatedType: 'booking',
        actionUrl: `/bookings/${data.bookingId}`,
      });
    });

    // Listen for tracking updates
    socket.on('tracking:updated', (data) => {
      addNotification({
        id: `tracking-${data.bookingId}-${Date.now()}`,
        title: 'Vehicle Location Updated',
        message: 'Your booked vehicle is on the way',
        type: 'info',
        relatedId: data.bookingId,
        relatedType: 'booking',
        actionUrl: `/bookings/${data.bookingId}/track`,
      });
    });

    return () => {
      socket.off('notification');
      socket.off('booking:status:updated');
      socket.off('tracking:updated');
    };
  }, [socket]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: notification.id || Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep only last 50 notifications
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );

    // Optionally sync with backend
    if (socket) {
      socket.emit('notification:read', id);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}