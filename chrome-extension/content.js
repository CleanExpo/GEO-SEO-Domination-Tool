// Content script - runs on web pages

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageInfo') {
    // Extract page information
    const pageInfo = extractPageInfo();
    sendResponse(pageInfo);
  } else if (request.action === 'highlightElement') {
    // Highlight specific element
    highlightElement(request.selector);
    sendResponse({ success: true });
  }
  return true;
});

// Extract comprehensive page information
function extractPageInfo() {
  return {
    url: window.location.href,
    title: document.title,
    meta: extractMetaTags(),
    headings: extractHeadings(),
    links: extractLinks(),
    images: extractImages(),
    content: extractMainContent(),
    structuredData: extractStructuredData(),
    performance: getPerformanceMetrics()
  };
}

// Extract meta tags
function extractMetaTags() {
  const metaTags = {};
  const metas = document.getElementsByTagName('meta');
  
  for (let meta of metas) {
    const name = meta.getAttribute('name') || meta.getAttribute('property');
    const content = meta.getAttribute('content');
    if (name && content) {
      metaTags[name] = content;
    }
  }
  
  return metaTags;
}

// Extract headings
function extractHeadings() {
  const headings = {
    h1: [],
    h2: [],
    h3: [],
    h4: [],
    h5: [],
    h6: []
  };
  
  for (let i = 1; i <= 6; i++) {
    const tags = document.querySelectorAll(`h${i}`);
    tags.forEach(tag => {
      headings[`h${i}`].push({
        text: tag.textContent.trim(),
        id: tag.id || null
      });
    });
  }
  
  return headings;
}

// Extract links
function extractLinks() {
  const links = {
    internal: [],
    external: []
  };
  
  const anchors = document.getElementsByTagName('a');
  const currentDomain = window.location.hostname;
  
  for (let anchor of anchors) {
    const href = anchor.href;
    if (!href) continue;
    
    try {
      const url = new URL(href);
      const isInternal = url.hostname === currentDomain;
      
      const linkData = {
        href: href,
        text: anchor.textContent.trim(),
        title: anchor.title || null
      };
      
      if (isInternal) {
        links.internal.push(linkData);
      } else {
        links.external.push(linkData);
      }
    } catch (e) {
      // Invalid URL, skip
    }
  }
  
  return links;
}

// Extract images
function extractImages() {
  const images = [];
  const imgs = document.getElementsByTagName('img');
  
  for (let img of imgs) {
    images.push({
      src: img.src,
      alt: img.alt || null,
      title: img.title || null,
      width: img.naturalWidth,
      height: img.naturalHeight
    });
  }
  
  return images;
}

// Extract main content (simplified)
function extractMainContent() {
  // Try to find main content area
  const main = document.querySelector('main') || 
                document.querySelector('[role="main"]') ||
                document.querySelector('article') ||
                document.body;
  
  return {
    text: main.innerText.substring(0, 5000), // First 5000 chars
    wordCount: main.innerText.split(/\s+/).length
  };
}

// Extract structured data (JSON-LD)
function extractStructuredData() {
  const structuredData = [];
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  
  scripts.forEach(script => {
    try {
      const data = JSON.parse(script.textContent);
      structuredData.push(data);
    } catch (e) {
      // Invalid JSON, skip
    }
  });
  
  return structuredData;
}

// Get performance metrics
function getPerformanceMetrics() {
  if (!window.performance) return null;
  
  const timing = window.performance.timing;
  const navigation = window.performance.navigation;
  
  return {
    loadTime: timing.loadEventEnd - timing.navigationStart,
    domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
    navigationType: navigation.type
  };
}

// Highlight element on page
function highlightElement(selector) {
  // Remove previous highlights
  document.querySelectorAll('.ai-assistant-highlight').forEach(el => {
    el.classList.remove('ai-assistant-highlight');
  });
  
  // Add highlight
  const element = document.querySelector(selector);
  if (element) {
    element.classList.add('ai-assistant-highlight');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Remove highlight after 3 seconds
    setTimeout(() => {
      element.classList.remove('ai-assistant-highlight');
    }, 3000);
  }
}

// Inject highlight styles
const style = document.createElement('style');
style.textContent = `
  .ai-assistant-highlight {
    outline: 3px solid #667eea !important;
    outline-offset: 2px !important;
    animation: ai-assistant-pulse 1s ease-in-out infinite !important;
  }
  
  @keyframes ai-assistant-pulse {
    0%, 100% { outline-color: #667eea; }
    50% { outline-color: #764ba2; }
  }
`;
document.head.appendChild(style);

console.log('GEO SEO AI Assistant content script loaded');
