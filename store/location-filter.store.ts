'use client';

import { create } from 'zustand';

interface LocationFilterState {
  /**
   * null only transiently before LocationSwitcher auto-selects the first
   * accessible location — there is no "All Locations" aggregate view.
   */
  selectedLocationId: number | null;
  setSelectedLocationId: (id: number | null) => void;
  hydrate: () => void;
}

const STORAGE_KEY = 'selected_location_id';

export const useLocationFilterStore = create<LocationFilterState>((set) => ({
  selectedLocationId: null,

  setSelectedLocationId: (id) => {
    if (id === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, String(id));
    set({ selectedLocationId: id });
  },

  hydrate: () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) set({ selectedLocationId: Number(raw) });
  },
}));
