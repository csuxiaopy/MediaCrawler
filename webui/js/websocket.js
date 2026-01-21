/**
 * MediaCrawler WebUI - WebSocket Module
 * Handles real-time log streaming via WebSocket
 */

class LogWebSocket {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
        this.onLogCallback = null;
        this.onStatusCallback = null;
    }

    /**
     * Connect to WebSocket server
     */
    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/ws/logs`;

        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('[WebSocket] Connected');
                this.reconnectAttempts = 0;
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'log' && this.onLogCallback) {
                        this.onLogCallback(data.data);
                    } else if (data.type === 'status' && this.onStatusCallback) {
                        this.onStatusCallback(data.data);
                    }
                } catch (e) {
                    console.error('[WebSocket] Failed to parse message:', e);
                }
            };

            this.ws.onclose = (event) => {
                console.log('[WebSocket] Disconnected:', event.code, event.reason);
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('[WebSocket] Error:', error);
            };
        } catch (e) {
            console.error('[WebSocket] Failed to connect:', e);
            this.attemptReconnect();
        }
    }

    /**
     * Attempt to reconnect after disconnect
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('[WebSocket] Max reconnect attempts reached');
            return;
        }

        this.reconnectAttempts++;
        console.log(`[WebSocket] Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts})`);

        setTimeout(() => {
            this.connect();
        }, this.reconnectDelay);
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    /**
     * Set callback for log messages
     */
    onLog(callback) {
        this.onLogCallback = callback;
    }

    /**
     * Set callback for status updates
     */
    onStatus(callback) {
        this.onStatusCallback = callback;
    }

    /**
     * Check if connected
     */
    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }
}

// Create singleton instance
window.logWebSocket = new LogWebSocket();
