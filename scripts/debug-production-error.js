#!/usr/bin/env node

/**
 * Production Error Debugger
 * Uses Docker Playwright MCP to investigate errors on production URL
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const TARGET_URL = 'https://geo-seo-domination-tool.vercel.app/onboarding/new';

console.log('🔍 Starting production error investigation...');
console.log(`📍 Target: ${TARGET_URL}\n`);

// MCP request to navigate and capture errors
const mcpRequests = [
  // Initialize
  {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'production-debugger',
        version: '1.0.0'
      }
    }
  },
  // Navigate to URL
  {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'playwright_navigate',
      arguments: {
        url: TARGET_URL
      }
    }
  },
  // Take screenshot
  {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'playwright_screenshot',
      arguments: {
        name: 'production-error',
        width: 1920,
        height: 1080
      }
    }
  },
  // Get console logs
  {
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'playwright_evaluate',
      arguments: {
        script: `
          // Capture any visible error messages
          const errorElements = document.querySelectorAll('[class*="error"], .error, #error, [role="alert"]');
          const errors = Array.from(errorElements).map(el => el.innerText);

          // Get page title
          const title = document.title;

          // Get first 1000 chars of body
          const bodyText = document.body.innerText.substring(0, 1000);

          return {
            title,
            errors,
            bodyText,
            url: window.location.href,
            userAgent: navigator.userAgent
          };
        `
      }
    }
  }
];

// Spawn docker exec to communicate with MCP server
const docker = spawn('docker', [
  'exec',
  '-i',
  'geo-seo-playwright-mcp',
  'node',
  '/app/mcp-wrapper.js'
]);

let outputBuffer = '';
let requestIndex = 0;

docker.stdout.on('data', (data) => {
  outputBuffer += data.toString();

  // Try to parse JSON-RPC responses
  const lines = outputBuffer.split('\n');
  outputBuffer = lines.pop(); // Keep incomplete line in buffer

  lines.forEach(line => {
    if (!line.trim()) return;

    try {
      const response = JSON.parse(line);
      console.log(`\n📥 Response ${response.id}:`, JSON.stringify(response, null, 2));

      // Send next request
      if (requestIndex < mcpRequests.length) {
        const nextRequest = mcpRequests[requestIndex++];
        console.log(`\n📤 Sending request ${nextRequest.id}...`);
        docker.stdin.write(JSON.stringify(nextRequest) + '\n');
      } else {
        // All done
        console.log('\n✅ Investigation complete!');
        docker.stdin.end();
      }
    } catch (e) {
      // Not JSON, might be debug output
      console.log('📝', line);
    }
  });
});

docker.stderr.on('data', (data) => {
  console.log('🔧', data.toString().trim());
});

docker.on('error', (error) => {
  console.error('❌ Docker error:', error);
  process.exit(1);
});

docker.on('exit', (code) => {
  console.log(`\n🏁 Process exited with code ${code}`);
  process.exit(code);
});

// Start by sending first request
setTimeout(() => {
  const firstRequest = mcpRequests[requestIndex++];
  console.log(`📤 Sending request ${firstRequest.id}...`);
  docker.stdin.write(JSON.stringify(firstRequest) + '\n');
}, 1000);

// Cleanup
process.on('SIGINT', () => {
  console.log('\n⚠️  Interrupted');
  docker.kill();
  process.exit(0);
});
