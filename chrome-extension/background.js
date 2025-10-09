// Background service worker for Chrome extension

// Install event
chrome.runtime.onInstalled.addListener(() => {
  console.log('GEO SEO AI Assistant installed');
  
  // Create context menu items
  chrome.contextMenus.create({
    id: 'analyze-page',
    title: 'Analyze Page with AI',
    contexts: ['page']
  });
  
  chrome.contextMenus.create({
    id: 'analyze-selection',
    title: 'Analyze Selected Text',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'analyze-link',
    title: 'Analyze This Link',
    contexts: ['link']
  });
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'analyze-page') {
    handleAnalyzePage(tab);
  } else if (info.menuItemId === 'analyze-selection') {
    handleAnalyzeSelection(info, tab);
  } else if (info.menuItemId === 'analyze-link') {
    handleAnalyzeLink(info, tab);
  }
});

// Handle analyze page
async function handleAnalyzePage(tab) {
  const instruction = `Analyze ${tab.url} for SEO optimization. Provide specific actionable improvements.`;
  await queueTask(instruction, tab.url);
  showNotification('Analysis Started', 'AI is analyzing the page...');
}

// Handle analyze selection
async function handleAnalyzeSelection(info, tab) {
  const selectedText = info.selectionText;
  const instruction = `Analyze this text for SEO and readability:\n\n"${selectedText}"\n\nProvide improvement suggestions.`;
  await queueTask(instruction, tab.url);
  showNotification('Text Analysis Started', 'AI is analyzing the selected text...');
}

// Handle analyze link
async function handleAnalyzeLink(info, tab) {
  const linkUrl = info.linkUrl;
  const instruction = `Analyze ${linkUrl} and compare it with current page ${tab.url}. What can we learn?`;
  await queueTask(instruction, linkUrl);
  showNotification('Link Analysis Started', 'AI is analyzing the linked page...');
}

// Queue task to backend
async function queueTask(instruction, startUrl) {
  try {
    const settings = await chrome.storage.local.get(['apiUrl']);
    const API_URL = settings.apiUrl || 'http://localhost:3000';
    
    const response = await fetch(`${API_URL}/api/gemini-task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instruction, startUrl })
    });
    
    if (!response.ok) {
      throw new Error('Failed to queue task');
    }
    
    const data = await response.json();
    
    // Save to history
    const history = await chrome.storage.local.get(['taskHistory']);
    const taskHistory = history.taskHistory || [];
    taskHistory.unshift({
      id: data.taskId,
      instruction,
      status: 'running',
      startedAt: new Date().toISOString()
    });
    await chrome.storage.local.set({ taskHistory: taskHistory.slice(0, 10) });
    
    // Start monitoring
    monitorTask(data.taskId, API_URL);
    
  } catch (error) {
    console.error('Error queuing task:', error);
    showNotification('Error', 'Failed to start task');
  }
}

// Monitor task completion
async function monitorTask(taskId, apiUrl) {
  const checkTask = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/gemini-task/${taskId}`);
      if (!response.ok) return;
      
      const data = await response.json();
      
      if (data.status === 'completed') {
        showNotification('Task Completed!', 'Your AI assistant has finished. Click to view results.');
        
        // Update history
        const history = await chrome.storage.local.get(['taskHistory']);
        const taskHistory = history.taskHistory || [];
        const task = taskHistory.find(t => t.id === taskId);
        if (task) {
          task.status = 'completed';
          task.result = data.result;
          task.completedAt = new Date().toISOString();
          await chrome.storage.local.set({ taskHistory });
        }
        
      } else if (data.status === 'failed') {
        showNotification('Task Failed', data.error || 'Unknown error occurred');
        
        // Update history
        const history = await chrome.storage.local.get(['taskHistory']);
        const taskHistory = history.taskHistory || [];
        const task = taskHistory.find(t => t.id === taskId);
        if (task) {
          task.status = 'failed';
          await chrome.storage.local.set({ taskHistory });
        }
        
      } else {
        // Still running, check again
        setTimeout(checkTask, 3000);
      }
      
    } catch (error) {
      console.error('Error monitoring task:', error);
    }
  };
  
  // Start checking
  setTimeout(checkTask, 3000);
}

// Show notification
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title,
    message,
    priority: 2
  });
}

// Handle notification clicks
chrome.notifications.onClicked.addListener(() => {
  // Open extension popup or results page
  chrome.action.openPopup();
});

// Listen for messages from popup/content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'queueTask') {
    queueTask(request.instruction, request.startUrl)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
});
