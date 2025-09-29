// Persistent call logging using Vercel KV (Redis)
const { kv } = require('@vercel/kv');

class CallLogger {
  constructor() {
    // Check if KV is available
    this.useKV = !!process.env.KV_REST_API_URL;
    
    if (!this.useKV) {
      console.warn('⚠️ Vercel KV not configured. Using in-memory storage (data will be lost on restart)');
      this.calls = [];
      this.messages = [];
      this.appointments = [];
    }
  }

  async logCall(callData) {
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      callerNumber: callData.callerNumber,
      action: callData.action,
      details: callData.details || '',
      duration: callData.duration || 0
    };
    
    if (this.useKV) {
      try {
        // Add to calls list
        await kv.lpush('calls', JSON.stringify(logEntry));
        // Keep only last 100 calls
        await kv.ltrim('calls', 0, 99);
        // Update stats
        await kv.incr('stats:totalCalls');
        await kv.set('stats:lastCall', logEntry.timestamp);
      } catch (error) {
        console.error('Error logging call to KV:', error);
      }
    } else {
      this.calls.push(logEntry);
    }
    
    console.log('Call logged:', logEntry);
    return logEntry;
  }

  async logMessage(messageData) {
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      callerNumber: messageData.callerNumber,
      transcription: messageData.transcription,
      recordingUrl: messageData.recordingUrl
    };
    
    if (this.useKV) {
      try {
        await kv.lpush('messages', JSON.stringify(logEntry));
        await kv.ltrim('messages', 0, 99);
        await kv.incr('stats:totalMessages');
      } catch (error) {
        console.error('Error logging message to KV:', error);
      }
    } else {
      this.messages.push(logEntry);
    }
    
    console.log('Message logged:', logEntry);
    return logEntry;
  }

  async logAppointment(appointmentData) {
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      customerName: appointmentData.customerName,
      customerPhone: appointmentData.customerPhone,
      service: appointmentData.service,
      appointmentDate: appointmentData.date,
      appointmentTime: appointmentData.time,
      status: 'scheduled'
    };
    
    if (this.useKV) {
      try {
        await kv.lpush('appointments', JSON.stringify(logEntry));
        await kv.ltrim('appointments', 0, 99);
        await kv.incr('stats:totalAppointments');
      } catch (error) {
        console.error('Error logging appointment to KV:', error);
      }
    } else {
      this.appointments.push(logEntry);
    }
    
    console.log('Appointment logged:', logEntry);
    return logEntry;
  }

  async getRecentCalls(limit = 10) {
    if (this.useKV) {
      try {
        const calls = await kv.lrange('calls', 0, limit - 1);
        return calls.map(call => JSON.parse(call));
      } catch (error) {
        console.error('Error fetching calls from KV:', error);
        return [];
      }
    }
    return this.calls.slice(-limit);
  }

  async getRecentMessages(limit = 10) {
    if (this.useKV) {
      try {
        const messages = await kv.lrange('messages', 0, limit - 1);
        return messages.map(msg => JSON.parse(msg));
      } catch (error) {
        console.error('Error fetching messages from KV:', error);
        return [];
      }
    }
    return this.messages.slice(-limit);
  }

  async getRecentAppointments(limit = 10) {
    if (this.useKV) {
      try {
        const appointments = await kv.lrange('appointments', 0, limit - 1);
        return appointments.map(apt => JSON.parse(apt));
      } catch (error) {
        console.error('Error fetching appointments from KV:', error);
        return [];
      }
    }
    return this.appointments.slice(-limit);
  }

  async getStats() {
    if (this.useKV) {
      try {
        const [totalCalls, totalMessages, totalAppointments, lastCall] = await Promise.all([
          kv.get('stats:totalCalls'),
          kv.get('stats:totalMessages'),
          kv.get('stats:totalAppointments'),
          kv.get('stats:lastCall')
        ]);

        return {
          totalCalls: totalCalls || 0,
          totalMessages: totalMessages || 0,
          totalAppointments: totalAppointments || 0,
          lastCall: lastCall || null
        };
      } catch (error) {
        console.error('Error fetching stats from KV:', error);
        return {
          totalCalls: 0,
          totalMessages: 0,
          totalAppointments: 0,
          lastCall: null
        };
      }
    }

    return {
      totalCalls: this.calls.length,
      totalMessages: this.messages.length,
      totalAppointments: this.appointments.length,
      lastCall: this.calls.length > 0 ? this.calls[this.calls.length - 1].timestamp : null
    };
  }
}

module.exports = new CallLogger();
