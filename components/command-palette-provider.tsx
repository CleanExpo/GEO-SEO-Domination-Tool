'use client';

import { CommandPalette } from './command-palette';
import { useCommandPalette } from '@/hooks/use-command-palette';

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useCommandPalette();

  return (
    <>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
