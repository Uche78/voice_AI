const OpenAI = require('openai');
const { businessInfo } = require('../utils/conversationFlow');

let openai = null;

function getOpenAIClient() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

class OpenAIService {
constructor() {
  this.conversationHistory = new Map();
  
  // Pre-generated responses for common questions
  this.commonResponses = new Map([
  // Hours questions
  ['hours', {
    action: 'faq',
    message: "We're open Monday through Friday from 8 to 6, Saturday 9 to 4, and closed Sundays. Is there a particular day you were hoping to come in?",
    confidence: 0.9
  }],
  ['open', {
    action: 'faq', 
    message: "We're open Monday through Friday from 8 to 6, Saturday 9 to 4, and closed Sundays. What day works best for you?",
    confidence: 0.9
  }],
  ['close', {
    action: 'faq',
    message: "We close at 6 PM on weekdays, 4 PM on Saturday, and we're closed Sundays. Need to come in before closing?",
    confidence: 0.9
  }],
  
  // Services questions
  ['services', {
    action: 'faq',
    message: "We do all kinds of automotive work - oil changes, brake repairs, tire services, engine diagnostics, transmission work, AC service, and general maintenance. What's going on with your car?",
    confidence: 0.9
  }],
  ['oil change', {
    action: 'faq',
    message: "Absolutely! We do oil changes. Usually takes about 30 minutes. Would you like to schedule one?",
    confidence: 0.9
  }],
  ['brakes', {
    action: 'faq',
    message: "Yes, we handle all brake work - pads, rotors, fluid, you name it. We can give you a free estimate. Want to set up an appointment?",
    confidence: 0.9
  }],
  
  // Location questions
  ['location', {
    action: 'faq',
    message: "We're located on Main Street with easy parking available. Need specific directions?",
    confidence: 0.9
  }],
  ['address', {
    action: 'faq',
    message: "We're on Main Street with easy parking. Would you like me to connect you with the owner for exact directions?",
    confidence: 0.9
  }],
  
  // Pricing questions
  ['price', {
    action: 'faq',
    message: "Our prices are really competitive and we always give free estimates! What kind of work are you thinking about?",
    confidence: 0.9
  }],
  ['cost', {
    action: 'faq',
    message: "We keep our prices fair and provide free estimates for most services. What can we help you with?",
    confidence: 0.9
  }],
  ['estimate', {
    action: 'faq',
    message: "We'd be happy to give you an estimate! You'll need to bring the car in so we can take a proper look. When works for you?",
    confidence: 0.9
  }],
  ['quote', {
    action: 'faq',
    message: "For an accurate quote, we'll need to see your car in person. Would you like to schedule a time to bring it in?",
    confidence: 0.9
  }],
  
  // Appointment requests
  ['appointment', {
    action: 'appointment',
    message: "I'd love to help you schedule an appointment! What kind of service does your car need?",
    confidence: 0.9
  }],
  ['schedule', {
    action: 'appointment',
    message: "Perfect! Let's get you scheduled. What's your name?",
    confidence: 0.9
  }],
  
  // Towing & Emergency
  ['tow', {
    action: 'transfer',
    message: "We do provide towing service! Let me connect you with the owner to arrange that right away.",
    confidence: 0.9
  }],
  ['broke down', {
    action: 'transfer',
    message: "Oh no! Let me get the owner on the line immediately to help with your breakdown.",
    confidence: 0.9
  }],
  ['emergency', {
    action: 'transfer',
    message: "I'll get the owner right now to help with your emergency situation.",
    confidence: 0.9
  }],
  ['stranded', {
    action: 'transfer',
    message: "Let me connect you with the owner immediately so we can get you help.",
    confidence: 0.9
  }],
  
  // Mechanic-specific requests
  ['tony', {
    action: 'transfer',
    message: "Let me check if Tony's available and connect you with him.",
    confidence: 0.9
  }],
  ['mike', {
    action: 'transfer',
    message: "I'll see if Mike is free to talk with you.",
    confidence: 0.9
  }],
  ['mechanic', {
    action: 'transfer',
    message: "Let me connect you with one of our mechanics.",
    confidence: 0.9
  }],
  
  // Brand-specific questions
  ['bmw', {
    action: 'faq',
    message: "Yes, we work on all makes including BMW. Our mechanics are experienced with European vehicles. What's going on with your BMW?",
    confidence: 0.9
  }],
  ['honda', {
    action: 'faq',
    message: "Absolutely! We service Honda vehicles all the time. What's your Honda needing?",
    confidence: 0.9
  }],
  ['toyota', {
    action: 'faq',
    message: "Yes, we work on Toyota vehicles regularly. What can we help you with?",
    confidence: 0.9
  }],
  ['ford', {
    action: 'faq',
    message: "We service Ford vehicles. What's your Ford needing?",
    confidence: 0.9
  }],
  ['european', {
    action: 'faq',
    message: "Yes, we work on European cars - BMW, Mercedes, Audi, Volkswagen, you name it. What's going on with your car?",
    confidence: 0.9
  }],
  
  // Problem descriptions
  ['squeaking', {
    action: 'faq',
    message: "Squeaking often means brake pads, but we'd need to take a look to be sure. Want to schedule an inspection?",
    confidence: 0.8
  }],
  ['noise', {
    action: 'faq',
    message: "Car noises can mean different things depending on where they're coming from. We'd need to hear it in person. Can you bring it in?",
    confidence: 0.8
  }],
  ['check engine', {
    action: 'faq',
    message: "Check engine lights need a diagnostic scan to see what's wrong. We can run that for you. When can you come in?",
    confidence: 0.8
  }],
  ['overheating', {
    action: 'transfer',
    message: "Overheating can be serious. Let me get the owner to talk with you about this right away.",
    confidence: 0.9
  }],
  
  // Appointment management
  ['running late', {
    action: 'transfer',
    message: "No worries at all! Let me connect you with the owner so they can update your appointment time.",
    confidence: 0.9
  }],
  ['reschedule', {
    action: 'transfer', 
    message: "I can help with that! Let me get the owner to check the schedule and find you a new time.",
    confidence: 0.9
  }],
  ['cancel', {
    action: 'transfer',
    message: "No problem. Let me connect you with the owner to cancel your appointment.",
    confidence: 0.9
  }],
  ['confirm appointment', {
    action: 'transfer',
    message: "Let me connect you with the owner to confirm your appointment details.",
    confidence: 0.9
  }],
  
  // Follow-up calls
  ['is it ready', {
    action: 'transfer',
    message: "Let me connect you with the owner to check on your car's status.",
    confidence: 0.9
  }],
  ['called about', {
    action: 'transfer',
    message: "Perfect! Let me get the owner who called you.",
    confidence: 0.9
  }],
  ['dropped off', {
    action: 'transfer',
    message: "I'll connect you with the owner to check on your car.",
    confidence: 0.9
  }],
  
  // Owner/staff requests
  ['owner', {
    action: 'transfer',
    message: "Of course! Let me get the owner for you.",
    confidence: 0.9
  }],
  ['manager', {
    action: 'transfer',
    message: "I'll connect you with the owner who manages the shop.",
    confidence: 0.9
  }],
  ['speak to someone', {
    action: 'transfer',
    message: "Absolutely! Let me get the owner on the line for you.",
    confidence: 0.9
  }]
]);
  }

  async processCustomerInput(callerNumber, customerInput, callContext = {}) {
    try {
      // Add this cache check at the very beginning:
      const cachedResponse = this.checkCachedResponses(customerInput);
      if (cachedResponse) {
      console.log('Using cached response for:', customerInput);
      return cachedResponse;
      }
      
      // Get or create conversation history for this caller
      let history = this.conversationHistory.get(callerNumber) || [];
      
      // Build the system prompt with business information
      const systemPrompt = this.buildSystemPrompt();
      
      // Add customer input to history
      history.push({ role: 'user', content: customerInput });
      
      // Keep history manageable (last 10 exchanges)
      if (history.length > 20) {
        history = history.slice(-20);
      }
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history
      ];

      const completion = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 100,
        temperature: 0.3,
        functions: [
          {
            name: 'determine_action',
            description: 'Determine what action to take based on customer request',
            parameters: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['faq', 'appointment', 'transfer', 'message', 'goodbye', 'clarify'],
                  description: 'The action to take'
                },
                response: {
                  type: 'string',
                  description: 'Natural, conversational response to the customer'
                },
                confidence: {
                  type: 'number',
                  description: 'Confidence level from 0 to 1'
                }
              },
              required: ['action', 'response', 'confidence']
            }
          }
        ],
        function_call: { name: 'determine_action' }
      });

      const functionCall = completion.choices[0].message.function_call;
      const result = JSON.parse(functionCall.arguments);
      
      // Add AI response to history
      history.push({ role: 'assistant', content: result.response });
      this.conversationHistory.set(callerNumber, history);
      
      return {
        action: result.action,
        message: result.response,
        confidence: result.confidence || 0.8
      };

    } catch (error) {
      console.error('OpenAI API error:', error);
      
      // Fallback to basic processing if OpenAI fails
      const fallbackResponse = this.getFallbackResponse(customerInput);
      return fallbackResponse;
    }
  }

  buildSystemPrompt() {
    const shopName = process.env.SHOP_NAME || 'Auto Repair Shop';
    
    return `You are a friendly, professional receptionist for ${shopName}. You sound warm, helpful, and conversational - like talking to a real person, not a robot.

BUSINESS INFORMATION:
- Hours: ${businessInfo.hours.weekday}, ${businessInfo.hours.saturday}, ${businessInfo.hours.sunday}
- Services: ${businessInfo.services.join(', ')}
- Location: ${businessInfo.location}
- Pricing: ${businessInfo.pricing}

CONVERSATION STYLE:
- Sound natural and conversational, like a real receptionist
- Use casual, friendly language ("Oh sure!", "Absolutely!", "Let me help you with that!")
- Ask follow-up questions to be helpful
- Show genuine interest in helping the customer
- Keep responses concise but warm

ACTIONS TO TAKE:
- "faq": Answer questions about hours, services, location, pricing naturally
- "appointment": Customer wants to schedule service
- "transfer": Customer wants to speak with owner/manager or has complex issues
- "message": Customer wants to leave a message
- "goodbye": Customer is ending the conversation
- "clarify": Need more information to help properly

EXAMPLES OF NATURAL RESPONSES:
Instead of: "Our business hours are Monday through Friday, 8 AM to 6 PM"
Say: "Oh sure! We're open Monday through Friday from 8 to 6, Saturday 9 to 4, and closed Sundays. Is there a particular day you were hoping to come in?"

Instead of: "We offer oil changes, brake repair, and tire rotation"
Say: "Absolutely! We do all kinds of work - oil changes, brake repairs, tire stuff, engine diagnostics, you name it. What's going on with your car?"

Always be helpful and try to move the conversation forward naturally.`;
  }

  getFallbackResponse(input) {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('hour') || lowerInput.includes('open')) {
      return {
        action: 'faq',
        message: "Oh sure! We're open Monday through Friday from 8 to 6, Saturday 9 to 4, and closed Sundays. Is there a particular day you were hoping to come in?",
        confidence: 0.7
      };
    }
    
    if (lowerInput.includes('appointment') || lowerInput.includes('schedule')) {
      return {
        action: 'appointment',
        message: "I'd love to help you schedule an appointment! What kind of service does your car need?",
        confidence: 0.8
      };
    }
    
    return {
      action: 'clarify',
      message: "I want to make sure I help you with exactly what you need. Could you tell me a bit more about what you're looking for?",
      confidence: 0.6
    };
  }

  async generateSpeech(text, voice = 'nova') {
    try {
      const mp3 = await getOpenAIClient().audio.speech.create({
        model: 'tts-1',
        voice: voice, // nova, alloy, echo, fable, onyx, shimmer
        input: text,
        speed: 0.9 // Slightly slower for clarity
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      return buffer;
    } catch (error) {
      console.error('OpenAI TTS error:', error);
      return null;
    }
  }

  clearConversationHistory(callerNumber) {
    this.conversationHistory.delete(callerNumber);
  }

  // Get available appointment slots with natural language
  getAvailableTimeSlots() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    const slots = [
      { date: tomorrow.toLocaleDateString(), time: '9:00 AM', dayName: this.getDayName(tomorrow) },
      { date: tomorrow.toLocaleDateString(), time: '2:00 PM', dayName: this.getDayName(tomorrow) },
      { date: dayAfter.toLocaleDateString(), time: '10:00 AM', dayName: this.getDayName(dayAfter) },
      { date: dayAfter.toLocaleDateString(), time: '3:00 PM', dayName: this.getDayName(dayAfter) }
    ];
    
    return slots;
  }

  getDayName(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  formatAvailableSlots() {
    const slots = this.getAvailableTimeSlots();
    const tomorrow = slots[0];
    const dayAfter = slots[2];
    
    return `I have some openings coming up. Tomorrow ${tomorrow.dayName} I have ${tomorrow.time} or ${slots[1].time}, and ${dayAfter.dayName} I have ${dayAfter.time} or ${slots[3].time}. What works better for you?`;
  }

  checkCachedResponses(input) {
  const lowerInput = input.toLowerCase();
  
  // Check for appointment intent FIRST (higher priority)
  if (lowerInput.includes('schedule') || lowerInput.includes('appointment') || 
      lowerInput.includes('book') || lowerInput.includes('need') && 
      (lowerInput.includes('oil') || lowerInput.includes('brake') || lowerInput.includes('service'))) {
    return {
      action: 'appointment',
      message: "I'd love to help you schedule that! What's your name?",
      confidence: 0.9
    };
  }
  
  // Then check for pure FAQ questions (only when NOT requesting service)
  if (!lowerInput.includes('schedule') && !lowerInput.includes('appointment') && 
      !lowerInput.includes('book') && !lowerInput.includes('need')) {
    
    for (const [keyword, response] of this.commonResponses) {
      if (lowerInput.includes(keyword)) {
        return response;
      }
    }
    
    // Check for compound questions
    if (lowerInput.includes('hour') || lowerInput.includes('open') || lowerInput.includes('close')) {
      return this.commonResponses.get('hours');
    }
    
    if (lowerInput.includes('service') || lowerInput.includes('repair') || lowerInput.includes('fix')) {
      return this.commonResponses.get('services');
    }
  }
  
  return null;
 }

}

module.exports = new OpenAIService();
