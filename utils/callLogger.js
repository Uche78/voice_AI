// Simple in-memory call logging for development
// In production, this would use a database

class CallLogger {
  constructor() {
    this.calls = [];
    this.messages = [];
    this.appointments = [];
  }

  logCall(callData) {
    const logEntry = {
      id: this.calls.length + 1,
      timestamp: new Date().toISOString(),
      callerNumber: callData.callerNumber,
      action: callData.action,
      details: callData.details || '',
      duration: callData.duration || 0
    };
    
    this.calls.push(logEntry);
    console.log('Call logged:', logEntry);
    return logEntry;
  }

  logMessage(messageData) {
    const logEntry = {
      id: this.messages.length + 1,
      timestamp: new Date().toISOString(),
      callerNumber: messageData.callerNumber,
      transcription: messageData.transcription,
      recordingUrl: messageData.recordingUrl
    };
    
    this.messages.push(logEntry);
    console.log('Message logged:', logEntry);
    return logEntry;
  }

  logAppointment(appointmentData) {
    const logEntry = {
      id: this.appointments.length + 1,
      timestamp: new Date().toISOString(),
      customerName: appointmentData.customerName,
      customerPhone: appointmentData.customerPhone,
      service: appointmentData.service,
      appointmentDate: appointmentData.date,
      appointmentTime: appointmentData.time,
      status: 'scheduled'
    };
    
    this.appointments.push(logEntry);
    console.log('Appointment logged:', logEntry);
    return logEntry;
  }

  getRecentCalls(limit = 10) {
    return this.calls.slice(-limit);
  }

  getRecentMessages(limit = 10) {
    return this.messages.slice(-limit);
  }

  getRecentAppointments(limit = 10) {
    return this.appointments.slice(-limit);
  }

  getStats() {
    return {
      totalCalls: this.calls.length,
      totalMessages: this.messages.length,
      totalAppointments: this.appointments.length,
      lastCall: this.calls.length > 0 ? this.calls[this.calls.length - 1].timestamp : null
    };
  }
}

module.exports = new CallLogger();