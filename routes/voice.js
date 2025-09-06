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
      voice: 'Polly.Salli',
      language: 'en-US'
    }, `Hi, this is ${shopName}. Sarah speaking, how can I help you today?`);
    
    // Gather customer speech input
    const gather = twiml.gather({
      input: 'speech',
      action: '/voice/process',
      method: 'POST',
      speechTimeout: 3,
      timeout: 8,
      language: 'en-US',
      enhanced: true // Better speech recognition
    });
    
    
    // Fallback if no input
    twiml.say({
      voice: 'Polly.Salli'
    }, "I didn't catch that. Let me get the owner on the line for you.");
    
    twiml.redirect('/voice/transfer');
    
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error in incoming call handler:', error);
    const twiml = new VoiceResponse();
    twiml.say({
      voice: 'Polly.Salli'
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
        voice: 'Polly.Salli'
      }, "Sorry, I didn't quite catch that. Could you tell me again how I can help you?");
      
      const gather = twiml.gather({
        input: 'speech',
        action: '/voice/process',
        method: 'POST',
        speechTimeout: 3,
        timeout: 8,
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
      voice: 'Polly.Salli' 
    }, response.message);
    
    if (response.action === 'faq') {
  //twiml.say({ voice: 'Polly.Salli' }, response.message);
  
  // Continue conversation instead of ending
  const gather = twiml.gather({
    input: 'speech',
    action: '/voice/process',
    method: 'POST',
    speechTimeout: 3,
    timeout: 8,
    enhanced: true
  });
  
  // Only redirect to goodbye if customer indicates they're done
  twiml.redirect('/voice/goodbye');
      
      twiml.redirect('/voice/goodbye');
    } else if (response.action === 'appointment') {
  // Go directly to name collection instead of redirecting
  const gather = twiml.gather({
    input: 'speech',
    action: '/voice/appointment-name',
    method: 'POST',
    speechTimeout: 4,
    timeout: 10,
    enhanced: true
  });
  
  twiml.redirect('/voice/transfer');
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
        voice: 'Polly.Salli' 
      }, 'What else can I help you with today?');
      
      twiml.redirect('/voice/transfer');
    }
    
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error processing customer input:', error);
    const twiml = new VoiceResponse();
    twiml.say({
      voice: 'Polly.Salli'
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
        voice: 'Polly.Salli'
      }, 'Let me get the owner on the line for you. Just a moment!');
      
      twiml.dial({
        timeout: 25,
        action: '/voice/transfer-status',
        method: 'POST'
      }, ownerPhone);
    } else {
      twiml.say({
        voice: 'Polly.Salli'
      }, "The owner isn't available right now. Would you like to leave a message?");
      
      twiml.redirect('/voice/message');
    }
    
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error in transfer handler:', error);
    const twiml = new VoiceResponse();
    twiml.say({
      voice: 'Polly.Salli'
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
      voice: 'Polly.Salli'
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

// Appointment booking flow
router.post('/appointment', async (req, res) => {
  try {
    const callerNumber = req.body.From || 'Unknown';
    const twiml = new VoiceResponse();
    
    callLogger.logCall({
      callerNumber,
      action: 'appointment_start',
      details: 'Customer requested appointment'
    });
    
    twiml.say({
      voice: 'Polly.Salli'
    }, "I'd love to help you schedule an appointment! What's your name?");
    
    const gather = twiml.gather({
      input: 'speech',
      action: '/voice/appointment-name',
      method: 'POST',
      speechTimeout: 4,
      timeout: 10,
      enhanced: true
    });
    
    twiml.say({
      voice: 'Polly.Salli'
    }, "I didn't catch your name clearly. Let me get the owner to help you schedule.");
    
    twiml.redirect('/voice/transfer');
    
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error in appointment handler:', error);
    const twiml = new VoiceResponse();
    twiml.redirect('/voice/transfer');
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Capture appointment name
router.post('/appointment-name', async (req, res) => {
  try {
    const speechResult = req.body.SpeechResult || '';
    let customerName = speechResult;

// Extract just the name from common phrases
    const namePatterns = [
      /my name is (\w+)/i,
      /i'm (\w+)/i,
      /this is (\w+)/i,
      /(\w+) speaking/i,
      /it's (\w+)/i,
      /call me (\w+)/i
    ];

    for (const pattern of namePatterns) {
      const match = speechResult.match(pattern);
      if (match && match[1]) {
        customerName = match[1];
        break;
        }
     }

// If no pattern matched but it's a short response, assume it's just the name
     if (customerName === speechResult && speechResult.split(' ').length <= 2) {
       customerName = speechResult.trim();
     }    
    
    const callerNumber = req.body.From || '';
    const confidence = parseFloat(req.body.Confidence || 0);
    
    const twiml = new VoiceResponse();
    
    if (customerName.length < 2 || confidence < 0.6) {
      twiml.say({
        voice: 'Polly.Salli'
      }, "I didn't get your name clearly. Let me connect you with the owner to get you scheduled.");
      
      twiml.redirect('/voice/transfer');
      res.type('text/xml');
      res.send(twiml.toString());
      return;
    }
    
    twiml.say({
      voice: 'Polly.Salli'
    }, `Perfect, ${customerName}! What kind of car do you have and what service do you need?`);
    
    // Store customer info in session (using query params)
const sessionData = encodeURIComponent(JSON.stringify({
  name: customerName,
  phone: callerNumber
}));

const gather = twiml.gather({
  input: 'speech',
  action: `/voice/appointment-details?session=${sessionData}`,  // Set the action with session data directly
  method: 'POST',
  speechTimeout: 6,
  timeout: 15,
  enhanced: true
});
    
    twiml.say({
      voice: 'Polly.Salli'
    }, "I need a bit more detail. Let me get the owner to help you out.");
    
    twiml.redirect('/voice/transfer');
    
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error capturing appointment name:', error);
    const twiml = new VoiceResponse();
    twiml.redirect('/voice/transfer');
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Capture appointment details
router.post('/appointment-details', async (req, res) => {
  try {
    const serviceDetails = req.body.SpeechResult || '';
    const sessionParam = req.query.session;
    const confidence = parseFloat(req.body.Confidence || 0);

    // Add these debug lines:
    console.log(`=== APPOINTMENT DETAILS DEBUG ===`);
    console.log(`Speech Result: "${serviceDetails}"`);
    console.log(`Confidence: ${confidence}`);
    console.log(`Length: ${serviceDetails.length}`);
    console.log(`Session Param: ${sessionParam}`);
    console.log(`=== END DEBUG ===`);
    
    let customerInfo = { name: 'Unknown', phone: req.body.From || '' };
    if (sessionParam) {
      try {
        customerInfo = JSON.parse(decodeURIComponent(sessionParam));
      } catch (e) {
        console.error('Error parsing session data:', e);
      }
    }
    
    const twiml = new VoiceResponse();
    
    if (serviceDetails.length < 3 || confidence < 0.4) {
      twiml.say({
        voice: 'Polly.Salli'
      }, "I need a bit more info about what you need done. Let me get the owner for you.");
      
      twiml.redirect('/voice/transfer');
      res.type('text/xml');
      res.send(twiml.toString());
      return;
    }
    
    // Get available time slots
    const availableSlots = openaiService.getAvailableTimeSlots();
    const availabilityMessage = openaiService.formatAvailableSlots();
    
    twiml.say({
      voice: 'Polly.Salli'
    }, `Got it! So ${customerInfo.name}, you need help with ${serviceDetails}. ${availabilityMessage}`);
    
    const gather = twiml.gather({
      input: 'speech',
      action: '/voice/appointment-confirm',
      method: 'POST',
      speechTimeout: 4,
      timeout: 12,
      enhanced: true
    });
    
    const finalSessionData = encodeURIComponent(JSON.stringify({
      ...customerInfo,
      service: serviceDetails,
      availableSlots: availableSlots
    }));
    
    gather.action(`/voice/appointment-confirm?session=${finalSessionData}`);
    
    twiml.redirect('/voice/transfer');
    
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error in appointment details:', error);
    const twiml = new VoiceResponse();
    twiml.redirect('/voice/transfer');
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Confirm appointment time
router.post('/appointment-confirm', async (req, res) => {
  try {
    const timePreference = req.body.SpeechResult || '';
    const sessionParam = req.query.session;
    
    let appointmentInfo = { 
      name: 'Unknown', 
      phone: req.body.From || '', 
      service: 'General service',
      availableSlots: []
    };
    
    if (sessionParam) {
      try {
        appointmentInfo = JSON.parse(decodeURIComponent(sessionParam));
      } catch (e) {
        console.error('Error parsing session data:', e);
      }
    }
    
    const twiml = new VoiceResponse();
    
    // Determine preferred time slot
    let selectedSlot;
    const lowerPreference = timePreference.toLowerCase();
    
    if (appointmentInfo.availableSlots && appointmentInfo.availableSlots.length > 0) {
      if (lowerPreference.includes('first') || lowerPreference.includes('morning') || 
          lowerPreference.includes('earlier') || lowerPreference.includes('9')) {
        selectedSlot = appointmentInfo.availableSlots[0];
      } else {
        selectedSlot = appointmentInfo.availableSlots[1] || appointmentInfo.availableSlots[0];
      }
    } else {
      // Fallback slots
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      selectedSlot = { 
        date: tomorrow.toLocaleDateString(), 
        time: lowerPreference.includes('morning') ? '9:00 AM' : '2:00 PM' 
      };
    }
    
    twiml.say({
      voice: 'Polly.Salli'
    }, `Perfect! I've got you scheduled for ${selectedSlot.date} at ${selectedSlot.time}. You'll get a text confirmation, and if anything changes, we'll give you a call. Thanks for choosing us!`);
    
    // Log the appointment
    callLogger.logAppointment({
      customerName: appointmentInfo.name,
      customerPhone: appointmentInfo.phone,
      service: appointmentInfo.service,
      date: selectedSlot.date,
      time: selectedSlot.time
    });
    
    // Send SMS notification to owner
    try {
      const smsService = require('../services/smsService');
      await smsService.sendAppointmentNotification({
        customerName: appointmentInfo.name,
        customerPhone: appointmentInfo.phone,
        service: appointmentInfo.service,
        date: selectedSlot.date,
        time: selectedSlot.time
      });
    } catch (smsError) {
      console.error('Error sending SMS notification:', smsError);
    }
    
    twiml.hangup();
    
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error confirming appointment:', error);
    const twiml = new VoiceResponse();
    twiml.say({
      voice: 'Polly.Salli'
    }, "I'm having trouble getting that scheduled. Let me connect you with the owner to get this sorted out.");
    twiml.redirect('/voice/transfer');
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Handle transfer status
router.post('/transfer-status', async (req, res) => {
  try {
    const dialStatus = req.body.DialCallStatus;
    const callerNumber = req.body.From || 'Unknown';
    const twiml = new VoiceResponse();
    
    callLogger.logCall({
      callerNumber,
      action: 'transfer_result',
      details: `Transfer status: ${dialStatus}`
    });
    
    if (dialStatus === 'no-answer' || dialStatus === 'failed' || dialStatus === 'busy') {
      twiml.say({
        voice: 'Polly.Salli'
      }, "The owner is tied up right now. Would you like to leave a message and I'll make sure they get back to you?");
      
      twiml.redirect('/voice/message');
    } else {
      twiml.hangup();
    }
    
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error in transfer status handler:', error);
    const twiml = new VoiceResponse();
    twiml.hangup();
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Take voice message
router.post('/message', async (req, res) => {
  try {
    const callerNumber = req.body.From || 'Unknown';
    const twiml = new VoiceResponse();
    
    callLogger.logCall({
      callerNumber,
      action: 'message_start',
      details: 'Customer leaving voice message'
    });
    
    twiml.say({
      voice: 'Polly.Salli'
    }, "Please leave your name, phone number, and your message after the beep. Press any key when you're finished.");
    
    twiml.record({
      action: '/voice/message-received',
      method: 'POST',
      maxLength: 180, // 3 minutes max
      finishOnKey: 'any',
      transcribe: true,
      transcribeCallback: '/voice/transcription'
    });
    
    twiml.say({
      voice: 'Polly.Salli'
    }, "I didn't get your message. Feel free to call back anytime.");
    
    twiml.hangup();
    
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error in message handler:', error);
    const twiml = new VoiceResponse();
    twiml.say({
      voice: 'Polly.Salli'
    }, "Sorry, I can't take a message right now. Please try calling back.");
    twiml.hangup();
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Handle received voice message
router.post('/message-received', async (req, res) => {
  try {
    const recordingUrl = req.body.RecordingUrl;
    const callerNumber = req.body.From;
    const recordingDuration = req.body.RecordingDuration || 0;
    
    console.log(`Voice message received from ${callerNumber}: ${recordingUrl} (${recordingDuration}s)`);
    
    const twiml = new VoiceResponse();
    
    twiml.say({
      voice: 'Polly.Salli'
    }, "Got it! The owner will get your message and call you back soon. Thanks for calling!");
    
    twiml.hangup();
    
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error handling received message:', error);
    const twiml = new VoiceResponse();
    twiml.hangup();
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Handle message transcription
router.post('/transcription', async (req, res) => {
  try {
    const transcriptionText = req.body.TranscriptionText || 'Transcription not available';
    const callerNumber = req.body.From;
    const recordingUrl = req.body.RecordingUrl;
    const timestamp = new Date().toLocaleString();
    
    console.log(`Message transcribed from ${callerNumber}: ${transcriptionText}`);
    
    // Send SMS to owner with transcription
    try {
      const smsService = require('../services/smsService');
      await smsService.sendVoiceMessageNotification({
        callerPhone: callerNumber,
        transcription: transcriptionText,
        recordingUrl: recordingUrl,
        timestamp: timestamp
      });
    } catch (smsError) {
      console.error('Error sending transcription SMS:', smsError);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error handling transcription:', error);
    res.status(500).send('Error');
  }
});

module.exports = router;
