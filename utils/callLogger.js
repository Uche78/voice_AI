// Persistent call logging using Vercel KV (Redis) - Debug Version
let kv;
let kvAvailable = false;

try {
  // Try to import Vercel KV
  const kvModule = require('@vercel/kv');
  kv = kvModule.kv;
  kvAvailable = !!process.env.KV_REST_API_URL;
} catch (error) {
  console.warn('⚠️ Vercel KV not available:', error.message);
  kvAvailable = false;
}

class CallLogger {
  constructor() {
    this.useKV = kvAvailable;
    
    // Always initialize in-memory storage as fallback
    this.calls = [];
    this.messages = [];
    this.appointments = [];
    
    if (!this.useKV) {
      console.warn('⚠️ Vercel KV not configured. Using in-memory storage (data will be lost on restart)');
    } else {
      console.log('✅ Vercel KV is configured and available');
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
        await kv.lpush('calls', JSON.stringify(logEntry));
        await kv.ltrim('calls', 0, 99);
        await kv.incr('stats:totalCalls');
        await kv.set('stats:lastCall', logEntry.timestamp);
      } catch (error) {
        console.error('Error logging call to KV:', error);
        // Fallback to in-memory
        this.calls.push(logEntry);
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
        this.messages.push(logEntry);
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
        this.appointments.push(logEntry);
      }
    } else {
      this.appointments.push(logEntry);
    }
    
    console.log('Appointment logged:', logEntry);
    return logEntry;
  }

  async getRecentCalls(limit = 10) {
    console.log('getRecentCalls called, useKV:', this.useKV);
    
    if (this.useKV) {
      try {
        const calls = await kv.lrange('calls', 0, limit - 1);
        console.log('KV returned calls:', calls, 'Type:', typeof calls, 'IsArray:', Array.isArray(calls));
        
        if (!calls || !Array.isArray(calls)) {
          console.log('No calls or not array, returning empty array');
          return [];
        }
        
        const parsed = calls.map(call => {
          try {
            return typeof call === 'string' ? JSON.parse(call) : call;
          } catch (e) {
            console.error('Error parsing call:', e);
            return null;
          }
        }).filter(call => call !== null);
        
        console.log('Returning parsed calls:', parsed.length);
        return parsed;
      } catch (error) {
        console.error('Error fetching calls from KV:', error);
        return [];
      }
    }
    
    console.log('Using in-memory calls:', this.calls.length);
    return this.calls.slice(-limit);
  }

  async getRecentMessages(limit = 10) {
    if (this.useKV) {
      try {
        const messages = await kv.lrange('messages', 0, limit - 1);
        
        if (!messages || !Array.isArray(messages)) {
          return [];
        }
        
        return messages.map(msg => {
          try {
            return typeof msg === 'string' ? JSON.parse(msg) : msg;
          } catch (e) {
            console.error('Error parsing message:', e);
            return null;
          }
        }).filter(msg => msg !== null);
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
        
        if (!appointments || !Array.isArray(appointments)) {
          return [];
        }
        
        return appointments.map(apt => {
          try {
            return typeof apt === 'string' ? JSON.parse(apt) : apt;
          } catch (e) {
            console.error('Error parsing appointment:', e);
            return null;
          }
        }).filter(apt => apt !== null);
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
