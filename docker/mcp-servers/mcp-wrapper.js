#!/usr/bin/env node

/**
 * MCP Server Wrapper for Docker
 * Wraps MCP servers to work with stdio communication from host
 *
 * This allows Docker containers to receive MCP requests via stdin
 * and send responses via stdout, compatible with Claude Code
 */

const { spawn } = require('child_process');

const SERVER_COMMANDS = {
  puppeteer: ['npx', '@modelcontextprotocol/server-puppeteer'],
  playwright: ['npx', '@playwright/mcp'],
};

const serverType = process.env.MCP_SERVER_TYPE || 'puppeteer';
const command = SERVER_COMMANDS[serverType];

if (!command) {
  console.error(`Unknown MCP server type: ${serverType}`);
  process.exit(1);
}

console.error(`Starting ${serverType} MCP server...`);

// Spawn the MCP server
const mcpServer = spawn(command[0], command.slice(1), {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: {
    ...process.env,
    PUPPETEER_EXECUTABLE_PATH: '/usr/bin/chromium',
  },
});

// Pipe stdin from Claude Code to MCP server
process.stdin.pipe(mcpServer.stdin);

// Pipe MCP server output to stdout (back to Claude Code)
mcpServer.stdout.pipe(process.stdout);

// Handle errors
mcpServer.on('error', (error) => {
  console.error(`MCP server error:`, error);
  process.exit(1);
});

mcpServer.on('exit', (code, signal) => {
  console.error(`MCP server exited with code ${code}, signal ${signal}`);
  process.exit(code || 0);
});

// Cleanup on termination
process.on('SIGTERM', () => {
  mcpServer.kill('SIGTERM');
});

process.on('SIGINT', () => {
  mcpServer.kill('SIGINT');
});

console.error(`${serverType} MCP server ready`);
