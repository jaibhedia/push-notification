const express = require('express');
const Joi = require('joi');
const Notification = require('../models/Notification');
const Device = require('../models/Device');
const { 
  sendNotificationToDevice, 
  sendNotificationToMultipleDevices,
  validateToken 
} = require('../services/firebaseService');

const router = express.Router();

// Validation schemas
const sendNotificationSchema = Joi.object({
  title: Joi.string().max(100).required(),
  body: Joi.string().max(1000).required(),
  icon: Joi.string().uri().optional(),
  image: Joi.string().uri().optional(),
  clickAction: Joi.string().uri().optional(),
  data: Joi.object().optional(),
  targetTokens: Joi.alternatives().try(
    Joi.array().items(Joi.string().min(100)),
    Joi.string().valid('all')
  ).required()
});

/**
 * Send push notification
 * POST /api/notifications/send
 */
router.post('/send', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = sendNotificationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details[0].message
      });
    }

    const { title, body, icon, image, clickAction, data, targetTokens } = value;

    // Get target tokens
    let tokens = [];
    if (targetTokens === 'all') {
      const allDevices = await Device.getAllActiveTokens();
      tokens = allDevices.map(device => device.token);
      console.log(`[DEBUG] Found ${tokens.length} tokens from devices:`, tokens.map(t => t.substring(0, 20) + '...'));
    } else {
      tokens = targetTokens;
      console.log(`[DEBUG] Using provided tokens:`, tokens.map(t => t.substring(0, 20) + '...'));
    }

    if (tokens.length === 0) {
      console.log('[DEBUG] No tokens found');
      return res.status(400).json({
        error: 'No valid tokens found',
        message: 'No devices available to send notifications to'
      });
    }

    // Validate tokens
    const validTokens = tokens.filter(validateToken);
    console.log(`[DEBUG] Token validation: ${tokens.length} total, ${validTokens.length} valid`);
    
    if (validTokens.length === 0) {
      console.log('[DEBUG] All tokens failed validation');
      tokens.forEach((token, i) => {
        console.log(`[DEBUG] Token ${i}: length=${token.length}, validation=${validateToken(token)}`);
      });
      return res.status(400).json({
        error: 'No valid tokens provided',
        message: 'All provided tokens are invalid'
      });
    }

    // Create notification record
    const notification = await Notification.create({
      title,
      body,
      icon,
      image,
      clickAction,
      data,
      targetTokens: validTokens
    });

    // Send notification
    let result;
    if (validTokens.length === 1) {
      result = await sendNotificationToDevice(validTokens[0], {
        title,
        body,
        icon,
        image,
        clickAction
      }, data);
    } else {
      result = await sendNotificationToMultipleDevices(validTokens, {
        title,
        body,
        icon,
        image,
        clickAction
      }, data);
    }

    // Update notification status
    if (result.success) {
      const successCount = result.successCount || (result.success ? 1 : 0);
      const failureCount = result.failureCount || 0;
      
      await Notification.updateStatus(notification.id, 'sent', {
        sentCount: validTokens.length,
        successCount,
        failureCount
      });

      // Log individual delivery statuses for batch sends
      if (result.responses) {
        for (let i = 0; i < result.responses.length; i++) {
          const response = result.responses[i];
          const token = validTokens[i];
          
          if (response.success) {
            await Notification.logDelivery(notification.id, token, 'sent');
          } else {
            await Notification.logDelivery(notification.id, token, 'failed', response.error?.message);
          }
        }
      }

      res.status(200).json({
        success: true,
        message: 'Notification sent successfully',
        data: {
          notificationId: notification.id,
          totalTokens: validTokens.length,
          successCount: successCount,
          failureCount: failureCount,
          invalidTokens: tokens.length - validTokens.length
        }
      });
    } else {
      await Notification.updateStatus(notification.id, 'failed', {
        sentCount: validTokens.length,
        failureCount: validTokens.length
      });

      res.status(500).json({
        error: 'Failed to send notification',
        message: result.error,
        notificationId: notification.id
      });
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      error: 'Failed to send notification',
      message: error.message
    });
  }
});

/**
 * Send notification to specific user
 * POST /api/notifications/send-to-user/:userId
 */
router.post('/send-to-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user's device tokens
    const userDevices = await Device.getTokensByUserId(userId);
    
    if (userDevices.length === 0) {
      return res.status(404).json({
        error: 'No devices found for user',
        userId
      });
    }

    // Prepare notification data
    const notificationData = {
      ...req.body,
      targetTokens: userDevices.map(device => device.token)
    };

    // Validate and send
    const { error, value } = sendNotificationSchema.validate(notificationData);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details[0].message
      });
    }

    // Use the main send logic
    req.body = notificationData;
    return router.handle(req, res);
  } catch (error) {
    console.error('Error sending notification to user:', error);
    res.status(500).json({
      error: 'Failed to send notification to user',
      message: error.message
    });
  }
});

/**
 * Get notification history
 * GET /api/notifications/history
 */
router.get('/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await Notification.getAll(page, limit);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({
      error: 'Failed to fetch notification history',
      message: error.message
    });
  }
});

/**
 * Get notification statistics
 * GET /api/notifications/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await Notification.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({
      error: 'Failed to fetch notification statistics',
      message: error.message
    });
  }
});

/**
 * Get specific notification details
 * GET /api/notifications/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'Invalid notification ID'
      });
    }

    const notification = await Notification.getById(parseInt(id));

    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({
      error: 'Failed to fetch notification',
      message: error.message
    });
  }
});

module.exports = router;
