const { eventEmitter, EVENT_TYPES } = require('../utils/events');
const notificationService = require('./notification.service');
const logger = require('../utils/logger');

/**
 * Service for handling application events and generating notifications
 */
class EventService {
  constructor() {
    this.registerEventHandlers();
  }

  /**
   * Register all event handlers
   */
  registerEventHandlers() {
    // Detection events
    eventEmitter.on(EVENT_TYPES.SONG_DETECTED, this.handleSongDetected.bind(this));
    eventEmitter.on(EVENT_TYPES.DETECTION_ERROR, this.handleDetectionError.bind(this));
    
    // Report events
    eventEmitter.on(EVENT_TYPES.REPORT_GENERATED, this.handleReportGenerated.bind(this));
    eventEmitter.on(EVENT_TYPES.REPORT_FAILED, this.handleReportFailed.bind(this));
    
    // System events
    eventEmitter.on(EVENT_TYPES.SYSTEM_OVERLOAD, this.handleSystemOverload.bind(this));
    
    // Channel events
    eventEmitter.on(EVENT_TYPES.CHANNEL_STATUS_CHANGED, this.handleChannelStatusChanged.bind(this));
    
    logger.info('Event handlers registered');
  }

  /**
   * Handle song detected event
   * @param {Object} payload - Event payload
   */
  async handleSongDetected(payload) {
    const { channelName, songTitle, songArtist, userId } = payload;
    
    try {
      if (userId) {
        await notificationService.createNotification({
          userId,
          title: 'Nouvelle détection',
          message: `"${songTitle}" par ${songArtist} détecté sur ${channelName}`,
          type: 'success',
          data: payload
        });
      }
    } catch (error) {
      logger.error('Error creating song detection notification:', error);
    }
  }

  /**
   * Handle detection error event
   * @param {Object} payload - Event payload
   */
  async handleDetectionError(payload) {
    const { channelName, error, userId } = payload;
    
    try {
      if (userId) {
        await notificationService.createNotification({
          userId,
          title: 'Erreur de détection',
          message: `Erreur lors de la détection sur ${channelName}: ${error}`,
          type: 'error',
          data: payload
        });
      }
    } catch (error) {
      logger.error('Error creating detection error notification:', error);
    }
  }

  /**
   * Handle report generated event
   * @param {Object} payload - Event payload
   */
  async handleReportGenerated(payload) {
    const { reportName, userId } = payload;
    
    try {
      await notificationService.createNotification({
        userId,
        title: 'Rapport généré',
        message: `Le rapport "${reportName}" a été généré avec succès`,
        type: 'success',
        data: payload
      });
    } catch (error) {
      logger.error('Error creating report notification:', error);
    }
  }

  /**
   * Handle report failed event
   * @param {Object} payload - Event payload
   */
  async handleReportFailed(payload) {
    const { reportName, error, userId } = payload;
    
    try {
      await notificationService.createNotification({
        userId,
        title: 'Échec de génération de rapport',
        message: `La génération du rapport "${reportName}" a échoué: ${error}`,
        type: 'error',
        data: payload
      });
    } catch (error) {
      logger.error('Error creating report failure notification:', error);
    }
  }

  /**
   * Handle system overload event
   * @param {Object} payload - Event payload
   */
  async handleSystemOverload(payload) {
    const { cpuUsage, memoryUsage } = payload;
    
    try {
      // Notify administrators (users with admin role)
      // This is a simplified example - in a real app, you'd query for admin users
      const adminId = payload.adminId;
      
      if (adminId) {
        await notificationService.createNotification({
          userId: adminId,
          title: 'Surcharge système',
          message: `Surcharge système détectée - CPU: ${(cpuUsage * 100).toFixed(2)}%, Mémoire: ${(memoryUsage * 100).toFixed(2)}%`,
          type: 'warning',
          data: payload
        });
      }
    } catch (error) {
      logger.error('Error creating system overload notification:', error);
    }
  }

  /**
   * Handle channel status changed event
   * @param {Object} payload - Event payload
   */
  async handleChannelStatusChanged(payload) {
    const { channelName, status, prevStatus, userId } = payload;
    
    try {
      if (userId) {
        // Only notify on status degradation
        if (prevStatus === 'active' && status !== 'active') {
          await notificationService.createNotification({
            userId,
            title: 'Changement de statut de chaîne',
            message: `La chaîne ${channelName} est passée de "${prevStatus}" à "${status}"`,
            type: 'warning',
            data: payload
          });
        }
      }
    } catch (error) {
      logger.error('Error creating channel status notification:', error);
    }
  }
}

// Create singleton instance
const eventService = new EventService();

module.exports = eventService; 