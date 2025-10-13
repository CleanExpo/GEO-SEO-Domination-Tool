#!/usr/bin/env node

/**
 * Verify API Timeout Implementation
 *
 * This script checks that all external API calls have proper timeout protection
 * to prevent hanging requests that can cause Vercel timeouts.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// ANSI color codes for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

// File patterns to check
const filePatterns = [
  'app/api/**/*.{ts,tsx}',
  'services/api/**/*.{ts,tsx}',
  'lib/**/*.{ts,tsx}',
];

// Patterns to check for timeout implementations
const apiPatterns = {
  fetch: {
    pattern: /await\s+fetch\s*\(/g,
    timeoutPatterns: [
      /signal:\s*AbortSignal\.timeout/,
      /signal:\s*createTimeoutSignal/,
      /fetchWithTimeout/,
    ],
  },
  axios: {
    pattern: /axios\.(get|post|put|delete|patch|head|options)\s*\(/g,
    timeoutPatterns: [
      /timeout:\s*\d+/,
      /timeout:\s*TIMEOUT_DEFAULTS/,
    ],
  },
  axiosImport: {
    pattern: /import\s+.*axios.*from\s+['"]axios['"]/g,
    correctPattern: /import\s+.*axios.*from\s+['"]@\/lib\/axios-config['"]/,
  },
};

// Files to exclude from checks
const excludeFiles = [
  '.backup',
  '.REMOVED',
  'node_modules',
  'dist',
  'build',
  '.next',
];

function checkFile(filePath) {
  const issues = [];
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Check for fetch calls without timeout
  const fetchMatches = [...content.matchAll(apiPatterns.fetch.pattern)];
  fetchMatches.forEach((match) => {
    const index = match.index;
    const lineNumber = content.substring(0, index).split('\n').length;

    // Find the complete fetch call (handle multiline)
    let fetchCall = '';
    let braceCount = 0;
    let foundClosing = false;
    let startLine = lineNumber - 1;

    for (let i = startLine; i < lines.length && !foundClosing; i++) {
      fetchCall += lines[i] + '\n';
      for (const char of lines[i]) {
        if (char === '(') braceCount++;
        if (char === ')') braceCount--;
        if (braceCount === 0 && fetchCall.includes('fetch')) {
          foundClosing = true;
          break;
        }
      }
    }

    // Check if timeout is present
    let hasTimeout = false;
    for (const timeoutPattern of apiPatterns.fetch.timeoutPatterns) {
      if (timeoutPattern.test(fetchCall)) {
        hasTimeout = true;
        break;
      }
    }

    if (!hasTimeout) {
      issues.push({
        type: 'fetch',
        line: lineNumber,
        message: `fetch() call without timeout protection`,
      });
    }
  });

  // Check for axios calls without timeout
  const axiosMatches = [...content.matchAll(apiPatterns.axios.pattern)];
  axiosMatches.forEach((match) => {
    const index = match.index;
    const lineNumber = content.substring(0, index).split('\n').length;

    // Find the complete axios call
    let axiosCall = '';
    let braceCount = 0;
    let foundClosing = false;
    let startLine = lineNumber - 1;

    for (let i = startLine; i < lines.length && !foundClosing; i++) {
      axiosCall += lines[i] + '\n';
      for (const char of lines[i]) {
        if (char === '(') braceCount++;
        if (char === ')') braceCount--;
        if (braceCount === 0 && axiosCall.includes('axios')) {
          foundClosing = true;
          break;
        }
      }
    }

    // Check if timeout is present
    let hasTimeout = false;
    for (const timeoutPattern of apiPatterns.axios.timeoutPatterns) {
      if (timeoutPattern.test(axiosCall)) {
        hasTimeout = true;
        break;
      }
    }

    // Check if using the configured axios instance (which has default timeout)
    if (!hasTimeout && content.includes('@/lib/axios-config')) {
      hasTimeout = true; // Using configured axios with default timeout
    }

    if (!hasTimeout) {
      issues.push({
        type: 'axios',
        line: lineNumber,
        message: `axios.${match[1]}() call without timeout protection`,
      });
    }
  });

  // Check for incorrect axios imports
  const axiosImportMatches = [...content.matchAll(apiPatterns.axiosImport.pattern)];
  axiosImportMatches.forEach((match) => {
    const index = match.index;
    const lineNumber = content.substring(0, index).split('\n').length;

    if (!apiPatterns.axiosImport.correctPattern.test(match[0])) {
      issues.push({
        type: 'import',
        line: lineNumber,
        message: `Using 'axios' directly instead of '@/lib/axios-config'`,
      });
    }
  });

  return issues;
}

function main() {
  console.log(`${colors.bold}${colors.cyan}🔍 Verifying API Timeout Implementation${colors.reset}\n`);

  let totalIssues = 0;
  const fileIssues = {};

  // Get all files to check
  const allFiles = [];
  filePatterns.forEach((pattern) => {
    const files = glob.sync(pattern, {
      cwd: process.cwd(),
      absolute: false,
    });
    allFiles.push(...files);
  });

  // Filter out excluded files
  const filesToCheck = allFiles.filter((file) => {
    return !excludeFiles.some((exclude) => file.includes(exclude));
  });

  console.log(`Checking ${filesToCheck.length} files...\n`);

  // Check each file
  filesToCheck.forEach((file) => {
    const issues = checkFile(file);
    if (issues.length > 0) {
      fileIssues[file] = issues;
      totalIssues += issues.length;
    }
  });

  // Report results
  if (totalIssues === 0) {
    console.log(`${colors.green}${colors.bold}✅ SUCCESS: All API calls have proper timeout protection!${colors.reset}\n`);
  } else {
    console.log(`${colors.red}${colors.bold}❌ FOUND ${totalIssues} ISSUES:${colors.reset}\n`);

    Object.entries(fileIssues).forEach(([file, issues]) => {
      console.log(`${colors.yellow}📁 ${file}${colors.reset}`);
      issues.forEach((issue) => {
        const icon = issue.type === 'fetch' ? '🌐' : issue.type === 'axios' ? '📡' : '📦';
        console.log(`  ${icon} Line ${issue.line}: ${issue.message}`);
      });
      console.log('');
    });

    console.log(`${colors.bold}${colors.cyan}📚 HOW TO FIX:${colors.reset}\n`);
    console.log(`${colors.bold}For fetch calls:${colors.reset}`);
    console.log(`  Add signal parameter: ${colors.green}{ signal: AbortSignal.timeout(30000) }${colors.reset}\n`);

    console.log(`${colors.bold}For axios calls:${colors.reset}`);
    console.log(`  1. Import from configured axios: ${colors.green}import axios from '@/lib/axios-config'${colors.reset}`);
    console.log(`  2. Or add timeout parameter: ${colors.green}{ timeout: 30000 }${colors.reset}\n`);

    console.log(`${colors.bold}Recommended timeouts:${colors.reset}`);
    console.log(`  • Short operations: ${colors.cyan}10000ms${colors.reset} (10 seconds)`);
    console.log(`  • Medium operations: ${colors.cyan}30000ms${colors.reset} (30 seconds) - Default`);
    console.log(`  • Long operations: ${colors.cyan}60000ms${colors.reset} (60 seconds) - Vercel Pro only\n`);
  }

  // Exit with appropriate code
  process.exit(totalIssues > 0 ? 1 : 0);
}

// Run the verification
main();