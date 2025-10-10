# Phase 4: UX Extension System

**Duration**: Week 6 (7 days)
**Progress**: [░░░░░░░░░░] 0%
**Impact**: +3% (from 97% → 100%)
**Priority**: 🟢 MEDIUM
**Depends On**: Phase 1-3 Complete

---

## Objectives

1. Create plugin architecture
2. Implement extension manifest system
3. Add hot-reload capabilities
4. Build example plugins

---

## Phase 4.1: Plugin System (Days 36-42)

### Files to Create

```
lib/plugins/
├── PluginRegistry.ts            # Central plugin registry
├── PluginLoader.ts              # Load/unload plugins
├── types.ts                     # Plugin types
├── hooks.ts                     # Plugin lifecycle hooks
└── validation.ts                # Manifest validation

app/api/plugins/
├── list/route.ts                # Get installed plugins
├── install/route.ts             # Install plugin
├── uninstall/route.ts           # Uninstall plugin
└── reload/route.ts              # Hot reload plugin

plugins/
├── example-seo-analyzer/        # Example plugin
│   ├── manifest.json
│   ├── index.ts
│   └── components/
└── README.md                    # Plugin development guide
```

### Plugin Manifest Structure

```typescript
// manifest.json
{
  "id": "seo-analyzer",
  "name": "SEO Content Analyzer",
  "version": "1.0.0",
  "author": "Your Team",
  "description": "Analyze content for SEO",
  "contributes": {
    "views": {
      "sidebar": {
        "id": "seo-view",
        "name": "SEO Analysis",
        "icon": "chart-bar"
      }
    },
    "commands": [
      {
        "id": "seo.analyze",
        "title": "Analyze Current Page",
        "shortcut": "Cmd+Shift+A",
        "category": "SEO"
      }
    ],
    "contextMenus": {
      "editor": [
        "Run SEO Analysis on Selection"
      ]
    },
    "settings": {
      "apiKey": {
        "type": "string",
        "description": "SEO API Key",
        "default": ""
      }
    }
  },
  "activationEvents": [
    "onCommand:seo.analyze",
    "onView:seo-view"
  ],
  "main": "dist/index.js"
}
```

### Plugin Registry Implementation

```typescript
// lib/plugins/PluginRegistry.ts
export class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();
  private hooks: Map<string, Function[]> = new Map();

  async register(manifest: PluginManifest, code: string) {
    // Validate manifest
    validateManifest(manifest);

    // Load plugin code (sandboxed)
    const plugin = await loadPlugin(manifest, code);

    // Register views
    plugin.contributes?.views?.forEach(view => {
      this.registerView(view, plugin.id);
    });

    // Register commands
    plugin.contributes?.commands?.forEach(cmd => {
      this.registerCommand(cmd, plugin.id);
    });

    // Store plugin
    this.plugins.set(manifest.id, plugin);

    // Trigger activation
    await this.activatePlugin(manifest.id);
  }

  async unregister(pluginId: string) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    // Deactivate
    await this.deactivatePlugin(pluginId);

    // Clean up registrations
    this.cleanupPlugin(pluginId);

    // Remove from registry
    this.plugins.delete(pluginId);
  }

  private registerCommand(cmd: CommandContribution, pluginId: string) {
    // Add to command palette
    commandRegistry.add({
      ...cmd,
      pluginId,
      handler: () => this.executeCommand(pluginId, cmd.id)
    });
  }

  private registerView(view: ViewContribution, pluginId: string) {
    // Add to sidebar
    sidebarRegistry.add({
      ...view,
      pluginId,
      component: () => this.getViewComponent(pluginId, view.id)
    });
  }
}
```

### Example Plugin

```typescript
// plugins/example-seo-analyzer/index.ts
import { Plugin, PluginContext } from '@/lib/plugins/types';

export default class SEOAnalyzerPlugin implements Plugin {
  private context: PluginContext;

  activate(context: PluginContext) {
    this.context = context;

    // Register command handler
    context.subscriptions.push(
      context.commands.registerCommand('seo.analyze', () => {
        this.analyzePage();
      })
    );

    // Register view provider
    context.subscriptions.push(
      context.views.registerViewProvider('seo-view', {
        render: () => this.renderView()
      })
    );
  }

  deactivate() {
    // Cleanup
  }

  private async analyzePage() {
    const { content } = await this.context.workspace.getActiveFile();
    const analysis = await fetch('/api/seo/analyze', {
      method: 'POST',
      body: JSON.stringify({ content })
    }).then(r => r.json());

    this.context.window.showNotification({
      type: 'info',
      message: `SEO Score: ${analysis.score}/100`
    });
  }

  private renderView() {
    return <SEOAnalysisView context={this.context} />;
  }
}
```

### Success Criteria

- [ ] Plugin registry functional
- [ ] Can install/uninstall plugins
- [ ] Hot reload works
- [ ] Example plugin works
- [ ] Plugin API documented
- [ ] Sandboxing secure

**Expected Impact**: +3% (97% → 100%)

---

## 🎯 100% Achievement

Once Phase 4 completes:
- ✅ Unified IDE workspace
- ✅ Context-aware tools
- ✅ Command palette
- ✅ Git integration
- ✅ Global search
- ✅ Agent orchestration
- ✅ Plugin system

**Result**: **100% IDE Ecosystem Complete!**

---

**Final Step**: [Launch Checklist](./launch-checklist.md)
