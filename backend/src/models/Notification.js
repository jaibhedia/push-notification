const { getDatabase } = require('./database');

class Notification {
  /**
   * Create a new notification record
   */
  static async create(notificationData) {
    const db = getDatabase();
    const { title, body, icon, image, clickAction, data, targetTokens } = notificationData;

    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO notifications (title, body, icon, image, click_action, data, target_tokens)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.run(query, [
        title,
        body,
        icon || null,
        image || null,
        clickAction || null,
        data ? JSON.stringify(data) : null,
        JSON.stringify(targetTokens)
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            title,
            body,
            icon,
            image,
            clickAction,
            data,
            targetTokens,
            status: 'pending'
          });
        }
      });
    });
  }

  /**
   * Update notification status and counts
   */
  static async updateStatus(id, status, counts = {}) {
    const db = getDatabase();
    const { sentCount, successCount, failureCount } = counts;

    return new Promise((resolve, reject) => {
      const updates = ['status = ?'];
      const values = [status];

      if (sentCount !== undefined) {
        updates.push('sent_count = ?');
        values.push(sentCount);
      }
      if (successCount !== undefined) {
        updates.push('success_count = ?');
        values.push(successCount);
      }
      if (failureCount !== undefined) {
        updates.push('failure_count = ?');
        values.push(failureCount);
      }

      if (status === 'sent') {
        updates.push('sent_at = CURRENT_TIMESTAMP');
      }

      values.push(id);

      const query = `
        UPDATE notifications
        SET ${updates.join(', ')}
        WHERE id = ?
      `;
      
      db.run(query, values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ success: this.changes > 0 });
        }
      });
    });
  }

  /**
   * Get notification by ID
   */
  static async getById(id) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM notifications WHERE id = ?
      `;
      
      db.get(query, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          if (row) {
            // Parse JSON fields
            row.data = row.data ? JSON.parse(row.data) : null;
            row.target_tokens = JSON.parse(row.target_tokens);
          }
          resolve(row);
        }
      });
    });
  }

  /**
   * Get all notifications with pagination
   */
  static async getAll(page = 1, limit = 20) {
    const db = getDatabase();
    const offset = (page - 1) * limit;

    return new Promise((resolve, reject) => {
      const countQuery = 'SELECT COUNT(*) as total FROM notifications';
      const dataQuery = `
        SELECT * FROM notifications
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      Promise.all([
        new Promise((res, rej) => {
          db.get(countQuery, (err, row) => err ? rej(err) : res(row.total));
        }),
        new Promise((res, rej) => {
          db.all(dataQuery, [limit, offset], (err, rows) => {
            if (err) {
              rej(err);
            } else {
              // Parse JSON fields
              rows.forEach(row => {
                row.data = row.data ? JSON.parse(row.data) : null;
                row.target_tokens = JSON.parse(row.target_tokens);
              });
              res(rows);
            }
          });
        })
      ]).then(([total, notifications]) => {
        resolve({
          notifications,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        });
      }).catch(reject);
    });
  }

  /**
   * Log notification delivery status
   */
  static async logDelivery(notificationId, token, status, errorMessage = null) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO notification_logs (notification_id, token, status, error_message)
        VALUES (?, ?, ?, ?)
      `;
      
      db.run(query, [notificationId, token, status, errorMessage], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  }

  /**
   * Get notification statistics
   */
  static async getStats() {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const queries = {
        totalNotifications: 'SELECT COUNT(*) as count FROM notifications',
        sentToday: `
          SELECT COUNT(*) as count
          FROM notifications
          WHERE sent_at > datetime('now', '-24 hours')
        `,
        statusBreakdown: `
          SELECT status, COUNT(*) as count
          FROM notifications
          GROUP BY status
        `,
        successRate: `
          SELECT
            SUM(success_count) as total_success,
            SUM(sent_count) as total_sent
          FROM notifications
          WHERE sent_count > 0
        `
      };

      Promise.all([
        new Promise((res, rej) => {
          db.get(queries.totalNotifications, (err, row) => err ? rej(err) : res(row.count));
        }),
        new Promise((res, rej) => {
          db.get(queries.sentToday, (err, row) => err ? rej(err) : res(row.count));
        }),
        new Promise((res, rej) => {
          db.all(queries.statusBreakdown, (err, rows) => err ? rej(err) : res(rows));
        }),
        new Promise((res, rej) => {
          db.get(queries.successRate, (err, row) => err ? rej(err) : res(row));
        })
      ]).then(([totalNotifications, sentToday, statusBreakdown, successRate]) => {
        const rate = successRate.total_sent > 0 
          ? ((successRate.total_success / successRate.total_sent) * 100).toFixed(2)
          : 0;

        resolve({
          totalNotifications,
          sentToday,
          statusBreakdown,
          successRate: `${rate}%`
        });
      }).catch(reject);
    });
  }
}

module.exports = Notification;
