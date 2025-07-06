const express = require('express');
const Joi = require('joi');
const Device = require('../models/Device');

const router = express.Router();

// Validation schemas
const registerTokenSchema = Joi.object({
  token: Joi.string().min(100).required(),
  userId: Joi.string().optional(),
  platform: Joi.string().valid('web', 'android', 'ios').default('web'),
  userAgent: Joi.string().optional()
});

/**
 * Register a device token
 * POST /api/devices/register
 */
router.post('/register', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = registerTokenSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details[0].message
      });
    }

    // Extract user agent from headers if not provided
    if (!value.userAgent) {
      value.userAgent = req.headers['user-agent'];
    }

    // Register the device token
    const result = await Device.registerToken(value);

    res.status(201).json({
      success: true,
      message: 'Device token registered successfully',
      data: result
    });
  } catch (error) {
    console.error('Error registering device token:', error);
    res.status(500).json({
      error: 'Failed to register device token',
      message: error.message
    });
  }
});

/**
 * Get all active device tokens
 * GET /api/devices/tokens
 */
router.get('/tokens', async (req, res) => {
  try {
    const tokens = await Device.getAllActiveTokens();

    res.json({
      success: true,
      count: tokens.length,
      data: tokens
    });
  } catch (error) {
    console.error('Error fetching device tokens:', error);
    res.status(500).json({
      error: 'Failed to fetch device tokens',
      message: error.message
    });
  }
});

/**
 * Get tokens for a specific user
 * GET /api/devices/user/:userId/tokens
 */
router.get('/user/:userId/tokens', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }

    const tokens = await Device.getTokensByUserId(userId);

    res.json({
      success: true,
      userId,
      count: tokens.length,
      data: tokens
    });
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    res.status(500).json({
      error: 'Failed to fetch user tokens',
      message: error.message
    });
  }
});

/**
 * Deactivate a device token
 * DELETE /api/devices/token/:token
 */
router.delete('/token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        error: 'Token is required'
      });
    }

    const result = await Device.deactivateToken(token);

    if (result.success) {
      res.json({
        success: true,
        message: 'Device token deactivated successfully'
      });
    } else {
      res.status(404).json({
        error: 'Token not found'
      });
    }
  } catch (error) {
    console.error('Error deactivating device token:', error);
    res.status(500).json({
      error: 'Failed to deactivate device token',
      message: error.message
    });
  }
});

/**
 * Get device statistics
 * GET /api/devices/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await Device.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching device stats:', error);
    res.status(500).json({
      error: 'Failed to fetch device statistics',
      message: error.message
    });
  }
});

module.exports = router;
