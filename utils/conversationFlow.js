const businessInfo = {
  hours: {
    weekday: 'Monday through Friday, 8 AM to 6 PM',
    saturday: 'Saturday 9 AM to 4 PM',
    sunday: 'Closed on Sundays'
  },
  services: [
    'oil changes',
    'brake repair and replacement',
    'tire rotation and balancing',
    'engine diagnostics',
    'transmission repair',
    'air conditioning service',
    'battery testing and replacement',
    'general automotive maintenance'
  ],
  location: 'We are located on Main Street with easy parking available',
  pricing: 'Our prices are competitive and we provide free estimates for most services'
};

function processCustomerInput(input) {
  const lowerInput = input.toLowerCase();
  
  // Hours inquiry
  if (lowerInput.includes('hour') || lowerInput.includes('open') || lowerInput.includes('close') || lowerInput.includes('time')) {
    return {
      action: 'faq',
      message: `Our business hours are ${businessInfo.hours.weekday}, ${businessInfo.hours.saturday}, and we're ${businessInfo.hours.sunday}.`
    };
  }
  
  // Services inquiry
  if (lowerInput.includes('service') || lowerInput.includes('repair') || lowerInput.includes('fix') || lowerInput.includes('maintenance')) {
    return {
      action: 'faq',
      message: `We offer a full range of automotive services including ${businessInfo.services.slice(0, 4).join(', ')}, and many other services. Would you like to schedule an appointment or speak with the owner for more details?`
    };
  }
  
  // Location/directions inquiry
  if (lowerInput.includes('location') || lowerInput.includes('address') || lowerInput.includes('where') || lowerInput.includes('direction')) {
    return {
      action: 'faq',
      message: `${businessInfo.location}. Would you like me to transfer you to the owner for specific directions?`
    };
  }
  
  // Pricing inquiry
  if (lowerInput.includes('price') || lowerInput.includes('cost') || lowerInput.includes('estimate') || lowerInput.includes('how much')) {
    return {
      action: 'faq',
      message: `${businessInfo.pricing}. Would you like to schedule an appointment for a free estimate?`
    };
  }
  
  // Appointment related keywords
  if (lowerInput.includes('appointment') || lowerInput.includes('schedule') || lowerInput.includes('book') || lowerInput.includes('available')) {
    return {
      action: 'appointment',
      message: "I'd be happy to help schedule your appointment."
    };
  }
  
  // Owner/manager request
  if (lowerInput.includes('owner') || lowerInput.includes('manager') || lowerInput.includes('speak') || lowerInput.includes('talk') || lowerInput.includes('human')) {
    return {
      action: 'transfer',
      message: "I'll connect you with the shop owner right away."
    };
  }
  
  // Emergency or urgent keywords
  if (lowerInput.includes('emergency') || lowerInput.includes('urgent') || lowerInput.includes('broken') || lowerInput.includes('stuck')) {
    return {
      action: 'transfer',
      message: "This sounds urgent. Let me connect you with the owner immediately."
    };
  }
  
  // Message/callback request
  if (lowerInput.includes('message') || lowerInput.includes('callback') || lowerInput.includes('call back')) {
    return {
      action: 'message',
      message: "I can take a detailed message for you."
    };
  }
  
  // Goodbye/end call
  if (lowerInput.includes('goodbye') || lowerInput.includes('bye') || lowerInput.includes('thanks') || lowerInput.includes('thank you')) {
    return {
      action: 'goodbye',
      message: "You're welcome! Thank you for choosing our shop."
    };
  }
  
  // Default response for unclear input
  return {
    action: 'clarify',
    message: "I can help you with our business hours, services, scheduling an appointment, or connect you with the owner. What would you like to know?"
  };
}

function getAvailableTimeSlots() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  
  return [
    { date: tomorrow.toLocaleDateString(), time: '9:00 AM' },
    { date: tomorrow.toLocaleDateString(), time: '2:00 PM' },
    { date: dayAfter.toLocaleDateString(), time: '10:00 AM' },
    { date: dayAfter.toLocaleDateString(), time: '3:00 PM' }
  ];
}

module.exports = {
  processCustomerInput,
  getAvailableTimeSlots,
  businessInfo
};