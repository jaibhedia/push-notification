const Device = require('../src/models/Device');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
};
