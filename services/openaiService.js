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

  // Enhanced context tracking per caller
    this.callContext = new Map();
  
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
  
  // Appointment booking
  ['appointment', {
    action: 'appointment',
    message: "I'd be happy to help schedule your appointment! What service do you need?",
    confidence: 0.9
  }],
  ['schedule', {
    action: 'appointment',
    message: "Perfect! Let's get you scheduled. What's your name and what service do you need?",
    confidence: 0.9
  }],
  ['book', {
    action: 'appointment',
    message: "I can help you book that! What service are you looking to schedule?",
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
  ['speak to owner', {
    action: 'transfer',
    message: "Sure thing! I'll connect you with the owner.",
    confidence: 0.95
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

  extractInfoFromInput(input, context) {
  const lowerInput = input.toLowerCase();
  
  // Extract name if mentioned
  const namePatterns = [
    /my name is (\w+)/i,
    /i'm (\w+)/i,
    /this is (\w+)/i,
    /(\w+) speaking/i
  ];
  
  for (const pattern of namePatterns) {
    const match = input.match(pattern);
    if (match && match[1] && !context.customerName) {
      context.customerName = match[1];
      break;
    }
  }
  
  // Extract vehicle information
  const carBrands = ['honda', 'toyota', 'ford', 'chevy', 'bmw', 'mercedes', 'nissan', 'hyundai'];
  for (const brand of carBrands) {
    if (lowerInput.includes(brand)) {
      context.vehicleInfo = brand;
      break;
    }
  }
  
  // Track service requests
  const services = ['oil change', 'tune up', 'brakes', 'maintenance'];
  for (const service of services) {
    if (lowerInput.includes(service)) {
      context.serviceRequested = service;
      break;
    }
  }
  
  // Track if asking for owner
  if (lowerInput.includes('owner') || lowerInput.includes('manager')) {
    context.hasAskedForOwner = true;
  }
  
  // Track quote requests
  if (lowerInput.includes('quote') || lowerInput.includes('price') || lowerInput.includes('cost')) {
    if (context.serviceRequested && !context.quotesRequested.includes(context.serviceRequested)) {
      context.quotesRequested.push(context.serviceRequested);
    }
  }
}

async processCustomerInput(callerNumber, customerInput, callContext = {}) {
    try {
      // Get or create context for this caller
      let context = this.callContext.get(callerNumber) || {
        customerName: null,
        vehicleInfo: null,
        serviceRequested: null,
        appointmentInProgress: false,
        quotesRequested: [],
        lastTopic: null,
        callStartTime: new Date(),
        hasAskedForOwner: false
      };

      // Check cached responses first
      const cachedResponse = this.checkCachedResponses(customerInput);
      if (cachedResponse) {
        // Update context based on cached response
        this.extractInfoFromInput(customerInput, context);
        this.updateContextFromResponse(context, customerInput, cachedResponse);
        this.callContext.set(callerNumber, context);
        
        console.log('Using cached response for:', customerInput);
        return cachedResponse;
      }

      // Extract information from customer input
      this.extractInfoFromInput(customerInput, context);

      // Get conversation history
      let history = this.conversationHistory.get(callerNumber) || [];
      
      // Build context-aware system prompt
      const systemPrompt = this.buildContextAwareSystemPrompt(context);
      
      // Add customer input to history
      history.push({ role: 'user', content: customerInput });
      
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
        max_tokens: 150,
        temperature: 0.3,
        functions: [
          {
            name: 'determine_action',
            description: 'Determine what action to take based on customer request and context',
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
                  description: 'Natural, conversational response that references previous conversation context when appropriate'
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
      
      // Update context based on AI response
      this.updateContextFromResponse(context, customerInput, result);
      
      // Store updated context and history
      this.callContext.set(callerNumber, context);
      history.push({ role: 'assistant', content: result.response });
      this.conversationHistory.set(callerNumber, history);
      
      return {
        action: result.action,
        message: result.response,
        confidence: result.confidence || 0.8
      };

    } catch (error) {
      console.error('OpenAI API error:', error);
      const fallbackResponse = this.getFallbackResponse(customerInput);
      return fallbackResponse;
    }
  }

buildContextAwareSystemPrompt(context) {
  const shopName = process.env.SHOP_NAME || 'Auto Repair Shop';
  
  let contextInfo = '';
  if (context.customerName) {
    contextInfo += `Customer's name: ${context.customerName}. Use their name naturally in conversation.\n`;
  }
  if (context.vehicleInfo) {
    contextInfo += `Customer's vehicle: ${context.vehicleInfo}. Reference this when relevant.\n`;
  }
  if (context.serviceRequested) {
    contextInfo += `Service requested: ${context.serviceRequested}. Keep this in mind for follow-ups.\n`;
  }
  if (context.hasAskedForOwner) {
    contextInfo += `Customer has asked for the owner. Be prepared to transfer if needed again.\n`;
  }
  
  return `You are Sarah, a friendly professional receptionist for ${shopName}.

CONVERSATION CONTEXT:
${contextInfo}

SERVICES WE OFFER:
- Oil Changes (45 minutes)
- Tune Ups 
- Brake Services
- General Maintenance

CONVERSATION STYLE:
- Reference previous parts of our conversation naturally
- Use the customer's name when you know it
- Remember what services they've asked about
- Always ask relevant follow-up questions after answering
- Show genuine interest in their car's condition
- Keep responses concise but warm and personal
- Keep conversations flowing rather than just answering and stopping

FOLLOW-UP EXAMPLES:
- After oil change info: "How's your car been running? Any unusual noises?"
- After brake info: "When did you first notice the issue?"
- After tune-up info: "What's your car's mileage? Any performance issues?"

If you know the customer's name and vehicle, use that information naturally. 
If they've mentioned a service before, reference it appropriately.
Always sound like you're having a genuine conversation, not starting fresh each time.`;
}

updateContextFromResponse(context, input, response) {
  // Update last topic
  context.lastTopic = response.action;
  
  // Track appointment progress
  if (response.action === 'appointment') {
    context.appointmentInProgress = true;
  }
  
  // Clear context after call ends
  if (response.action === 'goodbye' || response.action === 'hangup') {
    // Keep some info but reset conversation state
    context.appointmentInProgress = false;
    context.lastTopic = null;
  }
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
