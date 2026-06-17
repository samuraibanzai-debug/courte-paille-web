# 🎋 Courte Paille — Version Web (React + Vite + PWA)

## Stack
- **React 18 + TypeScript + Vite**
- **Firebase Realtime Database + Anonymous Auth**
- **PWA** — installable sur mobile sans passer par un store
- **Vercel** — déploiement en 2 minutes, URL publique gratuite

---

## 1. Installation locale

```bash
# Copier les variables d'environnement
cp .env.example .env
# Remplir .env avec tes clés Firebase (même projet que l'app mobile)

npm install
npm run dev
# → http://localhost:5173
```

---

## 2. Déploiement sur Vercel (URL publique)

### Option A — Via l'interface Vercel (recommandé)

1. Pousse le projet sur **GitHub**
```bash
git init && git add . && git commit -m "init"
git remote add origin https://github.com/TON_PSEUDO/courte-paille-web.git
git push -u origin main
```

2. Va sur **https://vercel.com** → "Add New Project"
3. Importe ton dépôt GitHub
4. Dans **"Environment Variables"**, ajoute chacune des variables de ton `.env`
5. Clique **Deploy**

→ Tu obtiens une URL du type `courte-paille.vercel.app` en 2 minutes

### Option B — Via CLI

```bash
npm install -g vercel
vercel login
vercel --prod
# Vercel demande les variables d'environnement lors du premier déploiement
```

---

## 3. PWA — Installation sur mobile

Une fois l'URL publique disponible :
- **Android (Chrome)** : ouvre l'URL → menu ⋮ → "Ajouter à l'écran d'accueil"
- **iOS (Safari)** : ouvre l'URL → bouton Partager → "Sur l'écran d'accueil"

L'app s'installe comme une vraie application, sans passer par le Play Store.

---

## 4. Firebase — même projet que l'app mobile

Tu peux réutiliser **exactement le même projet Firebase**.
Les variables `.env` correspondent aux mêmes clés, avec le préfixe `VITE_` au lieu de `EXPO_PUBLIC_`.

Les règles de sécurité et l'auth anonyme sont identiques — pas besoin de reconfigurer.

---

## Structure

```
courte-paille-web/
├── index.html
├── vite.config.ts        # Config Vite + PWA
├── vercel.json           # Routing SPA + headers sécurité
├── .env.example
├── public/
│   ├── favicon.svg
│   ├── icon-192.png      # À créer (icône PWA)
│   └── icon-512.png      # À créer (icône PWA)
└── src/
    ├── main.tsx
    ├── App.tsx            # Router
    ├── index.css          # Variables CSS + animations globales
    ├── config/firebase.ts
    ├── utils/
    │   ├── types.ts
    │   └── sessionService.ts
    ├── hooks/useSession.ts
    ├── components/
    │   ├── UI.tsx         # Card, Btn, Input, OfflineBanner…
    │   └── Straw.tsx      # SVG pailles animées
    └── pages/Pages.tsx    # Home, Create, Join, Lobby, Draw, Result
```

---

## Icônes PWA (à créer)

Place dans `/public/` :
- `icon-192.png` — 192×192px
- `icon-512.png` — 512×512px

Outil rapide : https://realfavicongenerator.net
