#!/usr/bin/env node

/**
 * MCP Proxy Server
 * Bridges Docker-based MCP servers to Claude Code via stdio
 *
 * This server acts as a TCP-to-stdio bridge, allowing Claude Code
 * to communicate with MCP servers running in Docker containers
 */

const net = require('net');
const { spawn } = require('child_process');

const CONFIG = {
  servers: {
    puppeteer: {
      host: 'localhost',
      port: 3100,
      name: 'Puppeteer MCP',
    },
    playwright: {
      host: 'localhost',
      port: 3101,
      name: 'Playwright MCP',
    },
  },
};

class MCPProxyServer {
  constructor(serverName, config) {
    this.serverName = serverName;
    this.config = config;
    this.client = null;
    this.connected = false;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.client = new net.Socket();

      this.client.connect(this.config.port, this.config.host, () => {
        console.error(`[${this.serverName}] Connected to ${this.config.host}:${this.config.port}`);
        this.connected = true;
        resolve();
      });

      this.client.on('error', (error) => {
        console.error(`[${this.serverName}] Connection error:`, error.message);
        this.connected = false;
        reject(error);
      });

      this.client.on('close', () => {
        console.error(`[${this.serverName}] Connection closed`);
        this.connected = false;
      });
    });
  }

  async start() {
    try {
      await this.connect();

      // Pipe stdin to TCP socket
      process.stdin.pipe(this.client);

      // Pipe TCP socket to stdout
      this.client.pipe(process.stdout);

      // Handle process signals
      process.on('SIGTERM', () => this.cleanup());
      process.on('SIGINT', () => this.cleanup());
    } catch (error) {
      console.error(`[${this.serverName}] Failed to start:`, error.message);
      process.exit(1);
    }
  }

  cleanup() {
    console.error(`[${this.serverName}] Cleaning up...`);
    if (this.client) {
      this.client.end();
    }
    process.exit(0);
  }
}

// Main execution
const serverType = process.argv[2] || 'puppeteer';
const config = CONFIG.servers[serverType];

if (!config) {
  console.error(`Unknown server type: ${serverType}`);
  console.error(`Available servers: ${Object.keys(CONFIG.servers).join(', ')}`);
  process.exit(1);
}

const proxy = new MCPProxyServer(serverType, config);
proxy.start();
