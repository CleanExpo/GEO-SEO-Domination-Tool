// Post-Audit Automation System Types

export type PlatformType = 'wordpress' | 'shopify' | 'next' | 'static' | 'custom' | 'react' | 'vue';
export type AccessMethod = 'wp_rest_api' | 'wp_admin' | 'ftp' | 'sftp' | 'github' | 'cpanel' | 'vercel' | 'shopify_api' | 'ssh';
export type TestConnectionStatus = 'untested' | 'success' | 'failed';

export interface WebsiteCredentials {
  id: string;
  company_id: string;
  created_at: Date;
  updated_at: Date;

  // Platform
  platform_type: PlatformType;
  platform_version?: string;
  primary_access_method: AccessMethod;

  // WordPress
  wp_url?: string;
  wp_username?: string;
  wp_app_password_encrypted?: string;
  wp_password_encrypted?: string;

  // FTP/SFTP
  ftp_host?: string;
  ftp_port?: number;
  ftp_username?: string;
  ftp_password_encrypted?: string;
  ftp_root_path?: string;
  ftp_protocol?: 'ftp' | 'sftp' | 'ftps';

  // cPanel
  cpanel_url?: string;
  cpanel_username?: string;
  cpanel_api_token_encrypted?: string;

  // GitHub
  github_repo?: string;
  github_token_encrypted?: string;
  github_branch?: string;
  github_auto_pr?: boolean;

  // Vercel
  vercel_project_id?: string;
  vercel_token_encrypted?: string;

  // Shopify
  shopify_store_url?: string;
  shopify_access_token_encrypted?: string;
  shopify_api_version?: string;

  // SSH
  ssh_host?: string;
  ssh_port?: number;
  ssh_username?: string;
  ssh_private_key_encrypted?: string;
  ssh_passphrase_encrypted?: string;

  // Metadata
  notes?: string;
  test_connection_status?: TestConnectionStatus;
  last_verified_at?: Date;
  last_used_at?: Date;
  is_active: boolean;
  deactivated_reason?: string;
}

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'requires_review' | 'rolled_back' | 'cancelled';
export type TaskCategory = 'content' | 'performance' | 'seo' | 'accessibility' | 'security' | 'ux' | 'technical';
export type AgentType = 'claude_computer_use' | 'wp_rest_api' | 'github_copilot' | 'ftp_script' | 'custom_script';
export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'success';

export interface TaskInstructions {
  action: string; // 'add_element', 'modify_element', 'delete_element', 'optimize_file', etc.
  [key: string]: any; // Flexible structure for different task types
}

export interface TaskExecutionLog {
  timestamp: string;
  level: LogLevel;
  message: string;
  step?: number;
  progress_pct?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceImpact {
  score_before?: number;
  score_after?: number;
  improvement?: number;
  metrics_changed?: string[];
  [key: string]: any;
}

export interface AgentTask {
  id: string;
  company_id: string;
  audit_id?: string;
  parent_task_id?: string;
  created_at: Date;
  updated_at: Date;
  scheduled_at?: Date;
  started_at?: Date;
  completed_at?: Date;

  // Classification
  task_type: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;

  // Target
  page_url?: string;
  element_selector?: string;
  target_files?: string[];

  // Instructions
  instructions: TaskInstructions;

  // Execution
  agent_type?: AgentType;
  estimated_time_seconds?: number;
  actual_time_seconds?: number;
  retry_count: number;
  max_retries: number;
  agent_execution_logs: TaskExecutionLog[];

  // Results
  success?: boolean;
  error_message?: string;
  error_code?: string;
  before_snapshot?: string;
  after_snapshot?: string;
  before_content_hash?: string;
  after_content_hash?: string;
  performance_impact?: PerformanceImpact;

  // Approval
  requires_approval: boolean;
  approval_reason?: string;
  approved_by?: string;
  approved_at?: Date;
  rejected_by?: string;
  rejected_at?: Date;
  rejection_reason?: string;

  // Rollback
  rollback_data?: any;
  rolled_back_at?: Date;
  rolled_back_by?: string;

  // Metadata
  tags?: string[];
  cost_usd?: number;
}

export interface TaskTemplate {
  id: string;
  created_at: Date;
  updated_at: Date;

  task_type: string;
  category: TaskCategory;
  default_priority: TaskPriority;

  title: string;
  description: string;

  instructions_template: Record<string, any>;
  compatible_agents: AgentType[];
  preferred_agent: AgentType;

  risk_level: 'low' | 'medium' | 'high' | 'critical';
  requires_approval: boolean;
  requires_backup: boolean;

  estimated_time_seconds: number;
  estimated_cost_usd?: number;

  success_criteria?: Record<string, any>;
  rollback_available: boolean;
  is_active: boolean;
}

export interface TaskExecutionLogEntry {
  id: string;
  task_id: string;
  timestamp: Date;
  log_level: LogLevel;
  message: string;
  step_number?: number;
  progress_pct?: number;
  metadata?: Record<string, any>;
}

export interface CredentialsAccessLog {
  id: string;
  credential_id: string;
  accessed_at: Date;
  accessed_by?: string;
  access_type: 'view' | 'edit' | 'test' | 'delete' | 'use_in_task';
  task_id?: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
}

export interface AutomationRule {
  id: string;
  company_id: string;
  created_at: Date;
  updated_at: Date;

  rule_name: string;
  description?: string;

  trigger_type: 'audit_completed' | 'score_dropped' | 'schedule' | 'manual' | 'webhook';
  trigger_conditions?: Record<string, any>;

  auto_create_tasks: boolean;
  auto_execute_tasks: boolean;
  require_approval: boolean;

  task_types_included?: string[];
  task_types_excluded?: string[];
  max_tasks_per_audit?: number;
  priority_threshold?: TaskPriority;

  is_active: boolean;
}

// API Request/Response Types

export interface CreateCredentialsRequest {
  company_id: string;
  platform_type: PlatformType;
  primary_access_method: AccessMethod;

  // Credentials (will be encrypted server-side)
  wp_url?: string;
  wp_username?: string;
  wp_app_password?: string;
  wp_password?: string;

  ftp_host?: string;
  ftp_port?: number;
  ftp_username?: string;
  ftp_password?: string;
  ftp_root_path?: string;
  ftp_protocol?: 'ftp' | 'sftp' | 'ftps';

  github_repo?: string;
  github_token?: string;
  github_branch?: string;

  notes?: string;
}

export interface CreateCredentialsResponse {
  id: string;
  created_at: Date;
  test_connection_status: TestConnectionStatus;
}

export interface TestCredentialsRequest {
  credential_id: string;
}

export interface TestCredentialsResponse {
  success: boolean;
  message: string;
  details?: {
    platform_detected?: string;
    version?: string;
    accessible_endpoints?: string[];
  };
  error?: string;
}

export interface CreateTasksFromAuditRequest {
  audit_id: string;
  company_id: string;
  auto_execute?: boolean;
  require_approval?: boolean;
  task_type_filter?: string[]; // Only create specific task types
  priority_threshold?: TaskPriority; // Only create tasks at or above this priority
}

export interface CreateTasksFromAuditResponse {
  tasks_created: number;
  task_ids: string[];
  tasks: AgentTask[];
  estimated_total_time_seconds: number;
  estimated_total_cost_usd: number;
}

export interface ExecuteTaskRequest {
  task_id: string;
  credential_id?: string; // Override default credentials
}

export interface ExecuteTaskResponse {
  status: TaskStatus;
  progress_url: string;
  estimated_completion_seconds: number;
}

export interface TaskProgressResponse {
  task_id: string;
  status: TaskStatus;
  progress_pct: number;
  current_step?: string;
  logs: TaskExecutionLog[];
  estimated_seconds_remaining?: number;
}

export interface ApproveTaskRequest {
  task_id: string;
  approved_by: string;
  notes?: string;
}

export interface ApproveTaskResponse {
  approved: true;
  will_execute_at: Date;
}

export interface RollbackTaskRequest {
  task_id: string;
  rolled_back_by: string;
  reason?: string;
}

export interface RollbackTaskResponse {
  rolled_back: true;
  reverted_to_state: any;
  verification_url?: string;
}

// Utility Types

export interface DecryptedCredentials {
  platform_type: PlatformType;
  access_method: AccessMethod;
  credentials: {
    // WordPress
    wp_url?: string;
    wp_username?: string;
    wp_app_password?: string; // Decrypted
    wp_password?: string; // Decrypted

    // FTP
    ftp_host?: string;
    ftp_port?: number;
    ftp_username?: string;
    ftp_password?: string; // Decrypted
    ftp_root_path?: string;

    // GitHub
    github_repo?: string;
    github_token?: string; // Decrypted
    github_branch?: string;

    // etc...
  };
}

export interface TaskMapper {
  auditFinding: {
    type: string;
    message: string;
    impact: 'low' | 'medium' | 'high';
    category?: string;
  };
  taskType: string;
  priority: TaskPriority;
  instructions: TaskInstructions;
  agent_type: AgentType;
}
