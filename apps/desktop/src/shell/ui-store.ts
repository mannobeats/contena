import { create } from "zustand";
import { persist } from "zustand/middleware";

type UiState = {
  sidebarCollapsed: boolean;
  paletteOpen: boolean;
  shortcutsOpen: boolean;
  /** The offer to install the command-line tools was turned down; Settings still has it. */
  toolsDeclined: boolean;
  /** Crashes the person has seen and set aside, as `crashKey`s, so the notice stays quiet. */
  dismissedCrashes: string[];
  toggleSidebar: () => void;
  setPaletteOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  declineTools: () => void;
  /** Replaces the list, so crashes that are gone stop taking room. */
  dismissCrashes: (keys: string[]) => void;
};

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      paletteOpen: false,
      shortcutsOpen: false,
      toolsDeclined: false,
      dismissedCrashes: [],
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
      setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
      declineTools: () => set({ toolsDeclined: true }),
      dismissCrashes: (dismissedCrashes) => set({ dismissedCrashes }),
    }),
    {
      name: "contena.ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        toolsDeclined: state.toolsDeclined,
        dismissedCrashes: state.dismissedCrashes,
      }),
    },
  ),
);
