const express = require('express');
const twilio = require('twilio');

const router = express.Router();
const VoiceResponse = twilio.twiml.VoiceResponse;

// Basic test route
router.get('/test', (req, res) => {
  res.json({ message: 'Voice route working' });
});

// Handle incoming calls with basic TwiML
router.post('/incoming', (req, res) => {
  try {
    const twiml = new VoiceResponse();
    const shopName = process.env.SHOP_NAME || 'Auto Repair Shop';
    
    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, `Hello, you have reached ${shopName}. This is a test of the voice system.`);
    
    twiml.say({
      voice: 'alice'
    }, 'The webhook is working correctly. Thank you for calling.');
    
    twiml.hangup();
    
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error in incoming call handler:', error);
    const twiml = new VoiceResponse();
    twiml.say('Sorry, there was an error processing your call.');
    twiml.hangup();
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Simple menu test
router.post('/menu', (req, res) => {
  try {
    const twiml = new VoiceResponse();
    
    twiml.say({
      voice: 'alice'
    }, 'Press 1 for business hours, press 2 to leave a message, or press 0 to hang up.');
    
    const gather = twiml.gather({
      numDigits: 1,
      action: '/voice/handle-menu',
      method: 'POST'
    });
    
    twiml.say('We did not receive a selection. Goodbye.');
    twiml.hangup();
    
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error in menu handler:', error);
    const twiml = new VoiceResponse();
    twiml.say('Sorry, there was an error. Goodbye.');
    twiml.hangup();
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Handle menu selections
router.post('/handle-menu', (req, res) => {
  try {
    const digit = req.body.Digits;
    const twiml = new VoiceResponse();
    
    switch (digit) {
      case '1':
        twiml.say({
          voice: 'alice'
        }, 'We are open Monday through Friday from 8 AM to 6 PM, Saturday 9 AM to 4 PM, and closed on Sundays.');
        break;
      case '2':
        twiml.say({
          voice: 'alice'
        }, 'Please leave your message after the beep.');
        twiml.record({
          maxLength: 60,
          finishOnKey: '#'
        });
        break;
      case '0':
        twiml.say({
          voice: 'alice'
        }, 'Thank you for calling. Goodbye.');
        break;
      default:
        twiml.say({
          voice: 'alice'
        }, 'Invalid selection. Goodbye.');
    }
    
    twiml.hangup();
    
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error handling menu selection:', error);
    const twiml = new VoiceResponse();
    twiml.say('Sorry, there was an error. Goodbye.');
    twiml.hangup();
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

module.exports = router;