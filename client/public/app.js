class PushNotificationApp {
    constructor() {
        this.messaging = null;
        this.currentToken = null;
        this.isRegistered = false;
        
        this.init();
    }

    async init() {
        this.log('Application initializing...', 'info');
        
        try {
            // Initialize Firebase
            firebase.initializeApp(window.CONFIG.firebaseConfig);
            this.messaging = firebase.messaging();
            
            // Set up VAPID key
            this.messaging.getToken({ vapidKey: window.CONFIG.VAPID_KEY });
            
            this.log('Firebase initialized successfully', 'success');
            this.setupEventListeners();
            this.setupMessageHandling();
            this.checkExistingPermission();
            await this.loadStats();
        } catch (error) {
            this.log(`Initialization failed: ${error.message}`, 'error');
        }
    }

    setupEventListeners() {
        // Permission and registration
        document.getElementById('requestPermissionBtn').addEventListener('click', 
            () => this.requestPermission());
        document.getElementById('registerDeviceBtn').addEventListener('click', 
            () => this.registerDevice());

        // Notification sending
        document.getElementById('notificationForm').addEventListener('submit', 
            (e) => this.sendNotification(e));
        document.getElementById('testNotificationBtn').addEventListener('click', 
            () => this.sendTestNotification());

        // Utility buttons
        document.getElementById('refreshStatsBtn').addEventListener('click', 
            () => this.loadStats());
        document.getElementById('clearLogsBtn').addEventListener('click', 
            () => this.clearLogs());
    }

    setupMessageHandling() {
        // Handle messages when app is in foreground
        this.messaging.onMessage((payload) => {
            this.log(`Received foreground message: ${payload.notification.title}`, 'info');
            
            // Show notification even when app is in foreground
            if ('serviceWorker' in navigator && 'Notification' in window) {
                navigator.serviceWorker.ready.then((registration) => {
                    registration.showNotification(payload.notification.title, {
                        body: payload.notification.body,
                        icon: payload.notification.icon || '/icon-192x192.png',
                        badge: '/badge-72x72.png',
                        tag: 'push-notification',
                        requireInteraction: true,
                        actions: [
                            {
                                action: 'view',
                                title: 'View',
                                icon: '/action-view.png'
                            },
                            {
                                action: 'dismiss',
                                title: 'Dismiss',
                                icon: '/action-dismiss.png'
                            }
                        ],
                        data: payload.data
                    });
                });
            }
        });
    }

    async checkExistingPermission() {
        if ('Notification' in window) {
            const permission = Notification.permission;
            this.log(`Current notification permission: ${permission}`, 'info');
            
            if (permission === 'granted') {
                this.updateConnectionStatus(true);
                document.getElementById('registerDeviceBtn').disabled = false;
                
                // Check if we already have a token
                try {
                    const token = await this.messaging.getToken({ 
                        vapidKey: window.CONFIG.VAPID_KEY 
                    });
                    if (token) {
                        this.currentToken = token;
                        this.displayToken(token);
                        this.log(`Existing token found: ${token.substring(0, 20)}...`, 'success');
                        
                        // Auto-register existing token with backend
                        this.log('Auto-registering existing token with backend...', 'info');
                        await this.registerTokenWithBackend(token);
                    } else {
                        this.log('No existing token found', 'info');
                    }
                } catch (error) {
                    this.log(`Error getting existing token: ${error.message}`, 'error');
                }
            }
        }
    }

    async registerTokenWithBackend(token) {
        try {
            const registrationData = {
                token: token,
                platform: 'web',
                userId: this.generateUserId(),
                userAgent: navigator.userAgent,
                registeredAt: new Date().toISOString()
            };
            
            const response = await fetch(`${window.CONFIG.API_BASE_URL}/devices/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registrationData)
            });

            if (response.ok) {
                const result = await response.json();
                this.isRegistered = true;
                this.log(`Token registered with backend! Device ID: ${result.deviceId || 'N/A'}`, 'success');
                await this.verifyDeviceRegistration();
                await this.loadStats();
                return result;
            } else {
                const errorText = await response.text();
                let errorMsg;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMsg = errorJson.message || errorJson.error || 'Unknown error';
                } catch {
                    errorMsg = errorText;
                }
                this.log(`Token registration failed: ${errorMsg}`, 'error');
                throw new Error(errorMsg);
            }
        } catch (error) {
            this.log(`Backend registration error: ${error.message}`, 'error');
            throw error;
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
                
                // Use the shared registration function
                await this.registerTokenWithBackend(token);
            } else {
                this.log('No registration token available. Please check browser permissions.', 'error');
            }
        } catch (error) {
            this.log(`Device registration failed: ${error.message}`, 'error');
        }
    }

    async verifyDeviceRegistration() {
        try {
            this.log('Verifying device registration...', 'info');
            const response = await fetch(`${window.CONFIG.API_BASE_URL}/devices/tokens`);
            
            if (response.ok) {
                const data = await response.json();
                const deviceCount = data.count || 0;
                this.log(`Verification: ${deviceCount} device(s) registered in backend`, 'info');
                
                if (deviceCount === 0) {
                    this.log('WARNING: No devices found in backend after registration!', 'error');
                } else {
                    // Check if our token is in the list
                    const devices = data.data || [];
                    const ourDevice = devices.find(device => device.token === this.currentToken);
                    if (ourDevice) {
                        this.log('✓ Current device found in backend registry', 'success');
                    } else {
                        this.log('⚠ Current device NOT found in backend registry', 'error');
                    }
                }
            } else {
                this.log('Could not verify device registration', 'error');
            }
        } catch (error) {
            this.log(`Verification failed: ${error.message}`, 'error');
        }
    }

    async sendNotification(event) {
        event.preventDefault();
        
        const title = document.getElementById('notificationTitle').value;
        const body = document.getElementById('notificationBody').value;
        const icon = document.getElementById('notificationIcon').value;
        const clickAction = document.getElementById('clickAction').value;

        if (!title || !body) {
            this.log('Title and message are required', 'error');
            return;
        }

        try {
            this.log('Sending notification to all devices...', 'info');
            
            const response = await fetch(`${window.CONFIG.API_BASE_URL}/notifications/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    body,
                    icon: icon || undefined,
                    clickAction: clickAction || undefined,
                    targetTokens: 'all',
                    data: {
                        timestamp: new Date().toISOString(),
                        source: 'web-client'
                    }
                })
            });

            if (response.ok) {
                const result = await response.json();
                this.log(`Notification sent successfully to ${result.data.successCount} devices`, 'success');
                
                // Clear form
                document.getElementById('notificationForm').reset();
                
                // Refresh stats
                this.loadStats();
            } else {
                const error = await response.json();
                this.log(`Failed to send notification: ${error.message}`, 'error');
            }
        } catch (error) {
            this.log(`Error sending notification: ${error.message}`, 'error');
        }
    }

    async sendTestNotification() {
        if (!this.currentToken) {
            this.log('No device token available. Please register device first.', 'error');
            return;
        }

        const testNotification = {
            title: '🧪 Test Notification',
            body: `Test message sent at ${new Date().toLocaleTimeString()}`,
            icon: '/icon-192x192.png',
            targetTokens: [this.currentToken],
            data: {
                test: true,
                timestamp: new Date().toISOString()
            }
        };

        try {
            this.log('Sending test notification...', 'info');
            
            const response = await fetch(`${window.CONFIG.API_BASE_URL}/notifications/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testNotification)
            });

            if (response.ok) {
                const result = await response.json();
                this.log('Test notification sent successfully', 'success');
                this.loadStats();
            } else {
                const error = await response.json();
                this.log(`Test notification failed: ${error.message}`, 'error');
            }
        } catch (error) {
            this.log(`Error sending test notification: ${error.message}`, 'error');
        }
    }

    async loadStats() {
        try {
            const [deviceStats, notificationStats] = await Promise.all([
                fetch(`${window.CONFIG.API_BASE_URL}/devices/stats`).then(r => r.json()),
                fetch(`${window.CONFIG.API_BASE_URL}/notifications/stats`).then(r => r.json())
            ]);

            if (deviceStats.success) {
                document.getElementById('totalDevices').textContent = 
                    deviceStats.data.totalDevices || 0;
            }

            if (notificationStats.success) {
                document.getElementById('totalNotifications').textContent = 
                    notificationStats.data.totalNotifications || 0;
                document.getElementById('successRate').textContent = 
                    notificationStats.data.successRate || '0%';
            }

            this.log('Statistics updated', 'info');
        } catch (error) {
            this.log(`Error loading statistics: ${error.message}`, 'error');
        }
    }

    updateConnectionStatus(connected) {
        const indicator = document.getElementById('connectionStatus');
        const text = document.getElementById('connectionText');
        
        if (connected) {
            indicator.classList.add('connected');
            text.textContent = 'Connected & Ready';
        } else {
            indicator.classList.remove('connected');
            text.textContent = 'Not Connected';
        }
    }

    displayToken(token) {
        document.getElementById('deviceToken').value = token;
        document.getElementById('tokenDisplay').classList.remove('hidden');
    }

    generateUserId() {
        // Generate a simple user ID for demo purposes
        let userId = localStorage.getItem('push-notification-user-id');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('push-notification-user-id', userId);
        }
        return userId;
    }

    log(message, level = 'info') {
        const logContainer = document.getElementById('activityLog');
        const timestamp = new Date().toLocaleTimeString();
        
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.innerHTML = `
            <span class="log-time">${timestamp}</span>
            <span class="log-level ${level}">${level.toUpperCase()}</span>
            <span>${message}</span>
        `;
        
        logContainer.insertBefore(logEntry, logContainer.firstChild);
        
        // Limit log entries to 50
        while (logContainer.children.length > 50) {
            logContainer.removeChild(logContainer.lastChild);
        }
        
        console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    }

    clearLogs() {
        const logContainer = document.getElementById('activityLog');
        logContainer.innerHTML = `
            <div class="log-entry">
                <span class="log-time">${new Date().toLocaleTimeString()}</span>
                <span class="log-level info">INFO</span>
                <span>Logs cleared</span>
            </div>
        `;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pushApp = new PushNotificationApp();
});
