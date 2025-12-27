import React, { useMemo, useState } from 'react';
import { useFPL } from '../context/FPLContext';
import { formatPrice, getPositionName, getDifficultyColor } from '../utils/helpers';
import { getTeamShirtUrl } from '../utils/teamShirts';

type ViewMode = 'field' | 'list';

const Team: React.FC = () => {
  const {
    managerData,
    currentPicks,
    bootstrapData,
    getPlayer,
    getPlayerWithLiveData,
    getTeam,
    loading,
    fixtures,
    selectedGameweek,
    getPicksForGameweek,
    setSelectedGameweek,
    getFinancialStatus,
  } = useFPL();

  const [viewMode, setViewMode] = useState<ViewMode>('field');

  // Get picks for current view
  const picksForView = selectedGameweek ? getPicksForGameweek(selectedGameweek) : currentPicks;

  // Fixtures for the selected gameweek grouped by team
  const fixturesForSelectedGWByTeam = useMemo(() => {
    if (!fixtures || !selectedGameweek) return {} as { [teamId: number]: { opponent: number; isHome: boolean; difficulty: number }[] };
    const map: { [teamId: number]: { opponent: number; isHome: boolean; difficulty: number }[] } = {};
    fixtures.filter(f => f.event === selectedGameweek).forEach(f => {
      map[f.team_h] = map[f.team_h] || [];
      map[f.team_h].push({ opponent: f.team_a, isHome: true, difficulty: f.team_h_difficulty });
      map[f.team_a] = map[f.team_a] || [];
      map[f.team_a].push({ opponent: f.team_h, isHome: false, difficulty: f.team_a_difficulty });
    });
    return map;
  }, [fixtures, selectedGameweek]);

  // Auto-captain suggestion based on fixture difficulty + form
  const autoCaptainSuggestion = useMemo(() => {
    if (!picksForView || !selectedGameweek) return null;
    const startXI = picksForView.picks.slice(0, 11);
    const playerScores = startXI.map(pick => {
      const player = getPlayerWithLiveData(pick.element, selectedGameweek);
      const team = player ? getTeam((player.team || 1) as number) : null;
      const fixtures = player?.team ? (fixturesForSelectedGWByTeam[player.team] || []) : [];
      const avgDifficulty = fixtures.length > 0 ? fixtures.reduce((sum: number, f: any) => sum + (5 - f.difficulty), 0) / fixtures.length : 0;
      const form = parseFloat(player?.form || '0');
      const score = (form * 2) + (avgDifficulty * 1.5); // Weigh form more heavily
      return { pick, player, team, score, form, avgDifficulty };
    });
    const best = playerScores.reduce((max, p) => p.score > max.score ? p : max);
    return best && best.score > 0 ? best : null;
  }, [picksForView, selectedGameweek, getPlayerWithLiveData, getTeam, fixturesForSelectedGWByTeam]);

  // Injury/suspension alerts
  const injuryAlerts = useMemo(() => {
    if (!picksForView) return [];
    return picksForView.picks.slice(0, 11)
      .map(pick => {
        const player = getPlayer(pick.element);
        if (!player) return null;
        const chancePlaying = player.chance_of_playing_next_round;
        const status = player.status;
        if (chancePlaying !== null && chancePlaying < 100) {
          return { player, chancePlaying, status };
        }
        return null;
      })
      .filter((p): p is Exclude<typeof p, null> => p !== null);
  }, [picksForView, getPlayer]);

  const financialStatus = useMemo(() => {
    return getFinancialStatus(selectedGameweek || 1);
  }, [selectedGameweek, getFinancialStatus]);

  // Calculate total points from starting XI (or all 15 if bench boost) including captain multiplier
  const totalPoints = useMemo(() => {
    if (!picksForView || !selectedGameweek) return 0;
    const isBenchBoost = picksForView.active_chip === 'bboost';
    const picksToCount = isBenchBoost ? picksForView.picks : picksForView.picks.slice(0, 11);
    let total = 0;
    picksToCount.forEach(pick => {
      const player = getPlayerWithLiveData(pick.element, selectedGameweek);
      if (player) {
        const points = player.event_points ?? 0;
        if (pick.is_captain) {
          total += points * 2;
        } else {
          total += points;
        }
      }
    });
    return total;
  }, [picksForView, selectedGameweek, getPlayerWithLiveData]);

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

  const startingXI = picksForView?.picks.slice(0, 11) || [];
  const bench = picksForView?.picks.slice(11, 15) || [];

  // Organize by position
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

  // For list view - organize by position
  const playersByPosition = useMemo(() => {
    const all = [...startingXI, ...bench];
    return {
      goalkeepers: all.filter(p => getPlayer(p.element)?.element_type === 1),
      defenders: all.filter(p => getPlayer(p.element)?.element_type === 2),
      midfielders: all.filter(p => getPlayer(p.element)?.element_type === 3),
      forwards: all.filter(p => getPlayer(p.element)?.element_type === 4),
    };
  }, [picksForView]);

  const renderFieldPlayer = (pick: any) => {
    const player = getPlayerWithLiveData(pick.element, selectedGameweek);
    const team = player ? getTeam(player.team) : null;
    const teamFixtures = player ? (fixturesForSelectedGWByTeam[player.team] || []) : [];
    
    // Check if player is playing or has played (has minutes > 0)
    const hasPlayed = (player?.minutes || 0) > 0;

    if (!player) return null;

    return (
      <div key={pick.element} className="flex flex-col items-center group cursor-pointer">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-gray-200 dark:border-gray-700 backdrop-blur-sm hover:shadow-xl transition-all overflow-hidden">
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

          {/* Show points if player has played, otherwise show fixtures */}
          {hasPlayed ? (
            <div className="w-full bg-green-500 text-white text-[9px] font-bold py-0.5 text-center shadow-md border-t border-green-700">
              {player.event_points ?? '-'}
            </div>
          ) : (
            teamFixtures.length > 0 && (
              <div className="w-full flex flex-col gap-0.5 px-0.5 py-0.5 bg-gray-50 dark:bg-gray-700">
                {teamFixtures.map((fx, i) => {
                  const opp = getTeam(fx.opponent);
                  return (
                    <span key={i} className={`block w-full text-[7px] px-1 py-0.5 rounded ${getDifficultyColor(fx.difficulty)} text-white text-center`}>
                      {fx.isHome ? 'vs' : '@'} {opp?.short_name}
                    </span>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    );
  };

  const renderListPlayer = (pick: any) => {
    const player = getPlayerWithLiveData(pick.element, selectedGameweek || currentPicks?.entry_history.event);
    const team = player ? getTeam(player.team) : null;
    const teamFixtures = player ? (fixturesForSelectedGWByTeam[player.team] || []) : [];
    const isBench = pick.position > 11;

    if (!player) return null;

    return (
      <tr key={pick.element} className={isBench ? 'opacity-75' : ''}>
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <img
              src={getTeamShirtUrl(team?.code || 0, player.element_type === 1)}
              alt={team?.short_name}
              className="w-8 h-8 object-contain"
            />
            <div>
              <div className="font-semibold text-gray-800 dark:text-gray-200">{player.web_name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{team?.short_name}</div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-center">
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded text-sm font-semibold">
            {getPositionName(player.element_type)}
          </span>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-center">
          {pick.is_captain && <span className="text-yellow-600 dark:text-yellow-400 font-bold">C</span>}
          {pick.is_vice_captain && <span className="text-gray-600 dark:text-gray-300 font-bold">V</span>}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex gap-1 flex-wrap">
            {teamFixtures.length === 0 ? (
              <span className="text-xs text-gray-400">-</span>
            ) : (
              teamFixtures.slice(0, 2).map((fx, i) => {
                const opp = getTeam(fx.opponent);
                return (
                  <span key={i} className={`text-[9px] px-1 py-0.5 rounded ${getDifficultyColor(fx.difficulty)} text-white`}>
                    {fx.isHome ? 'vs' : '@'} {opp?.short_name}
                  </span>
                );
              })
            )}
          </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-right">
          <div className="font-bold text-gray-800 dark:text-gray-200">{formatPrice(player.now_cost)}</div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-center">
          <div className="font-bold text-gray-800 dark:text-gray-200">{player.total_points}</div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-center font-bold text-gray-800 dark:text-gray-200">
          {player.event_points ?? '-'}
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with View Toggle */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col items-center gap-4">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Squad Overview</h1>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">GW{selectedGameweek}</div>
              <div className="mt-2">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Total Points</div>
                <div className="text-4xl font-bold text-green-600 dark:text-green-400">{totalPoints}</div>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('field')}
                className={`px-4 py-2 rounded transition font-semibold ${
                  viewMode === 'field'
                    ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Field View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded transition font-semibold ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Table View
              </button>
            </div>
          </div>

          {/* Gameweek Selector & Financials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 mr-2">Select Gameweek:</label>
              <select
                value={selectedGameweek}
                onChange={(e) => setSelectedGameweek(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg"
              >
                {bootstrapData?.events.map(gw => (
                  <option key={gw.id} value={gw.id}>
                    GW{gw.id} {gw.is_current ? '(Current)' : gw.is_next ? '(Next)' : gw.finished ? '(Finished)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Financial Status */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Squad Value</div>
                <div className="font-bold text-gray-800 dark:text-gray-200 text-sm">{formatPrice(financialStatus.squadValue)}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bank</div>
                <div className="font-bold text-green-600 dark:text-green-400 text-sm">{formatPrice(financialStatus.bank)}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Budget</div>
                <div className="font-bold text-blue-600 dark:text-blue-400 text-sm">{formatPrice(financialStatus.totalBudget)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Auto-Captain Suggestion */}
        {autoCaptainSuggestion && (
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-yellow-900 dark:text-yellow-300 text-sm">Auto-Captain Suggestion</h3>
                <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
                  <strong>{autoCaptainSuggestion.player?.web_name}</strong> ({autoCaptainSuggestion.team?.short_name}) - Form: {autoCaptainSuggestion.form} | Fixture Difficulty: {(5 - autoCaptainSuggestion.avgDifficulty).toFixed(1)}/5
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Injury/Suspension Alerts */}
        {injuryAlerts.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 2.523a6 6 0 008.367 8.368zm1.414-1.414A8 8 0 111.39 1.39a8 8 0 0113.501 13.501z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-red-900 dark:text-red-300 text-sm mb-2">Injury/Suspension Alerts</h3>
                <div className="space-y-1">
                  {injuryAlerts.map(alert => (
                    <div key={alert.player?.id} className="text-xs text-red-800 dark:text-red-200">
                      <strong>{alert.player?.web_name}</strong> - {alert.chancePlaying}% chance to play
                      {alert.status === 'u' && ' (Unavailable)'}
                      {alert.status === 'd' && ' (Doubtful)'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Field View */}
        {viewMode === 'field' && (
          <>
            <div className="max-w-4xl mx-auto">
              <div className="relative bg-green-600 rounded-lg shadow-2xl overflow-hidden border-4 border-green-800"
                   style={{
                     backgroundImage: `
                       repeating-linear-gradient(0deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 2px, transparent 2px, transparent 40px),
                       repeating-linear-gradient(90deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 2px, transparent 2px, transparent 40px)
                     `
                   }}>

                {/* Outer field border */}
                <div className="absolute inset-0 border-4 border-white rounded-lg pointer-events-none"></div>
                
                {/* Halfway line - more prominent */}
                <div className="absolute left-0 right-0 top-1/2 h-1 bg-white transform -translate-y-1/2 pointer-events-none"></div>
                
                {/* Center circle */}
                <div className="absolute left-1/2 top-1/2 w-28 h-28 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                
                {/* Center spot */}
                <div className="absolute left-1/2 top-1/2 w-1.5 h-1.5 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                {/* Penalty box at top (attacking end) */}
                <div className="absolute left-1/2 top-3 w-56 h-24 border-2 border-white transform -translate-x-1/2 pointer-events-none"></div>
                {/* Goal box at top */}
                <div className="absolute left-1/2 top-3 w-32 h-12 border-2 border-white transform -translate-x-1/2 pointer-events-none"></div>
                
                {/* Penalty box at bottom (defending end) */}
                <div className="absolute left-1/2 bottom-3 w-56 h-24 border-2 border-white transform -translate-x-1/2 pointer-events-none"></div>
                {/* Goal box at bottom */}
                <div className="absolute left-1/2 bottom-3 w-32 h-12 border-2 border-white transform -translate-x-1/2 pointer-events-none"></div>

                <div className="relative z-10 py-8 px-4 space-y-8">
                  {/* Forwards (attacking end - top) */}
                  <div className="flex justify-center gap-6">
                    {forwards.map(pick => renderFieldPlayer(pick))}
                  </div>

                  {/* Midfielders */}
                  <div className="flex justify-center gap-6 flex-wrap">
                    {midfielders.map(pick => renderFieldPlayer(pick))}
                  </div>

                  {/* Defenders */}
                  <div className="flex justify-center gap-6 flex-wrap">
                    {defenders.map(pick => renderFieldPlayer(pick))}
                  </div>

                  {/* Goalkeeper (defending end - bottom) */}
                  <div className="flex justify-center gap-6">
                    {goalkeeper.map(pick => renderFieldPlayer(pick))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bench - Separate section below the pitch */}
            <div className="max-w-4xl mx-auto mt-4 bg-gray-800 dark:bg-gray-900 rounded-lg shadow-lg py-4 px-6">
              <h3 className="text-white text-sm font-semibold mb-3 text-center">Substitutes</h3>
              <div className="flex justify-center gap-6">
                {bench.map(pick => {
                  const player = getPlayerWithLiveData(pick.element, selectedGameweek);
                  const team = player ? getTeam(player.team) : null;

                  if (!player) return null;

                  return (
                    <div key={pick.element} className="flex flex-col items-center">
                      <div className="relative">
                        <img
                          src={getTeamShirtUrl(team?.code || 0, player.element_type === 1)}
                          alt={player.web_name}
                          className="w-12 h-12 object-contain"
                        />
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          {player.event_points ?? '-'}
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        <div className="bg-gray-700 dark:bg-gray-800 px-2 py-1 rounded text-xs font-semibold text-gray-200">
                          {player.web_name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Table View */}
        {viewMode === 'list' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">Player</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">Position</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">Cap</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">Fixtures</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">Price</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">Total</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {['Goalkeepers', 'Defenders', 'Midfielders', 'Forwards'].map((_, idx) => {
                  const posKey = ['goalkeepers', 'defenders', 'midfielders', 'forwards'][idx] as keyof typeof playersByPosition;
                  return playersByPosition[posKey].map(pick => renderListPlayer(pick));
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Team;
