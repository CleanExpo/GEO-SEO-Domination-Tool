import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { WordPressExecutor } from '@/lib/executors/wordpress-executor';

/**
 * POST /api/agent-tasks/[id]/execute
 * 
 * Execute a specific agent task using appropriate executor
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const taskId = id;
  const startTime = Date.now();

  try {
    const supabase = await createClient();

    // Fetch task details
    const { data: task, error: taskError } = await supabase
      .from('agent_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check if task is already completed or in progress
    if (task.status === 'completed') {
      return NextResponse.json({
        success: false,
        message: 'Task already completed',
        task_id: taskId,
        status: 'completed',
      });
    }

    if (task.status === 'in_progress') {
      return NextResponse.json({
        success: false,
        message: 'Task is already in progress',
        task_id: taskId,
        status: 'in_progress',
      });
    }

    // Update status to in_progress
    await supabase
      .from('agent_tasks')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    // Fetch company credentials
    const { data: credentials, error: credError } = await supabase
      .from('website_credentials')
      .select('*')
      .eq('company_id', task.company_id)
      .eq('is_active', true)
      .single();

    if (credError || !credentials) {
      await logTaskFailure(supabase, taskId, 'No credentials found');
      
      return NextResponse.json(
        { error: 'No credentials configured for this company' },
        { status: 400 }
      );
    }

    // Log start of execution
    await logExecution(supabase, taskId, 'info', 'Task execution started', 0);

    // Route to appropriate executor
    let result;
    
    switch (credentials.primary_access_method) {
      case 'wp_rest_api':
      case 'wp_admin':
        result = await executeWordPressTask(task, credentials, supabase, taskId);
        break;
        
      case 'ftp':
      case 'sftp':
        result = await executeFTPTask(task, credentials, supabase, taskId);
        break;
        
      case 'github':
        result = await executeGitHubTask(task, credentials, supabase, taskId);
        break;
        
      default:
        throw new Error(`Unsupported access method: ${credentials.primary_access_method}`);
    }

    const endTime = Date.now();
    const executionTime = Math.round((endTime - startTime) / 1000);

    // Update task as completed
    await supabase
      .from('agent_tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        success: true,
        actual_time_seconds: executionTime,
        after_snapshot: result.after_snapshot || null,
      })
      .eq('id', taskId);

    await logExecution(supabase, taskId, 'success', 'Task completed successfully', 100);

    // Log credential usage
    await supabase.from('credentials_access_log').insert({
      credential_id: credentials.id,
      access_type: 'use_in_task',
      task_id: taskId,
      success: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Task executed successfully',
      task_id: taskId,
      execution_time_seconds: executionTime,
      result,
    });

  } catch (error: any) {
    console.error('[Task Executor] Error:', error);
    
    const supabase = await createClient();
    await logTaskFailure(supabase, taskId, error.message);

    return NextResponse.json(
      { 
        error: 'Task execution failed',
        details: error.message,
        task_id: taskId,
      },
      { status: 500 }
    );
  }
}

/**
 * Execute WordPress task
 */
async function executeWordPressTask(
  task: any,
  credentials: any,
  supabase: any,
  taskId: string
): Promise<any> {
  await logExecution(supabase, taskId, 'info', 'Initializing WordPress executor', 10);

  const executor = new WordPressExecutor(credentials);

  // Test connection first
  await logExecution(supabase, taskId, 'info', 'Testing WordPress connection...', 20);
  
  const connectionOk = await executor.testConnection();
  if (!connectionOk) {
    throw new Error('WordPress connection failed');
  }

  await logExecution(supabase, taskId, 'info', 'WordPress connection successful', 30);

  // Execute task based on type
  let result;
  
  switch (task.task_type) {
    case 'add_h1_tag':
      await logExecution(supabase, taskId, 'info', 'Adding H1 tag...', 50);
      result = await executor.addH1Tag(task.instructions);
      break;
      
    case 'update_meta_description':
      await logExecution(supabase, taskId, 'info', 'Updating meta description...', 50);
      result = await executor.updateMetaDescription(task.instructions);
      break;
      
    case 'add_alt_text':
      await logExecution(supabase, taskId, 'info', 'Adding alt text to images...', 50);
      result = await executor.addAltText(task.instructions);
      break;
      
    case 'optimize_images':
      await logExecution(supabase, taskId, 'info', 'Optimizing images...', 50);
      result = await executor.optimizeImages(task.instructions);
      break;
      
    case 'update_page_title':
      await logExecution(supabase, taskId, 'info', 'Updating page title...', 50);
      result = await executor.updatePageTitle(task.instructions);
      break;
      
    case 'add_internal_links':
      await logExecution(supabase, taskId, 'info', 'Adding internal links...', 50);
      result = await executor.addInternalLinks(task.instructions);
      break;
      
    default:
      throw new Error(`Unsupported WordPress task type: ${task.task_type}`);
  }

  await logExecution(supabase, taskId, 'info', `Task completed: ${result.message}`, 90);

  return result;
}

/**
 * Execute FTP task (placeholder)
 */
async function executeFTPTask(
  task: any,
  credentials: any,
  supabase: any,
  taskId: string
): Promise<any> {
  await logExecution(supabase, taskId, 'info', 'FTP executor not yet implemented', 50);
  
  return {
    success: false,
    message: 'FTP executor coming soon',
    note: 'Will support file uploads, script execution, etc.',
  };
}

/**
 * Execute GitHub task (placeholder)
 */
async function executeGitHubTask(
  task: any,
  credentials: any,
  supabase: any,
  taskId: string
): Promise<any> {
  await logExecution(supabase, taskId, 'info', 'GitHub executor not yet implemented', 50);
  
  return {
    success: false,
    message: 'GitHub executor coming soon',
    note: 'Will support commits, PRs, code changes, etc.',
  };
}

/**
 * Log execution progress
 */
async function logExecution(
  supabase: any,
  taskId: string,
  level: string,
  message: string,
  progress: number
): Promise<void> {
  await supabase.from('task_execution_logs').insert({
    task_id: taskId,
    log_level: level,
    message,
    progress_pct: progress,
  });
}

/**
 * Log task failure
 */
async function logTaskFailure(
  supabase: any,
  taskId: string,
  errorMessage: string
): Promise<void> {
  await supabase
    .from('agent_tasks')
    .update({
      status: 'failed',
      success: false,
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq('id', taskId);

  await logExecution(supabase, taskId, 'error', `Task failed: ${errorMessage}`, 0);
}
