// Alternative app.js for Firebase Free Tier
// This version uses Firebase client SDKs directly instead of Cloud Functions

class PushNotificationManager {
    constructor() {
        this.messaging = null;
        this.currentToken = null;
        this.isRegistered = false;
        this.logContainer = document.getElementById('activityLog');
        
        this.init();
    }

    async init() {
        this.log('Application initializing...', 'info');
        
        try {
            // Initialize Firebase (already done by config.js)
            this.messaging = firebase.messaging();
            this.log('Firebase initialized successfully', 'success');
            
            // Check permission status
            const permission = Notification.permission;
            this.log(`Current notification permission: ${permission}`, 'info');
            
            if (permission === 'granted') {
                this.updateConnectionStatus(true);
                document.getElementById('registerDeviceBtn').disabled = false;
                await this.checkExistingToken();
            }
            
            await this.loadStats();
            this.setupEventListeners();
            
        } catch (error) {
            this.log(`Initialization failed: ${error.message}`, 'error');
        }
    }

    setupEventListeners() {
        document.getElementById('requestPermissionBtn').addEventListener('click', () => this.requestPermission());
        document.getElementById('registerDeviceBtn').addEventListener('click', () => this.registerDevice());
        document.getElementById('notificationForm').addEventListener('submit', (e) => this.sendNotification(e));
        document.getElementById('testNotificationBtn').addEventListener('click', () => this.sendTestNotification());
        document.getElementById('refreshStatsBtn').addEventListener('click', () => this.loadStats());
        document.getElementById('clearLogsBtn').addEventListener('click', () => this.clearLogs());
    }

    async checkExistingToken() {
        try {
            const token = await this.messaging.getToken({ 
                vapidKey: window.CONFIG.VAPID_KEY 
            });
            
            if (token) {
                this.currentToken = token;
                this.displayToken(token);
                this.log(`Existing token found: ${token.substring(0, 20)}...`, 'success');
                this.updateConnectionStatus(true);
                this.isRegistered = true;
                
                // Store token in localStorage for demo purposes
                localStorage.setItem('fcm_token', token);
                localStorage.setItem('device_registered', 'true');
            }
        } catch (error) {
            this.log(`Token retrieval failed: ${error.message}`, 'error');
        }
    }

    async requestPermission() {
        if (!('Notification' in window)) {
            this.log('This browser does not support notifications', 'error');
            return;
        }

        try {
            this.log('Requesting notification permission...', 'info');
            
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                this.log('Notification permission granted', 'success');
                this.updateConnectionStatus(true);
                document.getElementById('registerDeviceBtn').disabled = false;
                
                // Register service worker
                if ('serviceWorker' in navigator) {
                    const registration = await navigator.serviceWorker.register('/sw.js');
                    this.log('Service Worker registered successfully', 'success');
                }
            } else {
                this.log('Notification permission denied', 'error');
                this.updateConnectionStatus(false);
            }
        } catch (error) {
            this.log(`Error requesting permission: ${error.message}`, 'error');
            this.updateConnectionStatus(false);
        }
    }

    async registerDevice() {
        try {
            this.log('Registering device with FCM...', 'info');
            
            const token = await this.messaging.getToken({ 
                vapidKey: window.CONFIG.VAPID_KEY 
            });
            
            if (token) {
                this.currentToken = token;
                this.displayToken(token);
                this.log(`FCM Token obtained: ${token.substring(0, 20)}...`, 'info');
                
                // For demo purposes, store in localStorage
                // In a real app, you'd send this to your backend
                const deviceData = {
                    token: token,
                    userId: this.generateUserId(),
                    platform: 'web',
                    registeredAt: new Date().toISOString()
                };
                
                localStorage.setItem('device_data', JSON.stringify(deviceData));
                localStorage.setItem('fcm_token', token);
                localStorage.setItem('device_registered', 'true');
                
                this.isRegistered = true;
                this.log('Device registered successfully (stored locally)', 'success');
                this.updateConnectionStatus(true);
                await this.loadStats();
            }
        } catch (error) {
            this.log(`Device registration failed: ${error.message}`, 'error');
        }
    }

    async sendNotification(event) {
        event.preventDefault();
        
        const title = document.getElementById('notificationTitle').value;
        const body = document.getElementById('notificationBody').value;
        const icon = document.getElementById('notificationIcon').value;
        const clickAction = document.getElementById('clickAction').value;
        
        if (!title || !body) {
            this.log('Title and body are required', 'error');
            return;
        }
        
        this.log('Sending notification to current device...', 'info');
        
        try {
            // For demo purposes, show a local notification
            if (this.currentToken && Notification.permission === 'granted') {
                const notification = new Notification(title, {
                    body: body,
                    icon: icon || '/icon-192x192.png',
                    badge: '/badge-72x72.png',
                    tag: 'demo-notification',
                    requireInteraction: true
                });
                
                if (clickAction) {
                    notification.onclick = () => {
                        window.open(clickAction, '_blank');
                        notification.close();
                    };
                }
                
                this.log('Local notification sent successfully', 'success');
                
                // Update stats
                const sentCount = parseInt(localStorage.getItem('notifications_sent') || '0') + 1;
                localStorage.setItem('notifications_sent', sentCount.toString());
                await this.loadStats();
                
                // Clear form
                document.getElementById('notificationForm').reset();
            } else {
                this.log('Device not registered or permission not granted', 'error');
            }
        } catch (error) {
            this.log(`Failed to send notification: ${error.message}`, 'error');
        }
    }

    async sendTestNotification() {
        this.log('Sending test notification...', 'info');
        
        try {
            if (this.currentToken && Notification.permission === 'granted') {
                const notification = new Notification('🎉 Test Notification', {
                    body: 'This is a test notification from your Firebase app!',
                    icon: '/icon-192x192.png',
                    badge: '/badge-72x72.png',
                    tag: 'test-notification',
                    requireInteraction: true
                });
                
                this.log('Test notification sent successfully', 'success');
                
                // Update stats
                const sentCount = parseInt(localStorage.getItem('notifications_sent') || '0') + 1;
                localStorage.setItem('notifications_sent', sentCount.toString());
                await this.loadStats();
            } else {
                this.log('Device not registered or permission not granted', 'error');
            }
        } catch (error) {
            this.log(`Test notification failed: ${error.message}`, 'error');
        }
    }

    async loadStats() {
        try {
            const deviceRegistered = localStorage.getItem('device_registered') === 'true';
            const notificationsSent = parseInt(localStorage.getItem('notifications_sent') || '0');
            
            document.getElementById('totalDevices').textContent = deviceRegistered ? '1' : '0';
            document.getElementById('totalNotifications').textContent = notificationsSent.toString();
            document.getElementById('successRate').textContent = notificationsSent > 0 ? '100%' : '0%';
            
            this.log('Statistics updated', 'info');
        } catch (error) {
            this.log(`Failed to load statistics: ${error.message}`, 'error');
        }
    }

    displayToken(token) {
        const tokenDisplay = document.getElementById('tokenDisplay');
        const tokenTextarea = document.getElementById('deviceToken');
        
        tokenTextarea.value = token;
        tokenDisplay.classList.remove('hidden');
    }

    updateConnectionStatus(connected) {
        const statusIndicator = document.getElementById('connectionStatus');
        const statusText = document.getElementById('connectionText');
        
        if (connected) {
            statusIndicator.classList.add('connected');
            statusText.textContent = 'Connected';
        } else {
            statusIndicator.classList.remove('connected');
            statusText.textContent = 'Not Connected';
        }
    }

    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    log(message, level = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        logEntry.innerHTML = `
            <span class="log-time">[${timestamp}]</span>
            <span class="log-level ${level}">${level.toUpperCase()}</span>
            <span>${message}</span>
        `;
        
        this.logContainer.insertBefore(logEntry, this.logContainer.firstChild);
        
        // Keep only the last 50 entries
        while (this.logContainer.children.length > 50) {
            this.logContainer.removeChild(this.logContainer.lastChild);
        }
        
        console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    }

    clearLogs() {
        this.logContainer.innerHTML = `
            <div class="log-entry">
                <span class="log-time">--:--:--</span>
                <span class="log-level info">INFO</span>
                <span>Logs cleared</span>
            </div>
        `;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PushNotificationManager();
});
