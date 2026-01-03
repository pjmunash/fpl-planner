import React, { useState, useMemo, useEffect } from 'react';
import { useFPL } from '../context/FPLContext';
import { formatPrice } from '../utils/helpers';
import { getTeamShirtUrl } from '../utils/teamShirts';
import { fplApi } from '../services/fplApi';

interface PlayerHistory {
  history: Array<{
    element: number;
    fixture: number;
    opponent_team: number;
    total_points: number;
    was_home: boolean;
    kickoff_time: string;
    team_h_score: number;
    team_a_score: number;
    round: number;
    minutes: number;
    goals_scored: number;
    assists: number;
    clean_sheets: number;
    goals_conceded: number;
    own_goals: number;
    penalties_saved: number;
    penalties_missed: number;
    yellow_cards: number;
    red_cards: number;
    saves: number;
    bonus: number;
    bps: number;
    influence: string;
    creativity: string;
    threat: string;
    ict_index: string;
    value: number;
    transfers_balance: number;
    selected: number;
    transfers_in: number;
    transfers_out: number;
    expected_goals: string;
    expected_assists: string;
    expected_goal_involvements: string;
    expected_goals_conceded: string;
  }>;
}

const PlayerComparison: React.FC = () => {
  const { bootstrapData, getPlayer, getTeam } = useFPL();
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [playerHistories, setPlayerHistories] = useState<Map<number, PlayerHistory>>(new Map());
  const [startGW, setStartGW] = useState<number>(1);
  const [endGW, setEndGW] = useState<number>(38);

  const currentGW = useMemo(() => {
    return bootstrapData?.events.find(e => e.is_current)?.id || 1;
  }, [bootstrapData]);

  useEffect(() => {
    setEndGW(currentGW);
  }, [currentGW]);

  useEffect(() => {
    const fetchHistories = async () => {
      if (selectedPlayers.length === 0) return;
      try {
        const histories = await Promise.all(
          selectedPlayers.map(async (id) => {
            if (playerHistories.has(id)) return null;
            try {
              const data = await fplApi.getPlayerHistory(id);
              return { id, data };
            } catch {
              return null;
            }
          })
        );
        const newHistories = new Map(playerHistories);
        histories.forEach((h) => {
          if (h) newHistories.set(h.id, h.data);
        });
        setPlayerHistories(newHistories);
      } catch (err) {
        console.error('Error fetching player histories:', err);
      }
    };
    fetchHistories();
  }, [selectedPlayers]);

  const filteredPlayers = useMemo(() => {
    if (!bootstrapData?.elements) return [];
    return bootstrapData.elements
      .filter(p => {
        if (positionFilter !== 'all' && p.element_type !== parseInt(positionFilter)) return false;
        if (searchQuery && !p.web_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, 50);
  }, [bootstrapData, searchQuery, positionFilter]);

  const comparedPlayers = useMemo(() => {
    return selectedPlayers
      .map(id => {
        const player = getPlayer(id);
        if (!player) return null;
        const history = playerHistories.get(id);
        const gwHistory = history?.history.filter(h => h.round >= startGW && h.round <= endGW) || [];
        
        const gwStats = gwHistory.reduce((acc, gw) => ({
          points: acc.points + gw.total_points,
          minutes: acc.minutes + gw.minutes,
          goals: acc.goals + gw.goals_scored,
          assists: acc.assists + gw.assists,
          xG: acc.xG + parseFloat(gw.expected_goals || '0'),
          xA: acc.xA + parseFloat(gw.expected_assists || '0'),
          xGA: acc.xGA + parseFloat(gw.expected_goals_conceded || '0'),
          saves: acc.saves + (gw.saves || 0),
          goalsConceded: acc.goalsConceded + (gw.goals_conceded || 0),
          bonus: acc.bonus + gw.bonus,
        }), { points: 0, minutes: 0, goals: 0, assists: 0, xG: 0, xA: 0, xGA: 0, saves: 0, goalsConceded: 0, bonus: 0 });

        return {
          ...player,
          team: getTeam(player.team),
          ppm: (player.total_points / (player.now_cost / 10)).toFixed(2),
          gwStats: { ...gwStats, sotFaced: gwStats.saves + gwStats.goalsConceded },
          gwCount: gwHistory.length,
        };
      })
      .filter((p): p is any => p !== null);
  }, [selectedPlayers, getPlayer, getTeam, playerHistories, startGW, endGW]);

  const togglePlayerSelection = (playerId: number) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
    } else if (selectedPlayers.length < 4) {
      setSelectedPlayers([...selectedPlayers, playerId]);
    }
  };

  const getPositionName = (type: number) => {
    const positions = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' };
    return positions[type as keyof typeof positions] || '';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">Player Comparison Tool</h1>

      {/* Gameweek Range Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Stats Range:</span>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 dark:text-gray-400">Start GW</label>
            <input
              type="number"
              min="1"
              max={endGW}
              value={startGW}
              onChange={(e) => setStartGW(Math.max(1, Math.min(parseInt(e.target.value) || 1, endGW)))}
              className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 dark:text-gray-400">End GW</label>
            <input
              type="number"
              min={startGW}
              max="38"
              value={endGW}
              onChange={(e) => setEndGW(Math.max(startGW, Math.min(parseInt(e.target.value) || 38, 38)))}
              className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({endGW - startGW + 1} gameweeks)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player Selection Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Select Players (Up to 4)</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">{selectedPlayers.length}/4 selected</p>

            {/* Filters */}
            <div className="space-y-3 mb-6">
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
              />
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
              >
                <option value="all">All Positions</option>
                <option value="1">Goalkeepers</option>
                <option value="2">Defenders</option>
                <option value="3">Midfielders</option>
                <option value="4">Forwards</option>
              </select>
            </div>

            {/* Player List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredPlayers.map(player => {
                const isSelected = selectedPlayers.includes(player.id);
                const team = getTeam(player.team);
                return (
                  <button
                    key={player.id}
                    onClick={() => togglePlayerSelection(player.id)}
                    className={`w-full p-3 rounded-lg text-left transition border-l-4 ${
                      isSelected
                        ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-500'
                        : 'bg-gray-50 dark:bg-gray-700 border-transparent hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img src={getTeamShirtUrl(team?.code || 0, player.element_type === 1)} alt="" className="w-6 h-6 object-contain" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">{player.web_name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{team?.short_name} • {getPositionName(player.element_type)}</div>
                      </div>
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">{formatPrice(player.now_cost)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Comparison View */}
        <div className="lg:col-span-2">
          {comparedPlayers.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-2">Select players to compare</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Choose up to 4 players from the list</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Player Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comparedPlayers.map(player => (
                  <div key={player.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <img src={getTeamShirtUrl(player.team?.code || 0, player.element_type === 1)} alt="" className="w-12 h-12 object-contain" />
                        <div>
                          <div className="font-bold text-lg text-gray-800 dark:text-gray-200">{player.web_name}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">{player.team?.short_name} • {getPositionName(player.element_type)}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => togglePlayerSelection(player.id)}
                        className="text-gray-400 hover:text-red-500 transition"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                        <span className="text-gray-600 dark:text-gray-400">Price</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{formatPrice(player.now_cost)}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                        <span className="text-gray-600 dark:text-gray-400">GW {startGW}-{endGW} Points</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{player.gwStats.points}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                        <span className="text-gray-600 dark:text-gray-400">PPM</span>
                        <span className="font-semibold text-purple-600 dark:text-purple-400">{player.ppm}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                        <span className="text-gray-600 dark:text-gray-400">Form</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{player.form}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                        <span className="text-gray-600 dark:text-gray-400">Minutes (GW Range)</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{player.gwStats.minutes}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                        <span className="text-gray-600 dark:text-gray-400">Goals (GW Range)</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{player.gwStats.goals}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                        <span className="text-gray-600 dark:text-gray-400">Assists (GW Range)</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{player.gwStats.assists}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                        <span className="text-gray-600 dark:text-gray-400">xG (GW Range)</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{player.gwStats.xG.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                        <span className="text-gray-600 dark:text-gray-400">xA (GW Range)</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{player.gwStats.xA.toFixed(2)}</span>
                      </div>
                      {player.element_type === 1 && (
                        <>
                          <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                            <span className="text-gray-600 dark:text-gray-400">xG Against (GW Range)</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{player.gwStats.xGA.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                            <span className="text-gray-600 dark:text-gray-400">Shots on Target Faced</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{player.gwStats.sotFaced}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                            <span className="text-gray-600 dark:text-gray-400">Saves</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{player.gwStats.saves}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                            <span className="text-gray-600 dark:text-gray-400">Goals Conceded</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{player.gwStats.goalsConceded}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                        <span className="text-gray-600 dark:text-gray-400">Bonus (GW Range)</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{player.gwStats.bonus}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                        <span className="text-gray-600 dark:text-gray-400">Selected By</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{((player.selected_by_percent || 0) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                        <span className="text-gray-600 dark:text-gray-400">Transfers In</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">+{player.transfers_in_event || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Transfers Out</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">-{player.transfers_out_event || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerComparison;
