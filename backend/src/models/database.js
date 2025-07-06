const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db;

/**
 * Initialize SQLite database
 */
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const dbPath = process.env.DATABASE_PATH || './data/notifications.db';
    
    // Ensure data directory exists
    const fs = require('fs');
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
      } else {
        console.log('Connected to SQLite database');
        createTables()
          .then(resolve)
          .catch(reject);
      }
    });
  });
}

/**
 * Create database tables
 */
async function createTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Device tokens table
      db.run(`
        CREATE TABLE IF NOT EXISTS device_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          token TEXT UNIQUE NOT NULL,
          user_id TEXT,
          platform TEXT DEFAULT 'web',
          user_agent TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT 1
        )
      `, (err) => {
        if (err) {
          console.error('Error creating device_tokens table:', err);
          reject(err);
          return;
        }
      });

      // Notifications table
      db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          icon TEXT,
          image TEXT,
          click_action TEXT,
          data TEXT, -- JSON string for additional data
          target_tokens TEXT, -- JSON array of tokens or 'all'
          sent_count INTEGER DEFAULT 0,
          success_count INTEGER DEFAULT 0,
          failure_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          sent_at DATETIME,
          status TEXT DEFAULT 'pending' -- pending, sent, failed
        )
      `, (err) => {
        if (err) {
          console.error('Error creating notifications table:', err);
          reject(err);
          return;
        }
      });

      // Notification logs table
      db.run(`
        CREATE TABLE IF NOT EXISTS notification_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          notification_id INTEGER,
          token TEXT,
          status TEXT, -- sent, delivered, failed
          error_message TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (notification_id) REFERENCES notifications (id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating notification_logs table:', err);
          reject(err);
          return;
        }
        resolve();
      });
    });
  });
}

/**
 * Get database instance
 */
function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * Close database connection
 */
function closeDatabase() {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase
};
