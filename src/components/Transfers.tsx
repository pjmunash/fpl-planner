import React, { useState, useMemo, useEffect } from 'react';
import { useFPL } from '../context/FPLContext';
import { formatPrice } from '../utils/helpers';
import { getTeamShirtUrl } from '../utils/teamShirts';

const Transfers: React.FC = () => {
  const { bootstrapData, currentPicks, getPlayer, getTeam, addTransferPlan, selectedGameweek, getFinancialStatus, transferPlans, getPicksForGameweek } = useFPL();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<number | 'all'>('all');
  const [selectedPlayerOut, setSelectedPlayerOut] = useState<number | null>(null);
  const [selectedPlayerIn, setSelectedPlayerIn] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number>(150);
  const [planGameweek, setPlanGameweek] = useState<number>(selectedGameweek);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pendingTransfers, setPendingTransfers] = useState<Array<{ playerOut: number; playerIn: number; cost: number }>>([]);
  const [ignoreBudget, setIgnoreBudget] = useState<boolean>(false);

  const picksForPlan = useMemo(() => {
    return getPicksForGameweek(planGameweek) || currentPicks || null;
  }, [planGameweek, getPicksForGameweek, currentPicks, transferPlans]);

  useEffect(() => {
    setPlanGameweek(selectedGameweek);
  }, [selectedGameweek]);

  // Apply pending transfers sequentially so multiple queued moves never revert
  const previewPicks = useMemo(() => {
    if (!picksForPlan) return null;
    const picks = [...picksForPlan.picks];

    pendingTransfers.forEach(t => {
      const outIndex = picks.findIndex(p => p.element === t.playerOut);
      if (outIndex !== -1) {
        picks[outIndex] = { ...picks[outIndex], element: t.playerIn };
      }
    });

    return { ...picksForPlan, picks };
  }, [picksForPlan, pendingTransfers]);

  // Squad after applying pending transfers (used for filtering and display)
  const currentSquad = useMemo(() => {
    if (!previewPicks || !bootstrapData) return [];
    return previewPicks.picks
      .map(pick => ({ ...pick, playerData: getPlayer(pick.element) }))
      .filter(p => p.playerData);
  }, [previewPicks, bootstrapData, getPlayer]);

  // Get financial status with transfer plans applied
  const financialStatus = useMemo(() => {
    return getFinancialStatus(planGameweek);
  }, [planGameweek, transferPlans, getFinancialStatus]);

  const pendingTotalCost = useMemo(() => {
    return pendingTransfers.reduce((sum, t) => sum + t.cost, 0);
  }, [pendingTransfers]);

  const availableBudget = useMemo(() => {
    const baseBank = Math.max(0, financialStatus.bank - pendingTotalCost);
    if (!selectedPlayerOut) return baseBank;
    const playerOut = getPlayer(selectedPlayerOut);
    return baseBank + (playerOut?.now_cost || 0);
  }, [selectedPlayerOut, financialStatus.bank, pendingTotalCost, getPlayer]);

  const filteredPlayers = useMemo(() => {
    if (!bootstrapData) return [];
    
    let players = bootstrapData.elements.filter(player => {
      // Not in current squad
      const inSquad = currentSquad.some(p => p.element === player.id);
      if (inSquad) return false;

      // Position filter
      if (selectedPosition !== 'all' && player.element_type !== selectedPosition) return false;

      // Price filter
      if (player.now_cost > maxPrice) return false;

      // Budget filter (optional)
      if (!ignoreBudget && player.now_cost > availableBudget) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = player.web_name.toLowerCase().includes(query) ||
                           player.first_name.toLowerCase().includes(query) ||
                           player.second_name.toLowerCase().includes(query);
        const team = getTeam(player.team);
        const matchesTeam = team?.name.toLowerCase().includes(query) ||
                           team?.short_name.toLowerCase().includes(query);
        return matchesName || matchesTeam;
      }

      return true;
    });

    // Sort by total points, do not limit list size
    return players.sort((a, b) => b.total_points - a.total_points);
  }, [bootstrapData, currentSquad, selectedPosition, maxPrice, availableBudget, searchQuery, ignoreBudget]);

  // Suggested transfers out (low form or low minutes)
  const suggestedTransfersOut = useMemo(() => {
    if (!previewPicks) return [];
    return previewPicks.picks
      .slice(0, 11)
      .map(pick => {
        const player = getPlayer(pick.element);
        const form = parseFloat(player?.form || '0');
        const avgMinutes = player ? (player.minutes / Math.max(1, player.minutes > 0 ? 1 : 0)) : 0;
        return { pick, player, form, avgMinutes };
      })
      .filter(p => p.player && (p.form < 2 || p.avgMinutes < 60))
      .sort((a, b) => a.form - b.form)
      .slice(0, 3);
  }, [previewPicks, getPlayer]);

  const confirmAllTransfers = () => {
    if (pendingTransfers.length === 0) {
      setFeedback({ type: 'error', text: 'No pending transfers to confirm.' });
      return;
    }
    pendingTransfers.forEach(t => {
      addTransferPlan({ gameweek: planGameweek, playerOut: t.playerOut, playerIn: t.playerIn, cost: t.cost });
    });
    setFeedback({ type: 'success', text: `Confirmed ${pendingTransfers.length} transfer(s) for GW${planGameweek}.` });
    setPendingTransfers([]);
  };

  // Organize squad players by position
  const startingXI = previewPicks?.picks.slice(0, 11) || [];
  const bench = previewPicks?.picks.slice(11, 15) || [];

  const goalkeeper = startingXI.filter(p => {
    const player = getPlayer(p.element);
    return player?.element_type === 1;
  });

  const defenders = startingXI.filter(p => {
    const player = getPlayer(p.element);
    return player?.element_type === 2;
  });

  const midfielders = startingXI.filter(p => {
    const player = getPlayer(p.element);
    return player?.element_type === 3;
  });

  const forwards = startingXI.filter(p => {
    const player = getPlayer(p.element);
    return player?.element_type === 4;
  });

  const renderSquadFieldPlayer = (pick: any) => {
    const player = getPlayer(pick.element);
    const team = player ? getTeam(player.team) : null;
    const isSelected = selectedPlayerOut === player?.id;

    if (!player) return null;

    return (
      <div key={pick.element} className="flex flex-col items-center group cursor-pointer" onClick={() => {
        if (isSelected) {
          setSelectedPlayerOut(null);
        } else {
          setSelectedPlayerOut(player.id);
          setSelectedPosition(player.element_type);
        }
      }}>
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 ${isSelected ? 'border-purple-500' : 'border-gray-200 dark:border-gray-700'} hover:shadow-xl transition-all overflow-hidden`}>
          <div className="flex flex-col items-center p-1.5">
            <div className="relative">
              <img
                src={getTeamShirtUrl(team?.code || 0, player.element_type === 1)}
                alt={player.web_name}
                className="w-12 h-12 object-contain drop-shadow-lg transform transition group-hover:scale-110"
              />
              {pick.is_captain && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center border border-white shadow-md">
                  <span className="text-[7px] font-bold text-gray-900">C</span>
                </div>
              )}
              {pick.is_vice_captain && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center border border-white shadow-md">
                  <span className="text-[7px] font-bold text-white">V</span>
                </div>
              )}
            </div>
            <div className="text-[9px] font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[70px] text-center mt-0.5">
              {player.web_name}
            </div>
          </div>
          <div className="w-full bg-blue-500 text-white text-[9px] font-bold py-0.5 text-center shadow-md border-t border-blue-600">
            {formatPrice(player.now_cost)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Transfer Simulator</h1>
        <p className="text-gray-600 dark:text-gray-400">Select a player to transfer out, then choose a replacement</p>
        {feedback && (
          <div
            className={`mt-4 px-4 py-3 rounded-lg text-sm font-semibold border ${
              feedback.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-200'
                : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200'
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* Suggested Transfers */}
        {suggestedTransfersOut.length > 0 && !selectedPlayerOut && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="text-sm font-bold text-yellow-800 dark:text-yellow-300 mb-3">Suggested Transfers</div>
            <div className="space-y-2">
              {suggestedTransfersOut.map(suggestion => {
                const team = suggestion.player?.team ? getTeam(suggestion.player.team) : null;
                return (
                  <button
                    key={suggestion.player?.id}
                    onClick={() => setSelectedPlayerOut(suggestion.player?.id || null)}
                    className="w-full flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded hover:bg-yellow-50 dark:hover:bg-gray-700 transition text-left"
                  >
                    <div className="flex items-center gap-2">
                      <img src={getTeamShirtUrl(team?.code || 0, suggestion.player?.element_type === 1)} alt="" className="w-6 h-6 object-contain" />
                      <div>
                        <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">{suggestion.player?.web_name}</div>
                        <div className="text-[10px] text-gray-600 dark:text-gray-400">Form: {suggestion.form}</div>
                      </div>
                    </div>
                    <div className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">Consider</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Transfer Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Plan for Gameweek</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400" htmlFor="plan-gw">Target GW</label>
            <select
              id="plan-gw"
              value={planGameweek}
              onChange={(e) => setPlanGameweek(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg"
            >
              {(bootstrapData?.events || []).map(gw => (
                <option key={gw.id} value={gw.id}>
                  GW{gw.id} {gw.is_current ? '(Current)' : gw.is_next ? '(Next)' : gw.finished ? '(Finished)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Available Budget</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatPrice(availableBudget)}</div>
          </div>
          <div className="text-center">
            <button
              onClick={confirmAllTransfers}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-lg transition disabled:opacity-50"
              disabled={pendingTransfers.length === 0}
            >
              Confirm All ({pendingTransfers.length})
            </button>
          </div>
        </div>

        {/* Financial Status */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">Financial Status (GW{planGameweek})</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Squad Value</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{formatPrice(financialStatus.squadValue)}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bank Available</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatPrice(Math.max(0, financialStatus.bank - pendingTotalCost))}
              </div>
              {pendingTransfers.length > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">After pending: -{formatPrice(pendingTotalCost)}</div>
              )}
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Budget</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatPrice(financialStatus.squadValue + Math.max(0, financialStatus.bank - pendingTotalCost))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Pending Transfers */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Pending Transfers</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700 dark:text-gray-200">Player Out</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700 dark:text-gray-200">Player In</th>
                  <th className="text-right px-4 py-2 font-semibold text-gray-700 dark:text-gray-200">Cost Δ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {pendingTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-gray-500 dark:text-gray-400 py-6">No pending transfers</td>
                  </tr>
                ) : (
                  pendingTransfers.map((t, idx) => {
                    const outP = getPlayer(t.playerOut);
                    const inP = getPlayer(t.playerIn);
                    return (
                      <tr key={idx}>
                        <td className="px-4 py-2">{outP?.web_name}</td>
                        <td className="px-4 py-2">{inP?.web_name}</td>
                        <td className="px-4 py-2 text-right">{formatPrice(t.cost)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side-by-side layout: Field on left, Player list on right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left side: Squad Field View */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Your Squad{selectedPlayerOut ? ' - Select replacement' : ' - Click a player to transfer out'}</h2>
            </div>
            <div className="max-w-4xl mx-auto">
              <div
                className="relative bg-green-600 rounded-lg shadow-2xl overflow-hidden border-4 border-green-800 z-0"
                style={{
                  backgroundImage: `
                    repeating-linear-gradient(0deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 2px, transparent 2px, transparent 40px),
                    repeating-linear-gradient(90deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 2px, transparent 2px, transparent 40px)
                  `
                }}
              >
                {/* Field lines */}
                <div className="absolute inset-0 border-4 border-white rounded-lg pointer-events-none z-0"></div>
                <div className="absolute left-0 right-0 top-1/2 h-1 bg-white transform -translate-y-1/2 pointer-events-none z-0"></div>
                <div className="absolute left-1/2 top-1/2 w-28 h-28 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"></div>
                <div className="absolute left-1/2 top-1/2 w-1.5 h-1.5 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"></div>
                <div className="absolute left-1/2 top-3 w-56 h-24 border-2 border-white transform -translate-x-1/2 pointer-events-none z-0"></div>
                <div className="absolute left-1/2 top-3 w-32 h-12 border-2 border-white transform -translate-x-1/2 pointer-events-none z-0"></div>
                <div className="absolute left-1/2 bottom-3 w-56 h-24 border-2 border-white transform -translate-x-1/2 pointer-events-none z-0"></div>
                <div className="absolute left-1/2 bottom-3 w-32 h-12 border-2 border-white transform -translate-x-1/2 pointer-events-none z-0"></div>

                {/* Players */}
                <div className="relative z-10 py-8 px-4 space-y-8">
                  {/* Forwards */}
                  <div className="flex justify-center gap-6">
                    {forwards.map(pick => renderSquadFieldPlayer(pick))}
                  </div>

                  {/* Midfielders */}
                  <div className="flex justify-center gap-6 flex-wrap">
                    {midfielders.map(pick => renderSquadFieldPlayer(pick))}
                  </div>

                  {/* Defenders */}
                  <div className="flex justify-center gap-6 flex-wrap">
                    {defenders.map(pick => renderSquadFieldPlayer(pick))}
                  </div>

                  {/* Goalkeeper */}
                  <div className="flex justify-center gap-6">
                    {goalkeeper.map(pick => renderSquadFieldPlayer(pick))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bench */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Bench</h3>
              <div className="flex justify-center gap-6 flex-wrap">
                {bench.map(pick => renderSquadFieldPlayer(pick))}
              </div>
            </div>
          </div>

          {/* Right side: Replacement Players List */}
          <div className="lg:col-span-1">
            {selectedPlayerOut && (
              <div className="mb-4 p-3 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Replacing: <span className="font-bold text-gray-800 dark:text-gray-200">{getPlayer(selectedPlayerOut)?.web_name}</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedPlayerOut(null);
                    setSelectedPlayerIn(null);
                  }}
                  className="mt-2 text-xs text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Cancel
                </button>
              </div>
            )}

            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">{selectedPlayerOut ? 'Select Replacement' : 'Available Players'}</h2>            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 mb-4">
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
                
                <select
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  disabled={!!selectedPlayerOut}
                >
                  <option value="all">All Positions</option>
                  <option value="1">Goalkeepers</option>
                  <option value="2">Defenders</option>
                  <option value="3">Midfielders</option>
                  <option value="4">Forwards</option>
                </select>

                <select
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  <option value="150">All Prices</option>
                  <option value="50">Under £5.0m</option>
                  <option value="70">Under £7.0m</option>
                  <option value="100">Under £10.0m</option>
                </select>

                <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={ignoreBudget}
                    onChange={(e) => setIgnoreBudget(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  Ignore budget
                </label>
              </div>
            </div>

            {/* Player List - Compact for side panel */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="max-h-[700px] overflow-y-auto">
                {filteredPlayers.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredPlayers.map(player => {
                      const team = getTeam(player.team);
                      const isSelected = selectedPlayerIn === player.id;
                      return (
                        <div
                          key={player.id}
                          className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${isSelected ? 'bg-purple-100 dark:bg-purple-900/40 border-l-4 border-purple-500' : 'border-l-4 border-transparent'}`}
                          onClick={() => {
                            if (selectedPlayerOut && player.id) {
                              const playerOut = getPlayer(selectedPlayerOut);
                              const cost = player.now_cost - (playerOut?.now_cost || 0);
                              setPendingTransfers([...pendingTransfers, { playerOut: selectedPlayerOut, playerIn: player.id, cost }]);
                              setFeedback({ type: 'success', text: `Transfer added: ${playerOut?.web_name} → ${player.web_name}` });
                              setSelectedPlayerOut(null);
                              setSelectedPlayerIn(null);
                            }
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <img src={getTeamShirtUrl(team?.code || 0, player.element_type === 1)} alt={team?.short_name} className="w-10 h-10 object-contain flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">{player.web_name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{team?.short_name}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{formatPrice(player.now_cost)}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                                <span className="text-xs text-gray-600 dark:text-gray-400">{player.total_points} pts</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No players found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transfers;
