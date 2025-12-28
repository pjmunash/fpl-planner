import React, { useState, useEffect } from 'react';
import { useFPL } from '../context/FPLContext';

const LeagueManagement: React.FC = () => {
  const { managerData, fetchPlayerLeagues, fetchLeagueStandings } = useFPL();
  const [leagueCode, setLeagueCode] = useState('');
  const [importedLeagues, setImportedLeagues] = useState<any[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (managerData?.id) {
      syncPlayerLeagues();
    }
  }, [managerData?.id]);

  const syncPlayerLeagues = async () => {
    if (!managerData?.id) return;
    try {
      setLoading(true);
      setError(null);
      const leaguesData = await fetchPlayerLeagues(managerData.id);
      const leagues = leaguesData.classic || [];
      const leaguesWithStandings = await Promise.all(
        leagues.map(async (league: any) => {
          try {
            const standings = await fetchLeagueStandings(league.id, false);
            return { ...league, standings: standings.standings?.results || [], type: 'classic' };
          } catch {
            return { ...league, standings: [], type: 'classic' };
          }
        })
      );
      setImportedLeagues(leaguesWithStandings);
      if (leaguesWithStandings.length > 0) setSelectedLeague(leaguesWithStandings[0]);
    } catch (err) {
      setError('Failed to load your leagues. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportLeague = async () => {
    if (!leagueCode.trim()) { setError('Please enter a league ID'); return; }
    const numericId = parseInt(leagueCode.trim(), 10);
    if (isNaN(numericId)) { setError('League ID must be a valid number'); return; }
    try {
      setLoading(true); setError(null);
      const standings = await fetchLeagueStandings(numericId, false);
      if (!standings || !standings.league) { setError('League not found.'); return; }
      const newLeague = {
        id: numericId,
        name: standings.league.name || `League ${numericId}`,
        standings: standings.standings?.results || [],
        type: 'classic', imported: true,
      };
      if (importedLeagues.find(l => l.id === newLeague.id)) { setError('This league is already imported.'); return; }
      setImportedLeagues([...importedLeagues, newLeague]); setSelectedLeague(newLeague); setLeagueCode('');
    } catch (err: any) {
      setError(`Failed to import league: ${err?.message || 'Unknown error'}`);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">League Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Track and compare your progress across all mini-leagues</p>
        </div>
        {!loading && importedLeagues.length > 0 && (
          <button onClick={syncPlayerLeagues} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition text-sm">🔄 Refresh</button>
        )}
      </div>

      {loading && importedLeagues.length === 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
          <p className="text-blue-800 dark:text-blue-300 font-medium">Loading your connected leagues...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-center justify-between">
          <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
          {importedLeagues.length === 0 && (
            <button onClick={syncPlayerLeagues} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold transition whitespace-nowrap">Retry</button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Import Additional League</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Add a league by its ID to track it</p>
            <div className="space-y-3">
              <input type="text" placeholder="Enter league ID..." value={leagueCode} onChange={(e) => setLeagueCode(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleImportLeague()} disabled={loading} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none disabled:opacity-50" />
              <button onClick={handleImportLeague} disabled={loading} className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition">{loading ? 'Loading...' : 'Import League'}</button>
            </div>
            {importedLeagues.length > 0 ? (
              <div className="mt-6 space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <span>Your Leagues</span>
                  <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-bold px-2 py-0.5 rounded-full">{importedLeagues.length}</span>
                </h3>
                {importedLeagues.map(league => (
                  <button key={league.id} onClick={() => setSelectedLeague(league)} className={`w-full p-3 rounded-lg text-left transition border-l-4 ${selectedLeague?.id === league.id ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-500' : 'bg-gray-50 dark:bg-gray-700 border-transparent hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
                    <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">{league.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">ID: {league.id}</div>
                    {league.standings && league.standings.length > 0 && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{league.standings.length} members</div>
                    )}
                  </button>
                ))}
              </div>
            ) : !loading && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">No leagues found</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Import a league using the form above</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {!selectedLeague ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-2">No league selected</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Import a league to view standings and comparisons</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">{selectedLeague.name}</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">League ID</div>
                    <div className="font-bold text-gray-800 dark:text-gray-200">{selectedLeague.id}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Members</div>
                    <div className="font-bold text-gray-800 dark:text-gray-200">{selectedLeague.standings?.length || 0}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">League Standings</h3>
                {selectedLeague.standings && selectedLeague.standings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600">
                        <tr>
                          <th className="px-4 py-2 text-left">Rank</th>
                          <th className="px-4 py-2 text-left">Team</th>
                          <th className="px-4 py-2 text-left">Manager</th>
                          <th className="px-4 py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {selectedLeague.standings.map((s: any) => (
                          <tr key={s.entry}>
                            <td className="px-4 py-2">{s.rank}</td>
                            <td className="px-4 py-2">{s.entry_name}</td>
                            <td className="px-4 py-2">{s.player_name}</td>
                            <td className="px-4 py-2 text-right font-semibold">{s.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">No standings available</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeagueManagement;
