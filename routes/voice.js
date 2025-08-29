const express = require('express');
const twilio = require('twilio');
const openaiService = require('../services/openaiService');
const callLogger = require('../utils/callLogger');

const router = express.Router();
const VoiceResponse = twilio.twiml.VoiceResponse;

// Handle incoming calls with conversation capability
router.post('/incoming', async (req, res) => {
  try {
    const callerNumber = req.body.From || 'Unknown';
    const twiml = new VoiceResponse();
    const shopName = process.env.SHOP_NAME || 'Auto Repair Shop';
    
    // Log the incoming call
    callLogger.logCall({
      callerNumber,
      action: 'incoming_call',
      details: 'Call received and greeting played'
    });
    
    // Professional greeting with natural speech
    twiml.say({
      voice: 'Polly.Joanna',
      language: 'en-US'
    }, `Hi there! You've reached ${shopName}. I'm Sarah, your virtual assistant. How can I help you today?`);
    
    // Gather customer speech input
    const gather = twiml.gather({
      input: 'speech',
      action: '/voice/process',
      method: 'POST',
      speechTimeout: 4,
      timeout: 10,
      language: 'en-US',
      enhanced: true // Better speech recognition
    });
    
    gather.say({
      voice: 'Polly.Joanna'
    }, 'I can help with our hours, services, appointments, or connect you with the owner.');
    
    // Fallback if no input
    twiml.say({
      voice: 'Polly.Joanna'
    }, "I didn't catch that. Let me get the owner on the line for you.");
    
    twiml.redirect('/voice/transfer');
    
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error in incoming call handler:', error);
    const twiml = new VoiceResponse();
    twiml.say({
      voice: 'Polly.Joanna'
    }, "Sorry, I'm having some technical trouble. Please try calling back in a moment.");
    twiml.hangup();
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Process customer speech with OpenAI
router.post('/process', async (req, res) => {
  try {
    const speechResult = req.body.SpeechResult || '';
    const confidence = parseFloat(req.body.Confidence || 0);
    const callerNumber = req.body.From || 'Unknown';
    
    console.log(`Customer said: "${speechResult}" (confidence: ${confidence})`);
    
    const twiml = new VoiceResponse();
    
    // Low confidence - ask for clarification
    if (confidence < 0.7) {
      twiml.say({
        voice: 'Polly.Joanna'
      }, "Sorry, I didn't quite catch that. Could you tell me again how I can help you?");
      
      const gather = twiml.gather({
        input: 'speech',
        action: '/voice/process',
        method: 'POST',
        speechTimeout: 4,
        timeout: 10,
        enhanced: true
      });
      
      twiml.redirect('/voice/transfer');
      res.type('text/xml');
      res.send(twiml.toString());
      return;
    }
    
    // Process speech with OpenAI for intelligent response
    const response = await openaiService.processCustomerInput(callerNumber, speechResult);
    
    twiml.say({ 
      voice: 'Polly.Joanna' 
    }, response.message);
    
    // Route based on AI's determined action
    if (response.action === 'faq') {
      // Continue conversation for more questions
      const gather = twiml.gather({
        input: 'speech',
        action: '/voice/process',
        method: 'POST',
        speechTimeout: 4,
        timeout: 8,
        enhanced: true
      });
      
      gather.say({ 
        voice: 'Polly.Joanna' 
      }, 'Is there anything else I can help you with?');
      
      twiml.redirect('/voice/goodbye');
    } else if (response.action === 'appointment') {
      twiml.redirect('/voice/appointment');
    } else if (response.action === 'transfer') {
      twiml.redirect('/voice/transfer');
    } else if (response.action === 'message') {
      twiml.redirect('/voice/message');
    } else if (response.action === 'goodbye') {
      twiml.redirect('/voice/goodbye');
    } else {
      // Continue conversation for unclear requests
      const gather = twiml.gather({
        input: 'speech',
        action: '/voice/process',
        method: 'POST',
        speechTimeout: 4,
        timeout: 8
      });
      
      gather.say({ 
        voice: 'Polly.Joanna' 
      }, 'What else can I help you with today?');
      
      twiml.redirect('/voice/transfer');
    }
    
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error processing customer input:', error);
    const twiml = new VoiceResponse();
    twiml.say({
      voice: 'Polly.Joanna'
    }, "I'm having a bit of trouble understanding right now. Let me connect you with the owner.");
    twiml.redirect('/voice/transfer');
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Transfer to shop owner
router.post('/transfer', (req, res) => {
  try {
    const twiml = new VoiceResponse();
    const ownerPhone = process.env.OWNER_PHONE_NUMBER;
    
    if (ownerPhone) {
      twiml.say({
        voice: 'Polly.Joanna'
      }, 'Let me get the owner on the line for you. Just a moment!');
      
      twiml.dial({
        timeout: 25,
        action: '/voice/transfer-status',
        method: 'POST'
      }, ownerPhone);
    } else {
      twiml.say({
        voice: 'Polly.Joanna'
      }, "The owner isn't available right now. Would you like to leave a message?");
      
      twiml.redirect('/voice/message');
    }
    
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error in transfer handler:', error);
    const twiml = new VoiceResponse();
    twiml.say({
      voice: 'Polly.Joanna'
    }, "I'm having trouble with the transfer. Please try calling back.");
    twiml.hangup();
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Goodbye message
router.post('/goodbye', (req, res) => {
  try {
    const twiml = new VoiceResponse();
    const shopName = process.env.SHOP_NAME || 'Auto Repair Shop';
    
    twiml.say({
      voice: 'Polly.Joanna'
    }, `Thanks so much for calling ${shopName}! Have a wonderful day and drive safe!`);
    
    twiml.hangup();
    
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error in goodbye handler:', error);
    const twiml = new VoiceResponse();
    twiml.hangup();
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

module.exports = router;
