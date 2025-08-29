const express = require('express');
const dotenv = require('dotenv');
const voiceRoutes = require('./routes/voice');
const smsRoutes = require('./routes/sms');
const adminRoutes = require('./routes/admin');
const testRoutes = require('./routes/test');

// Load environment variables
dotenv.config();
console.log('OpenAI Key loaded:', process.env.OPENAI_API_KEY ? 'YES' : 'NO');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use('/voice', voiceRoutes);
// Add this debug right after the voice routes line:
console.log('Voice routes object:', voiceRoutes);
console.log('Voice routes type:', typeof voiceRoutes);
console.log('Voice routes keys:', Object.keys(voiceRoutes || {}));
app.use('/sms', smsRoutes);
app.use('/admin', adminRoutes);
app.use('/test', testRoutes);

console.log('Voice routes loaded:', typeof voiceRoutes);

// Add this directly to server.js as a test
app.get('/voice/debug', (req, res) => {
  res.json({ message: 'Direct voice route works' });
});

// Health check endpoint
app.get('/', (req, res) => {
  const shopName = process.env.SHOP_NAME || 'Auto Repair Shop';
  res.json({ 
    message: `${shopName} AI Receptionist is running`,
    timestamp: new Date().toISOString(),
    webhookUrl: `http://localhost:${PORT}/voice/incoming`
  });
});

// Test endpoint for development
app.get('/test', (req, res) => {
  const requiredEnvVars = [
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN', 
    'TWILIO_PHONE_NUMBER',
    'OWNER_PHONE_NUMBER'
  ];
  
  const envCheck = {};
  requiredEnvVars.forEach(envVar => {
    envCheck[envVar.toLowerCase()] = process.env[envVar] ? 'Set' : 'Missing';
  });
  
  res.json({ 
    message: 'Test endpoint working',
    env_check: envCheck,
    shop_name: process.env.SHOP_NAME || 'Auto Repair Shop',
    server_time: new Date().toISOString()
  });
});

// Webhook test endpoint (for development testing)
app.post('/test-webhook', (req, res) => {
  console.log('Test webhook called with body:', req.body);
  res.json({ 
    message: 'Webhook received',
    body: req.body,
    headers: req.headers
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: 'Please try again later'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: `Endpoint ${req.path} not found`
  });
});

app.listen(PORT, () => {
  console.log(`🤖 AI Car Shop Receptionist server running on port ${PORT}`);
  console.log(`📞 Voice webhook URL: http://localhost:${PORT}/voice/incoming`);
  console.log(`📱 SMS webhook URL: http://localhost:${PORT}/sms/incoming`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/admin/dashboard`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
  
  // Environment validation
  const requiredVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER', 'OWNER_PHONE_NUMBER'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missingVars.join(', ')}`);
    console.warn('📝 Copy .env.example to .env and fill in your Twilio credentials');
  } else {
    console.log('✅ All environment variables are configured');
  }
});