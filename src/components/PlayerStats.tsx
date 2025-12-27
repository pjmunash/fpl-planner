import React from 'react';

interface PlayerStatsProps {
  player: any;
  team: any;
}

const PlayerStats: React.FC<PlayerStatsProps> = ({ player, team }) => {
  const stats = [
    { label: 'Minutes', value: player.minutes },
    { label: 'Goals', value: player.goals_scored },
    { label: 'Assists', value: player.assists },
    { label: 'Clean Sheets', value: player.clean_sheets },
    { label: 'Bonus', value: player.bonus },
    { label: 'BPS', value: player.bps },
  ];

  const advancedStats = [
    { label: 'xG', value: parseFloat(player.expected_goals || '0').toFixed(2) },
    { label: 'xA', value: parseFloat(player.expected_assists || '0').toFixed(2) },
    { label: 'xGI', value: parseFloat(player.expected_goal_involvements || '0').toFixed(2) },
    { label: 'ICT Index', value: parseFloat(player.ict_index || '0').toFixed(1) },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{player.web_name}</h2>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>{player.first_name} {player.second_name}</span>
          <span>·</span>
          <span>{team?.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm text-purple-600 mb-1">Price</div>
          <div className="text-2xl font-bold text-purple-700">
            £{(player.now_cost / 10).toFixed(1)}m
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-600 mb-1">Total Points</div>
          <div className="text-2xl font-bold text-green-700">{player.total_points}</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-600 mb-1">Ownership</div>
          <div className="text-2xl font-bold text-blue-700">{player.selected_by_percent}%</div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Season Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="border rounded-lg p-3">
              <div className="text-xs text-gray-500">{stat.label}</div>
              <div className="text-lg font-semibold text-gray-800">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Advanced Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {advancedStats.map((stat) => (
            <div key={stat.label} className="border rounded-lg p-3">
              <div className="text-xs text-gray-500">{stat.label}</div>
              <div className="text-lg font-semibold text-gray-800">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {player.news && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="font-semibold text-yellow-800 mb-1">News</div>
          <div className="text-sm text-yellow-700">{player.news}</div>
        </div>
      )}
    </div>
  );
};

export default PlayerStats;
