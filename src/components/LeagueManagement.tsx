import React from 'react';

const LeagueManagement: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">🚧</div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">Coming Soon</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
            League Management features are currently in development.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Track mini-leagues, compare standings, and analyze catch-up strategies.
          </p>
        </div>
        <div className="inline-block bg-purple-50 dark:bg-purple-900/30 px-6 py-3 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
            Stay tuned for updates!
          </p>
        </div>
      </div>
    </div>
  );
};

export default LeagueManagement;
