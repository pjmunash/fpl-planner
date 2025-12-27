import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { fplApi } from '../services/fplApi';
import { storage } from '../utils/storage';
import type {
  FPLBootstrapData,
  ManagerData,
  ManagerPicks,
  Player,
  Team,
  Fixture,
  TransferPlan,
  ChipPlan,
} from '../types/fpl';

interface FPLContextType {
  // Data
  bootstrapData: FPLBootstrapData | null;
  managerData: ManagerData | null;
  currentPicks: ManagerPicks | null;
  fixtures: Fixture[] | null;
  
  // Planning
  transferPlans: TransferPlan[];
  chipPlans: ChipPlan[];
  selectedGameweek: number;
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Actions
  connectTeam: (teamId: number) => Promise<void>;
  refreshData: () => Promise<void>;
  disconnect: () => void;
  setSelectedGameweek: (gw: number) => void;
  addTransferPlan: (plan: TransferPlan) => void;
  removeTransferPlan: (gameweek: number) => void;
  addChipPlan: (plan: ChipPlan) => void;
  removeChipPlan: (gameweek: number) => void;
  
  // Helpers
  getPlayer: (id: number) => Player | undefined;
  getPlayerWithLiveData: (id: number, gw?: number) => Player | undefined;
  getTeam: (id: number) => Team | undefined;
  getCurrentGameweek: () => number;
  getPicksForGameweek: (gw: number) => ManagerPicks | null;
  getFinancialStatus: (gw: number) => { bank: number; squadValue: number; totalBudget: number };
  fetchPlayerLeagues: (teamId: number) => Promise<any>;
  fetchLeagueStandings: (leagueId: number, isHeadToHead?: boolean) => Promise<any>;
}

const FPLContext = createContext<FPLContextType | undefined>(undefined);

export const FPLProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bootstrapData, setBootstrapData] = useState<FPLBootstrapData | null>(null);
  const [managerData, setManagerData] = useState<ManagerData | null>(null);
  const [currentPicks, setCurrentPicks] = useState<ManagerPicks | null>(null);
  const [picksByGW, setPicksByGW] = useState<Record<number, ManagerPicks>>({});
  const [liveData, setLiveData] = useState<Record<number, any>>({});
  const [fixtures, setFixtures] = useState<Fixture[] | null>(null);
  const [transferPlans, setTransferPlans] = useState<TransferPlan[]>([]);
  const [chipPlans, setChipPlans] = useState<ChipPlan[]>([]);
  const [selectedGameweek, setSelectedGameweekState] = useState<number>(storage.getSelectedGW() || 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load from session storage on mount
    const teamId = storage.getTeamId();
    const savedManagerData = storage.getManagerData();
    const savedTransferPlans = storage.getTransferPlans();
    const savedChipPlans = storage.getChipPlans();

    if (savedManagerData) {
      setManagerData(savedManagerData);
    }
    
    setTransferPlans(savedTransferPlans);
    setChipPlans(savedChipPlans);

    // Load bootstrap data
    loadBootstrapData();

    // Auto-refresh if connected and data is stale
    if (teamId && storage.isExpired()) {
      connectTeam(teamId);
    }
  }, []);

  const loadBootstrapData = async () => {
    try {
      const data = await fplApi.getBootstrapData();
      setBootstrapData(data);
      
      const fixturesData = await fplApi.getFixtures();
      setFixtures(fixturesData);
    } catch (err) {
      console.error('Failed to load bootstrap data:', err);
    }
  };

  const connectTeam = async (teamId: number) => {
    setLoading(true);
    setError(null);

    try {
      // Load bootstrap data if not already loaded
      if (!bootstrapData) {
        const data = await fplApi.getBootstrapData();
        setBootstrapData(data);
        
        const fixturesData = await fplApi.getFixtures();
        setFixtures(fixturesData);
      }

      // Fetch manager data
      const manager = await fplApi.getManagerData(teamId);
      setManagerData(manager);
      storage.setManagerData(manager);
      storage.setTeamId(teamId);

      // Fetch current picks - use current_event from manager data
      const currentGW = manager.current_event || 1;
      setSelectedGameweek(currentGW);
      const picks = await fplApi.getManagerPicks(teamId, currentGW);
      setCurrentPicks(picks);
      setPicksByGW(prev => ({ ...prev, [currentGW]: picks }));

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect team. Please check the Team ID.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    const teamId = storage.getTeamId();
    if (!teamId) {
      setError('No team connected');
      return;
    }

    fplApi.clearCache();
    setPicksByGW({}); // Clear cached picks to force refetch
    setLiveData({}); // Clear live data
    await loadBootstrapData();
    await connectTeam(teamId);
  };

  const disconnect = () => {
    storage.clear();
    setManagerData(null);
    setCurrentPicks(null);
    setPicksByGW({});
    setTransferPlans([]);
    setChipPlans([]);
    setError(null);
  };

  const setSelectedGameweek = (gw: number) => {
    setSelectedGameweekState(gw);
    storage.setSelectedGW(gw);
  };

  // When the selected gameweek changes, fetch official picks and live data
  useEffect(() => {
    const teamId = storage.getTeamId();
    if (!teamId || !selectedGameweek) return;
    
    // Early return: both picks and live data already cached for this GW
    if (picksByGW[selectedGameweek] && liveData[selectedGameweek]) {
      return;
    }

    const fetchData = async () => {
      try {
        // Batch parallel fetches instead of sequential
        const [picks, live] = await Promise.all([
          !picksByGW[selectedGameweek] ? fplApi.getManagerPicks(teamId, selectedGameweek) : Promise.resolve(null),
          !liveData[selectedGameweek] ? fplApi.getLiveGameweek(selectedGameweek).catch(() => null) : Promise.resolve(null)
        ]);

        // Only update if we actually fetched (not null)
        if (picks) {
          setPicksByGW(prev => ({ ...prev, [selectedGameweek]: picks }));
          // Keep currentPicks in sync if this is the current GW
          if (managerData?.current_event === selectedGameweek) {
            setCurrentPicks(picks);
          }
        }

        if (live) {
          setLiveData(prev => ({ ...prev, [selectedGameweek]: live }));
        }
      } catch (err) {
        console.error('Failed to fetch data for GW', selectedGameweek, err);
      }
    };

    fetchData();
  }, [selectedGameweek]);

  const addTransferPlan = (plan: TransferPlan) => {
    const updated = [...transferPlans.filter(p => p.gameweek !== plan.gameweek), plan];
    setTransferPlans(updated);
    storage.setTransferPlans(updated);
  };

  const removeTransferPlan = (gameweek: number) => {
    const updated = transferPlans.filter(p => p.gameweek !== gameweek);
    setTransferPlans(updated);
    storage.setTransferPlans(updated);
  };

  const addChipPlan = (plan: ChipPlan) => {
    const updated = [...chipPlans.filter(p => p.gameweek !== plan.gameweek), plan];
    setChipPlans(updated);
    storage.setChipPlans(updated);
  };

  const removeChipPlan = (gameweek: number) => {
    const updated = chipPlans.filter(p => p.gameweek !== gameweek);
    setChipPlans(updated);
    storage.setChipPlans(updated);
  };

  const getPlayer = (id: number): Player | undefined => {
    return bootstrapData?.elements.find(p => p.id === id);
  };

  const getPlayerWithLiveData = (id: number, gw?: number): Player | undefined => {
    const player = bootstrapData?.elements.find(p => p.id === id);
    if (!player) return undefined;

    const targetGW = gw || selectedGameweek;
    if (!targetGW) return player;

    // Check if GW is in the future (no live data yet)
    const gwEvent = bootstrapData?.events.find(e => e.id === targetGW);
    if (!gwEvent || (!gwEvent.is_current && !gwEvent.finished)) {
      // Future GW - return player with event_points = undefined
      return { ...player, event_points: undefined };
    }

    // Merge with live data if available (elements is an array)
    const live = liveData[targetGW];
    if (live && Array.isArray(live.elements)) {
      const livePlayer = live.elements.find((e: any) => e.id === id);
      if (livePlayer) {
        // Merge live stats (GW-specific) with base player data
        const mergedPlayer = {
          ...player,
          // GW-specific stats from live data
          event_points: livePlayer.stats?.total_points ?? 0,
          minutes: livePlayer.stats?.minutes ?? 0,
          goals_scored: livePlayer.stats?.goals_scored ?? 0,
          assists: livePlayer.stats?.assists ?? 0,
          clean_sheets: livePlayer.stats?.clean_sheets ?? 0,
        } as any;
        
        // Add defensive stats if available
        if (livePlayer.stats?.tackles !== undefined) mergedPlayer.tackles = livePlayer.stats.tackles;
        if (livePlayer.stats?.interceptions !== undefined) mergedPlayer.interceptions = livePlayer.stats.interceptions;
        if (livePlayer.stats?.own_goals !== undefined) mergedPlayer.own_goals = livePlayer.stats.own_goals;
        if (livePlayer.stats?.penalties_saved !== undefined) mergedPlayer.penalties_saved = livePlayer.stats.penalties_saved;
        if (livePlayer.stats?.yellow_cards !== undefined) mergedPlayer.yellow_cards = livePlayer.stats.yellow_cards;
        if (livePlayer.stats?.red_cards !== undefined) mergedPlayer.red_cards = livePlayer.stats.red_cards;
        
        return mergedPlayer;
      }
    }

    return player;
  };

  const getTeam = (id: number): Team | undefined => {
    return bootstrapData?.teams.find(t => t.id === id);
  };

  const getCurrentGameweek = (): number => {
    return bootstrapData?.events.find(e => e.is_current)?.id || 1;
  };

  const getPicksForGameweek = (gw: number): ManagerPicks | null => {
    if (!bootstrapData) return currentPicks;

    // Prefer fetched picks for that GW (reflects official transfers from API)
    if (picksByGW[gw]) {
      // Apply any local transfer plans on top of fetched picks
      const base = picksByGW[gw];
      // Include plans for this GW and after the base event (so same-GW plans apply)
      const plansUpToGW = transferPlans.filter(p => p.gameweek <= gw && p.gameweek >= base.entry_history.event && p.playerOut && p.playerIn);
      if (plansUpToGW.length === 0) return base;

      const picksCopy = base.picks.map(p => ({ ...p }));
      plansUpToGW.sort((a, b) => a.gameweek - b.gameweek).forEach(plan => {
        const idx = picksCopy.findIndex(p => p.element === plan.playerOut);
        if (idx >= 0) {
          picksCopy[idx].element = plan.playerIn as number;
        }
      });

      return { ...base, picks: picksCopy } as ManagerPicks;
    }

    // Fallback: simulate from currentPicks with transfer plans
    if (!currentPicks) return null;
    const base = currentPicks;
    const plansUpToGW = transferPlans.filter(p => p.gameweek <= gw && p.playerOut && p.playerIn);
    if (plansUpToGW.length === 0) return base;

    const picksCopy = base.picks.map(p => ({ ...p }));
    plansUpToGW.sort((a, b) => a.gameweek - b.gameweek).forEach(plan => {
      const idx = picksCopy.findIndex(p => p.element === plan.playerOut);
      if (idx >= 0) {
        picksCopy[idx].element = plan.playerIn as number;
      }
    });

    return { ...base, picks: picksCopy } as ManagerPicks;
  };

  const getFinancialStatus = (gw: number): { bank: number; squadValue: number; totalBudget: number } => {
    const picks = getPicksForGameweek(gw);
    if (!picks || !bootstrapData) {
      return { bank: 0, squadValue: 0, totalBudget: 0 };
    }

    // Calculate squad value based on current picks with transfers applied
    let squadValue = 0;
    picks.picks.forEach(pick => {
      const player = bootstrapData.elements.find(p => p.id === pick.element);
      if (player) squadValue += player.now_cost;
    });

    // Calculate bank: start with original bank from API for base picks,
    // then apply ALL planned transfers up to the target GW (cumulative),
    // using same rules as getPicksForGameweek.
    let bank = picks.entry_history.bank;

    // Determine base event for fetched picks
    const baseEvent = picks.entry_history.event;
    const plansUpToGW = transferPlans.filter(p => p.playerOut && p.playerIn && p.gameweek <= gw && p.gameweek >= baseEvent);

    plansUpToGW.forEach(plan => {
      const playerOut = bootstrapData.elements.find(p => p.id === plan.playerOut);
      const playerIn = bootstrapData.elements.find(p => p.id === plan.playerIn);
      if (playerOut && playerIn) {
        const transferCost = playerIn.now_cost - playerOut.now_cost;
        bank -= transferCost;
      }
    });

    const safeBank = Math.max(0, bank);
    return {
      bank: safeBank,
      squadValue,
      totalBudget: squadValue + safeBank
    };
  };

  const fetchPlayerLeagues = async (teamId: number) => {
    try {
      const leagues = await fplApi.getManagerLeagues(teamId);
      return leagues;
    } catch (err) {
      console.error('Failed to fetch player leagues:', err);
      throw err;
    }
  };

  const fetchLeagueStandings = async (leagueId: number, isHeadToHead = false) => {
    try {
      const standings = isHeadToHead 
        ? await fplApi.getHeadToHeadLeagueStandings(leagueId)
        : await fplApi.getLeagueStandings(leagueId);
      return standings;
    } catch (err) {
      console.error('Failed to fetch league standings:', err);
      throw err;
    }
  };

  return (
    <FPLContext.Provider
      value={{
        bootstrapData,
        managerData,
        currentPicks,
        fixtures,
        transferPlans,
        chipPlans,
        selectedGameweek,
        loading,
        error,
        connectTeam,
        refreshData,
        disconnect,
        setSelectedGameweek,
        addTransferPlan,
        removeTransferPlan,
        addChipPlan,
        removeChipPlan,
        getPlayer,
        getPlayerWithLiveData,
        getTeam,
        getCurrentGameweek,
        getPicksForGameweek,
        getFinancialStatus,
        fetchPlayerLeagues,
        fetchLeagueStandings,
      }}
    >
      {children}
    </FPLContext.Provider>
  );
};

export const useFPL = () => {
  const context = useContext(FPLContext);
  if (context === undefined) {
    throw new Error('useFPL must be used within an FPLProvider');
  }
  return context;
};
