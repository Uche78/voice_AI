const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Validate webhook signature for security
function validateTwilioSignature(req, res, next) {
  const twilioSignature = req.headers['x-twilio-signature'];
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  
  if (process.env.NODE_ENV === 'development') {
    // Skip validation in development
    return next();
  }
  
  const isValid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN,
    twilioSignature,
    url,
    req.body
  );
  
  if (!isValid) {
    return res.status(403).send('Forbidden');
  }
  
  next();
}

module.exports = {
  client,
  validateTwilioSignature
};