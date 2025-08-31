const { client } = require('../config/twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendAppointmentNotification(appointmentDetails) {
  try {
    const { customerName, customerPhone, service, date, time } = appointmentDetails;
    const shopName = process.env.SHOP_NAME || 'Auto Repair Shop';
    
    const message = `🔧 NEW APPOINTMENT - ${shopName}
    
Customer: ${customerName}
Phone: ${customerPhone}
Service: ${service}
Date: ${date}
Time: ${time}

Please call the customer to confirm and get more details.`;

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.OWNER_PHONE_NUMBER
    });
    
    console.log('Appointment notification sent to owner');
    return true;
  } catch (error) {
    console.error('Error sending appointment SMS:', error);
    return false;
  }
}

async function sendVoiceMessageNotification(messageDetails) {
  try {
    const { callerPhone, transcription, recordingUrl, timestamp } = messageDetails;
    const shopName = process.env.SHOP_NAME || 'Auto Repair Shop';
    
    const message = `📞 VOICE MESSAGE - ${shopName}

From: ${callerPhone}
Time: ${timestamp}

Message: ${transcription}

Recording: ${recordingUrl}

Please follow up with this customer.`;

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.OWNER_PHONE_NUMBER
    });
    
    console.log('Voice message notification sent to owner');
    return true;
  } catch (error) {
    console.error('Error sending voice message SMS:', error);
    return false;
  }
}

async function sendGeneralNotification(notificationText) {
  try {
    const shopName = process.env.SHOP_NAME || 'Auto Repair Shop';
    
    const message = `🚗 ${shopName} - ${notificationText}`;

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.OWNER_PHONE_NUMBER
    });
    
    console.log('General notification sent to owner');
    return true;
  } catch (error) {
    console.error('Error sending general SMS:', error);
    return false;
  }
}

async function sendOwnerUnavailableNotification(callerData) {
  try {
    const shopName = process.env.SHOP_NAME || 'Auto Repair Shop';
    
    const message = `📞 CALLBACK REQUEST - ${shopName}

Customer asking for owner:
Name: ${callerData.name || 'Not provided'}
Phone: ${callerData.phone}
Time: ${new Date().toLocaleString()}

Please call them back when available.`;

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.OWNER_PHONE_NUMBER
    });
    
    console.log('Owner unavailable notification sent');
    return true;
  } catch (error) {
    console.error('Error sending owner unavailable SMS:', error);
    return false;
  }
}

module.exports = {
  sendAppointmentNotification,
  sendVoiceMessageNotification,
  sendGeneralNotification,
  sendOwnerUnavailableNotification
};
