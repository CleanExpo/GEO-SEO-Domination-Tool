// API Configuration
let API_URL = 'http://localhost:3000';
let NOTIFICATIONS_ENABLED = true;

// State
let currentTaskId = null;
let taskHistory = [];
let pollingInterval = null;

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadTaskHistory();
  setupEventListeners();
  checkBackendStatus();
});

// Load settings from storage
async function loadSettings() {
  const result = await chrome.storage.local.get(['apiUrl', 'notificationsEnabled', 'autoAnalyze']);
  if (result.apiUrl) API_URL = result.apiUrl;
  if (result.notificationsEnabled !== undefined) NOTIFICATIONS_ENABLED = result.notificationsEnabled;
  
  // Update settings UI
  document.getElementById('apiUrl').value = API_URL;
  document.getElementById('notificationsEnabled').checked = NOTIFICATIONS_ENABLED;
  document.getElementById('autoAnalyze').checked = result.autoAnalyze || false;
}

// Load task history
async function loadTaskHistory() {
  const result = await chrome.storage.local.get(['taskHistory']);
  taskHistory = result.taskHistory || [];
  renderTaskHistory();
}

// Save task to history
async function saveTaskToHistory(task) {
  taskHistory.unshift(task);
  if (taskHistory.length > 10) taskHistory = taskHistory.slice(0, 10);
  await chrome.storage.local.set({ taskHistory });
  renderTaskHistory();
}

// Setup event listeners
function setupEventListeners() {
  // Quick action buttons
  document.getElementById('analyzePageBtn').addEventListener('click', analyzeCurrentPage);
  document.getElementById('extractDataBtn').addEventListener('click', extractPageData);
  
  // Submit button
  document.getElementById('submitBtn').addEventListener('click', submitTask);
  
  // Enter key in textarea
  document.getElementById('taskInput').addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      submitTask();
    }
  });
  
  // Cancel button
  document.getElementById('cancelBtn').addEventListener('click', cancelCurrentTask);
  
  // Settings
  document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('settingsModal').style.display = 'flex';
  });
  
  document.getElementById('closeSettings').addEventListener('click', () => {
    document.getElementById('settingsModal').style.display = 'none';
  });
  
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
}

// Check backend status
async function checkBackendStatus() {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    if (response.ok) {
      updateStatus('ready', 'Ready');
    } else {
      updateStatus('error', 'Backend Error');
    }
  } catch (error) {
    updateStatus('error', 'Offline');
  }
}

// Update status indicator
function updateStatus(state, text) {
  const statusEl = document.getElementById('status');
  statusEl.className = `status ${state}`;
  statusEl.querySelector('.status-text').textContent = text;
}

// Analyze current page
async function analyzeCurrentPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const instruction = `Analyze the current page (${tab.url}) for SEO optimization. Provide:\n1. Page title and meta description review\n2. Heading structure (H1-H6) analysis\n3. Content quality assessment\n4. 5 actionable improvement suggestions\n5. Overall SEO score out of 100`;
  
  document.getElementById('taskInput').value = instruction;
  await submitTask();
}

// Extract page data
async function extractPageData() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const instruction = `Extract structured data from ${tab.url}:\n1. All headings (H1-H6)\n2. All links (internal and external)\n3. All images with alt text\n4. Meta information\n5. Structured data (schema.org)`;
  
  document.getElementById('taskInput').value = instruction;
  await submitTask();
}

// Submit task to backend
async function submitTask() {
  const instruction = document.getElementById('taskInput').value.trim();
  if (!instruction) {
    alert('Please enter a task instruction');
    return;
  }
  
  // Get current page URL
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const pageUrl = tab.url;
  
  // Build full instruction with context
  const fullInstruction = `${instruction}\n\nCurrent page: ${pageUrl}`;
  
  try {
    updateStatus('loading', 'Starting...');
    document.getElementById('submitBtn').disabled = true;
    
    // Call Gemini Computer Use API
    const response = await fetch(`${API_URL}/api/gemini-task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instruction: fullInstruction,
        startUrl: pageUrl
      })
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    currentTaskId = data.taskId;
    
    // Show current task section
    document.getElementById('currentTask').style.display = 'block';
    document.getElementById('taskProgress').textContent = 'Initializing task...';
    
    // Save to history
    await saveTaskToHistory({
      id: currentTaskId,
      instruction: instruction,
      status: 'running',
      startedAt: new Date().toISOString()
    });
    
    // Start polling for updates
    startPolling();
    
    // Clear input
    document.getElementById('taskInput').value = '';
    
    updateStatus('loading', 'Running...');
    
  } catch (error) {
    console.error('Error submitting task:', error);
    updateStatus('error', 'Error');
    alert(`Failed to start task: ${error.message}`);
    document.getElementById('submitBtn').disabled = false;
  }
}

// Start polling for task updates
function startPolling() {
  if (pollingInterval) clearInterval(pollingInterval);
  
  pollingInterval = setInterval(async () => {
    try {
      const response = await fetch(`${API_URL}/api/gemini-task/${currentTaskId}`);
      if (!response.ok) throw new Error('Failed to check task status');
      
      const data = await response.json();
      
      // Update progress
      document.getElementById('taskProgress').textContent = data.progress || 'Processing...';
      
      // Check if complete
      if (data.status === 'completed' || data.status === 'failed') {
        stopPolling();
        handleTaskComplete(data);
      }
      
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, 2000); // Poll every 2 seconds
}

// Stop polling
function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

// Handle task completion
async function handleTaskComplete(data) {
  document.getElementById('currentTask').style.display = 'none';
  document.getElementById('submitBtn').disabled = false;
  
  // Update task in history
  const task = taskHistory.find(t => t.id === currentTaskId);
  if (task) {
    task.status = data.status;
    task.result = data.result;
    task.completedAt = new Date().toISOString();
    await chrome.storage.local.set({ taskHistory });
    renderTaskHistory();
  }
  
  if (data.status === 'completed') {
    updateStatus('ready', 'Ready');
    
    // Show notification
    if (NOTIFICATIONS_ENABLED) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Task Completed!',
        message: 'Your AI assistant has finished the task.',
        priority: 2
      });
    }
    
    // Show result in a new way - could open a results page
    if (confirm('Task completed! Would you like to view the results?')) {
      showTaskResult(data);
    }
    
  } else {
    updateStatus('error', 'Failed');
    alert(`Task failed: ${data.error || 'Unknown error'}`);
  }
  
  currentTaskId = null;
}

// Show task result
function showTaskResult(data) {
  // Create a formatted result display
  const resultWindow = window.open('', '_blank', 'width=600,height=800');
  resultWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Task Result</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 24px;
          background: #f9fafb;
          color: #111827;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 32px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        h1 {
          color: #667eea;
          margin-bottom: 8px;
        }
        .meta {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 24px;
        }
        .result {
          white-space: pre-wrap;
          line-height: 1.6;
          color: #374151;
        }
        .success {
          background: #d1fae5;
          color: #065f46;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success">✓ Task completed successfully</div>
        <h1>Task Result</h1>
        <div class="meta">Completed at ${new Date(data.completedAt).toLocaleString()}</div>
        <div class="result">${data.result || 'No result text available'}</div>
      </div>
    </body>
    </html>
  `);
}

// Cancel current task
async function cancelCurrentTask() {
  if (!currentTaskId) return;
  
  try {
    await fetch(`${API_URL}/api/gemini-task/${currentTaskId}`, {
      method: 'DELETE'
    });
    
    stopPolling();
    document.getElementById('currentTask').style.display = 'none';
    document.getElementById('submitBtn').disabled = false;
    updateStatus('ready', 'Ready');
    
    currentTaskId = null;
    
  } catch (error) {
    console.error('Error canceling task:', error);
    alert('Failed to cancel task');
  }
}

// Render task history
function renderTaskHistory() {
  const container = document.getElementById('taskHistory');
  
  if (taskHistory.length === 0) {
    container.innerHTML = '<div class="empty-state">No tasks yet. Start by giving your AI assistant a task!</div>';
    return;
  }
  
  container.innerHTML = taskHistory.map(task => {
    const statusClass = task.status;
    const statusIcon = {
      completed: '✓',
      failed: '✗',
      running: '⟳'
    }[task.status] || '⋯';
    
    const timeAgo = getTimeAgo(new Date(task.startedAt));
    
    return `
      <div class="task-item" onclick="viewTask('${task.id}')">
        <div class="task-item-header">
          <div class="task-item-status ${statusClass}">
            ${statusIcon} ${task.status}
          </div>
          <div class="task-item-time">${timeAgo}</div>
        </div>
        <div class="task-item-text">${task.instruction}</div>
      </div>
    `;
  }).join('');
}

// View task details
window.viewTask = function(taskId) {
  const task = taskHistory.find(t => t.id === taskId);
  if (!task) return;
  
  if (task.status === 'completed' && task.result) {
    showTaskResult(task);
  } else {
    alert(`Task status: ${task.status}\n\n${task.instruction}`);
  }
};

// Get time ago string
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Save settings
async function saveSettings() {
  const apiUrl = document.getElementById('apiUrl').value;
  const notificationsEnabled = document.getElementById('notificationsEnabled').checked;
  const autoAnalyze = document.getElementById('autoAnalyze').checked;
  
  await chrome.storage.local.set({
    apiUrl,
    notificationsEnabled,
    autoAnalyze
  });
  
  API_URL = apiUrl;
  NOTIFICATIONS_ENABLED = notificationsEnabled;
  
  document.getElementById('settingsModal').style.display = 'none';
  
  // Recheck backend status with new URL
  checkBackendStatus();
}
