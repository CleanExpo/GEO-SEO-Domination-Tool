'use client';

import * as React from 'react';

export function useCommandPalette() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) ||
          // Cmd+P or Ctrl+P
          (e.key === 'p' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setOpen((open) => !open);
      }

      // Forward slash (/) for quick search (only when not in input)
      if (e.key === '/' &&
          e.target instanceof HTMLElement &&
          !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return { open, setOpen };
}
