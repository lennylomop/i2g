import { create } from 'zustand'

// Define types
export interface Dashboard {
  id: string;
  name: string;
  createdAt: string;
  stats: StatsEntry;
  absageGruende: AbsageGruende;
  kaufangebote: Kaufangebot[];
  image: string | null;
}

export interface StatsEntry {
  date: string;
  besucher: number;
  lesezeichen: number;
  bewerber: number;
}

export interface AbsageGruende {
  lage: number;
  preis: number;
  zustand: number;
  sonstiges: number;
  keineRueckmeldung: number;
}

export interface Kaufangebot {
  betrag: number;
  finanzierung: 'vorhanden' | 'ausstehend' | 'unwahrscheinlich';
  gueltigBis: string;
  empfehlung: boolean;
}

export interface AttraktivitaetsSettings {
  calculation: 'bewerberLesezeichen' | 'bewerberAufrufe';
  greenThreshold: number;
  yellowThreshold: number;
  redThreshold: number;
}

interface Store {
  dashboards: Dashboard[];
  addDashboard: (name: string) => string;
  currentDashboard: string | null;
  setCurrentDashboard: (id: string | null) => void;
  image: string | null;
  setImage: (image: string | null) => void;
  latestStats: StatsEntry;
  updateLatestStats: (stats: Partial<StatsEntry>) => void;
  statsHistory: StatsEntry[];
  addStatsHistory: (stats: StatsEntry) => void;
  updateStatsHistory: (index: number, stats: StatsEntry) => void;
  removeStatsHistory: (index: number) => void;
  absageGruende: AbsageGruende;
  setAbsageGruende: (gruende: AbsageGruende) => void;
  kaufangebote: Kaufangebot[];
  addKaufangebot: (angebot: Kaufangebot) => void;
  removeKaufangebot: (index: number) => void;
  backgroundColor: string;
  backgroundColor2: string;
  textColor1: string;
  textColor2: string;
  updateColors: (backgroundColor: string, backgroundColor2: string, textColor1: string, textColor2: string) => void;
  currentStats: StatsEntry;
  setCurrentStats: (stats: StatsEntry) => void;
  currentAngebot: Kaufangebot;
  setCurrentAngebot: (angebot: Kaufangebot) => void;
  getMostRecentStats: () => StatsEntry;
  saveDashboard: (id: string, data: Omit<Dashboard, 'id' | 'name' | 'createdAt'>) => void;
  attraktivitaetsSettings: AttraktivitaetsSettings;
  updateAttraktivitaetsSettings: (settings: Partial<AttraktivitaetsSettings>) => void;
}

export const useStore = create<Store>((set, get) => ({
  dashboards: [],
  addDashboard: (name) => {
    const id = Date.now().toString();
    set((state) => ({
      dashboards: [...state.dashboards, { 
        id, 
        name, 
        createdAt: new Date().toISOString(),
        stats: get().currentStats,
        absageGruende: get().absageGruende,
        kaufangebote: get().kaufangebote,
        image: get().image
      }],
      currentDashboard: id
    }));
    return id;
  },
  currentDashboard: null,
  setCurrentDashboard: (id) => set({ currentDashboard: id }),
  image: null,
  setImage: (image) => set({ image }),
  latestStats: {
    date: new Date().toISOString().split('T')[0],
    besucher: 0,
    lesezeichen: 0,
    bewerber: 0
  },
  updateLatestStats: (stats) => set((state) => ({ 
    latestStats: { ...state.latestStats, ...stats },
    currentStats: { ...state.currentStats, ...stats }
  })),
  statsHistory: [],
  addStatsHistory: (stats) => set((state) => {
    const updatedHistory = state.statsHistory.filter(entry => entry.date !== stats.date);
    return {
      statsHistory: [...updatedHistory, stats],
      latestStats: stats,
      currentStats: stats
    };
  }),
  updateStatsHistory: (index, stats) => set((state) => ({
    statsHistory: state.statsHistory.map((item, i) => i === index ? stats : item)
  })),
  removeStatsHistory: (index) => set((state) => ({
    statsHistory: state.statsHistory.filter((_, i) => i !== index)
  })),
  absageGruende: {
    lage: 0,
    preis: 0,
    zustand: 0,
    sonstiges: 0,
    keineRueckmeldung: 0
  },
  setAbsageGruende: (gruende) => set({ absageGruende: gruende }),
  kaufangebote: [],
  addKaufangebot: (angebot) => set((state) => ({
    kaufangebote: [...state.kaufangebote, angebot]
  })),
  removeKaufangebot: (index) => set((state) => ({
    kaufangebote: state.kaufangebote.filter((_, i) => i !== index)
  })),
  backgroundColor: '#ffffff',
  backgroundColor2: '#ffffff',
  textColor1: '#000000',
  textColor2: '#333333',
  updateColors: (backgroundColor, backgroundColor2, textColor1, textColor2) => 
    set({ backgroundColor, backgroundColor2, textColor1, textColor2 }),
  currentStats: {
    date: new Date().toISOString().split('T')[0],
    besucher: 0,
    lesezeichen: 0,
    bewerber: 0
  },
  setCurrentStats: (stats) => set({ currentStats: stats }),
  currentAngebot: {
    betrag: 0,
    finanzierung: 'ausstehend',
    gueltigBis: new Date().toISOString().split('T')[0],
    empfehlung: false
  },
  setCurrentAngebot: (angebot) => set({ currentAngebot: angebot }),
  getMostRecentStats: () => {
    const { statsHistory } = get();
    if (statsHistory.length === 0) {
      return get().currentStats;
    }
    return statsHistory.reduce((latest, current) => 
      new Date(current.date) > new Date(latest.date) ? current : latest
    );
  },
  saveDashboard: (id, data) => set((state) => ({
    dashboards: state.dashboards.map(dashboard => 
      dashboard.id === id 
        ? { ...dashboard, ...data }
        : dashboard
    )
  })),
  attraktivitaetsSettings: {
    calculation: 'bewerberLesezeichen',
    greenThreshold: 20,
    yellowThreshold: 10,
    redThreshold: 0
  },
  updateAttraktivitaetsSettings: (settings) => set((state) => {
    const updatedSettings = { ...state.attraktivitaetsSettings };
    
    for (const key in settings) {
      if (key === 'calculation') {
        updatedSettings.calculation = settings.calculation as 'bewerberLesezeichen' | 'bewerberAufrufe';
      } else if (['greenThreshold', 'yellowThreshold', 'redThreshold'].includes(key)) {
        const value = settings[key as keyof AttraktivitaetsSettings];
        if (typeof value === 'string') {
          // Allow both comma and period as decimal separators
          const numericValue = parseFloat(value.replace(',', '.'));
          if (!isNaN(numericValue)) {
            updatedSettings[key as keyof AttraktivitaetsSettings] = numericValue as never;
          } else {
            // Keep the string value if it's not a valid number
            updatedSettings[key as keyof AttraktivitaetsSettings] = value as never;
          }
        } else if (typeof value === 'number') {
          updatedSettings[key as keyof AttraktivitaetsSettings] = value as never;
        }
      }
    }

    return { attraktivitaetsSettings: updatedSettings };
  }),
}))