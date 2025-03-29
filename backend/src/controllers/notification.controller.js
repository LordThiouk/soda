const { catchAsync } = require('../middlewares/errorHandler');
const notificationService = require('../services/notification.service');

const notificationController = {
  /**
   * Create a new notification
   * @route POST /api/notifications
   * @access Private - Admin only
   */
  createNotification: catchAsync(async (req, res) => {
    const { userId, title, message, type, data } = req.body;
    
    const notification = await notificationService.createNotification({
      userId,
      title, 
      message,
      type: type || 'info',
      data
    });
    
    res.status(201).json({
      status: 'success',
      data: { notification }
    });
  }),

  /**
   * Get all notifications for the current user
   * @route GET /api/notifications
   * @access Private
   */
  getMyNotifications: catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { read, limit, offset } = req.query;
    
    const notifications = await notificationService.getNotificationsByUserId(userId, {
      read: read === 'true' ? true : read === 'false' ? false : undefined,
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0
    });
    
    res.status(200).json({
      status: 'success',
      results: notifications.length,
      data: { notifications }
    });
  }),

  /**
   * Mark a notification as read
   * @route PATCH /api/notifications/:id/read
   * @access Private
   */
  markAsRead: catchAsync(async (req, res) => {
    const notificationId = req.params.id;
    const userId = req.user.id;
    
    const notification = await notificationService.markNotificationAsRead(notificationId, userId);
    
    res.status(200).json({
      status: 'success',
      data: { notification }
    });
  }),

  /**
   * Mark all notifications as read for the current user
   * @route POST /api/notifications/mark-all-read
   * @access Private
   */
  markAllAsRead: catchAsync(async (req, res) => {
    const userId = req.user.id;
    
    await notificationService.markAllNotificationsAsRead(userId);
    
    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read'
    });
  }),

  /**
   * Delete a notification
   * @route DELETE /api/notifications/:id
   * @access Private
   */
  deleteNotification: catchAsync(async (req, res) => {
    const notificationId = req.params.id;
    const userId = req.user.id;
    
    await notificationService.deleteNotification(notificationId, userId);
    
    res.status(200).json({
      status: 'success',
      message: 'Notification deleted'
    });
  }),

  /**
   * Delete all notifications for current user
   * @route DELETE /api/notifications/all
   * @access Private
   */
  deleteAllNotifications: catchAsync(async (req, res) => {
    const userId = req.user.id;
    
    await notificationService.deleteAllNotifications(userId);
    
    res.status(204).send();
  })
};

module.exports = notificationController; 