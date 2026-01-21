# Hub Halal

Application de bureau moderne pour les musulmans - Coran, horaires de prière et ressources islamiques.

## 📥 Téléchargement

Rendez-vous dans la section [Releases](https://github.com/ShadowWLX/hub-halal/releases) pour télécharger la dernière version:

- **Hub Halal Setup.exe** - Installeur Windows (recommandé)
- **Hub Halal.exe** - Version portable

## ✨ Fonctionnalités

### 📖 Coran
- Affichage complet du Coran
- 3 polices arabes : Uthmani simple, Police .ttf, Tajweed coloré
- Traduction française
- Translittération phonétique
- Règles de Tajweed avec guide visuel

### 🕌 Prières
- Horaires de prière automatiques
- Adhan automatique à l'heure de la prière
- Notifications 5 minutes avant
- Compte à rebours avec affichage des secondes
- Invocation avant la prière (10 min)
- Localisation automatique ou recherche de ville

### 🎯 Pratique
- Démarrage automatique avec Windows
- Minimisation en tray (l'app reste active en arrière-plan)
- Mises à jour automatiques
- Mode dev/release séparé

## 🔄 Mises à jour

L'application vérifie automatiquement les mises à jour au démarrage et vous notifie quand une nouvelle version est disponible.

## 📝 Notes de version

Consultez les [Releases](https://github.com/ShadowWLX/hub-halal/releases) pour l'historique complet.

---

**Version actuelle:** 0.1.2  
**Développeur:** ShadowWLX

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
