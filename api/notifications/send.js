const Joi = require('joi');
const Notification = require('../src/models/Notification');
const { sendNotificationToTokens } = require('../src/services/firebaseService');

// Validation schema
const sendNotificationSchema = Joi.object({
  title: Joi.string().max(100).required(),
  body: Joi.string().max(1000).required(),
  icon: Joi.string().uri().optional(),
  data: Joi.object().optional(),
  targetTokens: Joi.array().items(Joi.string()).optional(),
  userId: Joi.string().optional()
});

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request body
    const { error, value } = sendNotificationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details[0].message
      });
    }

    // Create notification record
    const notification = await Notification.create({
      title: value.title,
      body: value.body,
      icon: value.icon,
      data: value.data,
      targetTokens: value.targetTokens
    });

    // Send the notification
    const result = await sendNotificationToTokens({
      title: value.title,
      body: value.body,
      icon: value.icon,
      data: value.data
    }, value.targetTokens, value.userId);

    // Update notification with results
    await Notification.updateSendStatus(notification.id, {
      sentCount: result.successCount,
      failedCount: result.failureCount,
      status: result.successCount > 0 ? 'sent' : 'failed'
    });

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        notificationId: notification.id,
        sentCount: result.successCount,
        failedCount: result.failureCount,
        results: result.results
      }
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      error: 'Failed to send notification',
      message: error.message
    });
  }
};
