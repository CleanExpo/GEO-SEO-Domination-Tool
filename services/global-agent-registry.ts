// Global Agent Registry Loader
// Loads agents from global registry and manages their lifecycle

import fs from 'fs';
import path from 'path';

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  requiredTools: string[];
}

export interface RegisteredAgent {
  id: string;
  name: string;
  capabilities: AgentCapability[];
  mcpTools: string[];
  autonomy: number;
  priority: number;
  version?: string;
  author?: string;
  dependencies?: string[];
}

export interface AgentRegistry {
  version: string;
  agents: RegisteredAgent[];
  lastUpdated: string;
}

export class GlobalAgentRegistry {
  private registryPath: string;
  private registry: AgentRegistry | null = null;
  private loadedAgents: Map<string, any> = new Map();

  constructor(registryPath?: string) {
    // Default to C:/AI/GlobalAgents/registry.json or custom path
    this.registryPath = registryPath || process.env.GLOBAL_AGENT_REGISTRY_PATH || 'C:/AI/GlobalAgents/registry/registry.json';
  }

  /**
   * Load registry metadata from disk
   */
  async loadRegistry(): Promise<AgentRegistry> {
    if (this.registry) return this.registry;

    try {
      // Check if registry file exists
      if (!fs.existsSync(this.registryPath)) {
        console.warn(`⚠️  Agent registry not found at ${this.registryPath}`);
        console.warn('   Run "pwsh scripts/setup.ps1" to initialize global agents');

        // Return empty registry
        this.registry = {
          version: '1.0.0',
          agents: [],
          lastUpdated: new Date().toISOString()
        };
        return this.registry;
      }

      // Load registry
      const registryContent = fs.readFileSync(this.registryPath, 'utf-8');
      this.registry = JSON.parse(registryContent) as AgentRegistry;

      console.log(`✅ Loaded agent registry: ${this.registry.agents.length} agents available`);
      return this.registry;
    } catch (error) {
      console.error('❌ Failed to load agent registry:', error);
      throw new Error(`Failed to load agent registry: ${error}`);
    }
  }

  /**
   * Get all registered agents
   */
  async getAgents(): Promise<RegisteredAgent[]> {
    const registry = await this.loadRegistry();
    return registry.agents;
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: string): Promise<RegisteredAgent | null> {
    const registry = await this.loadRegistry();
    return registry.agents.find(agent => agent.id === agentId) || null;
  }

  /**
   * Find agents by capability
   */
  async findAgentsByCapability(capabilityId: string): Promise<RegisteredAgent[]> {
    const registry = await this.loadRegistry();
    return registry.agents.filter(agent =>
      agent.capabilities.some(cap => cap.id === capabilityId)
    );
  }

  /**
   * Find agents by MCP tool requirement
   */
  async findAgentsByTool(toolName: string): Promise<RegisteredAgent[]> {
    const registry = await this.loadRegistry();
    return registry.agents.filter(agent =>
      agent.mcpTools.includes(toolName)
    );
  }

  /**
   * Get agents sorted by priority
   */
  async getAgentsByPriority(): Promise<RegisteredAgent[]> {
    const registry = await this.loadRegistry();
    return [...registry.agents].sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get autonomous agents (autonomy >= threshold)
   */
  async getAutonomousAgents(minAutonomy: number = 0.7): Promise<RegisteredAgent[]> {
    const registry = await this.loadRegistry();
    return registry.agents.filter(agent => agent.autonomy >= minAutonomy);
  }

  /**
   * Load agent implementation dynamically
   * Expects agent modules to export a default function or class
   */
  async loadAgentImplementation(agentId: string): Promise<any> {
    // Check if already loaded
    if (this.loadedAgents.has(agentId)) {
      return this.loadedAgents.get(agentId);
    }

    const agentMeta = await this.getAgent(agentId);
    if (!agentMeta) {
      throw new Error(`Agent not found in registry: ${agentId}`);
    }

    try {
      // Try to load from services/agents directory
      const agentPath = path.join(process.cwd(), 'services', 'agents', `${agentId}.ts`);

      if (fs.existsSync(agentPath)) {
        // Dynamic import
        const agentModule = await import(agentPath);
        const agentImpl = agentModule.default || agentModule;

        this.loadedAgents.set(agentId, agentImpl);
        console.log(`✅ Loaded agent implementation: ${agentId}`);

        return agentImpl;
      }

      // Try global agents directory
      const registryDir = path.dirname(this.registryPath);
      const globalAgentPath = path.join(registryDir, `${agentId}.js`);

      if (fs.existsSync(globalAgentPath)) {
        const agentModule = await import(globalAgentPath);
        const agentImpl = agentModule.default || agentModule;

        this.loadedAgents.set(agentId, agentImpl);
        console.log(`✅ Loaded global agent implementation: ${agentId}`);

        return agentImpl;
      }

      throw new Error(`Agent implementation not found for: ${agentId}`);
    } catch (error) {
      console.error(`❌ Failed to load agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Register a new agent at runtime
   */
  async registerAgent(agent: RegisteredAgent): Promise<void> {
    const registry = await this.loadRegistry();

    // Check if agent already exists
    const existingIndex = registry.agents.findIndex(a => a.id === agent.id);

    if (existingIndex >= 0) {
      // Update existing
      registry.agents[existingIndex] = agent;
      console.log(`✅ Updated agent in registry: ${agent.id}`);
    } else {
      // Add new
      registry.agents.push(agent);
      console.log(`✅ Registered new agent: ${agent.id}`);
    }

    // Update timestamp
    registry.lastUpdated = new Date().toISOString();

    // Save back to disk
    await this.saveRegistry(registry);
  }

  /**
   * Unregister an agent
   */
  async unregisterAgent(agentId: string): Promise<boolean> {
    const registry = await this.loadRegistry();
    const originalLength = registry.agents.length;

    registry.agents = registry.agents.filter(a => a.id !== agentId);

    if (registry.agents.length < originalLength) {
      registry.lastUpdated = new Date().toISOString();
      await this.saveRegistry(registry);

      // Unload from memory
      this.loadedAgents.delete(agentId);

      console.log(`✅ Unregistered agent: ${agentId}`);
      return true;
    }

    return false;
  }

  /**
   * Save registry to disk
   */
  private async saveRegistry(registry: AgentRegistry): Promise<void> {
    try {
      const registryDir = path.dirname(this.registryPath);

      // Ensure directory exists
      if (!fs.existsSync(registryDir)) {
        fs.mkdirSync(registryDir, { recursive: true });
      }

      // Write registry
      fs.writeFileSync(
        this.registryPath,
        JSON.stringify(registry, null, 2),
        'utf-8'
      );

      this.registry = registry;
    } catch (error) {
      console.error('❌ Failed to save agent registry:', error);
      throw error;
    }
  }

  /**
   * Validate agent dependencies
   */
  async validateAgentDependencies(agentId: string): Promise<{ valid: boolean; missing: string[] }> {
    const agent = await this.getAgent(agentId);
    if (!agent) {
      return { valid: false, missing: ['Agent not found'] };
    }

    const missing: string[] = [];

    // Check if all required MCP tools are available (would need MCP client integration)
    // For now, just check if dependencies exist in registry
    if (agent.dependencies) {
      for (const depId of agent.dependencies) {
        const depAgent = await this.getAgent(depId);
        if (!depAgent) {
          missing.push(depId);
        }
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Get agent execution graph (for dependency resolution)
   */
  async getExecutionGraph(agentIds: string[]): Promise<{ order: string[][]; cycles: boolean }> {
    const registry = await this.loadRegistry();
    const graph: Map<string, string[]> = new Map();

    // Build dependency graph
    for (const agentId of agentIds) {
      const agent = await this.getAgent(agentId);
      if (agent && agent.dependencies) {
        graph.set(agentId, agent.dependencies);
      } else {
        graph.set(agentId, []);
      }
    }

    // Topological sort (simple implementation)
    const visited = new Set<string>();
    const temp = new Set<string>();
    const order: string[][] = [];
    let hasCycles = false;

    function visit(nodeId: string, depth: number = 0): void {
      if (temp.has(nodeId)) {
        hasCycles = true;
        return;
      }
      if (visited.has(nodeId)) return;

      temp.add(nodeId);

      const deps = graph.get(nodeId) || [];
      for (const depId of deps) {
        visit(depId, depth + 1);
      }

      temp.delete(nodeId);
      visited.add(nodeId);

      // Add to order at appropriate depth
      if (!order[depth]) order[depth] = [];
      order[depth].push(nodeId);
    }

    for (const agentId of agentIds) {
      visit(agentId);
    }

    return {
      order: order.filter(batch => batch.length > 0).reverse(),
      cycles: hasCycles
    };
  }
}

// Singleton instance
let globalRegistry: GlobalAgentRegistry | null = null;

/**
 * Get global agent registry instance
 */
export function getGlobalAgentRegistry(registryPath?: string): GlobalAgentRegistry {
  if (!globalRegistry) {
    globalRegistry = new GlobalAgentRegistry(registryPath);
  }
  return globalRegistry;
}

/**
 * Helper: List all available agents
 */
export async function listGlobalAgents(): Promise<void> {
  const registry = getGlobalAgentRegistry();
  const agents = await registry.getAgents();

  console.log('\n🤖 Available Global Agents:\n');

  if (agents.length === 0) {
    console.log('  No agents registered. Run "pwsh scripts/setup.ps1" to initialize.\n');
    return;
  }

  for (const agent of agents) {
    const autonomyBadge = agent.autonomy >= 0.8 ? '🟢' : agent.autonomy >= 0.5 ? '🟡' : '🔴';
    console.log(`${autonomyBadge} ${agent.name} (${agent.id})`);
    console.log(`   Priority: ${agent.priority} | Autonomy: ${(agent.autonomy * 100).toFixed(0)}%`);
    console.log(`   Tools: ${agent.mcpTools.join(', ')}`);
    console.log(`   Capabilities: ${agent.capabilities.map(c => c.name).join(', ')}`);
    console.log('');
  }
}
