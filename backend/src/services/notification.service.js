const { supabase } = require('../lib/supabase');
const { AppError } = require('../middlewares/errorHandler');

const notificationService = {
  /**
   * Create a new notification
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} - Created notification
   */
  async createNotification(notificationData) {
    const { userId, title, message, type = 'info', data } = notificationData;
    
    // Validate notification type
    const validTypes = ['info', 'success', 'warning', 'error'];
    if (!validTypes.includes(type)) {
      throw new AppError(`Invalid notification type. Must be one of: ${validTypes.join(', ')}`, 400);
    }
    
    // Create notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        data,
        read: false
      })
      .select('*')
      .single();
    
    if (error) {
      throw new AppError(`Error creating notification: ${error.message}`, 500);
    }
    
    return notification;
  },
  
  /**
   * Get notifications for a specific user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Notifications
   */
  async getNotificationsByUserId(userId, options = {}) {
    const { read, limit = 20, offset = 0 } = options;
    
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId);
    
    // Filter by read status if provided
    if (read !== undefined) {
      query = query.eq('read', read);
    }
    
    // Pagination
    const { data: notifications, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw new AppError(`Error fetching notifications: ${error.message}`, 500);
    }
    
    return notifications;
  },
  
  /**
   * Mark a notification as read
   * @param {number} notificationId - Notification ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Updated notification
   */
  async markNotificationAsRead(notificationId, userId) {
    // Check if notification exists and belongs to user
    const { data: existingNotification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('user_id', userId)
      .single();
    
    if (fetchError || !existingNotification) {
      throw new AppError('Notification not found or access denied', 404);
    }
    
    // Update notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select('*')
      .single();
    
    if (error) {
      throw new AppError(`Error updating notification: ${error.message}`, 500);
    }
    
    return notification;
  },
  
  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async markAllNotificationsAsRead(userId) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    
    if (error) {
      throw new AppError(`Error updating notifications: ${error.message}`, 500);
    }
  },
  
  /**
   * Delete a notification
   * @param {number} notificationId - Notification ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteNotification(notificationId, userId) {
    // Check if notification exists and belongs to user
    const { data: existingNotification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('user_id', userId)
      .single();
    
    if (fetchError || !existingNotification) {
      throw new AppError('Notification not found or access denied', 404);
    }
    
    // Delete notification
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    
    if (error) {
      throw new AppError(`Error deleting notification: ${error.message}`, 500);
    }
  },
  
  /**
   * Delete all notifications for a user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteAllNotifications(userId) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      throw new AppError(`Error deleting notifications: ${error.message}`, 500);
    }
  }
};

module.exports = notificationService; 