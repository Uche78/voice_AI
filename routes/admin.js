const express = require('express');
const callLogger = require('../utils/callLogger');
const elevenlabsService = require('../services/elevenlabsService');

const router = express.Router();

// Enhanced admin dashboard with ElevenLabs conversation history
router.get('/dashboard', async (req, res) => {
  try {
    // Get local stats (your existing system) - NOW WITH AWAIT
    const localStats = await callLogger.getStats();
    const recentCalls = await callLogger.getRecentCalls(5);
    const recentMessages = await callLogger.getRecentMessages(5);
    const recentAppointments = await callLogger.getRecentAppointments(5);
    
    // Get ElevenLabs conversation data
    let elevenlabsStats = {};
    let conversations = [];
    
    try {
      elevenlabsStats = await elevenlabsService.getConversationStats();
      const conversationsData = await elevenlabsService.getConversations(20);
      
      if (conversationsData.conversations) {
        conversations = conversationsData.conversations.map(conv => 
          elevenlabsService.formatConversationForDashboard(conv)
        );
      }
    } catch (error) {
      console.error('Error fetching ElevenLabs data:', error);
      // Continue with local data only
    }
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>AI Receptionist Dashboard</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1400px; margin: 0 auto; }
        .card { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .stat { text-align: center; padding: 15px; }
        .stat-number { font-size: 2em; font-weight: bold; color: #2563eb; }
        .stat-label { color: #666; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
        th { background-color: #f8f9fa; font-weight: 600; }
        .timestamp { color: #666; font-size: 0.9em; }
        h1 { color: #1f2937; }
        h2 { color: #374151; margin-top: 30px; }
        .tab-container { margin: 20px 0; }
        .tab-buttons { display: flex; gap: 10px; margin-bottom: 20px; }
        .tab-button { 
          padding: 10px 20px; 
          background: #e5e7eb; 
          border: none; 
          border-radius: 5px; 
          cursor: pointer; 
        }
        .tab-button.active { background: #3b82f6; color: white; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .conversation-row { cursor: pointer; }
        .conversation-row:hover { background-color: #f9f9f9; }
        .status-completed { color: #10b981; font-weight: bold; }
        .status-ongoing { color: #f59e0b; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 AI Car Shop Receptionist Dashboard</h1>
        
        <div class="card">
          <h2>System Statistics</h2>
          <div class="stats">
            <div class="stat">
              <div class="stat-number">${elevenlabsStats.totalConversations || localStats.totalCalls}</div>
              <div class="stat-label">Total Conversations</div>
            </div>
            <div class="stat">
              <div class="stat-number">${elevenlabsStats.todayConversations || 0}</div>
              <div class="stat-label">Today's Calls</div>
            </div>
            <div class="stat">
              <div class="stat-number">${elevenlabsStats.avgDuration || 'N/A'}</div>
              <div class="stat-label">Avg Duration</div>
            </div>
            <div class="stat">
              <div class="stat-number">${localStats.totalAppointments}</div>
              <div class="stat-label">Appointments Booked</div>
            </div>
            <div class="stat">
              <div class="stat-number">${elevenlabsStats.transferredCalls || 0}</div>
              <div class="stat-label">Transferred to Owner</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="tab-container">
            <div class="tab-buttons">
              <button class="tab-button active" onclick="showTab('conversations')">ElevenLabs Conversations</button>
              <button class="tab-button" onclick="showTab('legacy')">Legacy Call Logs</button>
              <button class="tab-button" onclick="showTab('appointments')">Appointments</button>
            </div>

            <div id="conversations" class="tab-content active">
              <h2>Recent AI Conversations</h2>
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Caller</th>
                    <th>Duration</th>
                    <th>Messages</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${conversations.length > 0 ? conversations.map(conv => `
                    <tr class="conversation-row" onclick="viewConversation('${conv.id}')">
                      <td class="timestamp">${conv.startTime}</td>
                      <td>${conv.callerNumber}</td>
                      <td>${conv.duration}</td>
                      <td>${conv.messageCount}</td>
                      <td class="status-${conv.status}">${conv.status}</td>
                      <td>
                        <button onclick="event.stopPropagation(); viewTranscript('${conv.id}')" style="padding: 5px 10px; margin-right: 5px;">View Transcript</button>
                        <button onclick="event.stopPropagation(); playAudio('${conv.id}')" style="padding: 5px 10px;">Play Audio</button>
                      </td>
                    </tr>
                  `).join('') : '<tr><td colspan="6" style="text-align: center; padding: 20px;">No ElevenLabs conversations yet. They will appear here once you enable ConvAI.</td></tr>'}
                </tbody>
              </table>
            </div>

            <div id="legacy" class="tab-content">
              <h2>Legacy Call Activity</h2>
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Phone Number</th>
                    <th>Action</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  ${recentCalls.length > 0 ? recentCalls.map(call => `
                    <tr>
                      <td class="timestamp">${new Date(call.timestamp).toLocaleString()}</td>
                      <td>${call.callerNumber}</td>
                      <td>${call.action}</td>
                      <td>${call.details}</td>
                    </tr>
                  `).join('') : '<tr><td colspan="4" style="text-align: center; padding: 20px;">No calls logged yet. Make a test call to see data here!</td></tr>'}
                </tbody>
              </table>
            </div>

            <div id="appointments" class="tab-content">
              <h2>Recent Appointments</h2>
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Service</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${recentAppointments.length > 0 ? recentAppointments.map(apt => `
                    <tr>
                      <td>${apt.customerName}</td>
                      <td>${apt.customerPhone}</td>
                      <td>${apt.service}</td>
                      <td>${apt.appointmentDate} at ${apt.appointmentTime}</td>
                      <td>${apt.status}</td>
                    </tr>
                  `).join('') : '<tr><td colspan="5" style="text-align: center; padding: 20px;">No appointments booked yet.</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div class="card">
          <h2>System Health</h2>
          <p><strong>Server Status:</strong> ✅ Running</p>
          <p><strong>ElevenLabs Integration:</strong> ${conversations.length > 0 ? '✅ Connected' : '⚠️ Disabled/No Data'}</p>
          <p><strong>Last Activity:</strong> ${localStats.lastCall ? new Date(localStats.lastCall).toLocaleString() : 'No activity yet'}</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
        </div>
      </div>

      <script>
        function showTab(tabName) {
          document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
          });
          
          document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
          });
          
          document.getElementById(tabName).classList.add('active');
          event.target.classList.add('active');
        }

        function viewConversation(conversationId) {
          window.open('/admin/conversation/' + conversationId, '_blank');
        }

        function viewTranscript(conversationId) {
          window.open('/admin/transcript/' + conversationId, '_blank');
        }

        function playAudio(conversationId) {
          window.open('/admin/audio/' + conversationId, '_blank');
        }

        // Auto refresh every 30 seconds
        setTimeout(() => {
          location.reload();
        }, 30000);
      </script>
    </body>
    </html>
    `;
    
    res.send(html);
  } catch (error) {
    console.error('Error rendering dashboard:', error);
    res.status(500).json({ 
      error: 'Dashboard error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// API endpoint to get stats as JSON (enhanced)
router.get('/stats', async (req, res) => {
  try {
    const localStats = await callLogger.getStats();
    const elevenlabsStats = await elevenlabsService.getConversationStats();
    
    res.json({
      local: localStats,
      elevenlabs: elevenlabsStats,
      recentCalls: await callLogger.getRecentCalls(10),
      recentMessages: await callLogger.getRecentMessages(10),
      recentAppointments: await callLogger.getRecentAppointments(10)
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Error retrieving stats', message: error.message });
  }
});

// View specific conversation details
router.get('/conversation/:id', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const conversation = await elevenlabsService.getConversationById(conversationId);
    
    res.json(conversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Error fetching conversation details' });
  }
});

// Get conversation transcript
router.get('/transcript/:id', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const messages = await elevenlabsService.getConversationMessages(conversationId);
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Conversation Transcript</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .message { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .user-message { background: #e3f2fd; margin-left: 20px; }
        .assistant-message { background: #f3e5f5; margin-right: 20px; }
        .timestamp { font-size: 0.8em; color: #666; }
        .speaker { font-weight: bold; margin-bottom: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Conversation Transcript</h1>
        <p><strong>Conversation ID:</strong> ${conversationId}</p>
        
        ${messages.messages ? messages.messages.map(msg => `
          <div class="message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}">
            <div class="speaker">${msg.role === 'user' ? '👤 Customer' : '🤖 Sarah'}</div>
            <div>${msg.content}</div>
            <div class="timestamp">${new Date(msg.timestamp).toLocaleString()}</div>
          </div>
        `).join('') : '<p>No messages available</p>'}
      </div>
    </body>
    </html>
    `;
    
    res.send(html);
  } catch (error) {
    console.error('Error fetching transcript:', error);
    res.status(500).send('Error loading transcript');
  }
});

// Stream conversation audio
router.get('/audio/:id', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const audioStream = await elevenlabsService.getConversationAudio(conversationId);
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `inline; filename="conversation-${conversationId}.mp3"`);
    
    audioStream.pipe(res);
  } catch (error) {
    console.error('Error streaming audio:', error);
    res.status(500).send('Error loading audio');
  }
});

module.exports = router;
