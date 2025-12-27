export const formatPrice = (price: number): string => {
  return `£${(price / 10).toFixed(1)}m`;
};

export const getPositionName = (elementType: number): string => {
  const positions: { [key: number]: string } = {
    1: 'GKP',
    2: 'DEF',
    3: 'MID',
    4: 'FWD',
  };
  return positions[elementType] || 'Unknown';
};

export const getDifficultyColor = (difficulty: number): string => {
  const colors: { [key: number]: string } = {
    1: 'bg-green-500',
    2: 'bg-green-400',
    3: 'bg-yellow-400',
    4: 'bg-orange-500',
    5: 'bg-red-500',
  };
  return colors[difficulty] || 'bg-gray-400';
};

export const getDifficultyText = (difficulty: number): string => {
  const texts: { [key: number]: string } = {
    1: 'Very Easy',
    2: 'Easy',
    3: 'Medium',
    4: 'Hard',
    5: 'Very Hard',
  };
  return texts[difficulty] || 'Unknown';
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const calculateSquadValue = (picks: any[], allPlayers: any[]): number => {
  return picks.reduce((total, pick) => {
    const player = allPlayers.find(p => p.id === (pick.element ?? pick.player));
    return total + (player?.now_cost || 0);
  }, 0);
};

export const getRemainingBudget = (squadValue: number, bank: number): number => {
  return 1000 - squadValue + bank;
};

export const isValidSquad = (picks: any[], allPlayers?: any[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (picks.length !== 15) {
    errors.push('Squad must have exactly 15 players');
  }

  const positions = picks.reduce((acc, pick) => {
    const player = allPlayers?.find(p => p.id === (pick.element ?? pick.player));
    const et = player?.element_type;
    if (et) acc[et] = (acc[et] || 0) + 1;
    return acc;
  }, {} as { [key: number]: number });

  if (positions[1] !== 2) errors.push('Must have exactly 2 goalkeepers');
  if (positions[2] < 3 || positions[2] > 5) errors.push('Must have 3-5 defenders');
  if (positions[3] < 2 || positions[3] > 5) errors.push('Must have 2-5 midfielders');
  if (positions[4] < 1 || positions[4] > 3) errors.push('Must have 1-3 forwards');

  const teamCounts = picks.reduce((acc, pick) => {
    const player = allPlayers?.find(p => p.id === (pick.element ?? pick.player));
    if (player?.team) acc[player.team] = (acc[player.team] || 0) + 1;
    return acc;
  }, {} as { [key: number]: number });

  const maxFromTeam = Math.max(...(Object.values(teamCounts) as number[]));
  if (maxFromTeam > 3) {
    errors.push('Maximum 3 players from the same team');
  }

  return { valid: errors.length === 0, errors };
};
