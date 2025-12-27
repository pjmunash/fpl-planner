import React, { useMemo } from 'react';
import { useFPL } from '../context/FPLContext';
import { getDifficultyColor, getDifficultyText } from '../utils/helpers';
import { getTeamShirtUrl } from '../utils/teamShirts';

const Planner: React.FC = () => {
  const { bootstrapData, fixtures, currentPicks, getPlayer, chipPlans, addChipPlan, removeChipPlan, selectedGameweek, setSelectedGameweek, getPicksForGameweek } = useFPL();

  const currentGW = selectedGameweek || (bootstrapData?.events.find(e => e.is_current)?.id || 1);
  const futureGameweeks = bootstrapData?.events.filter(e => e.id >= currentGW).slice(0, 8) || [];

  // Get squad for the selected gameweek (after planned transfers)
  const picksForView = useMemo(() => getPicksForGameweek(currentGW) || currentPicks, [getPicksForGameweek, currentGW, currentPicks]);
  const startingXI = picksForView?.picks.slice(0, 11) || [];
  const bench = picksForView?.picks.slice(11, 15) || [];

  // Fixtures for the selected gameweek grouped by team
  const fixturesForSelectedGWByTeam = useMemo(() => {
    if (!fixtures) return {} as { [teamId: number]: { opponent: number; isHome: boolean; difficulty: number }[] };
    const map: { [teamId: number]: { opponent: number; isHome: boolean; difficulty: number }[] } = {};
    fixtures.filter(f => f.event === currentGW).forEach(f => {
      map[f.team_h] = map[f.team_h] || [];
      map[f.team_h].push({ opponent: f.team_a, isHome: true, difficulty: f.team_h_difficulty });
      map[f.team_a] = map[f.team_a] || [];
      map[f.team_a].push({ opponent: f.team_h, isHome: false, difficulty: f.team_a_difficulty });
    });
    return map;
  }, [fixtures, currentGW]);

  const toggleChip = (gameweek: number, chipType: 'wildcard' | 'freehit' | 'benchboost' | 'triplecaptain') => {
    const existing = chipPlans.find(p => p.gameweek === gameweek);
    
    // Check if chip already used in another GW
    const chipUsedElsewhere = chipPlans.find(p => p.chip === chipType && p.gameweek !== gameweek);
    
    if (chipUsedElsewhere && (!existing || existing.chip !== chipType)) {
      alert(`${chipType} is already planned for GW${chipUsedElsewhere.gameweek}`);
      return;
    }
    
    if (existing && existing.chip === chipType) {
      removeChipPlan(gameweek);
    } else {
      addChipPlan({ gameweek, chip: chipType });
    }
  };

  const getChipForGW = (gameweek: number) => {
    return chipPlans.find(p => p.gameweek === gameweek)?.chip || null;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Gameweek Planner</h1>
          <p className="text-gray-600 dark:text-gray-400">Plan your transfers and chip strategy for upcoming gameweeks</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Selected Gameweek</label>
          <select
            value={currentGW}
            onChange={(e) => setSelectedGameweek(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          >
            {bootstrapData?.events.map(gw => (
              <option key={gw.id} value={gw.id}>GW{gw.id} {gw.is_current ? '(Current)' : gw.is_next ? '(Next)' : gw.finished ? '(Finished)' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Field-style planner for selected GW */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">Showing fixtures for GW{currentGW}</div>
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

          <div className="relative z-10 py-12 px-8 space-y-8">
            {/* Forwards */}
            <div className="flex justify-center gap-8">
              {startingXI.filter(p => getPlayer(p.element)?.element_type === 4).map(p => (
                <PlayerWithFixture key={p.element} pick={p} fixturesMap={fixturesForSelectedGWByTeam} />
              ))}
            </div>

            {/* Midfielders */}
            <div className="flex justify-center gap-6">
              {startingXI.filter(p => getPlayer(p.element)?.element_type === 3).map(p => (
                <PlayerWithFixture key={p.element} pick={p} fixturesMap={fixturesForSelectedGWByTeam} />
              ))}
            </div>

            {/* Defenders */}
            <div className="flex justify-center gap-4">
              {startingXI.filter(p => getPlayer(p.element)?.element_type === 2).map(p => (
                <PlayerWithFixture key={p.element} pick={p} fixturesMap={fixturesForSelectedGWByTeam} />
              ))}
            </div>

            {/* Goalkeeper */}
            <div className="flex justify-center">
              {startingXI.filter(p => getPlayer(p.element)?.element_type === 1).map(p => (
                <PlayerWithFixture key={p.element} pick={p} fixturesMap={fixturesForSelectedGWByTeam} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Bench for selected GW */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Substitutes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {bench.map(p => (
            <PlayerCard key={p.element} pick={p} fixturesMap={fixturesForSelectedGWByTeam} compact />
          ))}
        </div>
      </div>

      {/* Chip Planning */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Chip Strategy</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {futureGameweeks.slice(0, 6).map(gw => {
            const activeChip = getChipForGW(gw.id);
            
            return (
              <div key={gw.id} className="border dark:border-gray-700 rounded-lg p-4">
                <div className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Gameweek {gw.id}</div>
                <div className="space-y-2">
                  {['wildcard', 'freehit', 'benchboost', 'triplecaptain'].map(chip => (
                    <button
                      key={chip}
                      onClick={() => toggleChip(gw.id, chip as any)}
                      className={`w-full text-xs px-3 py-2 rounded transition ${
                        activeChip === chip
                          ? 'bg-green-500 text-white font-semibold'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {chip === 'wildcard' && 'Wildcard'}
                      {chip === 'freehit' && 'Free Hit'}
                      {chip === 'benchboost' && 'Bench Boost'}
                      {chip === 'triplecaptain' && 'Triple Captain'}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Fixture Difficulty Rating</h3>
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4, 5].map(difficulty => (
            <div key={difficulty} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${getDifficultyColor(difficulty)}`}></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">{getDifficultyText(difficulty)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Planner;

// --- Local helper components ---

const PlayerWithFixture: React.FC<{ pick: any; fixturesMap: { [teamId: number]: { opponent: number; isHome: boolean; difficulty: number }[] } }> = ({ pick, fixturesMap }) => {
  return <PlayerCard pick={pick} fixturesMap={fixturesMap} />;
};

const PlayerCard: React.FC<{ pick: any; fixturesMap: { [teamId: number]: { opponent: number; isHome: boolean; difficulty: number }[] }; compact?: boolean }> = ({ pick, fixturesMap, compact = false }) => {
  const { getPlayer, getTeam } = useFPL();
  const player = getPlayer(pick.element);
  const team = player ? getTeam(player.team) : null;
  if (!player) return null;

  const teamFixtures = fixturesMap[player.team] || [];

  return (
    <div className={`flex flex-col items-center ${compact ? '' : 'group cursor-pointer'}`}>
      <div className="relative">
        <div className="relative">
          <img 
            src={getTeamShirtUrl(team?.code || 0, player.element_type === 1)} 
            alt={player.web_name}
            className={`${compact ? 'w-12 h-12' : 'w-20 h-20'} object-contain drop-shadow-lg`}
          />
        </div>
        {pick.is_captain && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white shadow-md">
            <span className="text-[10px] font-bold text-gray-900">C</span>
          </div>
        )}
        {pick.is_vice_captain && !pick.is_captain && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center border-2 border-white shadow-md">
            <span className="text-[10px] font-bold text-white">V</span>
          </div>
        )}
      </div>
      <div className="mt-2 text-center">
        <div className="bg-white dark:bg-gray-700 px-2 py-1 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
          <div className={`font-semibold ${compact ? 'text-xs' : 'text-sm'} text-gray-800 dark:text-gray-200 truncate max-w-[100px]`}>{player.web_name}</div>
          <div className="flex gap-1 justify-center mt-1 flex-wrap">
            {teamFixtures.length === 0 ? (
              <span className="text-[10px] text-gray-500">-</span>
            ) : (
              teamFixtures.map((fx, i) => {
                const opp = getTeam(fx.opponent);
                return (
                  <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${getDifficultyColor(fx.difficulty)} text-white`}>
                    {fx.isHome ? 'vs' : '@'} {opp?.short_name}
                  </span>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
