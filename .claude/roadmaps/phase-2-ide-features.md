# Phase 2: IDE Feature Parity

**Duration**: Weeks 3-4 (14 days)
**Progress**: [░░░░░░░░░░] 0%
**Impact**: +12% (from 81% → 93%)
**Priority**: 🔴 CRITICAL
**Depends On**: Phase 1 Complete

---

## Objectives

1. Implement Command Palette (Cmd+K) for quick actions
2. Add Git integration with visual diff and commit UI
3. Build global file search (Cmd+Shift+F)
4. Add keyboard shortcuts system

---

## Phase 2.1: Command Palette (Days 15-18)

### Implementation

**Files to Create**:
```
components/workspace/
├── CommandPalette.tsx           # Main command palette UI
└── CommandItem.tsx              # Individual command item

lib/commands/
├── registry.ts                  # Command registry
├── builtins.ts                  # 50+ built-in commands
├── types.ts                     # Command types
└── shortcuts.ts                 # Keyboard shortcut manager
```

**Key Commands to Implement**:
- `client.switch` - Switch client
- `seo.audit` - Run SEO audit
- `agent.run` - Run agent
- `terminal.new` - New terminal
- `file.search` - Search files
- `git.commit` - Git commit
- `workspace.save` - Save workspace
- `workspace.load` - Load workspace

**Success Criteria**:
- [ ] Cmd+K opens command palette
- [ ] Fuzzy search across 50+ commands
- [ ] Commands execute correctly
- [ ] Recent commands shown first
- [ ] Keyboard navigation works

**Expected Impact**: +5% (81% → 86%)

---

## Phase 2.2: Git Integration (Days 19-24)

### Implementation

**Files to Create**:
```
components/workspace/
├── GitPanel.tsx                 # Git sidebar panel
├── DiffViewer.tsx               # Visual diff component
├── CommitBox.tsx                # Commit message UI
└── BranchSelector.tsx           # Branch switcher

lib/git/
├── operations.ts                # Git API wrapper
├── diff.ts                      # Diff utilities
└── types.ts                     # Git types

app/api/git/
├── status/route.ts              # Git status
├── commit/route.ts              # Commit changes
├── push/route.ts                # Push to remote
└── diff/route.ts                # Get diff
```

**Features**:
- Visual file status (modified, staged, untracked)
- Inline diff viewer
- Commit with message
- Push/pull controls
- Branch management

**Success Criteria**:
- [ ] Git status shows in sidebar
- [ ] Can stage/unstage files
- [ ] Visual diff works
- [ ] Can commit with message
- [ ] Can push to remote

**Expected Impact**: +4% (86% → 90%)

---

## Phase 2.3: Global Search (Days 25-28)

### Implementation

**Files to Create**:
```
components/workspace/
├── GlobalSearch.tsx             # Search interface
├── SearchResults.tsx            # Results list
└── SearchFilters.tsx            # Filter options

lib/search/
├── engine.ts                    # Search engine (Fuse.js)
├── indexer.ts                   # File indexer
└── types.ts                     # Search types
```

**Features**:
- Search across all files
- Regex support
- Case-sensitive toggle
- File type filters
- Jump to result

**Success Criteria**:
- [ ] Cmd+Shift+F opens search
- [ ] Search across all files
- [ ] Results show file + line + preview
- [ ] Can jump to result
- [ ] Regex works

**Expected Impact**: +3% (90% → 93%)

---

## Success Criteria

Phase 2 complete when:
- [ ] Command Palette functional with 50+ commands
- [ ] Git integration working (status, diff, commit, push)
- [ ] Global search implemented
- [ ] All keyboard shortcuts working
- [ ] Tests passing (85%+)

---

**Next**: [Phase 3: Agent Orchestration](./phase-3-agent-orchestration.md)
