# BibleVerseMemo

BibleVerseMemo est une application mobile **100% gratuite, sans publicité**, conçue pour t’aider à mémoriser la Parole de Dieu de manière simple, quotidienne et motivante.

Construite avec **React Native + Expo**, l’app fonctionne autour de versets bibliques, de répétition, de quiz et d’un système de progression (streak, XP, récompenses visuelles).

## ✨ Ce que fait l’app

- 📖 **Lecture de la Bible** avec navigation par livre, chapitre et verset.
- 🎯 **Mémorisation active** avec suivi des versets appris.
- 🧠 **Quiz bibliques** pour tester la rétention et renforcer la mémoire.
- 🌅 **Verset du jour** (avec options de tirage aléatoire).
- 🗂️ **Organisation par thèmes** pour mémoriser selon les besoins spirituels.
- ❤️ **Espace “Mémorisés”** pour retrouver rapidement ses versets appris.
- 📈 **Progression gamifiée** avec:
  - XP,
  - streak quotidien,
  - jalons et récompenses.
- 🔊 **Lecture audio (TTS)** avec choix de langue/voix/vitesse.
- 🌍 **Multi-langue / multi-traductions** selon les versions disponibles.
- 🎨 **Personnalisation visuelle** (thèmes d’apparence).

## 👥 Pour qui ?

BibleVerseMemo s’adresse à :

- toute personne qui veut mémoriser des versets régulièrement,
- les chrétiens qui souhaitent intégrer la Parole dans leur quotidien,
- les groupes de jeunes, cellules, études bibliques,
- les débutants qui veulent apprendre progressivement.

## 🧭 Philosophie du projet

- **Gratuit** : pas de version premium bloquante.
- **Sans pub** : pas de distraction dans l’expérience spirituelle.
- **Simple** : une interface pensée pour pratiquer chaque jour.
- **Motivant** : progression visible pour garder la constance.

## 🛠️ Stack technique

- **React Native**
- **Expo / Expo Router**
- **TypeScript**
- Stockage local (SQLite/AsyncStorage selon les usages)

## 🚀 Lancer le projet en local

### Prérequis

- Node.js
- npm (ou bun)
- Expo CLI (via `npx expo`)

### Installation

```bash
npm install
```

### Démarrage

```bash
npm run start
```

Puis ouvrir l’app avec Expo Go ou un simulateur.

## 🤝 Contribution

Les contributions sont bienvenues (corrections, idées d’amélioration UX, nouvelles fonctionnalités de mémorisation, etc.).

---

Si tu utilises BibleVerseMemo, n’hésite pas à laisser une ⭐ sur le repo pour soutenir le projet.


## 🔐 Configuration Supabase (auth)

Pour que l'inscription/connexion fonctionne, configure uniquement une URL Supabase publique et une clé anon/publishable :

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Alias compatibles aussi pris en charge :

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

Tu peux créer un fichier `.env` (non versionné) à la racine en t'appuyant sur `.env.example` :

```bash
cp .env.example .env
```

Le fichier `.env.example` contient des placeholders : remplace-les avec tes propres valeurs Supabase, puis redémarre l'app Expo pour recharger les variables.

### SQL à exécuter dans Supabase

Exécute les scripts suivants dans l’ordre pour aligner la base avec l’application :

1. `supabase/base_schema.sql`
2. `supabase/user_app_state.sql`
3. `supabase/user_state_normalization.sql`
4. `supabase/xp_challenge_requests.sql`
5. `supabase/secure_profile_sync.sql`

Ces scripts créent les tables `profiles`, `friend_requests`, `friends`, `user_app_state`, les nouvelles tables dédiées (`user_preferences`, `verse_progress`, `user_quiz_stats`, `user_streak_state`, `user_reward_state`) ainsi que les tables d’historique métier (`verse_review_events`, `quiz_attempts`, `streak_events`, `reward_events`), activent la RLS et limitent l’accès RPC aux utilisateurs authentifiés.

⚠️ Important : après modification du `.env`, fais un redémarrage complet du bundler (`npx expo start -c`). N’utilise jamais la clé `service_role` dans cette app mobile.

### Android : erreur `Network request failed`

Si cela fonctionne dans Expo Go/preview mais échoue après compilation Android :

1. Vérifie que l'URL Supabase est correcte (évite `localhost` sur appareil physique).
2. Si tu testes un backend en `http://` (sans TLS), Android peut bloquer la requête en release.
3. Cette app bloque le cleartext en configuration Android par défaut ; utilise `https://` pour Supabase/API.

> Recommandation production : garder une URL `https://` et une clé anon/publishable uniquement.

### Erreur `[Supabase] Fetch failed: Failed to fetch ...`

Cette erreur indique en général un problème de réseau/configuration côté client, pas un SQL manquant dans Supabase :

- vérifie `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY` ;
- redémarre complètement Expo après modification du `.env` avec `npx expo start -c` ;
- n’utilise pas `localhost` sur un appareil physique ;
- préfère une URL `https://...supabase.co`.

Tu n’as besoin d’exécuter les scripts SQL que si l’authentification passe mais que les tables/RPC (`profiles`, `user_app_state`, `sync_profile_progress`, etc.) n’existent pas encore.

### Erreur `PGRST205: Could not find the table 'public.user_reward_state'`

Si Supabase renvoie `Could not find the table 'public.user_reward_state' in the schema cache`, cela signifie que la migration de normalisation n’a pas encore été appliquée sur la base distante. Exécute au minimum :

1. `supabase/user_app_state.sql`
2. `supabase/user_state_normalization.sql`

En attendant, l’application retombe automatiquement sur le stockage local/legacy pour les récompenses, mais la correction définitive est bien côté SQL.

## 🔄 Stratégie de sync locale/distante

L’app suit maintenant un modèle **local first + sync ciblée** :

- les écritures UI continuent de passer d’abord par `AsyncStorage` pour garder l’app réactive hors-ligne ;
- `user_app_state.storage` reste la source de compatibilité legacy, sans suppression brutale ;
- en parallèle, les états les plus importants sont progressivement dupliqués dans des tables dédiées (`user_preferences`, `verse_progress`, `user_quiz_stats`, `user_streak_state`, `user_reward_state`) ;
- une queue locale rejoue les synchronisations ciblées quand Supabase redevient disponible ;
- les événements métier (`verse_review_events`, `quiz_attempts`, `streak_events`, `reward_events`) sont ajoutés en append-only pour l’analyse produit/UX ;
- la résolution de conflit reste volontairement simple : **last-write-wins par scope métier**, à partir de `client_updated_at`, avec priorité au local tant qu’une mutation locale n’a pas encore été flushée.

Cette approche évite le big bang : le blob legacy reste présent tant que la migration n’est pas considérée comme sûre.
