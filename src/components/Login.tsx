import React, { useState } from 'react';
import { useFPL } from '../context/FPLContext';

const Login: React.FC = () => {
  const [teamId, setTeamId] = useState('');
  const { connectTeam, loading, error } = useFPL();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const id = parseInt(teamId, 10);
    if (isNaN(id) || id <= 0) {
      return;
    }

    try {
      await connectTeam(id);
      // Success - context will handle navigation
    } catch (err: any) {
      // Error is already set in context
      console.error('Connection failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 dark:from-purple-900 dark:to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">FPL Planner</h1>
          <p className="text-gray-600 dark:text-gray-400">Connect your Fantasy Premier League team</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="teamId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Team ID
            </label>
            <input
              type="text"
              id="teamId"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              placeholder="Enter your FPL Team ID"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              disabled={loading}
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Find your Team ID in the FPL website URL: fantasy.premierleague.com/entry/
              <span className="font-semibold">XXXXXX</span>/event/XX
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !teamId}
            className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connecting...' : 'Connect Team'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            This app uses the official FPL API. No credentials are stored permanently.
            Session data is stored locally in your browser.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
