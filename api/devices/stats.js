const Device = require('../../backend/src/models/Device');

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
};
