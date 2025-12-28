import React, { useState, useMemo } from 'react';
import { useFPL } from '../context/FPLContext';
import { formatPrice } from '../utils/helpers';
import { getTeamShirtUrl } from '../utils/teamShirts';

const PlayerComparison: React.FC = () => {
  const { bootstrapData, getPlayer, getTeam } = useFPL();
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');

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
      .map(id => getPlayer(id))
      .filter((p): p is any => p !== undefined)
      .map(p => ({
        ...p,
        team: getTeam(p.team),
        ppm: (p.total_points / (p.now_cost / 10)).toFixed(2),
      }));
  }, [selectedPlayers, getPlayer, getTeam]);

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
                        <span className="text-gray-600 dark:text-gray-400">Total Points</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{player.total_points}</span>
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
                        <span className="text-gray-600 dark:text-gray-400">Minutes</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{player.minutes}</span>
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

              {/* Stat Comparison Table */}
              {comparedPlayers.length > 1 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Stat</th>
                          {comparedPlayers.map(p => (
                            <th key={p.id} className="px-4 py-2 text-center font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">{p.web_name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        <tr className="bg-gray-50 dark:bg-gray-700/50">
                          <td className="px-4 py-2 font-semibold text-gray-800 dark:text-gray-200">Price</td>
                          {comparedPlayers.map(p => (
                            <td key={p.id} className="px-4 py-2 text-center text-gray-800 dark:text-gray-200">{formatPrice(p.now_cost)}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-semibold text-gray-800 dark:text-gray-200">Total Points</td>
                          {comparedPlayers.map(p => (
                            <td key={p.id} className="px-4 py-2 text-center text-gray-800 dark:text-gray-200 font-bold">{p.total_points}</td>
                          ))}
                        </tr>
                        <tr className="bg-gray-50 dark:bg-gray-700/50">
                          <td className="px-4 py-2 font-semibold text-gray-800 dark:text-gray-200">PPM</td>
                          {comparedPlayers.map(p => (
                            <td key={p.id} className="px-4 py-2 text-center text-purple-600 dark:text-purple-400 font-bold">{p.ppm}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-semibold text-gray-800 dark:text-gray-200">Ownership</td>
                          {comparedPlayers.map(p => (
                            <td key={p.id} className="px-4 py-2 text-center text-gray-800 dark:text-gray-200">{((p.selected_by_percent || 0) * 100).toFixed(1)}%</td>
                          ))}
                        </tr>
                        <tr className="bg-gray-50 dark:bg-gray-700/50">
                          <td className="px-4 py-2 font-semibold text-gray-800 dark:text-gray-200">Form</td>
                          {comparedPlayers.map(p => (
                            <td key={p.id} className="px-4 py-2 text-center text-gray-800 dark:text-gray-200">{p.form}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-semibold text-gray-800 dark:text-gray-200">Minutes</td>
                          {comparedPlayers.map(p => (
                            <td key={p.id} className="px-4 py-2 text-center text-gray-800 dark:text-gray-200">{p.minutes}</td>
                          ))}
                        </tr>
                        <tr className="bg-gray-50 dark:bg-gray-700/50">
                          <td className="px-4 py-2 font-semibold text-gray-800 dark:text-gray-200">Goals</td>
                          {comparedPlayers.map(p => (
                            <td key={p.id} className="px-4 py-2 text-center text-gray-800 dark:text-gray-200 font-bold">{p.goals_scored || 0}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-semibold text-gray-800 dark:text-gray-200">Assists</td>
                          {comparedPlayers.map(p => (
                            <td key={p.id} className="px-4 py-2 text-center text-gray-800 dark:text-gray-200 font-bold">{p.assists || 0}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerComparison;
