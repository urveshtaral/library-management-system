// src/utils/socketConnection.js - ULTIMATE FIX
export class SocketConnection {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 0; // Don't retry
    this.API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    this.isInitializing = false;
  }

  // Initialize socket only if absolutely necessary
  async initialize(user, token) {
    // Don't initialize if already trying or no user/token
    if (this.isInitializing || !user || !token) {
      return null;
    }

    this.isInitializing = true;
    
    try {
      console.log('🔄 Checking socket compatibility...');
      
      // FIRST: Test if server is even available and compatible
      const isServerAvailable = await this.testServerCompatibility();
      
      if (!isServerAvailable) {
        console.log('🚫 Socket server not compatible, disabling socket features');
        this.isInitializing = false;
        return null;
      }

      // Dynamically import socket.io-client to avoid bundle issues
      const { io } = await import('socket.io-client');
      
      console.log('🔌 Creating socket connection with v2/v3 compatibility...');
      
      // Use v2/v3 compatible configuration
      this.socket = io(this.API_URL, {
        // Force v2/v3 compatibility
        transports: ['polling'], // NO websocket
        upgrade: false, // Disable websocket upgrade
        forceNew: true,
        reconnection: false, // Disable auto-reconnection
        timeout: 3000,
        autoConnect: false, // Manual connection
        withCredentials: false,
        // v2/v3 specific flags
        'force new connection': true,
        multiplex: false,
        // Query parameters
        query: {
          EIO: 3, // Force Engine.IO v3
          transport: 'polling',
          t: Date.now(),
          userId: user._id || user.id
        }
      });

      // Setup minimal event handlers
      this.setupEventHandlers();
      
      // Try to connect
      this.socket.connect();
      
      return this.socket;
      
    } catch (error) {
      console.warn('⚠️ Socket initialization failed:', error.message);
      this.socket = null;
      return null;
    } finally {
      this.isInitializing = false;
    }
  }

  // Test server compatibility before trying to connect
  async testServerCompatibility() {
    try {
      // Test with a simple fetch to see if server responds
      const response = await fetch(`${this.API_URL.replace('/api', '')}/socket.io/?EIO=3`, {
        method: 'GET',
        headers: {
          'Accept': '*/*'
        },
        mode: 'cors',
        credentials: 'omit'
      });
      
      // If we get any response (even 400), server is there
      console.log('Server response status:', response.status);
      
      // If server responds with 200/400, it's there but might be incompatible
      // We'll still try to connect with v3 settings
      return response.status !== 404;
      
    } catch (error) {
      console.log('⚠️ Server compatibility test failed:', error.message);
      return false;
    }
  }

  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected (polling only)');
      this.isConnected = true;
      this.retryCount = 0;
    });

    this.socket.on('connect_error', (error) => {
      console.warn('❌ Socket connection error:', error.message);
      this.isConnected = false;
      this.retryCount++;
      
      // Disconnect and don't retry
      this.disconnect();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      this.isConnected = false;
    });
  }

  // Safe emit method
  emit(event, data) {
    if (this.socket && this.isConnected) {
      try {
        this.socket.emit(event, data);
        return true;
      } catch (error) {
        console.warn('⚠️ Failed to emit event:', error);
        return false;
      }
    }
    return false;
  }

  // Clean disconnect
  disconnect() {
    if (this.socket) {
      // Remove all listeners first
      this.socket.removeAllListeners();
      
      // Disconnect if connected
      if (this.socket.connected) {
        this.socket.disconnect();
      }
      
      this.socket = null;
      this.isConnected = false;
      console.log('🧹 Socket connection cleaned up');
    }
  }

  // Get connection status
  getStatus() {
    return {
      isConnected: this.isConnected,
      socket: this.socket
    };
  }
}

// Singleton instance
const socketConnection = new SocketConnection();
export default socketConnection;