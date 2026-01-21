# Hub Halal - Guide de démarrage

## ✅ Installation complète!

Votre projet est prêt. Voici comment l'utiliser:

### 🚀 Démarrage rapide

**Mode développement** (avec hot reload):
```bash
npm run dev
```

**Build pour distribution**:
```bash
npm run dist
```

Cela crée un installateur Windows et un .exe portable dans `dist/`.

---

## 📁 Structure du Projet

```
Hub Halal/
├── src/
│   ├── main/              # Code Electron (backend)
│   │   ├── main.ts        # Point d'entrée
│   │   ├── database.ts    # SQLite setup
│   │   ├── ipc.ts         # Communication IPC
│   │   └── preload.ts     # Security bridge
│   ├── renderer/          # Code React (UI)
│   │   ├── pages/         # Pages principales
│   │   ├── components/    # Composants réutilisables
│   │   └── styles/        # CSS Tailwind
│   └── shared/            # Code partagé
├── dist/                  # Build output
├── public/                # Assets publics
└── .vscode/               # Configuration VS Code
```

---

## 🔧 Commandes Utiles

| Commande | Effet |
|----------|-------|
| `npm run dev` | Lance le dev server avec Electron + React HMR |
| `npm run build` | Compile main + renderer |
| `npm run build:main` | Compile uniquement Electron |
| `npm run build:renderer` | Compile uniquement React |
| `npm run start` | Build + Lance Electron |
| `npm run dist` | Crée installateur Windows |

---

## 📱 Fonctionnalités Phase 0

✅ **Auth System**
- Registration/Login avec SQLite
- Stockage sécurisé des données utilisateur

✅ **Settings**
- Langage (FR/EN/AR)
- Madhab (Hanafi, Maliki, Shafi'i, Hanbali)
- Méthode calcul prières
- Options affichage Coran
- Notifications

✅ **Navigation**
- 4 onglets principaux (Coran, Prières, Média, Paramètres)
- Design minimaliste inspiré d'Apple

---

## 🌐 APIs Intégrées

| API | Usage | Status |
|-----|-------|--------|
| AlQuran Cloud | Quran complet + ayahs | ✅ Actif |
| Aladhan | Horaires prières | ✅ Actif |
| Tafsir API | Prêt pour phase 1 | 📋 À intégrer |

---

## 🎨 Design

- **Palette**: Vert islamique (#1a472a), Accent vert clair (#26d07c)
- **Font**: Inter (UI) + Noto Naskh Arabic (Texte arabe)
- **Tailwind CSS**: Utility-first approach

---

## 📊 Prochaines Étapes

### Phase 1 - Onglet Coran
- [ ] Ajouter traductions (FR/EN)
- [ ] Intégrer tafsir arabe
- [ ] Toggle police tajweed
- [ ] Lecteur audio

### Phase 2 - Onglet Prières
- [ ] Notifications push
- [ ] Sélection location
- [ ] Countdown prière

### Phase 3 - Onglet Média
- [ ] Intégration audio player
- [ ] Gestion playlists
- [ ] Récitations récitées

### Phase 4 - Advanced
- [ ] Dark mode
- [ ] Bookmarks
- [ ] Search feature
- [ ] AI tafsir

---

## 🔐 Sécurité

- **Context Isolation**: Enabled
- **Sandbox**: Enabled
- **Node Integration**: Disabled
- **Preload Script**: Sécurise les IPC

---

## 📝 Notes de Développement

- **BDD**: SQLite stockée dans `%APPDATA%/hub-halal/data/`
- **Dev Tools**: Disponibles en mode dev (F12)
- **HMR**: React Fast Refresh activé
- **Types**: Full TypeScript strict mode

---

## 🐛 Troubleshooting

**L'app ne démarre pas?**
```bash
npm install
npm run build
npm run start
```

**Port 5173 déjà utilisé?**
Vite utilisera automatiquement le port suivant (5174, 5175, etc.)

**Build Windows échoue?**
Assurez-vous d'avoir les tools de build installés:
```bash
npm install windows-build-tools -g
```

---

## 📦 Distribution

Pour partager avec des amis:

1. Build: `npm run dist`
2. Fichier créé: `dist/Hub Halal Setup 0.1.0.exe`
3. Partagez le .exe, ils installent et utilisent!

---

**Bon développement! بسم الله الرحمن الرحيم**
