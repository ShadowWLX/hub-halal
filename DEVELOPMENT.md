# 🚀 Hub Halal - Phase 0 Complete!

## ✅ Phase 2.1: Prières - Fixe Persistance & Notifications

### Problèmes Résolus
1. ✅ **Persistance de la méthode de calcul** - La méthode était réinitialisée à "UOIF" quand on changeait d'onglet
   - Solution: Sauvegarde des settings dans localStorage avec clé `halal_prayer_settings`
   - Les settings sont maintenant chargés au montage du composant et sauvegardés à chaque changement

2. ✅ **Système de notifications Windows + Adhan**
   - Utilise l'API Notification Windows (standard navigateur)
   - Joue l'Adhan (récitation d'appel à la prière) 5 minutes avant chaque prière
   - Support d'Adhan personnalisé: l'utilisateur peut charger un fichier audio local
   - Bouton de test pour vérifier que les notifications fonctionnent

### Code Modifié
**PrayersPage.tsx**
- Charge les settings depuis localStorage au mount
- Sauvegarde settings à chaque modification
- Utilise `fetchPrayerTimes(lat, lng, method)` avec paramètre method
- Déclenche les notifications 5 minutes avant chaque prière
- UI pour télécharger un Adhan personnalisé

**Nouveau: notificationService.ts**
- `showPrayerNotification()` - Affiche notification + joue Adhan
- `playAdhan()` - Joue Adhan personnalisé ou défaut
- `requestNotificationPermission()` - Demande permission Windows
- `sendTestNotification()` - Test de notification

### Fonctionnalités Ajoutées
- 🔔 Notifications Windows avec titre/description personnalisé
- 🎵 Adhan par défaut du réseau Islamic Network CDN
- 📁 Upload d'un fichier Adhan personnalisé (MP3/WAV)
- 🧪 Bouton "Tester une notification"
- 💾 Persistence complète des settings utilisateur

### Stockage
```javascript
// halal_prayer_settings (localStorage)
{
  "method": 12,              // 1-15 selon l'API Aladhan
  "notifications": true,     // Activer/désactiver notifications
  "adhanFile": "data:audio/..." // Base64 du fichier audio personnalisé (optionnel)
}
```

### Test
1. Aller à l'onglet Prières
2. Cliquer sur ⚙️ Paramètres de prière
3. Changer la méthode → quitter l'onglet → revenir = le choix est sauvegardé ✓
4. Cocher "Recevoir des rappels de prières"
5. Cliquer "Tester une notification" → devrait recevoir une notification Windows ✓
6. (Optionnel) Charger un fichier Adhan personnel → cet audio jouera à chaque alerte

---



### Architecture
- ✅ **Electron 27** - Framework desktop pour Windows/Mac/Linux
- ✅ **React 18 + TypeScript** - UI moderne et type-safe
- ✅ **Vite** - Build tool ultra-rapide
- ✅ **Tailwind CSS** - Styling minimaliste
- ✅ **SQLite** - Base de données locale

### Fonctionnalités
- ✅ **Auth System** - Login/Register avec BDD locale
- ✅ **Settings** - 10+ paramètres utilisateur
- ✅ **Navigation** - 4 onglets (Coran, Prières, Média, Settings)
- ✅ **Design** - Couleurs islamiques, inspiration Apple
- ✅ **APIs** - Configuration pour Quran.com, Aladhan, Tafsir

### Code Ready-to-Use
```
src/
├── main/              # Electron process
├── renderer/          # React interface
├── shared/            # Types, APIs, Theme
└── .vscode/           # VS Code config
```

---

## 🎯 Avant de continuer...

### 1️⃣ Testez que tout fonctionne
```bash
npm run dev
```
Cela lance Electron + React dev server.

### 2️⃣ Explorez la structure
- Ouvrez `src/renderer/App.tsx` - c'est l'entrée
- Ouvrez `src/main/main.ts` - c'est le backend Electron
- Ouvrez `src/renderer/pages/QuranPage.tsx` - exemple de page

### 3️⃣ Comprendre le flux
```
User clicks button → React event → IPC message → Electron main → Database
Response ← IPC ← Renderer updates
```

---

## 📋 Prochaines Phases (À faire)

### Phase 1: Onglet Coran Complet
Actuellement: Simple listing avec API AlQuran Cloud
À faire:
- [ ] Afficher complément ayahs
- [ ] Traductions (FR/EN)
- [ ] Boutons "Favoris"
- [ ] Lecteur audio intégré
- [ ] Affichage tafsir
- [ ] Toggle police tajweed

**Estimated time**: 3-4 jours

### Phase 2: Onglet Prières Complet
Actuellement: Simple affichage horaires
À faire:
- [ ] Système de notifications (desktop)
- [ ] Paramètres location (map interactive)
- [ ] Choix méthode calcul
- [ ] Countdown avant prière
- [ ] Historique prières
- [ ] Gestion Ramadan

**Estimated time**: 2-3 jours

### Phase 3: Onglet Média
Actuellement: Mock data uniquement
À faire:
- [ ] Lecteur audio HTML5
- [ ] Récitations vraies (API ou stockage)
- [ ] Gestion playlists (CRUD)
- [ ] Random, shuffle
- [ ] Favoris/likes
- [ ] Vidéos éducatives (YouTube embed)

**Estimated time**: 4-5 jours

### Phase 4: Polish & Advanced
- [ ] Dark mode toggle
- [ ] Bookmarks système
- [ ] Moteur de recherche
- [ ] Notes personnelles
- [ ] Analytics (ce qu'on lit le plus)
- [ ] Sync cloud (optionnel)
- [ ] Build Windows installer

**Estimated time**: 3-4 jours

---

## 💡 Tips de développement

### Hot Reload
React Fast Refresh est activé. Modifiez un fichier `.tsx` et sauvegardez = refresh automatique!

### Database Queries
Utilisez `ipc.ts` pour ajouter des handlers:
```typescript
ipcMain.handle('my-action', (_event, data) => {
  // Do DB stuff
  return result
})
```

Depuis le renderer:
```typescript
const result = await (window as any).electron['my-action'](data)
```

### API Calls
Utilisez `src/shared/api-config.ts` pour les endpoints:
```typescript
const response = await fetch(`${APIs.quran.baseUrl}${APIs.quran.endpoints.surahs}`)
```

### Styling
Utilisez Tailwind. Exemple:
```jsx
<button className="bg-islamic-primary text-white px-4 py-2 rounded-lg hover:opacity-90">
  Click me
</button>
```

---

## 🔧 Commandes à mémoriser

| Commande | Utilité |
|----------|---------|
| `npm run dev` | 🚀 Development avec HMR |
| `npm run build` | 🔨 Production build |
| `npm run dist` | 📦 Create Windows installer |
| `npm run start` | ▶️ Build + Run Electron |

---

## 📁 Fichiers importants à connaître

### Pour ajouter des pages
1. Créez `src/renderer/pages/MyPage.tsx`
2. Importez dans `App.tsx`
3. Ajoutez au switch/if

### Pour ajouter des handlers IPC
1. Créez la fonction dans `src/main/ipc.ts`
2. Exposez dans `src/main/preload.ts`
3. Utilisez dans React

### Pour ajouter des settings
1. Modifiez `src/shared/types.ts` (interface Settings)
2. Updatez la création table dans `src/main/database.ts`
3. Ajoutez UI dans `SettingsPage.tsx`

---

## 🎨 Design System

Tous les colors, fonts, espacements sont dans:
- `src/shared/theme.ts` - Tokens
- `tailwind.config.js` - Tailwind config
- `src/renderer/styles/globals.css` - Global styles

Palette actuelle:
- 🟢 Primary: `#1a472a` (Islamic green)
- 🟢 Accent: `#26d07c` (Bright green)
- ⚪ Light: `#f0f9f5` (Very light green)
- ⚫ Dark: `#0d1f15` (Very dark green)

---

## 🤔 FAQs

**Q: Comment ajouter une nouvelle dépendance?**
A: `npm install package-name` ou `npm install --save-dev package-name`

**Q: Où le app crée la BDD?**
A: Windows: `C:\Users\[USER]\AppData\Roaming\Hub Halal\data\hub-halal.db`

**Q: Je dois réinstaller node_modules?**
A: `rm -r node_modules && npm install` (ou sur Windows: `rmdir /s node_modules && npm install`)

**Q: Je peux partager l'app?**
A: Oui! `npm run dist` crée un .exe. Partagez `dist/Hub Halal Setup 0.1.0.exe`

---

## 🚨 Problèmes courants

### L'app démarre en blanc
→ Attendez 5 sec, le React peut être lent au démarrage
→ Ouvrez DevTools (F12) et vérifiez les erreurs

### Port 5173 occupé
→ Vite utilise le port suivant automatiquement
→ Si pas, tuez le processus: `lsof -i :5173` (mac/linux)

### Erreur BDD
→ La BDD se crée automatiquement
→ Si erreur, supprimez `%APPDATA%\Hub Halal\data\` et relancez

---

## 📚 Ressources

- Electron Docs: https://www.electronjs.org/docs
- React Docs: https://react.dev
- Tailwind: https://tailwindcss.com/docs
- AlQuran API: https://alquran.cloud/api
- Aladhan API: https://aladhan.com/api-details

---

## 🎯 Next Step

Lancez le dev server:
```bash
npm run dev
```

Puis explorez l'app! Essayez:
1. Créer un compte
2. Naviguer entre les onglets
3. Changer les settings
4. Regardez la BDD se remplir (devtools)

---

**بسم الله الرحمن الرحيم**
Bon développement! 🚀
