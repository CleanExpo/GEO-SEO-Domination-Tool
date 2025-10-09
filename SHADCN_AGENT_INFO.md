# Shadcn SDK Agent - Quick Reference

**Status**: ✅ **ACTIVE AND READY TO USE**

---

## 📍 Location

**Agent Files**:
- **JSON Config**: `.claude/agents/ui_shadcn.json`
- **Documentation**: `.claude/agents/ui-shadcn-generator.md`

**Support Files**:
- `./_src_electron/services/shadcn-setup.ts`

---

## 🎯 What It Does

The **UI-Shadcn Agent** is an elite UI component architect that specializes in:

✅ Installing and configuring shadcn/ui components
✅ Creating consistent design systems
✅ Implementing responsive layouts
✅ Adding loading and error states
✅ Ensuring accessibility compliance

---

## 🔧 Core Components Generated

### 1. **Sidebar Component** (`src/components/Sidebar.tsx`)
- Fully typed navigation with Next.js app router
- Client-side routing with `usePathname`
- Active state management
- Nested navigation support
- Keyboard accessible

### 2. **StatCard Component** (`src/components/cards/StatCard.tsx`)
- Minimal, reusable statistics card
- Typed props (title, value)
- Shadcn/ui styling
- Responsive design

### 3. **Navigation Helper** (`src/ui/nav.ts`)
- Type-safe navigation map builder
- NavItem and NavMap types
- Default navigation structure
- Guard support (auth, admin, none)
- Nested hierarchies

---

## 🚀 How to Use

### Option 1: Via Claude Code CLI

```bash
claude-code --agent ui_shadcn --input '{
  "projectPath": "./",
  "components": ["button", "card", "dialog", "input", "label", "table"],
  "darkMode": true,
  "designTokens": {
    "primaryColor": "emerald",
    "radius": "0.5rem"
  }
}'
```

### Option 2: Via Task Tool in Code

```typescript
// Launch the agent to generate UI components
const result = await runAgent('ui_shadcn', {
  projectPath: './',
  components: ['button', 'card', 'input'],
  darkMode: true
});
```

### Option 3: Interactive with Claude

```
You: "I need shadcn UI components for my dashboard"
Claude: [Uses ui_shadcn agent automatically]
```

---

## 📦 Available shadcn/ui Components

The agent can install any shadcn component:

**Form Components**:
- button, input, label, textarea, checkbox, radio-group
- select, switch, slider, form

**Layout Components**:
- card, separator, sheet, dialog, drawer
- tabs, accordion, collapsible

**Data Display**:
- table, badge, avatar, skeleton
- calendar, progress, tooltip

**Feedback**:
- alert, alert-dialog, toast, popover
- dropdown-menu, context-menu

**Default Installation**:
```json
["button", "card", "dialog", "input", "label", "table", "badge", "skeleton"]
```

---

## ⚙️ Agent Configuration

### Input Schema:
```typescript
{
  projectPath: string;          // Required: Path to Next.js project
  components?: string[];        // Optional: Components to install
  darkMode?: boolean;           // Optional: Enable dark mode (default: false)
  designTokens?: {
    primaryColor?: string;      // Optional: Primary color (default: "emerald")
    radius?: string;            // Optional: Border radius (default: "0.5rem")
  }
}
```

### Output:
```typescript
{
  installed_components: string[];     // List of installed components
  design_tokens: object;              // Applied design tokens
  updated_pages: string[];            // Updated page files
  accessibility_score: number;        // WCAG compliance score (0-100)
}
```

---

## ✅ What the Agent Does

### Step 1: Audit & Identify
- Checks existing components
- Identifies inconsistencies
- Lists missing shadcn components

### Step 2: Install Components
- Runs `npx shadcn@latest add [component]`
- Installs to `components/ui/`
- Configures Tailwind properly

### Step 3: Configure Design System
- Updates `tailwind.config.ts`
- Sets up design tokens (colors, spacing, typography)
- Configures dark mode if requested

### Step 4: Ensure Consistency
- Creates reusable component patterns
- Adds proper TypeScript types
- Implements loading states and skeletons
- Ensures responsive layouts

### Step 5: Accessibility
- WCAG AA color contrast
- Keyboard navigation
- Screen reader support
- Semantic HTML

---

## 🎨 Design Tokens

Default theme configuration:

```typescript
{
  primaryColor: "emerald",     // Main brand color
  radius: "0.5rem",            // Border radius for components
  darkMode: false              // Dark mode toggle
}
```

**Available Primary Colors**:
- emerald (default)
- blue, green, red, orange, purple, pink
- slate, zinc, neutral, stone

---

## 📋 Success Criteria

Agent completes when:
- ✅ All requested components installed
- ✅ Tailwind config updated with design tokens
- ✅ No style conflicts or CSS errors
- ✅ Responsive on mobile/tablet/desktop
- ✅ WCAG AA compliance for color contrast

**Maximum Iterations**: 4 attempts to resolve issues

---

## 💡 Common Use Cases

### 1. Bootstrap New Dashboard
```bash
claude-code --agent ui_shadcn --input '{
  "projectPath": "./",
  "components": ["button", "card", "table", "dialog", "input", "label"],
  "darkMode": true
}'
```

### 2. Add Form Components
```bash
claude-code --agent ui_shadcn --input '{
  "projectPath": "./",
  "components": ["form", "input", "label", "select", "checkbox", "radio-group"]
}'
```

### 3. Create Data Dashboard
```bash
claude-code --agent ui_shadcn --input '{
  "projectPath": "./",
  "components": ["table", "card", "badge", "skeleton", "tabs"]
}'
```

### 4. Modal & Overlays
```bash
claude-code --agent ui_shadcn --input '{
  "projectPath": "./",
  "components": ["dialog", "sheet", "popover", "dropdown-menu", "alert-dialog"]
}'
```

---

## 🔧 Technical Details

### Agent Capabilities:
- **shadcn/ui** component installation
- **Tailwind CSS** configuration
- **Radix UI** primitives integration
- **Dark mode** implementation
- **Form validation** (react-hook-form + zod)
- **Responsive design** patterns
- **Component composition**

### Technologies Used:
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix UI
- React Hook Form
- Zod validation

---

## 📖 Related Documentation

**Official Docs**:
- shadcn/ui: https://ui.shadcn.com
- Tailwind CSS: https://tailwindcss.com
- Radix UI: https://www.radix-ui.com

**Project Docs**:
- Agent Config: `.claude/agents/ui_shadcn.json`
- Agent Guide: `.claude/agents/ui-shadcn-generator.md`
- Main README: `.claude/agents/README.md`

---

## 🎯 Quick Example

**Task**: "I need a dashboard with cards, buttons, and a data table"

**Agent Action**:
```bash
# Automatically runs:
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add table

# Generates:
- components/ui/button.tsx
- components/ui/card.tsx
- components/ui/table.tsx
- components/Sidebar.tsx
- components/cards/StatCard.tsx
- ui/nav.ts

# Updates:
- tailwind.config.ts (with design tokens)
- app/globals.css (with shadcn styles)
```

**Result**: Production-ready UI components with:
- ✅ TypeScript types
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Accessibility
- ✅ Consistent styling

---

## 🚀 Getting Started

**1. Install via Agent:**
```bash
claude-code --agent ui_shadcn --input '{"projectPath": "./"}'
```

**2. Or Ask Claude:**
```
"Set up shadcn UI components for my dashboard with dark mode"
```

**3. Components Installed to:**
```
components/
├── ui/           # shadcn/ui components
├── cards/        # Custom card components
└── Sidebar.tsx   # Navigation component
```

---

**Status**: ✅ **READY TO USE**

Your Shadcn SDK Agent is fully configured and ready to generate production-quality UI components for your Next.js application!

---

*Last Updated: October 8, 2025*
*Agent Version: 1.0*
