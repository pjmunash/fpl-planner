import React, { useMemo } from 'react';
import { useFPL } from '../context/FPLContext';
import { formatPrice, getDifficultyColor } from '../utils/helpers';
import { getTeamShirtUrl } from '../utils/teamShirts';

const Dashboard: React.FC = () => {
  const { managerData, currentPicks, bootstrapData, getPlayer, getPlayerWithLiveData, getTeam, loading, fixtures, selectedGameweek, getFinancialStatus } = useFPL();

  // Fixtures for the current gameweek grouped by team
  const fixturesForCurrentGWByTeam = useMemo(() => {
    if (!fixtures || !currentPicks) return {} as { [teamId: number]: { opponent: number; isHome: boolean; difficulty: number }[] };
    const currentGW = currentPicks.entry_history.event;
    const map: { [teamId: number]: { opponent: number; isHome: boolean; difficulty: number }[] } = {};
    fixtures.filter(f => f.event === currentGW).forEach(f => {
      map[f.team_h] = map[f.team_h] || [];
      map[f.team_h].push({ opponent: f.team_a, isHome: true, difficulty: f.team_h_difficulty });
      map[f.team_a] = map[f.team_a] || [];
      map[f.team_a].push({ opponent: f.team_h, isHome: false, difficulty: f.team_a_difficulty });
    });
    return map;
  }, [fixtures, currentPicks]);

  // Calculate top/worst performers and best captain pick
  const performanceStats = useMemo(() => {
    const all = [...(currentPicks?.picks || [])];
    const withPoints = all.map(pick => {
      const player = getPlayer(pick.element);
      return { pick, player, points: player?.event_points || 0 };
    }).filter(p => p.player);

    return {
      topPerformer: withPoints.reduce((max, p) => p.points > max.points ? p : max, withPoints[0] || null),
      worstPerformer: withPoints.reduce((min, p) => p.points < min.points ? p : min, withPoints[0] || null),
      startingPoints: all.slice(0, 11).reduce((sum, pick) => sum + (getPlayer(pick.element)?.event_points || 0), 0),
      benchPoints: all.slice(11).reduce((sum, pick) => sum + (getPlayer(pick.element)?.event_points || 0), 0),
    };
  }, [currentPicks, getPlayer]);

  // Rank change calculation
  const rankChange = useMemo(() => {
    if (!currentPicks || !managerData) return null;
    const lastRank = managerData.summary_overall_rank || 0;
    const thisRank = currentPicks.entry_history.rank || 0;
    return lastRank - thisRank; // positive = moved up
  }, [currentPicks, managerData]);

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
        <p className="text-gray-600">Loading team data...</p>
      </div>
    );
  }

  const startingXI = currentPicks.picks.slice(0, 11);
  const bench = currentPicks.picks.slice(11, 15);

  // Organize by position for table view
  const playersByPosition = useMemo(() => {
    const all = [...startingXI, ...bench];
    return {
      goalkeepers: all.filter(p => getPlayer(p.element)?.element_type === 1),
      defenders: all.filter(p => getPlayer(p.element)?.element_type === 2),
      midfielders: all.filter(p => getPlayer(p.element)?.element_type === 3),
      forwards: all.filter(p => getPlayer(p.element)?.element_type === 4),
    };
  }, [currentPicks]);

  const renderPlayerRow = (pick: any, idx: number, positionLabel: string) => {
    const player = getPlayerWithLiveData(pick.element, selectedGameweek || currentPicks?.entry_history.event);
    const team = player ? getTeam(player.team) : null;
    const teamFixtures = player ? (fixturesForCurrentGWByTeam[player.team] || []) : [];
    const isBench = pick.position > 11;
    
    if (!player) return null;
    
    return (
      <tr key={pick.element} className={`${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-700'} ${isBench ? 'opacity-60' : ''}`}>
        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{positionLabel}</span>
            {isBench && <span className="text-xs bg-gray-200 dark:bg-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">BENCH</span>}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={getTeamShirtUrl(team?.code || 0, player.element_type === 1)} alt={team?.short_name} className="w-8 h-8 object-contain" />
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{player.web_name}</span>
              {pick.is_captain && <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded font-bold">C</span>}
              {pick.is_vice_captain && <span className="text-xs bg-gray-400 text-gray-900 px-2 py-0.5 rounded font-bold">VC</span>}
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{team?.short_name}</td>
        <td className="px-4 py-3 text-center">
          <div className="flex gap-1 justify-center flex-wrap">
            {teamFixtures.length === 0 ? (
              <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
            ) : (
              teamFixtures.map((fx, i) => {
                const opp = getTeam(fx.opponent);
                return (
                  <span key={i} className={`text-xs px-2 py-1 rounded ${getDifficultyColor(fx.difficulty)} text-white font-medium`}>
                    {fx.isHome ? 'vs' : '@'} {opp?.short_name}
                  </span>
                );
              })
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">{formatPrice(player.now_cost)}</td>
        <td className="px-4 py-3 text-center font-bold text-gray-800 dark:text-gray-200">{player.event_points ?? '-'}</td>
        <td className="px-4 py-3 text-center">
          {player.chance_of_playing_next_round !== null && player.chance_of_playing_next_round < 100 ? (
            <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 px-2 py-1 rounded">{player.chance_of_playing_next_round}%</span>
          ) : (
            <span className="text-xs text-green-600 dark:text-green-400">✓</span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-700 dark:to-blue-800 rounded-lg p-6 mb-6 text-white">
        <h1 className="text-3xl font-bold mb-4">
          {managerData.name || `${managerData.player_first_name} ${managerData.player_last_name}`}
        </h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm opacity-90">Total Points</div>
            <div className="text-2xl font-bold">{managerData.summary_overall_points}</div>
          </div>
          <div>
            <div className="text-sm opacity-90">Overall Rank</div>
            <div className="text-2xl font-bold flex items-center gap-2">
              {managerData.summary_overall_rank?.toLocaleString()}
              {rankChange !== null && (
                <span className={rankChange > 0 ? 'text-green-300 text-sm' : rankChange < 0 ? 'text-red-300 text-sm' : 'text-gray-300 text-sm'}>
                  {rankChange > 0 ? `↑${rankChange}` : rankChange < 0 ? `↓${Math.abs(rankChange)}` : '—'}
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="text-sm opacity-90">Team Value</div>
            <div className="text-2xl font-bold">{formatPrice(getFinancialStatus(selectedGameweek || currentPicks.entry_history.event).squadValue)}</div>
          </div>
          <div>
            <div className="text-sm opacity-90">Bank</div>
            <div className="text-2xl font-bold">{formatPrice(getFinancialStatus(selectedGameweek || currentPicks.entry_history.event).bank)}</div>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Top Performer */}
        {performanceStats.topPerformer && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">TOP PERFORMER</div>
            <div className="flex items-center gap-2 mb-2">
              <img 
                src={getTeamShirtUrl((performanceStats.topPerformer.player?.team || 1) as number, performanceStats.topPerformer.player?.element_type === 1)} 
                alt="" 
                className="w-8 h-8 object-contain" 
              />
              <div className="flex-1">
                <div className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">{performanceStats.topPerformer.player?.web_name}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{getTeam((performanceStats.topPerformer.player?.team || 1) as number)?.short_name}</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{performanceStats.topPerformer.points} pts</div>
          </div>
        )}

        {/* Worst Performer */}
        {performanceStats.worstPerformer && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">WORST PERFORMER</div>
            <div className="flex items-center gap-2 mb-2">
              <img 
                src={getTeamShirtUrl((performanceStats.worstPerformer.player?.team || 1) as number, performanceStats.worstPerformer.player?.element_type === 1)} 
                alt="" 
                className="w-8 h-8 object-contain" 
              />
              <div className="flex-1">
                <div className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">{performanceStats.worstPerformer.player?.web_name}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{getTeam((performanceStats.worstPerformer.player?.team || 1) as number)?.short_name}</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{performanceStats.worstPerformer.points} pts</div>
          </div>
        )}

        {/* Starting XI Points */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">STARTING XI</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">{performanceStats.startingPoints} pts</div>
          <div className="text-xs text-blue-600 dark:text-blue-400">11 players</div>
        </div>

        {/* Bench Points */}
        <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">BENCH</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">{performanceStats.benchPoints} pts</div>
          <div className="text-xs text-purple-600 dark:text-purple-400">4 players</div>
        </div>
      </div>

      {/* Gameweek Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Gameweek {currentPicks.entry_history.event}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Points: {currentPicks.entry_history.points} | 
              Rank: {currentPicks.entry_history.rank?.toLocaleString()} | 
              Transfers: {currentPicks.entry_history.event_transfers} 
              ({currentPicks.entry_history.event_transfers_cost} pts cost)
            </p>
          </div>
          {currentPicks.active_chip && (
            <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-lg font-semibold text-sm">
              {currentPicks.active_chip.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Starting XI & Bench - Table View */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Position</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Player</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Team</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Fixture</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Price</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Points</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Goalkeepers */}
              {playersByPosition.goalkeepers.map((pick, idx) => renderPlayerRow(pick, idx, 'GKP'))}
              
              {/* Defenders */}
              {playersByPosition.defenders.map((pick, idx) => renderPlayerRow(pick, idx, 'DEF'))}
              
              {/* Midfielders */}
              {playersByPosition.midfielders.map((pick, idx) => renderPlayerRow(pick, idx, 'MID'))}
              
              {/* Forwards */}
              {playersByPosition.forwards.map((pick, idx) => renderPlayerRow(pick, idx, 'FWD'))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Auto Subs */}
      {currentPicks.automatic_subs && currentPicks.automatic_subs.length > 0 && (
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Automatic Substitutions</h3>
          <div className="space-y-1">
            {currentPicks.automatic_subs.map((sub: any, index: number) => {
              const playerOut = getPlayer(sub.element_out);
              const playerIn = getPlayer(sub.element_in);
              return (
                <div key={index} className="text-sm text-blue-800 dark:text-blue-200">
                  {playerOut?.web_name} → {playerIn?.web_name}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
