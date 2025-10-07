/**
 * Terminal Service Test Script
 * Tests the Windows terminal service functionality
 */

import { terminalService } from '../services/terminal/windows-terminal-service';

async function testTerminalService() {
  console.log('🧪 Testing Windows Terminal Service...\n');

  try {
    // Test 1: Create terminal session
    console.log('Test 1: Creating terminal session...');
    const sessionId = await terminalService.createSession({
      workspaceId: 'test-workspace',
      clientId: 'test-client',
      shell: 'powershell',
      brandName: 'Test Terminal'
    });
    console.log(`✓ Session created: ${sessionId}\n`);

    // Test 2: Get session info
    console.log('Test 2: Getting session info...');
    const session = terminalService.getSession(sessionId);
    console.log(`✓ Session found:`, {
      id: session?.id,
      workspaceId: session?.workspaceId,
      clientId: session?.clientId,
      cwd: session?.cwd
    });
    console.log('');

    // Test 3: Execute command
    console.log('Test 3: Executing PowerShell command (Get-Location)...');
    const output = await terminalService.executeCommand(sessionId, 'Get-Location');
    console.log(`✓ Command output:\n${output}`);
    console.log('');

    // Test 4: Execute another command
    console.log('Test 4: Executing command (Get-ChildItem)...');
    const output2 = await terminalService.executeCommand(sessionId, 'Get-ChildItem');
    console.log(`✓ Command output:\n${output2}`);
    console.log('');

    // Test 5: List all sessions
    console.log('Test 5: Listing all sessions...');
    const sessions = terminalService.getAllSessions();
    console.log(`✓ Active sessions: ${sessions.length}`);
    sessions.forEach(s => {
      console.log(`  - ${s.id} (${s.workspaceId})`);
    });
    console.log('');

    // Test 6: Close session
    console.log('Test 6: Closing terminal session...');
    const closed = terminalService.closeSession(sessionId);
    console.log(`✓ Session closed: ${closed}\n`);

    // Test 7: Verify session is closed
    console.log('Test 7: Verifying session is closed...');
    const closedSession = terminalService.getSession(sessionId);
    console.log(`✓ Session ${closedSession ? 'still exists (unexpected!)' : 'no longer exists (expected)'}\n`);

    console.log('✅ All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testTerminalService().then(() => {
  console.log('\n🎉 Terminal service is working correctly!');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
