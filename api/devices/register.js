const Joi = require('joi');

// Import models and services from backend
const Device = require('../../backend/src/models/Device');

// Validation schema
const registerTokenSchema = Joi.object({
  token: Joi.string().min(100).required(),
  userId: Joi.string().optional(),
  platform: Joi.string().valid('web', 'android', 'ios').default('web'),
  userAgent: Joi.string().optional(),
  registeredAt: Joi.string().isoDate().optional()
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
};
