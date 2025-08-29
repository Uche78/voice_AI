# AI Car Shop Receptionist

A professional AI voice assistant system for auto repair shops using Twilio Voice API. Handles incoming calls, answers questions, books appointments, and takes messages.

## Features

- 🎙️ **Professional Voice Greeting** - Welcomes customers with shop name
- 🤖 **Smart Conversation Flow** - Understands customer needs and routes appropriately  
- 📅 **Appointment Booking** - Captures customer details and schedules appointments
- 📞 **Call Transfer** - Connects customers to shop owner when needed
- 📱 **SMS Notifications** - Sends appointment and message alerts to owner
- 🎵 **Voice Messages** - Records and transcribes messages when owner unavailable
- 📊 **Simple Dashboard** - View call activity and statistics

## Quick Setup

### 1. Twilio Account Setup
1. Sign up at [Twilio Console](https://console.twilio.com/)
2. Get a Twilio phone number with Voice capabilities
3. Copy your Account SID, Auth Token, and phone number

### 2. Environment Configuration
1. Copy `.env.example` to `.env`
2. Fill in your Twilio credentials:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+1234567890
   OWNER_PHONE_NUMBER=+1234567891
   SHOP_NAME=Your Auto Shop Name
   ```

### 3. Install and Run
```bash
npm install
npm start
```

### 4. Configure Twilio Webhook
1. Go to your Twilio phone number configuration
2. Set Voice webhook URL to: `http://your-domain.com/voice/incoming`
3. Set HTTP method to POST

## Development Testing

### Local Testing with ngrok
```bash
# Install ngrok globally
npm install -g ngrok

# In one terminal, start the server
npm start

# In another terminal, expose local server
ngrok http 3000

# Use the ngrok URL in your Twilio webhook configuration
# Example: https://abc123.ngrok.io/voice/incoming
```

### Test Endpoints
- **Health Check**: `GET /` - Verify server is running
- **Environment Check**: `GET /test` - Verify Twilio credentials
- **Dashboard**: `GET /admin/dashboard` - View call activity
- **Webhook Test**: `POST /test-webhook` - Test webhook reception

## Call Flow

### 1. Initial Call
- Greeting with shop name and AI introduction
- Listens for customer response
- Routes to appropriate handler based on intent

### 2. FAQ Handling
Automatically answers questions about:
- Business hours
- Services offered
- Location/directions  
- General pricing

### 3. Appointment Booking
- Captures customer name and phone
- Records vehicle and service details
- Offers available time slots
- Confirms appointment and sends SMS to owner

### 4. Call Transfer
- Attempts to connect customer with owner
- Handles busy/no-answer scenarios gracefully
- Falls back to message taking

### 5. Voice Messages
- Records detailed customer messages
- Automatically transcribes using Twilio
- Sends transcription via SMS to owner

## SMS Notifications

The system sends formatted SMS alerts to the owner for:

**New Appointments:**
```
🔧 NEW APPOINTMENT - Your Shop Name

Customer: John Smith  
Phone: +1234567890
Service: Oil change and tire rotation
Date: 12/15/2023
Time: 9:00 AM

Please call the customer to confirm and get more details.
```

**Voice Messages:**
```
📞 VOICE MESSAGE - Your Shop Name

From: +1234567890
Time: 12/15/2023 2:30 PM

Message: Hi, my car is making a strange noise...

Recording: [link to recording]

Please follow up with this customer.
```

## File Structure

```
├── server.js              # Express server with routes
├── config/
│   └── twilio.js          # Twilio client and webhook validation
├── routes/
│   ├── voice.js           # Voice call handling with TwiML
│   ├── sms.js             # SMS handling and test endpoints
│   └── admin.js           # Simple dashboard for monitoring
├── services/
│   ├── smsService.js      # SMS notification service
│   ├── openaiService.js   # OpenAI GPT conversation handling
│   └── twilioService.js   # Twilio API wrapper
├── utils/
│   ├── conversationFlow.js # AI conversation logic
│   └── callLogger.js      # In-memory call logging
└── .env                   # Environment variables
```

## Production Deployment

### Environment Variables
Ensure these are set in production:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN` 
- `TWILIO_PHONE_NUMBER`
- `OWNER_PHONE_NUMBER`
- `SHOP_NAME`
- `NODE_ENV=production`

### Security
- Webhook signature validation is enabled in production
- All sensitive data is stored in environment variables
- Error handling prevents system crashes

## Customization

### Business Information
Edit `services/openaiService.js` system prompt to update:
- Business hours
- Services offered
- Location details
- Pricing information

### Voice Settings

### Appointment Slots
Update `getAvailableTimeSlots()` in `services/openaiService.js` to match your actual availability.

## Troubleshooting

### Common Issues
1. **No voice response**: Check webhook URL and Twilio configuration
2. **Unnatural responses**: Verify OpenAI API key is set correctly
2. **SMS not sending**: Verify phone numbers and Twilio credentials  
3. **Poor speech recognition**: Adjust confidence thresholds in voice.js
4. **Call transfer fails**: Check owner phone number format (+1234567890)

### Logs
Monitor console output for detailed logs of all call activity, errors, and SMS notifications.

## Support

For technical support or customization requests, check the code comments and console logs for debugging information.