const express = require('express');
const router = express.Router();

// Super simplified routes for testing - no dependencies

/**
 * @route GET /api/notifications
 * @desc Get current user's notifications
 * @access Private
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    results: 0,
    data: { notifications: [] }
  });
});

/**
 * @route POST /api/notifications
 * @desc Create a notification for a user (admin only)
 * @access Private - Admin
 */
router.post('/', (req, res) => {
  res.status(201).json({
    status: 'success',
    data: { notification: {} }
  });
});

/**
 * @route PATCH /api/notifications/:id/read
 * @desc Mark a notification as read
 * @access Private
 */
router.patch('/:id/read', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: { notification: {} }
  });
});

/**
 * @route POST /api/notifications/mark-all-read
 * @desc Mark all notifications as read
 * @access Private
 */
router.post('/mark-all-read', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'All notifications marked as read'
  });
});

/**
 * @route DELETE /api/notifications/:id
 * @desc Delete a notification
 * @access Private
 */
router.delete('/:id', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Notification deleted'
  });
});

/**
 * @route DELETE /api/notifications
 * @desc Delete all notifications for the user
 * @access Private
 */
router.delete('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'All notifications deleted'
  });
});

module.exports = router; 