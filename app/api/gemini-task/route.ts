import { NextRequest, NextResponse } from 'next/server';
import { GeminiComputerUseService, getGeminiApiKey } from '@/services/api/gemini-computer-use';

// Store active tasks in memory (in production, use Redis or database)
export const activeTasks = new Map<string, {
  status: 'queued' | 'running' | 'completed' | 'failed';
  result?: string;
  error?: string;
  progress?: string;
  startedAt: string;
  completedAt?: string;
}>();

/**
 * POST /api/gemini-task
 * Create a new Gemini Computer Use task
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instruction, startUrl } = body;

    if (!instruction) {
      return NextResponse.json(
        { error: 'Instruction is required' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

    // Generate task ID
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store task
    activeTasks.set(taskId, {
      status: 'queued',
      startedAt: new Date().toISOString()
    });

    // Execute task asynchronously
    executeTask(taskId, instruction, startUrl).catch(console.error);

    return NextResponse.json(
      {
        success: true,
        taskId,
        status: 'queued'
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );

  } catch (error: any) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: error.message },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * Execute Gemini Computer Use task
 */
async function executeTask(taskId: string, instruction: string, startUrl?: string) {
  const task = activeTasks.get(taskId);
  if (!task) return;

  try {
    // Update status
    task.status = 'running';
    task.progress = 'Initializing Gemini Computer Use...';

    // Initialize service
    const service = new GeminiComputerUseService({
      apiKey: getGeminiApiKey(),
      headless: true, // Run headless for server
      timeout: 60000
    });

    await service.initialize();
    task.progress = 'Browser launched, executing task...';

    // Execute task
    const result = await service.executeTask({
      description: instruction,
      startUrl: startUrl,
      maxSteps: 15,
      requireConfirmation: false
    });

    // Clean up
    await service.cleanup();

    // Update task with result
    if (result.success) {
      task.status = 'completed';
      task.result = formatResult(result);
      task.completedAt = new Date().toISOString();
    } else {
      task.status = 'failed';
      task.error = result.error || 'Unknown error';
      task.completedAt = new Date().toISOString();
    }

  } catch (error: any) {
    console.error(`Error executing task ${taskId}:`, error);
    task.status = 'failed';
    task.error = error.message;
    task.completedAt = new Date().toISOString();
  }
}

/**
 * Format task result for display
 */
function formatResult(result: any): string {
  let output = 'Task completed successfully!\n\n';
  
  output += `Total steps: ${result.steps.length}\n\n`;
  
  output += '=== Actions Taken ===\n';
  result.steps.forEach((step: any, index: number) => {
    output += `\n${index + 1}. ${step.action}`;
    if (step.blocked) {
      output += ` [BLOCKED: ${step.blockReason}]`;
    }
  });
  
  output += '\n\n=== Summary ===\n';
  output += 'The AI assistant completed the requested analysis. ';
  output += 'Review the actions taken above for details.';
  
  return output;
}
