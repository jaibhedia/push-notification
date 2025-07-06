const { getDatabase } = require('./database');

class Device {
  /**
   * Register a new device token
   */
  static async registerToken(tokenData) {
    const db = getDatabase();
    const { token, userId, platform, userAgent } = tokenData;

    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR REPLACE INTO device_tokens (token, user_id, platform, user_agent, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      db.run(query, [token, userId, platform || 'web', userAgent], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            token,
            userId,
            platform: platform || 'web',
            registered: true
          });
        }
      });
    });
  }

  /**
   * Get all active device tokens
   */
  static async getAllActiveTokens() {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const query = `
        SELECT token, user_id, platform, created_at, updated_at
        FROM device_tokens
        WHERE is_active = 1
        ORDER BY updated_at DESC
      `;
      
      db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Get tokens by user ID
   */
  static async getTokensByUserId(userId) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const query = `
        SELECT token, platform, created_at, updated_at
        FROM device_tokens
        WHERE user_id = ? AND is_active = 1
        ORDER BY updated_at DESC
      `;
      
      db.all(query, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Deactivate a device token
   */
  static async deactivateToken(token) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const query = `
        UPDATE device_tokens
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP
        WHERE token = ?
      `;
      
      db.run(query, [token], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ success: this.changes > 0 });
        }
      });
    });
  }

  /**
   * Get device statistics
   */
  static async getStats() {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const queries = {
        totalDevices: 'SELECT COUNT(*) as count FROM device_tokens WHERE is_active = 1',
        platformStats: `
          SELECT platform, COUNT(*) as count
          FROM device_tokens
          WHERE is_active = 1
          GROUP BY platform
        `,
        recentRegistrations: `
          SELECT COUNT(*) as count
          FROM device_tokens
          WHERE is_active = 1 AND created_at > datetime('now', '-24 hours')
        `
      };

      Promise.all([
        new Promise((res, rej) => {
          db.get(queries.totalDevices, (err, row) => err ? rej(err) : res(row.count));
        }),
        new Promise((res, rej) => {
          db.all(queries.platformStats, (err, rows) => err ? rej(err) : res(rows));
        }),
        new Promise((res, rej) => {
          db.get(queries.recentRegistrations, (err, row) => err ? rej(err) : res(row.count));
        })
      ]).then(([totalDevices, platformStats, recentRegistrations]) => {
        resolve({
          totalDevices,
          platformStats,
          recentRegistrations
        });
      }).catch(reject);
    });
  }
}

module.exports = Device;
