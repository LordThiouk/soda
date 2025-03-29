"use client";

import { useState, useEffect } from "react";
import useAuth from "@/hooks/useAuth";
import socketService, { Notification } from "@/lib/websocket";
import apiService from "@/services/apiService";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Fetch unread notifications initially and set up WebSocket
  useEffect(() => {
    if (!user?.id) return;
    
    // Connect to WebSocket if not already
    if (!socketService.isConnected()) {
      socketService.connect();
    }
    
    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await apiService.get<{ notifications: Notification[] }>('/notifications?read=false');
        setNotifications(response.notifications || []);
        setUnreadCount(response.notifications?.length || 0);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
        console.error("Failed to fetch notifications:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
    
    // Subscribe to notifications for this user
    const unsubscribeNotification = socketService.on('notification', (notification: Notification) => {
      // Add to notifications if it's for this user
      if (notification.user_id === user.id) {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    });
    
    // Subscribe to unread count updates
    const unsubscribeUnreadCount = socketService.on('unread_count', (data: { count: number }) => {
      setUnreadCount(data.count);
    });
    
    // Cleanup
    return () => {
      unsubscribeNotification();
      unsubscribeUnreadCount();
    };
  }, [user?.id]);
  
  // Mark a notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      await apiService.post(`/notifications/${notificationId}/read`);
      
      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (err) {
      console.error("Error marking notification as read:", err);
      return false;
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await apiService.post('/notifications/mark-all-read');
      
      // Update local state
      setNotifications([]);
      setUnreadCount(0);
      
      return true;
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      return false;
    }
  };
  
  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
  };
} 