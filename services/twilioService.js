const { client } = require('../config/twilio');

class TwilioService {
  async makeOutboundCall(toNumber, twimlUrl) {
    try {
      const call = await client.calls.create({
        to: toNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
        url: twimlUrl,
        method: 'POST'
      });
      
      console.log(`Outbound call initiated: ${call.sid}`);
      return call;
    } catch (error) {
      console.error('Error making outbound call:', error);
      throw error;
    }
  }

  async getCallDetails(callSid) {
    try {
      const call = await client.calls(callSid).fetch();
      return call;
    } catch (error) {
      console.error('Error fetching call details:', error);
      throw error;
    }
  }

  async getRecordingTranscription(recordingSid) {
    try {
      const recording = await client.recordings(recordingSid).fetch();
      return recording;
    } catch (error) {
      console.error('Error fetching recording:', error);
      throw error;
    }
  }

  async sendSMS(to, message) {
    try {
      const sms = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      });
      
      console.log(`SMS sent: ${sms.sid}`);
      return sms;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  // Check if owner phone is available (simple ping)
  async isOwnerAvailable() {
    try {
      // For now, return true if owner phone is configured
      return !!process.env.OWNER_PHONE_NUMBER;
    } catch (error) {
      console.error('Error checking owner availability:', error);
      return false;
    }
  }
}

module.exports = new TwilioService();