import React, { useMemo } from 'react';
import { useFPL } from '../context/FPLContext';
import { getPositionName, getDifficultyColor, formatPrice } from '../utils/helpers';
import { getTeamShirtUrl } from '../utils/teamShirts';

const FieldView: React.FC = () => {
  const { currentPicks, getPlayer, getPlayerWithLiveData, getTeam, bootstrapData, selectedGameweek, getPicksForGameweek, setSelectedGameweek, fixtures, getFinancialStatus } = useFPL();

  const picksForView = selectedGameweek ? getPicksForGameweek(selectedGameweek) : currentPicks;
  
  // Get financial status with transfers applied
  const financialStatus = useMemo(() => {
    return getFinancialStatus(selectedGameweek || 1);
  }, [selectedGameweek, getFinancialStatus]);

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

  if (!picksForView) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">No team data available</p>
      </div>
    );
  }

  const startingXI = picksForView.picks.slice(0, 11);
  const bench = picksForView.picks.slice(11, 15);

  // Organize players by position
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

  const renderPlayer = (pick: any) => {
    const player = getPlayerWithLiveData(pick.element, selectedGameweek);
    const team = player ? getTeam(player.team) : null;
    const teamFixtures = player ? (fixturesForSelectedGWByTeam[player.team] || []) : [];

    if (!player) return null;

    return (
      <div key={pick.element} className="flex flex-col items-center group cursor-pointer">
        {/* Player Card - Combined */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all overflow-hidden">
          <div className="flex flex-col items-center p-1.5">
            {/* Jersey/Avatar */}
            <div className="relative">
              <img 
                src={getTeamShirtUrl(team?.code || 0, player.element_type === 1)} 
                alt={player.web_name}
                className="w-12 h-12 object-contain drop-shadow-lg transform transition group-hover:scale-110"
              />

              {/* Captain Badge */}
              {pick.is_captain && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center border border-white shadow-md">
                  <span className="text-[7px] font-bold text-gray-900">C</span>
                </div>
              )}

              {/* Vice-Captain Badge */}
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

          {/* Points Bar */}
          <div className="w-full bg-green-500 text-white text-[9px] font-bold py-0.5 text-center shadow-md border-t border-green-600">
            {player.event_points ?? '-'}
          </div>

          {/* Fixtures */}
          {teamFixtures.length > 0 && (
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
          )}
        </div>

        {/* Hover Tooltip */}
        <div className="hidden group-hover:block absolute z-10 mt-28 w-48 bg-white rounded-lg shadow-xl border-2 border-purple-200 p-3">
          <div className="text-sm font-bold text-gray-800 mb-2">
            {player.first_name} {player.second_name}
          </div>
          <div className="text-xs space-y-1 text-gray-600">
            <div className="flex justify-between">
              <span>Price:</span>
              <span className="font-semibold">£{(player.now_cost / 10).toFixed(1)}m</span>
            </div>
            <div className="flex justify-between">
              <span>Form:</span>
              <span className="font-semibold">{player.form}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Pts:</span>
              <span className="font-semibold">{player.total_points}</span>
            </div>
          </div>
          </div>
        </div>
    );
  };

  const renderBenchPlayer = (pick: any) => {
    const player = getPlayerWithLiveData(pick.element, selectedGameweek);
    const team = player ? getTeam(player.team) : null;
    const teamFixtures = player ? (fixturesForSelectedGWByTeam[player.team] || []) : [];

    if (!player) return null;

    return (
      <div key={pick.element} className="flex items-center gap-3 bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-600">
        <div className="flex-shrink-0">
          <img 
            src={getTeamShirtUrl(team?.code || 0, player.element_type === 1)} 
            alt={player.web_name}
            className="w-12 h-12 object-contain"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">{player.web_name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{team?.short_name} • {getPositionName(player.element_type)}</div>
          <div className="flex gap-1 mt-1 flex-wrap">
            {teamFixtures.length === 0 ? (
              <span className="text-[9px] text-gray-400">-</span>
            ) : (
              teamFixtures.map((fx, i) => {
                const opp = getTeam(fx.opponent);
                return (
                  <span key={i} className={`text-[9px] px-1 py-0.5 rounded ${getDifficultyColor(fx.difficulty)} text-white`}>
                    {fx.isHome ? 'vs' : '@'} {opp?.short_name}
                  </span>
                );
              })
            )}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-lg font-bold text-gray-700 dark:text-gray-300">{player.event_points ?? '-'}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">pts</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 dark:from-green-800 dark:via-green-900 dark:to-green-950 p-6">
      {/* Field Container */}
      <div className="max-w-7xl mx-auto">
        {/* Gameweek Info Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                Gameweek {selectedGameweek}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Points: <span className="font-bold text-purple-600 dark:text-purple-400">{picksForView.entry_history?.points ?? '-'}</span>
                {picksForView.active_chip && (
                  <span className="ml-3 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-full text-sm font-semibold">
                    {picksForView.active_chip.toUpperCase()} ACTIVE
                  </span>
                )}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">Bank</div>
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatPrice(financialStatus.bank)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Squad: {formatPrice(financialStatus.squadValue)}</div>
            </div>
          </div>
          <div className="mt-4">
            <label className="text-sm text-gray-600 dark:text-gray-400 mr-2">Select GW:</label>
            <select
              value={selectedGameweek}
              onChange={(e) => setSelectedGameweek(parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded"
            >
              {bootstrapData?.events.map(gw => (
                <option key={gw.id} value={gw.id}>GW{gw.id} {gw.is_current ? '(Current)' : gw.is_next ? '(Next)' : gw.finished ? '(Finished)' : ''}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Football Field */}
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

            {/* Players */}
            <div className="relative z-10 py-8 px-4 space-y-8">
              {/* Forwards */}
              <div className="flex justify-center gap-6">
                {forwards.map(pick => renderPlayer(pick))}
              </div>

              {/* Midfielders */}
              <div className="flex justify-center gap-6 flex-wrap">
                {midfielders.map(pick => renderPlayer(pick))}
              </div>

              {/* Defenders */}
              <div className="flex justify-center gap-6 flex-wrap">
                {defenders.map(pick => renderPlayer(pick))}
              </div>

              {/* Goalkeeper */}
              <div className="flex justify-center gap-6">
                {goalkeeper.map(pick => renderPlayer(pick))}
              </div>
          </div>
        </div>
      </div>

        {/* Bench */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gray-700 dark:bg-gray-600 rounded flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M3 7h18M9 21V7m6 14V7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Substitutes</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {bench.map((pick) => renderBenchPlayer(pick))}
          </div>
        </div>

        {/* Auto Subs Info */}
        {picksForView.automatic_subs && picksForView.automatic_subs.length > 0 && (
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Automatic Substitutions
            </h3>
            <div className="space-y-2">
              {picksForView.automatic_subs.map((sub: any, index: number) => {
                const playerOut = getPlayer(sub.element_out);
                const playerIn = getPlayer(sub.element_in);
                return (
                  <div key={index} className="flex items-center gap-3 text-sm bg-white dark:bg-gray-800 rounded p-2">
                    <span className="text-red-600 dark:text-red-400 font-semibold">{playerOut?.web_name}</span>
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span className="text-green-600 dark:text-green-400 font-semibold">{playerIn?.web_name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldView;
