# FPL Planner - Fantasy Premier League Planning Tool

A comprehensive React + Vite web application for Fantasy Premier League players to plan their strategy, analyze fixtures, and optimize their team for future gameweeks.

## Features

- **Team Connection**: Connect your real FPL team using your Team ID
- **Live Dashboard**: View your current squad, points, and rank
- **Gameweek Planner**: Plan up to 8 gameweeks ahead with fixture difficulty ratings
- **Transfer Simulator**: Simulate transfers with budget tracking
- **Chip Strategy**: Plan when to use Wildcard, Free Hit, Bench Boost, and Triple Captain
- **Player Analytics**: Detailed statistics including xG, xA, form, and ownership
- **Session-Based**: No database required - uses browser session storage

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v7
- **State Management**: React Context API
- **Data Source**: Official FPL API

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Your FPL Team ID (find it in your FPL profile URL)

### Installation

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Finding Your Team ID

1. Go to https://fantasy.premierleague.com
2. Navigate to your team page
3. Your Team ID is in the URL: `fantasy.premierleague.com/entry/XXXXXX/event/XX`
4. The 6-digit number is your Team ID

## Usage

### Connecting Your Team

1. On the login page, enter your FPL Team ID
2. Click "Connect Team"
3. Your data will be fetched and stored in your browser session

### Dashboard

View your current squad with:
- Starting XI and bench
- Captain and vice-captain
- Points breakdown
- Team value and bank
- Overall rank

### Planner

- See fixtures for your squad across the next 8 gameweeks
- Color-coded fixture difficulty ratings
- Plan chip usage (Wildcard, Free Hit, Bench Boost, Triple Captain)
- Identify double/blank gameweeks

### Transfers

- Select a player to transfer out
- Browse and filter available replacements
- Real-time budget tracking
- Player statistics comparison

## Data & Privacy

- **No Login Required**: Uses public FPL API endpoints
- **Session Storage**: All data stored locally in your browser
- **No Backend Database**: Data cleared when you close the browser
- **No Credentials Stored**: Only your Team ID is used
- **CORS**: Direct API calls to FPL (may need CORS proxy for production)

## API Rate Limits

The app caches FPL API responses for 5 minutes to avoid rate limiting. You can manually refresh data using the refresh button in the header.

## Development

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Project Structure

```
src/
├── components/        # React components
│   ├── Dashboard.tsx
│   ├── Planner.tsx
│   ├── Transfers.tsx
│   ├── Login.tsx
│   ├── Header.tsx
│   └── ...
├── context/          # React Context for state
│   └── FPLContext.tsx
├── services/         # API services
│   └── fplApi.ts
├── types/            # TypeScript types
│   └── fpl.ts
├── utils/            # Helper functions
│   ├── helpers.ts
│   └── storage.ts
├── App.tsx           # Main app component
└── main.tsx          # Entry point
```

## Known Limitations

- **CORS Issues**: Direct API calls may be blocked by CORS in production. Consider using a proxy server or CORS proxy service.
- **Live Updates**: Not real-time during matches. Use refresh button to update data.
- **Session Storage**: Data cleared when browser is closed. Consider using localStorage for persistence.
- **No Authentication**: Cannot make transfers or manage your actual FPL team.

## Future Enhancements

- [ ] Mini-league standings and comparisons
- [ ] Expected points (xP) predictions
- [ ] Historical points graphs
- [ ] Player ownership tracking
- [ ] Differential finder
- [ ] Transfer planner with multi-GW optimization
- [ ] Export/import transfer plans
- [ ] Dark mode
- [ ] Mobile app

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - Feel free to use this project for personal or commercial purposes.

## Disclaimer

This is an unofficial tool and is not affiliated with Fantasy Premier League or the Premier League. All data is sourced from the official FPL API.

## Acknowledgments

- Official FPL API for providing public endpoints
- LiveFPL.net for inspiration
- React, Vite, and Tailwind CSS communities
