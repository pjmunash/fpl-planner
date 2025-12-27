import React, { useMemo } from 'react';
import { useFPL } from '../context/FPLContext';
import { formatPrice } from '../utils/helpers';
import { getTeamShirtUrl } from '../utils/teamShirts';

const Analytics: React.FC = () => {
  const { bootstrapData, currentPicks, getPlayer, getTeam } = useFPL();

  // Points per million (PPM) calculation
  const ppmStats = useMemo(() => {
    if (!currentPicks || !bootstrapData) return [];
    return currentPicks.picks
      .map(pick => {
        const player = getPlayer(pick.element);
        if (!player) return null;
        return {
          player,
          points: player.total_points,
          price: player.now_cost,
          ppm: (player.total_points / (player.now_cost / 10)).toFixed(2),
          team: getTeam(player.team),
        };
      })
      .filter((p): p is Exclude<typeof p, null> => p !== null)
      .sort((a, b) => parseFloat(b.ppm) - parseFloat(a.ppm));
  }, [currentPicks, getPlayer, getTeam]);

  // Form calculation (last 5 gameweeks)
  const formStats = useMemo(() => {
    if (!currentPicks || !bootstrapData) return [];
    return currentPicks.picks
      .map(pick => {
        const player = getPlayer(pick.element);
        if (!player) return null;
        const formValue = parseFloat(player.form || '0');
        return {
          player,
          form: player.form,
          formValue,
          team: getTeam(player.team),
        };
      })
      .filter((p): p is Exclude<typeof p, null> => p !== null)
      .sort((a, b) => b.formValue - a.formValue);
  }, [currentPicks, getPlayer, getTeam]);

  // Fixture difficulty matrix
  const fixtureMatrix = useMemo(() => {
    if (!bootstrapData) return [];
    // Note: fixtures data would need to be fetched separately from FPL API
    // For now, return teams sorted by strength as a placeholder
    return bootstrapData.teams
      .sort((a, b) => b.strength - a.strength)
      .map(team => ({
        team,
        fixtures: [],
        avgDifficulty: 'N/A',
      }));
  }, [bootstrapData]);

  // Rotation risk assessment
  const rotationRisk = useMemo(() => {
    if (!currentPicks || !bootstrapData) return [];
    return currentPicks.picks
      .slice(0, 11) // Starting XI only
      .map(pick => {
        const player = getPlayer(pick.element);
        if (!player) return null;
        const minutes = player.minutes || 0;
        const games = bootstrapData.events.find(e => e.is_current)?.id || 1;
        const avgMinutes = games > 0 ? minutes / games : 0;
        let riskLevel = 'Low';
        if (avgMinutes < 60) riskLevel = 'High';
        else if (avgMinutes < 75) riskLevel = 'Medium';
        
        return {
          player,
          minutes,
          avgMinutes: avgMinutes.toFixed(1),
          riskLevel,
          team: getTeam(player.team),
        };
      })
      .filter((p): p is Exclude<typeof p, null> => p !== null)
      .sort((a, b) => {
        const riskOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
        return riskOrder[a.riskLevel as keyof typeof riskOrder] - riskOrder[b.riskLevel as keyof typeof riskOrder];
      });
  }, [currentPicks, getPlayer, getTeam, bootstrapData]);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">Analytics & Statistics</h1>

      {/* Points Per Million */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Points Per Million (PPM)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Player</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">Points</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">Price</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">PPM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {ppmStats.slice(0, 10).map((stat, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <img src={getTeamShirtUrl(stat.team?.code || 0, stat.player.element_type === 1)} alt="" className="w-6 h-6 object-contain" />
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-gray-200">{stat.player.web_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{stat.team?.short_name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-800 dark:text-gray-200">{stat.points}</td>
                  <td className="px-4 py-3 text-right text-gray-800 dark:text-gray-200">{formatPrice(stat.price)}</td>
                  <td className="px-4 py-3 text-right font-bold text-purple-600 dark:text-purple-400">{stat.ppm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Form (Last 5 Gameweeks Average)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Player</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">Current Form</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">Avg (L5)</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {formStats.slice(0, 10).map((stat, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <img src={getTeamShirtUrl(stat.team?.code || 0, stat.player.element_type === 1)} alt="" className="w-6 h-6 object-contain" />
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-gray-200">{stat.player.web_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{stat.team?.short_name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-800 dark:text-gray-200">{stat.form}</td>
                  <td className="px-4 py-3 text-center font-bold text-blue-600 dark:text-blue-400">{stat.formValue.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={stat.formValue > 3 ? 'text-green-600 dark:text-green-400' : stat.formValue < 1 ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}>
                      {stat.formValue > 3 ? '↑' : stat.formValue < 1 ? '↓' : '→'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fixture Difficulty */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Team Strength Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {fixtureMatrix.slice(0, 8).map((item, idx) => (
            <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded p-4">
              <div className="flex items-center gap-2 mb-3">
                <img src={getTeamShirtUrl(item.team.code, false)} alt={item.team.short_name} className="w-8 h-8 object-contain" />
                <div>
                  <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{item.team.short_name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Strength: {item.team.strength}</div>
                </div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div>Home: {item.team.strength_overall_home}</div>
                <div>Away: {item.team.strength_overall_away}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rotation Risk */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Rotation Risk Assessment</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Player</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">Total Minutes</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">Avg/Game</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {rotationRisk.map((stat, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <img src={getTeamShirtUrl(stat.team?.code || 0, stat.player.element_type === 1)} alt="" className="w-6 h-6 object-contain" />
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-gray-200">{stat.player.web_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{stat.team?.short_name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-800 dark:text-gray-200">{stat.minutes}</td>
                  <td className="px-4 py-3 text-right text-gray-800 dark:text-gray-200">{stat.avgMinutes}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      stat.riskLevel === 'High' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200' :
                      stat.riskLevel === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200' :
                      'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200'
                    }`}>
                      {stat.riskLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
