/**
 * Event system for the application
 * Used to emit and handle events throughout the application
 */

// A simple event emitter for handling events
class EventEmitter {
  constructor() {
    this.events = {};
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {function} listener - Event listener function
   * @returns {function} - Function to unsubscribe from the event
   */
  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);

    // Return unsubscribe function
    return () => {
      this.events[event] = this.events[event].filter(l => l !== listener);
    };
  }

  /**
   * Emit an event with payload
   * @param {string} event - Event name
   * @param {*} payload - Event payload
   */
  emit(event, payload) {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener(payload));
    }
  }
}

// Create a singleton instance
const eventEmitter = new EventEmitter();

// Event types
const EVENT_TYPES = {
  // Detection events
  SONG_DETECTED: 'song_detected',
  DETECTION_ERROR: 'detection_error',
  DETECTION_STARTED: 'detection_started',
  DETECTION_STOPPED: 'detection_stopped',
  
  // Report events
  REPORT_GENERATED: 'report_generated',
  REPORT_FAILED: 'report_failed',
  
  // System events
  SYSTEM_OVERLOAD: 'system_overload',
  SYSTEM_RECOVERED: 'system_recovered',
  
  // Channel events
  CHANNEL_STATUS_CHANGED: 'channel_status_changed',
  
  // User events
  USER_LOGIN: 'user_login',
  USER_REGISTERED: 'user_registered',
};

module.exports = {
  eventEmitter,
  EVENT_TYPES
}; 