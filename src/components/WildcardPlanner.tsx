import React, { useState, useMemo } from 'react';
import { useFPL } from '../context/FPLContext';
import { formatPrice } from '../utils/helpers';
import { getTeamShirtUrl } from '../utils/teamShirts';

const WildcardPlanner: React.FC = () => {
  const { bootstrapData, getPlayer, getTeam, getFinancialStatus, selectedGameweek } = useFPL();
  const [tempTeam, setTempTeam] = useState<number[]>([]);
  const budget = getFinancialStatus(selectedGameweek || 1).bank + (100 * 11); // Full budget

  // Helper to parse selected_by_percent safely
  const getOwnershipPercent = (player: any) => {
    const pct = parseFloat(player.selected_by_percent || '0');
    return isNaN(pct) ? 0 : pct;
  };

  // Template team - most owned players by position
  const templateTeam = useMemo(() => {
    if (!bootstrapData?.elements) return { gk: [], def: [], mid: [], fwd: [] };
    const maxPrice = 150;
    const players = bootstrapData.elements
      .filter(p => p.now_cost <= maxPrice * 10)
      .map(p => ({ ...p, team: getTeam(p.team) }));

    return {
      gk: players
        .filter(p => p.element_type === 1)
        .sort((a, b) => getOwnershipPercent(b) - getOwnershipPercent(a))
        .slice(0, 3),
      def: players
        .filter(p => p.element_type === 2)
        .sort((a, b) => getOwnershipPercent(b) - getOwnershipPercent(a))
        .slice(0, 5),
      mid: players
        .filter(p => p.element_type === 3)
        .sort((a, b) => getOwnershipPercent(b) - getOwnershipPercent(a))
        .slice(0, 5),
      fwd: players
        .filter(p => p.element_type === 4)
        .sort((a, b) => getOwnershipPercent(b) - getOwnershipPercent(a))
        .slice(0, 3),
    };
  }, [bootstrapData, getTeam]);
  const bestValuePlayers = useMemo(() => {
    if (!bootstrapData?.elements) return [];
    const maxPrice = 150;
    return bootstrapData.elements
      .map(p => ({
        ...p,
        team: getTeam(p.team),
        ppm: (p.total_points / (p.now_cost / 10)).toFixed(2),
      }))
      .filter(p => p.now_cost <= maxPrice * 10)
      .sort((a, b) => parseFloat(b.ppm) - parseFloat(a.ppm))
      .slice(0, 20);
  }, [bootstrapData, getTeam]);

  const tempTeamCost = useMemo(() => {
    return tempTeam.reduce((sum, playerId) => {
      const player = getPlayer(playerId);
      return sum + (player?.now_cost || 0);
    }, 0);
  }, [tempTeam, getPlayer]);

  const tempTeamRemainingBudget = useMemo(() => {
    return budget - tempTeamCost;
  }, [budget, tempTeamCost]);

  const addPlayerToTemp = (playerId: number) => {
    const player = getPlayer(playerId);
    if (player && tempTeamCost + player.now_cost <= budget && tempTeam.length < 11) {
      setTempTeam([...tempTeam, playerId]);
    }
  };

  const removePlayerFromTemp = (playerId: number) => {
    setTempTeam(tempTeam.filter(id => id !== playerId));
  };

  const toggleTemplatePlayer = (playerId: number) => {
    if (tempTeam.includes(playerId)) {
      removePlayerFromTemp(playerId);
    } else {
      addPlayerToTemp(playerId);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">Wildcard / Free Hit Planner</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Template & Best Value */}
        <div className="lg:col-span-1 space-y-6">
          {/* Template Team */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Most Owned Template</h2>
            
            <div className="space-y-4">
              {/* Goalkeepers */}
              <div>
                <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Goalkeepers</h3>
                <div className="space-y-2">
                  {templateTeam.gk.map(player => (
                    <button
                      key={player.id}
                      onClick={() => toggleTemplatePlayer(player.id)}
                      className={`w-full p-2 rounded text-left text-xs transition border-l-4 ${
                        tempTeam.includes(player.id)
                          ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-500'
                          : 'bg-gray-50 dark:bg-gray-700 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img src={getTeamShirtUrl(player.team?.code || 0, true)} alt="" className="w-5 h-5 object-contain" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate">{player.web_name}</div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">{(getOwnershipPercent(player) * 100).toFixed(1)}% owned</div>
                        </div>
                        <div className="text-xs font-semibold">{formatPrice(player.now_cost)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Defenders */}
              <div>
                <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Defenders</h3>
                <div className="space-y-2">
                  {templateTeam.def.slice(0, 3).map(player => (
                    <button
                      key={player.id}
                      onClick={() => toggleTemplatePlayer(player.id)}
                      className={`w-full p-2 rounded text-left text-xs transition border-l-4 ${
                        tempTeam.includes(player.id)
                          ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-500'
                          : 'bg-gray-50 dark:bg-gray-700 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img src={getTeamShirtUrl(player.team?.code || 0, false)} alt="" className="w-5 h-5 object-contain" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate text-[11px]">{player.web_name}</div>
                          <div className="text-[9px] text-gray-500">{(getOwnershipPercent(player) * 100).toFixed(1)}%</div>
                        </div>
                        <div className="text-xs font-semibold">{formatPrice(player.now_cost)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Midfielders */}
              <div>
                <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Midfielders</h3>
                <div className="space-y-2">
                  {templateTeam.mid.slice(0, 3).map(player => (
                    <button
                      key={player.id}
                      onClick={() => toggleTemplatePlayer(player.id)}
                      className={`w-full p-2 rounded text-left text-xs transition border-l-4 ${
                        tempTeam.includes(player.id)
                          ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-500'
                          : 'bg-gray-50 dark:bg-gray-700 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img src={getTeamShirtUrl(player.team?.code || 0, false)} alt="" className="w-5 h-5 object-contain" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate text-[11px]">{player.web_name}</div>
                          <div className="text-[9px] text-gray-500">{(getOwnershipPercent(player) * 100).toFixed(1)}%</div>
                        </div>
                        <div className="text-xs font-semibold">{formatPrice(player.now_cost)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Forwards */}
              <div>
                <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Forwards</h3>
                <div className="space-y-2">
                  {templateTeam.fwd.map(player => (
                    <button
                      key={player.id}
                      onClick={() => toggleTemplatePlayer(player.id)}
                      className={`w-full p-2 rounded text-left text-xs transition border-l-4 ${
                        tempTeam.includes(player.id)
                          ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-500'
                          : 'bg-gray-50 dark:bg-gray-700 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img src={getTeamShirtUrl(player.team?.code || 0, false)} alt="" className="w-5 h-5 object-contain" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate text-[11px]">{player.web_name}</div>
                          <div className="text-[9px] text-gray-500">{(getOwnershipPercent(player) * 100).toFixed(1)}%</div>
                        </div>
                        <div className="text-xs font-semibold">{formatPrice(player.now_cost)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Best Value Players */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Best Value (PPM)</h2>
            <div className="space-y-2">
              {bestValuePlayers.slice(0, 8).map(player => (
                <button
                  key={player.id}
                  onClick={() => toggleTemplatePlayer(player.id)}
                  className={`w-full p-2 rounded text-left text-xs transition border-l-4 ${
                    tempTeam.includes(player.id)
                      ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-500'
                      : 'bg-gray-50 dark:bg-gray-700 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <img src={getTeamShirtUrl(player.team?.code || 0, player.element_type === 1)} alt="" className="w-5 h-5 object-contain" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{player.web_name}</div>
                      <div className="text-[9px] text-purple-600 dark:text-purple-400 font-bold">PPM: {player.ppm}</div>
                    </div>
                    <div className="text-xs font-semibold">{formatPrice(player.now_cost)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Team Builder */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Build Your Team</h2>
              <div className="text-right">
                <div className="text-xs text-gray-600 dark:text-gray-400">Squad: {tempTeam.length}/11</div>
                <div className="text-lg font-bold text-gray-800 dark:text-gray-200">{formatPrice(tempTeamCost)} / {formatPrice(budget)}</div>
                <div className={`text-sm font-semibold ${tempTeamRemainingBudget >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {tempTeamRemainingBudget >= 0 ? '+ ' : ''}
                  {formatPrice(Math.abs(tempTeamRemainingBudget))}
                </div>
              </div>
            </div>

            {/* Selected Players Grid */}
            {tempTeam.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>No players selected</p>
                <p className="text-xs mt-1">Click on template players or search for players</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                {tempTeam.map(playerId => {
                  const player = getPlayer(playerId);
                  if (!player) return null;
                  const team = getTeam(player.team);
                  return (
                    <div key={playerId} className="bg-gray-50 dark:bg-gray-700 rounded p-3 text-center relative group">
                      <button
                        onClick={() => removePlayerFromTemp(playerId)}
                        className="absolute top-1 right-1 text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                      <img src={getTeamShirtUrl(team?.code || 0, player.element_type === 1)} alt="" className="w-10 h-10 object-contain mx-auto mb-1" />
                      <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{player.web_name}</div>
                      <div className="text-[10px] text-gray-600 dark:text-gray-400">{team?.short_name}</div>
                      <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mt-1">{formatPrice(player.now_cost)}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Team Summary */}
            {tempTeam.length > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Total Cost:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{formatPrice(tempTeamCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Budget:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{formatPrice(budget)}</span>
                </div>
                <div className="border-t border-purple-200 dark:border-purple-700 pt-2 flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Remaining:</span>
                  <span className={`font-bold ${tempTeamRemainingBudget >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatPrice(tempTeamRemainingBudget)}
                  </span>
                </div>
              </div>
            )}

            {/* Formation Info */}
            {tempTeam.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-2">Squad Composition:</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="font-bold">{tempTeam.filter(id => getPlayer(id)?.element_type === 1).length}</div>
                    <div className="text-xs">GK</div>
                  </div>
                  <div>
                    <div className="font-bold">{tempTeam.filter(id => getPlayer(id)?.element_type === 2).length}</div>
                    <div className="text-xs">DEF</div>
                  </div>
                  <div>
                    <div className="font-bold">{tempTeam.filter(id => getPlayer(id)?.element_type === 3).length}</div>
                    <div className="text-xs">MID</div>
                  </div>
                  <div>
                    <div className="font-bold">{tempTeam.filter(id => getPlayer(id)?.element_type === 4).length}</div>
                    <div className="text-xs">FWD</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WildcardPlanner;
