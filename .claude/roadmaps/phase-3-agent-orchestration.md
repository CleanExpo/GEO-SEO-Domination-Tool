# Phase 3: Agent Orchestration UI

**Duration**: Week 5 (7 days)
**Progress**: [░░░░░░░░░░] 0%
**Impact**: +4% (from 93% → 97%)
**Priority**: 🟡 HIGH
**Depends On**: Phase 1-2 Complete

---

## Objectives

1. Create visual agent control panel
2. Add real-time agent monitoring
3. Build workflow visualizer
4. Implement agent chat interface

---

## Phase 3.1: Agent Control Panel (Days 29-35)

### Files to Create

```
app/workspace/agents/
├── page.tsx                     # Agent orchestrator page
└── layout.tsx                   # Agent workspace layout

components/agents/
├── AgentCard.tsx                # Individual agent display
├── AgentConsole.tsx             # Agent log output
├── AgentChat.tsx                # Chat with agent
├── WorkflowVisualizer.tsx       # Visual workflow
├── AgentConfigModal.tsx         # Configuration UI
└── AgentList.tsx                # List of available agents

app/api/agents/
├── list/route.ts                # Get all agents
├── start/route.ts               # Start agent
├── stop/route.ts                # Stop agent
├── logs/route.ts                # Stream logs (WebSocket)
└── config/route.ts              # Get/update config

lib/agents/
├── types.ts                     # Agent types
├── registry.ts                  # Agent registry
└── websocket.ts                 # WebSocket client
```

### Features

**Agent Card**:
```typescript
<AgentCard
  name="Competitive Intelligence"
  status="running"
  progress={45}
  onStart={() => {}}
  onStop={() => {}}
  onConfigure={() => {}}
/>
```

**Agent Console**:
- Real-time log streaming
- Filterable output
- Copy to clipboard
- Clear logs

**Workflow Visualizer**:
- Visual node graph
- Agent dependencies
- Progress indication
- Interactive navigation

### Success Criteria

- [ ] Agent control panel renders
- [ ] Can start/stop agents
- [ ] Real-time logs stream
- [ ] Agent progress updates
- [ ] Workflow visualization works
- [ ] Can configure agents

**Expected Impact**: +4% (93% → 97%)

---

## Integration Points

### Connect to Existing Engines

**Master Orchestrator** (`services/engines/master-orchestrator.ts`):
```typescript
// Expose via WebSocket
io.on('agent:start', async (agentType, config) => {
  const orchestrator = new MasterOrchestrator();
  await orchestrator.executeWorkflow('competitive-analysis', config);
});
```

**Competitive Intelligence** (`services/engines/competitive-intelligence-engine.ts`):
```typescript
// Stream progress updates
engine.on('progress', (data) => {
  io.emit('agent:progress', {
    agentId: 'competitive-intel',
    progress: data.progress,
    message: data.message
  });
});
```

---

**Next**: [Phase 4: Extensibility](./phase-4-extensibility.md)
