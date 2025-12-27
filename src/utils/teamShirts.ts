// Team shirt image URLs
// FPL uses the team code property from the API
// Pattern: https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_{code}-110.png
// Goalkeeper pattern: shirt_{code}_1-66.png (alternative kit)

export const getTeamShirtUrl = (teamCode: number, isGoalkeeper: boolean = false): string => {
  // Use the team code from the team object
  // Goalkeepers get the alternative kit (suffix _1)
  if (isGoalkeeper) {
    return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}_1-110.png`;
  }
  return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}-110.png`;
};

export const getTeamShirtUrlLarge = (teamCode: number, isGoalkeeper: boolean = false): string => {
  if (isGoalkeeper) {
    return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}_1-220.png`;
  }
  return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}_1-220.png`;
};

// Fallback team badge if shirt doesn't load
export const getTeamBadgeUrl = (teamCode: number): string => {
  return `https://resources.premierleague.com/premierleague/badges/t${teamCode}.png`;
};
