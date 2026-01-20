# Hub Halal - Modern Islamic App

A modern, minimalist desktop application for Islamic resources with Quran, prayer times, and Islamic media.

## Features

### Phase 0 ✅ (Fondations)
- **Auth System**: Local SQLite database with user registration and login
- **Settings Management**: Customizable user preferences
- **Modern UI**: Apple-inspired design with Tailwind CSS
- **Multi-language Support**: French, English, Arabic ready

### Phase 1 🚀 (Onglet Coran)
- Complete Quran display using AlQuran Cloud API
- Arabic text with Uthmani font
- Surah browsing
- Ready for: translations, tafsir, tajweed fonts

### Phase 2 🔄 (Onglet Prières)
- Prayer times using Aladhan API
- Location-based calculations
- Madhab selection
- Notification system ready

### Phase 3 📺 (Onglet Média)
- Recitations management
- Playlist creation
- Built-in player ready
- Educational videos embedding ready

### Phase 4 🧠 (Valeur Ajoutée)
- Bookmarks
- Personal notes
- AI-powered tafsir summaries

## Tech Stack

- **Electron 27**: Cross-platform desktop framework
- **React 18**: UI library
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Modern styling
- **SQLite3**: Local database
- **Vite**: Fast build tool

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This starts both the Electron main process and the React dev server.

### Build

```bash
npm run build
```

### Distribution

```bash
npm run dist
```

Creates Windows installer and portable executable.

## Project Structure

```
src/
├── main/           # Electron main process
│   ├── main.ts     # App entry point
│   ├── database.ts # SQLite setup
│   ├── ipc.ts      # Electron IPC handlers
│   └── preload.ts  # Security preload
├── renderer/       # React frontend
│   ├── components/ # Reusable components
│   ├── pages/      # Page components
│   └── styles/     # Global styles
└── shared/         # Shared utilities
```

## APIs Used

- **Quran**: https://api.alquran.cloud
- **Prayer Times**: https://api.aladhan.com
- **Tafsir**: Ready for integration

## Next Steps

1. **Enhance Quran Display**
   - Add translation selection
   - Implement tafsir display
   - Add audio player

2. **Improve Prayer Times**
   - Add notification system
   - Location settings UI
   - Prayer countdown

3. **Media Management**
   - Audio player integration
   - Playlist features
   - Video embedding

4. **Advanced Features**
   - Dark mode theme
   - Bookmarking system
   - Search functionality

## Contributing

Feel free to contribute! Please follow the code style and create feature branches.

## License

MIT

## Contact & Support

For questions or suggestions, open an issue or contact the team.

---

**بسم الله الرحمن الرحيم**
