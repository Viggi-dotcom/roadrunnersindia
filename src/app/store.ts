import { create } from "zustand";

interface MapFilters {
  showMechanics: boolean;
  showFuel: boolean;
  showStays: boolean;
}

interface AppStore {
  // Map state
  mapFilters: MapFilters;
  toggleMapFilter: (filter: keyof MapFilters) => void;
  selectedMapPoint: any | null;
  setSelectedMapPoint: (point: any | null) => void;

  // UI
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  // Auth
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  adminUser: any | null;
  setAdminUser: (user: any | null) => void;

  // Expedition filters
  difficultyFilter: string;
  setDifficultyFilter: (f: string) => void;
  durationFilter: string;
  setDurationFilter: (f: string) => void;
  terrainFilter: string;
  setTerrainFilter: (f: string) => void;
}

export const useStore = create<AppStore>((set) => ({
  // Map
  mapFilters: { showMechanics: true, showFuel: true, showStays: true },
  toggleMapFilter: (filter) =>
    set((state) => ({
      mapFilters: { ...state.mapFilters, [filter]: !state.mapFilters[filter] },
    })),
  selectedMapPoint: null,
  setSelectedMapPoint: (point) => set({ selectedMapPoint: point }),

  // UI
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  // Auth
  accessToken: null,
  setAccessToken: (token) => set({ accessToken: token }),
  isAdmin: false,
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  adminUser: null,
  setAdminUser: (user) => set({ adminUser: user }),

  // Filters
  difficultyFilter: "ALL",
  setDifficultyFilter: (f) => set({ difficultyFilter: f }),
  durationFilter: "ALL",
  setDurationFilter: (f) => set({ durationFilter: f }),
  terrainFilter: "ALL",
  setTerrainFilter: (f) => set({ terrainFilter: f }),
}));
