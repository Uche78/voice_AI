const axios = require('axios');

class ElevenLabsService {
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.agentId = process.env.ELEVENLABS_AGENT_ID;
    this.baseURL = 'https://api.elevenlabs.io/v1';
    this.isConfigured = !!this.apiKey;
    
    if (!this.apiKey) {
      console.warn('⚠️ ElevenLabs API key not found. Dashboard will show limited data.');
    }
  }

  // Check if service is properly configured
  isEnabled() {
    return this.isConfigured;
  }

  // Get headers for API requests
  getHeaders() {
    return {
      'xi-api-key': this.apiKey,
      'Content-Type': 'application/json'
    };
  }

  // Get all conversations for the agent
  async getConversations(limit = 50, offset = 0) {
    if (!this.isConfigured) {
      return { conversations: [] };
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/convai/conversations`,
        {
          headers: this.getHeaders(),
          params: {
            agent_id: this.agentId,
            limit: limit,
            offset: offset
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error.response?.data || error.message);
      return { conversations: [] };
    }
  }

  // Get specific conversation details
  async getConversationById(conversationId) {
    if (!this.isConfigured) {
      return { error: 'ElevenLabs not configured' };
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/convai/conversations/${conversationId}`,
        {
          headers: this.getHeaders()
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation details:', error.response?.data || error.message);
      return { error: 'Conversation not found' };
    }
  }

  // Get conversation messages/transcript
  async getConversationMessages(conversationId) {
    if (!this.isConfigured) {
      return { messages: [] };
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/convai/conversations/${conversationId}/messages`,
        {
          headers: this.getHeaders()
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation messages:', error.response?.data || error.message);
      return { messages: [] };
    }
  }

  // Get conversation audio recording
  async getConversationAudio(conversationId) {
    if (!this.isConfigured) {
      throw new Error('ElevenLabs not configured');
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/convai/conversations/${conversationId}/audio`,
        {
          headers: this.getHeaders(),
          responseType: 'stream'
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation audio:', error.response?.data || error.message);
      throw error;
    }
  }

  // Format conversation data for dashboard display
  formatConversationForDashboard(conversation) {
    return {
      id: conversation.conversation_id,
      startTime: new Date(conversation.start_time).toLocaleString(),
      endTime: conversation.end_time ? 
        new Date(conversation.end_time).toLocaleString() : 'Ongoing',
      duration: this.calculateDuration(conversation.start_time, conversation.end_time),
      callerNumber: conversation.caller_number || 'Unknown',
      status: conversation.status || 'completed',
      summary: conversation.summary || 'No summary available',
      messageCount: conversation.message_count || 0,
      agentName: 'Sarah (Auto Shop Receptionist)'
    };
  }

  // Calculate conversation duration
  calculateDuration(startTime, endTime) {
    if (!endTime) return 'Ongoing';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    return `${diffMins}m ${diffSecs}s`;
  }

  // Get conversation statistics
  async getConversationStats() {
    if (!this.isConfigured) {
      return {
        totalConversations: 0,
        todayConversations: 0,
        avgDuration: 'N/A',
        successfulCalls: 0,
        transferredCalls: 0
      };
    }

    try {
      const conversations = await this.getConversations(100);
      
      const stats = {
        totalConversations: conversations.conversations?.length || 0,
        todayConversations: 0,
        avgDuration: 0,
        successfulCalls: 0,
        transferredCalls: 0
      };

      if (conversations.conversations) {
        const today = new Date().toDateString();
        let totalDuration = 0;
        let completedCalls = 0;

        conversations.conversations.forEach(conv => {
          const convDate = new Date(conv.start_time).toDateString();
          if (convDate === today) {
            stats.todayConversations++;
          }

          if (conv.end_time) {
            const duration = new Date(conv.end_time) - new Date(conv.start_time);
            totalDuration += duration;
            completedCalls++;
          }

          if (conv.status === 'completed') {
            stats.successfulCalls++;
          }

          // Check if conversation was transferred
          if (conv.summary?.includes('transferred') || conv.summary?.includes('owner')) {
            stats.transferredCalls++;
          }
        });

        if (completedCalls > 0) {
          const avgMs = totalDuration / completedCalls;
          stats.avgDuration = `${Math.floor(avgMs / 60000)}m ${Math.floor((avgMs % 60000) / 1000)}s`;
        } else {
          stats.avgDuration = 'N/A';
        }
      }

      return stats;
    } catch (error) {
      console.error('Error getting conversation stats:', error);
      return {
        totalConversations: 0,
        todayConversations: 0,
        avgDuration: 'N/A',
        successfulCalls: 0,
        transferredCalls: 0
      };
    }
  }
}

module.exports = new ElevenLabsService();
