# Command Palette Documentation

**Feature ID:** CMD-001
**Phase:** 2 (Developer Experience)
**Status:** ✅ Complete
**Created:** 2025-10-05

---

## Overview

The Command Palette provides a universal command launcher accessible via keyboard shortcuts, enabling rapid navigation and action execution across the application.

## Features

### Core Functionality

- **Universal Access**: Available from any page via `Cmd+K` (Mac) / `Ctrl+K` (Windows)
- **Alternative Triggers**: Also accessible via `Cmd+P` / `Ctrl+P` or forward slash (`/`)
- **Fuzzy Search**: Score-based ranking algorithm for accurate results
- **Recent Commands**: Last 5 commands stored in localStorage
- **Keyboard Navigation**: Full arrow key and enter/escape support

### Command Categories

#### Navigation (5 commands)
- `Go to Dashboard` (shortcut: `g d`)
- `Go to Companies` (shortcut: `g c`)
- `Go to Keywords` (shortcut: `g k`)
- `Go to Rankings` (shortcut: `g r`)
- `Go to Reports` (shortcut: `g p`)

#### Search (3 commands)
- `Search Companies` - Navigates to companies page and focuses search input
- `Search Keywords` - Navigates to keywords page and focuses search input
- `Search Content` - Global content search

#### Actions (2 commands)
- `New Company` (shortcut: `n c`)
- `New Keyword Campaign` (shortcut: `n k`)

#### Settings (2 commands)
- `Switch Organisation` - Triggers organisation switcher dropdown
- `Open Settings` (shortcut: `,`)

## Technical Architecture

### Components

**File:** `web-app/components/command-palette.tsx`

```typescript
interface Command {
  id: string;
  name: string;
  description?: string;
  icon?: React.ComponentType;
  keywords?: string[];
  section: 'navigation' | 'search' | 'actions' | 'settings';
  action: () => void | Promise<void>;
  shortcut?: string;
}
```

**File:** `web-app/hooks/use-command-palette.ts`
- Handles keyboard event listeners
- Manages modal open/close state
- Supports `Cmd/Ctrl + K`, `Cmd/Ctrl + P`, and `/` keys

**File:** `web-app/components/command-palette-provider.tsx`
- Client-side wrapper for global availability
- Integrated into root layout

### Implementation Details

**Search Algorithm:**
- Exact name match: +10 points
- Name starts with query: +5 points
- Name contains query: +3 points
- Keyword match: +2 points
- Description match: +1 point

**Recent Commands:**
- Stored in `localStorage` under key `recent-commands`
- Maximum 5 entries (FIFO)
- Displayed in separate section when palette is empty

**Accessibility:**
- Modal overlay with backdrop blur
- Focus trap within command palette
- Escape key to close
- Arrow keys for navigation
- Enter to execute command

## Usage Examples

### For End Users

```
1. Press Cmd+K (or Ctrl+K on Windows)
2. Type "dashboard" → Select "Go to Dashboard"
3. Or use shortcut: Press "g" then "d"
```

### For Developers

**Adding a New Command:**

```typescript
// In command-palette.tsx, add to commands array:
{
  id: 'nav-analytics',
  name: 'Go to Analytics',
  description: 'View analytics dashboard',
  icon: BarChartIcon,
  keywords: ['analytics', 'metrics', 'data'],
  section: 'navigation',
  action: () => router.push('/analytics'),
  shortcut: 'g a',
}
```

## Integration with Phase 1

- ✅ Works with multi-tenancy (organisation context preserved)
- ✅ "Switch Organisation" command triggers Phase 1's organisation switcher
- ✅ Respects Row-Level Security (RLS) policies

## Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile responsive (touch-friendly)

## Performance

- **Bundle Size:** +12KB (cmdk library)
- **Initial Load:** <50ms
- **Search Latency:** <5ms (client-side fuzzy search)
- **localStorage Impact:** <1KB (recent commands)

## Future Enhancements

- [ ] Command history persistence across devices (via Supabase)
- [ ] Custom user-defined commands
- [ ] Command aliases (e.g., "comp" → "companies")
- [ ] AI-powered command suggestions
- [ ] Command analytics (most-used commands)

## Troubleshooting

**Issue:** Command palette not opening
- **Solution:** Check if `CommandPaletteProvider` is in `app/layout.tsx`

**Issue:** Keyboard shortcuts not working
- **Solution:** Ensure no input/textarea has focus (shortcuts disabled in input fields)

**Issue:** Recent commands not persisting
- **Solution:** Check browser localStorage permissions
