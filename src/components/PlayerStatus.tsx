import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFPL } from '../context/FPLContext';
import { getTeamShirtUrl } from '../utils/teamShirts';

const PlayerStatus: React.FC = () => {
  const { currentPicks, bootstrapData, getPlayer, getTeam } = useFPL();
  const navigate = useNavigate();

  // Get status for all players
  const playerStatuses = useMemo(() => {
    if (!currentPicks || !bootstrapData) return [];
    
    return currentPicks.picks
      .map(pick => {
        const player = getPlayer(pick.element);
        if (!player) return null;
        
        return {
          pick,
          player,
          team: getTeam(player.team),
          status: player.status,
          chancePlaying: player.chance_of_playing_next_round,
          news: player.news,
        };
      })
      .filter((p): p is Exclude<typeof p, null> => p !== null);
  }, [currentPicks, bootstrapData, getPlayer, getTeam]);

  // Get status flag color and label
  const getStatusFlag = (status: string | null, chancePlaying: number | null) => {
    if (status === 'd') return { color: 'orange', label: 'Doubtful', icon: '⚠️' };
    if (status === 's') return { color: 'red', label: 'Suspended', icon: '🚫' };
    if (status === 'u') return { color: 'red', label: 'Unavailable', icon: '❌' };
    if (chancePlaying !== null && chancePlaying < 100) {
      if (chancePlaying < 25) return { color: 'red', label: `${chancePlaying}% Likely`, icon: '🔴' };
      if (chancePlaying < 50) return { color: 'orange', label: `${chancePlaying}% Likely`, icon: '🟠' };
      if (chancePlaying < 100) return { color: 'yellow', label: `${chancePlaying}% Likely`, icon: '🟡' };
    }
    return { color: 'green', label: 'Fit', icon: '🟢' };
  };

  // Filter players by status
  const flaggedPlayers = playerStatuses.filter(p => {
    const flag = getStatusFlag(p.status, p.chancePlaying);
    return flag.color !== 'green';
  });

  const fitPlayers = playerStatuses.filter(p => {
    const flag = getStatusFlag(p.status, p.chancePlaying);
    return flag.color === 'green';
  });

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <button
        onClick={() => navigate('/team')}
        className="mb-6 px-4 py-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition"
      >
        ← Back to Team
      </button>

      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">Player Status & Injuries</h1>

      {/* Flagged Players */}
      {flaggedPlayers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            ⚠️ Players with Issues ({flaggedPlayers.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flaggedPlayers.map(p => {
              const flag = getStatusFlag(p.status, p.chancePlaying);
              const colorClasses = {
                red: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
                orange: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
                yellow: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
                green: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
              };
              const textClasses = {
                red: 'text-red-800 dark:text-red-200',
                orange: 'text-orange-800 dark:text-orange-200',
                yellow: 'text-yellow-800 dark:text-yellow-200',
                green: 'text-green-800 dark:text-green-200',
              };

              return (
                <div
                  key={p.player?.id}
                  className={`border rounded-lg p-4 ${colorClasses[flag.color as keyof typeof colorClasses]}`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={getTeamShirtUrl(p.team?.code || 0, p.player?.element_type === 1)}
                      alt={p.team?.short_name}
                      className="w-8 h-8 object-contain"
                    />
                    <div className="flex-1">
                      <h3 className={`font-bold text-sm ${textClasses[flag.color as keyof typeof textClasses]}`}>
                        {flag.icon} {p.player?.web_name}
                      </h3>
                      <p className={`text-xs ${textClasses[flag.color as keyof typeof textClasses]} mt-1`}>
                        {p.team?.short_name}
                      </p>
                      <p className={`text-sm font-semibold ${textClasses[flag.color as keyof typeof textClasses]} mt-2`}>
                        {flag.label}
                      </p>
                      {p.news && (
                        <p className={`text-xs mt-2 ${textClasses[flag.color as keyof typeof textClasses]}`}>
                          📋 {p.news}
                        </p>
                      )}
                      {p.status === 'd' && (
                        <p className={`text-xs mt-1 ${textClasses[flag.color as keyof typeof textClasses]}`}>
                          Status: Doubtful
                        </p>
                      )}
                      {p.status === 's' && (
                        <p className={`text-xs mt-1 ${textClasses[flag.color as keyof typeof textClasses]}`}>
                          Status: Suspended
                        </p>
                      )}
                      {p.status === 'u' && (
                        <p className={`text-xs mt-1 ${textClasses[flag.color as keyof typeof textClasses]}`}>
                          Status: Unavailable
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fit Players */}
      {fitPlayers.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            ✅ Fit Players ({fitPlayers.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {fitPlayers.map(p => (
              <div
                key={p.player?.id}
                className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={getTeamShirtUrl(p.team?.code || 0, p.player?.element_type === 1)}
                    alt={p.team?.short_name}
                    className="w-6 h-6 object-contain"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-green-900 dark:text-green-200 truncate">
                      {p.player?.web_name}
                    </p>
                    <p className="text-[10px] text-green-700 dark:text-green-300">
                      {p.team?.short_name} • 🟢 Fit
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {playerStatuses.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">No squad data available</p>
        </div>
      )}
    </div>
  );
};

export default PlayerStatus;
