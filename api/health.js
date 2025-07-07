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

  res.json({
    status: 'ok',
    message: 'Push Notification API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      'POST /api/devices/register': 'Register device token',
      'GET /api/devices/tokens': 'Get all device tokens',
      'GET /api/devices/stats': 'Get device statistics',
      'POST /api/notifications/send': 'Send notification',
      'GET /api/notifications/stats': 'Get notification statistics',
      'GET /api/health': 'Health check'
    }
  });
};
