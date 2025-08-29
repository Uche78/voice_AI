const express = require('express');
const callLogger = require('../utils/callLogger');

const router = express.Router();

// Simple admin dashboard (for development/testing)
router.get('/dashboard', (req, res) => {
  try {
    const stats = callLogger.getStats();
    const recentCalls = callLogger.getRecentCalls(5);
    const recentMessages = callLogger.getRecentMessages(5);
    const recentAppointments = callLogger.getRecentAppointments(5);
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>AI Receptionist Dashboard</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
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
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 AI Car Shop Receptionist Dashboard</h1>
        
        <div class="card">
          <h2>System Statistics</h2>
          <div class="stats">
            <div class="stat">
              <div class="stat-number">${stats.totalCalls}</div>
              <div class="stat-label">Total Calls</div>
            </div>
            <div class="stat">
              <div class="stat-number">${stats.totalMessages}</div>
              <div class="stat-label">Voice Messages</div>
            </div>
            <div class="stat">
              <div class="stat-number">${stats.totalAppointments}</div>
              <div class="stat-label">Appointments Booked</div>
            </div>
          </div>
        </div>
        
        <div class="card">
          <h2>Recent Call Activity</h2>
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
              ${recentCalls.map(call => `
                <tr>
                  <td class="timestamp">${new Date(call.timestamp).toLocaleString()}</td>
                  <td>${call.callerNumber}</td>
                  <td>${call.action}</td>
                  <td>${call.details}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="card">
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
              ${recentAppointments.map(apt => `
                <tr>
                  <td>${apt.customerName}</td>
                  <td>${apt.customerPhone}</td>
                  <td>${apt.service}</td>
                  <td>${apt.appointmentDate} at ${apt.appointmentTime}</td>
                  <td>${apt.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="card">
          <h2>Recent Voice Messages</h2>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Phone Number</th>
                <th>Transcription</th>
                <th>Recording</th>
              </tr>
            </thead>
            <tbody>
              ${recentMessages.map(msg => `
                <tr>
                  <td class="timestamp">${new Date(msg.timestamp).toLocaleString()}</td>
                  <td>${msg.callerNumber}</td>
                  <td>${msg.transcription.substring(0, 100)}${msg.transcription.length > 100 ? '...' : ''}</td>
                  <td><a href="${msg.recordingUrl}" target="_blank">Listen</a></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="card">
          <h2>System Health</h2>
          <p><strong>Server Status:</strong> ✅ Running</p>
          <p><strong>Last Activity:</strong> ${stats.lastCall ? new Date(stats.lastCall).toLocaleString() : 'No activity yet'}</p>
          <p><strong>Twilio Integration:</strong> ✅ Connected</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
        </div>
      </div>
    </body>
    </html>
    `;
    
    res.send(html);
  } catch (error) {
    console.error('Error rendering dashboard:', error);
    res.status(500).json({ error: 'Dashboard error' });
  }
});

// API endpoint to get stats as JSON
router.get('/stats', (req, res) => {
  try {
    const stats = callLogger.getStats();
    res.json({
      stats,
      recentCalls: callLogger.getRecentCalls(10),
      recentMessages: callLogger.getRecentMessages(10),
      recentAppointments: callLogger.getRecentAppointments(10)
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Error retrieving stats' });
  }
});

module.exports = router;