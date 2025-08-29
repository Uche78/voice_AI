const express = require('express');
const { validateTwilioSignature } = require('../config/twilio');
const smsService = require('../services/smsService');

const router = express.Router();

// Handle incoming SMS messages (optional - for future expansion)
router.post('/incoming', validateTwilioSignature, async (req, res) => {
  try {
    const messageBody = req.body.Body || '';
    const fromNumber = req.body.From || '';
    
    console.log(`Incoming SMS from ${fromNumber}: ${messageBody}`);
    
    // For now, just forward SMS messages to the owner
    if (fromNumber !== process.env.OWNER_PHONE_NUMBER) {
      await smsService.sendGeneralNotification(
        `SMS from ${fromNumber}: ${messageBody}`
      );
    }
    
    // Respond with empty TwiML (no auto-reply)
    res.type('text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  } catch (error) {
    console.error('Error handling incoming SMS:', error);
    res.status(500).send('Error processing SMS');
  }
});

// Test endpoint for sending SMS
router.post('/test', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const result = await smsService.sendGeneralNotification(message);
    
    res.json({ 
      success: result,
      message: result ? 'SMS sent successfully' : 'Failed to send SMS'
    });
  } catch (error) {
    console.error('Error in SMS test endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;