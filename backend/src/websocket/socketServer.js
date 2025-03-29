const { Server } = require('socket.io');
const logger = require('../utils/logger');
const { supabase } = require('../config/supabase');

let io;

/**
 * Initialize the WebSocket server
 * @param {*} server - HTTP server instance
 */
const initSocketServer = (server) => {
  // Create Socket.IO server with CORS configuration
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Connection event
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);
    
    // Handle authentication
    socket.on('authenticate', async (token) => {
      try {
        // Verify the token with Supabase
        const { data, error } = await supabase.auth.getUser(token);
        
        if (error || !data.user) {
          logger.warn(`Authentication failed for socket ${socket.id}: ${error?.message}`);
          socket.emit('auth_error', { message: 'Authentication failed' });
          return;
        }
        
        // Store user information in socket
        socket.user = data.user;
        
        // Join user-specific room
        socket.join(`user:${data.user.id}`);
        
        logger.info(`Socket ${socket.id} authenticated as user ${data.user.id}`);
        socket.emit('authenticated', { status: 'success' });
        
        // Send initial unread notifications count
        emitUnreadNotificationsCount(data.user.id);
      } catch (error) {
        logger.error(`Authentication error: ${error.message}`);
        socket.emit('auth_error', { message: 'Internal authentication error' });
      }
    });
    
    // Handle subscription to specific channels
    socket.on('subscribe', (channel) => {
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }
      
      logger.info(`User ${socket.user.id} subscribed to ${channel}`);
      socket.join(channel);
    });
    
    // Handle unsubscription
    socket.on('unsubscribe', (channel) => {
      socket.leave(channel);
    });
    
    // Disconnection event
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });
  
  logger.info('WebSocket server initialized');
  
  // Start Supabase subscriptions
  initSupabaseSubscriptions();
  
  return io;
};

/**
 * Initialize Supabase real-time subscriptions
 */
const initSupabaseSubscriptions = () => {
  // Subscribe to notifications table
  const notificationsChannel = supabase
    .channel('db-notifications')
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications' 
      }, 
      (payload) => {
        handleNewNotification(payload);
      }
    )
    .subscribe();
  
  // Subscribe to airplay logs
  const airplayLogsChannel = supabase
    .channel('db-airplay-logs')
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'airplay_logs' 
      }, 
      (payload) => {
        handleNewAirplayLog(payload);
      }
    )
    .subscribe();
  
  // Subscribe to channel status updates
  const channelStatusChannel = supabase
    .channel('db-channel-status')
    .on('postgres_changes', 
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'channels' 
      }, 
      (payload) => {
        handleChannelStatusUpdate(payload);
      }
    )
    .subscribe();
  
  // Subscribe to report status updates
  const reportStatusChannel = supabase
    .channel('db-report-status')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'reports' 
      }, 
      (payload) => {
        handleReportStatusUpdate(payload);
      }
    )
    .subscribe();
  
  logger.info('Supabase real-time subscriptions initialized');
};

/**
 * Handle new notification from Supabase
 * @param {Object} payload - Notification payload
 */
const handleNewNotification = (payload) => {
  if (!payload.new || !payload.new.user_id) return;
  
  const userId = payload.new.user_id;
  const notification = payload.new;
  
  // Emit to user-specific room
  io.to(`user:${userId}`).emit('notification', notification);
  
  // Update unread count
  emitUnreadNotificationsCount(userId);
};

/**
 * Handle new airplay log from Supabase
 * @param {Object} payload - Airplay log payload
 */
const handleNewAirplayLog = (payload) => {
  if (!payload.new) return;
  
  const airplayLog = payload.new;
  
  // Emit to all clients subscribed to airplay updates
  io.to('airplay_updates').emit('new_airplay', airplayLog);
  
  // If channel ID exists, emit to channel-specific room
  if (airplayLog.channel_id) {
    io.to(`channel:${airplayLog.channel_id}`).emit('new_airplay', airplayLog);
  }
};

/**
 * Handle channel status update from Supabase
 * @param {Object} payload - Channel status payload
 */
const handleChannelStatusUpdate = (payload) => {
  if (!payload.new) return;
  
  const channelUpdate = payload.new;
  
  // Emit to all clients subscribed to channel updates
  io.to('channel_updates').emit('channel_status', channelUpdate);
};

/**
 * Handle report status update from Supabase
 * @param {Object} payload - Report status payload
 */
const handleReportStatusUpdate = (payload) => {
  if (!payload.new || !payload.new.generated_by) return;
  
  const userId = payload.new.generated_by;
  const reportUpdate = payload.new;
  
  // Emit to user-specific room
  io.to(`user:${userId}`).emit('report_update', reportUpdate);
  
  // Also emit to the general reports channel
  io.to('report_updates').emit('report_update', reportUpdate);
};

/**
 * Emit current unread notifications count to a user
 * @param {string} userId - User ID
 */
const emitUnreadNotificationsCount = async (userId) => {
  try {
    // Get unread notifications count from Supabase
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('read', false);
    
    if (error) {
      logger.error(`Error getting unread notifications count: ${error.message}`);
      return;
    }
    
    // Emit count to user
    io.to(`user:${userId}`).emit('unread_count', { count });
  } catch (error) {
    logger.error(`Error emitting unread count: ${error.message}`);
  }
};

/**
 * Get the Socket.IO instance
 * @returns {Object} Socket.IO instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

module.exports = {
  initSocketServer,
  getIO
}; 