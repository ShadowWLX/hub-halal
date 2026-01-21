# Build Environments

Hub Halal supports two build modes: **dev** and **release**.

## Dev Mode (Default for `npm run dev`)
- Enables DevTools and shortcuts (F12, Ctrl+Shift+I)
- Uses Quran.Foundation **prelive** endpoints:
  - `https://prelive-oauth2.quran.foundation`
  - `https://apis-prelive.quran.foundation/content/api/v4`
- Shows Test Adhan button and other dev-only features

## Release Mode (Default for `npm run build`, `npm start`, `npm run dist`)
- DevTools disabled, no dev shortcuts
- Uses Quran.Foundation **production** endpoints:
  - `https://oauth2.quran.foundation`
  - `https://api.quran.foundation/content/api/v4`
- Hides Test Adhan button and dev-only UI

## Scripts

### 🔧 Développement (Mode Dev)
```bash
npm run dev              # Lance le serveur de développement
                         # → Vite avec hot reload
                         # → DevTools activés
                         # → API prelive + Test Adhan visible
```

### 📦 Release (Mode Production)
```bash
npm run build            # Build pour release
                         # → Compile avec optimisations
                         # → API production, pas de DevTools

npm start                # Build release + lance l'app
                         # → Équivalent de l'ancien npm run start
                         # → Teste la version finale avant distribution

npm run dist             # Build release + crée l'installateur
                         # → Génère les .exe dans dist/
                         # → Prêt pour distribution
```

### ⚙️ Autres commandes
```bash
npm run build:dev        # Build en mode dev (test)
npm run electron         # Lance Electron (après build manuel)
```

## Résumé Rapide

| Commande         | À utiliser pour...                                    |
|------------------|-------------------------------------------------------|
| `npm run dev`    | **Développer** (avec hot reload et DevTools)          |
| `npm start`      | **Tester** la version finale avant distribution       |
| `npm run dist`   | **Créer l'installateur** pour distribuer l'app        |

## Environment Files (Optional)

- **`.env.development`** and **`.env.production`**: Optional override files for local development
- **NOT required for packaged builds** - all configuration is hardcoded in the source code
- Endpoints switch automatically based on Vite's `import.meta.env.PROD` flag

## How It Works

1. **Electron (main process)**: Detects release build via `app.isPackaged`, `BUILD_ENV=release`, or `NODE_ENV=production`. DevTools/shortcuts are disabled in release.
2. **Renderer (React)**: Imports `ENV` from `config/env.ts` which reads Vite's `import.meta.env` and toggles production endpoints/test features accordingly.
3. **API Config**: `config/api.ts` switches OAuth and API base URLs based on `ENV.isRelease`.
4. **UI**: Components like PrayersPage hide dev-only controls when `ENV.enableTestFeatures` is false.

## Testing Release Locally

```bash
npm run build        # Builds with release flags (production endpoints, no devtools)
npm start            # Launches the release build in Electron
```

or directly package:

```bash
npm run dist         # Builds release + creates installer/portable exe
```

The resulting executable in `dist/` folder will run in full release mode with no dev features.
