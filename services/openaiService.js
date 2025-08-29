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
    this.conversationHistory = new Map(); // Store conversation context per caller
  }

  async processCustomerInput(callerNumber, customerInput, callContext = {}) {
    try {
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
        model: 'gpt-4',
        messages: messages,
        max_tokens: 200,
        temperature: 0.7,
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
}

module.exports = new OpenAIService();