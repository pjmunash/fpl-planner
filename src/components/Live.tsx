import React, { useMemo, useState } from 'react';
import { useFPL } from '../context/FPLContext';
import { getTeamShirtUrl } from '../utils/teamShirts';

const Live: React.FC = () => {
  const {
    managerData,
    currentPicks,
    bootstrapData,
    getPlayerWithLiveData,
    getTeam,
    loading,
  } = useFPL();

  const [hoveredPlayer, setHoveredPlayer] = useState<number | null>(null);

  // Current GW
  const currentGW = useMemo(() => {
    return bootstrapData?.events.find(e => e.is_current)?.id || 1;
  }, [bootstrapData]);

  // Current GW stats - get picks for current GW
  const currentGWPicks = useMemo(() => {
    if (!currentGW) return currentPicks;
    return currentPicks;
  }, [currentGW, currentPicks]);

  const gwStats = useMemo(() => {
    if (!currentGWPicks) return null;
    return currentGWPicks.entry_history;
  }, [currentGWPicks]);

  // Starting XI with live data for current GW only
  const startingXI = useMemo(() => {
    if (!currentPicks || !currentGW) return [];
    return currentPicks.picks
      .slice(0, 11)
      .map(pick => ({
        pick,
        player: getPlayerWithLiveData(pick.element, currentGW),
      }))
      .filter(p => p.player);
  }, [currentPicks, currentGW, getPlayerWithLiveData]);

  // Bench players (shown separately when bench boost is active)
  const benchPlayers = useMemo(() => {
    if (!currentPicks || !currentGW) return [];
    const isBenchBoost = currentPicks.active_chip === 'bboost';
    if (!isBenchBoost) return [];
    return currentPicks.picks
      .slice(11, 15)
      .map(pick => ({
        pick,
        player: getPlayerWithLiveData(pick.element, currentGW),
      }))
      .filter(p => p.player);
  }, [currentPicks, currentGW, getPlayerWithLiveData]);

  // Group by position
  const positionGroups = useMemo(() => {
    return {
      gk: startingXI.filter(p => p.player?.element_type === 1),
      def: startingXI.filter(p => p.player?.element_type === 2),
      mid: startingXI.filter(p => p.player?.element_type === 3),
      fwd: startingXI.filter(p => p.player?.element_type === 4),
    };
  }, [startingXI]);

  // Calculate total points from starting XI (or all 15 if bench boost) with captain multiplier
  const totalPoints = useMemo(() => {
    if (!currentPicks || !currentGW) return 0;
    
    const isBenchBoost = currentPicks.active_chip === 'bboost';
    const picksToCount = isBenchBoost ? currentPicks.picks : currentPicks.picks.slice(0, 11);
    
    return picksToCount.reduce((total, pick) => {
      const player = getPlayerWithLiveData(pick.element, currentGW);
      if (!player) return total;
      
      const points = player.event_points || 0;
      const multiplier = pick.is_captain ? 2 : 1;
      return total + (points * multiplier);
    }, 0);
  }, [currentPicks, currentGW, getPlayerWithLiveData]);

  // Calculate dynamic overall total points (previous GWs + current GW live points)
  const overallTotalPoints = useMemo(() => {
    const previousTotal = gwStats?.total_points ?? managerData?.summary_overall_points ?? 0;
    const previousGWPoints = gwStats?.points ?? 0;
    return previousTotal - previousGWPoints + totalPoints;
  }, [gwStats, managerData, totalPoints]);

  // Calculate rank change (negative = rank improving)
  const rankChange = useMemo(() => {
    if (!gwStats?.overall_rank || !managerData?.summary_overall_rank) return 0;
    return managerData.summary_overall_rank - gwStats.overall_rank;
  }, [gwStats, managerData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!managerData || !currentPicks || !bootstrapData) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Loading live data...</p>
      </div>
    );
  }

  const renderPlayerCard = (item: any) => {
    const { pick, player } = item;
    const team = getTeam(player.team);
    
    // Check if player has played
    const hasPlayed = (player.minutes || 0) > 0;
    const points = hasPlayed ? (player.event_points || 0) : null;
    const displayPoints = points === null ? '-' : (pick.is_captain ? points * 2 : pick.is_vice_captain ? points : points);

    // Build stat rows - show gameweek stats (even if 0)
    const stats = [];
    if (hasPlayed) {
      stats.push({ label: 'minutes', value: player.minutes || 0 });
      stats.push({ label: 'goals', value: player.goals_scored || 0 });
      stats.push({ label: 'assists', value: player.assists || 0 });
      if (player.clean_sheets) stats.push({ label: 'clean sheet', value: 1 });
      if (player.yellow_cards) stats.push({ label: 'yellow', value: player.yellow_cards });
      if (player.red_cards) stats.push({ label: 'red', value: player.red_cards });
      if (player.own_goals) stats.push({ label: 'own goals', value: player.own_goals });
      if (player.penalties_saved) stats.push({ label: 'saved', value: player.penalties_saved });
    }

    return (
      <div
        key={player.id}
        className="relative group"
        onMouseEnter={() => setHoveredPlayer(player.id)}
        onMouseLeave={() => setHoveredPlayer(null)}
      >
        <div className="flex flex-col items-center cursor-pointer">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all overflow-hidden">
            <div className="flex flex-col items-center p-1.5">
              <div className="relative">
                <img
                  src={getTeamShirtUrl(team?.code || 0, player.element_type === 1)}
                  alt={player.web_name}
                  className="w-12 h-12 object-contain drop-shadow-lg transform transition group-hover:scale-110"
                />
                {pick.is_captain && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center border border-white text-[7px] font-bold text-gray-900">
                    C
                  </div>
                )}
                {pick.is_vice_captain && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center border border-white text-[7px] font-bold text-white">
                    V
                  </div>
                )}
              </div>
              <div className="text-[9px] font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[70px] text-center mt-0.5">
                {player.web_name}
              </div>
            </div>
            <div className={`w-full text-white text-[9px] font-bold py-0.5 text-center shadow-md border-t ${displayPoints === '-' ? 'bg-gray-400 border-gray-500' : 'bg-green-500 border-green-700'}`}>
              {displayPoints}
            </div>
          </div>
        </div>

        {/* Hover Card with Live Stats Table - Position based on player position */}
        {hoveredPlayer === player.id && (
          <div className={`absolute left-1/2 transform -translate-x-1/2 ${player.element_type === 4 ? 'top-full mt-2' : 'bottom-full mb-2'} bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 border border-gray-200 dark:border-gray-700 overflow-hidden w-56`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-2.5 text-center">
              <div className="font-bold text-sm">{player.web_name}</div>
            </div>

            {/* GW Status */}
            {!hasPlayed ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/30 p-2.5 text-center border-b border-gray-200 dark:border-gray-700">
                <div className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">Yet to Play</div>
              </div>
            ) : (
              <>
                {/* Points Summary */}
                <div className="bg-green-50 dark:bg-green-900/20 px-2.5 py-1.5 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">GW Points</span>
                    <span className="flex items-center gap-1 font-bold text-green-600 dark:text-green-400">
                      <span className="text-lg">{points}</span>
                      {pick.is_captain && <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400">×2</span>}
                    </span>
                  </div>
                </div>

                {/* Stats Table */}
                {stats.length > 0 ? (
                  <div className="p-2">
                    <div className="space-y-0.5">
                      {stats.map((stat, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-0.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                          <span className="text-gray-600 dark:text-gray-400 capitalize">{stat.label}</span>
                          <span className="font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-1.5 py-[1px] rounded text-[11px]">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No stats yet
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col items-center gap-4">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Live - GW{currentGW}</h1>
              <div className="mt-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Total Points</div>
                <div className="text-4xl font-bold text-green-600 dark:text-green-400">{totalPoints}</div>
              </div>
            </div>
          </div>

          {/* Current GW Summary */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mt-6">
            <div className="bg-purple-50 dark:bg-purple-900/30 px-3 py-3 sm:p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mb-1">Overall Rank</div>
              <div className="flex items-center gap-2">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-400 truncate">
                  {gwStats?.overall_rank?.toLocaleString() || managerData?.summary_overall_rank?.toLocaleString() || '-'}
                </div>
                {rankChange !== 0 && (
                  <div className={`text-xs sm:text-sm font-semibold ${
                    rankChange > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {rankChange > 0 ? '↑' : '↓'} {Math.abs(rankChange).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/30 px-3 py-3 sm:p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mb-1">GW Rank</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400 truncate">
                {gwStats?.rank?.toLocaleString() || '-'}
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/30 px-3 py-3 sm:p-4 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mb-1">Total Points</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400 truncate">{overallTotalPoints.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Live Squad - By Position on Green Field */}
        <div className="max-w-4xl mx-auto relative bg-green-600 rounded-lg shadow-2xl overflow-hidden border-4 border-green-800"
             style={{
               backgroundImage: `
                 repeating-linear-gradient(0deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 2px, transparent 2px, transparent 40px),
                 repeating-linear-gradient(90deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 2px, transparent 2px, transparent 40px)
               `
             }}>
          
          {/* Outer field border */}
          <div className="absolute inset-0 border-4 border-white rounded-lg pointer-events-none z-0"></div>
          
          {/* Halfway line - more prominent */}
          <div className="absolute left-0 right-0 top-1/2 h-1 bg-white transform -translate-y-1/2 pointer-events-none z-0"></div>
          
          {/* Center circle */}
          <div className="absolute left-1/2 top-1/2 w-28 h-28 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"></div>
          
          {/* Center spot */}
          <div className="absolute left-1/2 top-1/2 w-1.5 h-1.5 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"></div>

          {/* Penalty box at top (attacking end) */}
          <div className="absolute left-1/2 top-3 w-56 h-24 border-2 border-white transform -translate-x-1/2 pointer-events-none z-0"></div>
          {/* Goal box at top */}
          <div className="absolute left-1/2 top-3 w-32 h-12 border-2 border-white transform -translate-x-1/2 pointer-events-none z-0"></div>
          
          {/* Penalty box at bottom (defending end) */}
          <div className="absolute left-1/2 bottom-3 w-56 h-24 border-2 border-white transform -translate-x-1/2 pointer-events-none z-0"></div>
          {/* Goal box at bottom */}
          <div className="absolute left-1/2 bottom-3 w-32 h-12 border-2 border-white transform -translate-x-1/2 pointer-events-none z-0"></div>
          
          <div className="relative z-10 py-8 px-4 space-y-8">
            {/* Forwards */}
            {positionGroups.fwd.length > 0 && (
              <div>
                <div className="flex flex-wrap justify-center gap-6">
                  {positionGroups.fwd.map(item => renderPlayerCard(item))}
                </div>
              </div>
            )}

            {/* Midfielders */}
            {positionGroups.mid.length > 0 && (
              <div>
                <div className="flex flex-wrap justify-center gap-6">
                  {positionGroups.mid.map(item => renderPlayerCard(item))}
                </div>
              </div>
            )}

            {/* Defenders */}
            {positionGroups.def.length > 0 && (
              <div>
                <div className="flex flex-wrap justify-center gap-6">
                  {positionGroups.def.map(item => renderPlayerCard(item))}
                </div>
              </div>
            )}

            {/* Goalkeepers */}
            {positionGroups.gk.length > 0 && (
              <div>
                <div className="flex flex-wrap justify-center gap-6">
                  {positionGroups.gk.map(item => renderPlayerCard(item))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bench Players (only shown when bench boost active) */}
        {benchPlayers.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded font-bold">BENCH BOOST ACTIVE</span>
              Bench Players
            </h3>
            <div className="flex flex-wrap justify-center gap-8">
              {benchPlayers.map(item => renderPlayerCard(item))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Live;
