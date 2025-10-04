/**
 * Type definitions for GEO Builders MCP Server
 */

// Builder Manifest Schema
export interface BuilderManifest {
  id: string;
  version: string;
  title: string;
  summary?: string;
  tags?: string[];
  targetPaths?: string[];
  variables?: BuilderVariable[];
  templates: BuilderTemplate[];
  conflicts?: ConflictRule[];
  hooks?: BuilderHooks;
  validators?: string[];
  licenses?: License[];
}

export interface BuilderVariable {
  name: string;
  required?: boolean;
  example?: string;
  description?: string;
  default?: any;
}

export interface BuilderTemplate {
  from: string;
  to: string;
  engine?: "eta" | "handlebars";
}

export interface ConflictRule {
  glob: string;
  strategy: "fail" | "overwrite" | "rename";
}

export interface BuilderHooks {
  pre?: string[];
  post?: string[];
}

export interface License {
  name: string;
  url?: string;
}

// Registry Configuration
export interface RegistryConfig {
  sources: RegistrySource[];
}

export interface RegistrySource {
  type: "local";
  path: string;
}

// Tool Parameters
export interface BuilderListParams {
  source?: "local";
  tags?: string[];
}

export interface BuilderInspectParams {
  id: string;
}

export interface ApplyBuilderParams {
  id: string;
  variables?: Record<string, any>;
  dryRun?: boolean;
}

// Builder Summary (for list_builders output)
export interface BuilderSummary {
  id: string;
  version: string;
  title: string;
  summary?: string;
  tags?: string[];
}

// Tool Outputs
export interface ListBuildersOutput {
  builders: BuilderSummary[];
}

export interface InspectBuilderOutput extends BuilderManifest {
  _source: {
    type: string;
    path: string;
  };
}

export interface ApplyBuilderOutput {
  success: boolean;
  filesWritten?: string[];
  filesSkipped?: string[];
  conflicts?: string[];
  errors?: string[];
  dryRun?: boolean;
}
