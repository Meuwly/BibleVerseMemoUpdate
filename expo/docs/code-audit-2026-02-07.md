# Audit technique du code — 2026-02-07

## Portée
Analyse statique de l'application (structure Expo/React Native + couche utilitaires/rewards), avec vérifications automatiques (`expo lint`, `tsc --noEmit`).

## Problèmes détectés

### 1) Incohérence de version biblique custom (bug logique)
- **Fichiers:** `contexts/AppContext.tsx`, `utils/database.ts`
- **Constat:** `setCustomVersionUrl(versionName, content)` ignore `versionName` et stocke uniquement le texte dans `@custom_version`; `parseBibleFile` lit ce même singleton pour toutes les langues `CUSTOM_*`.
- **Risque:** si l'utilisateur importe plusieurs versions custom, la langue persistée (`CUSTOM_...`) peut pointer vers un autre contenu que celui attendu après redémarrage.
- **Correction proposée:** stocker un objet indexé par `versionName` (`{ [versionName]: content }`) et charger la bonne entrée.

### 2) Parsing JSON fragile au chargement des settings
- **Fichier:** `contexts/AppContext.tsx`
- **Constat:** `JSON.parse(...)` est appelé en chaîne dans un même `try` global.
- **Risque:** une seule valeur corrompue invalide tout le chargement des préférences.
- **Correction proposée:** introduire un `safeParse(value, fallback)` par clé pour isoler les erreurs.

### 3) Condition de concurrence sur le compteur de versets
- **Fichier:** `contexts/SupportModalContext.tsx`
- **Constat:** `incrementCompletedVerses` fait `completedVersesCount + 1` à partir d'un state potentiellement obsolète.
- **Risque:** pertes d'incréments si plusieurs complétions arrivent rapidement.
- **Correction proposée:** utiliser un verrou léger ou un `setState(prev => prev + 1)` combiné à une persistance atomique.

### 4) Double orchestration des notifications
- **Fichiers:** `app/(tabs)/settings.tsx`, `contexts/AppContext.tsx`, `utils/notifications.ts`
- **Constat:** le scheduling est déclenché à la fois depuis l'écran Settings et via l'effet de sync global dans `AppContext`.
- **Risque:** appels redondants, annulations/replanifications inutiles, comportement instable selon timing.
- **Correction proposée:** centraliser l'orchestration dans `AppContext` et laisser Settings ne modifier que l'état.

### 5) `cancelAllScheduledNotificationsAsync()` trop agressif
- **Fichier:** `utils/notifications.ts`
- **Constat:** toute reprogrammation annule *toutes* les notifications.
- **Risque:** suppression d'autres notifications de l'app (ou futurs canaux métiers).
- **Correction proposée:** stocker les IDs planifiés et annuler uniquement ceux de la feature rappel biblique.

### 6) Câblage de handler notifications dupliqué
- **Fichier:** `utils/notifications.ts`
- **Constat:** `setNotificationHandler` est appelé au module init, dans `initNotifications`, puis dans `requestNotificationPermissions`.
- **Risque:** duplication inutile, maintenance difficile.
- **Correction proposée:** factoriser en fonction unique appelée une fois au bootstrap.

### 7) Paramètre de maîtrise non exploité
- **Fichiers:** `types/database.ts`, `app/learn/[book]/[chapter]/[verse].tsx`
- **Constat:** `learningSettings.maxMasteryLevel` existe, mais l'incrément est plafonné en dur à `5`.
- **Risque:** paramètre UI trompeur, incohérence fonctionnelle.
- **Correction proposée:** remplacer le `5` codé en dur par `learningSettings.maxMasteryLevel` (ou retirer le paramètre s'il est volontairement figé).

### 8) Validation textuelle coûteuse en mémoire
- **Fichier:** `utils/text-validation.ts`
- **Constat:** Levenshtein construit une matrice 2D complète.
- **Risque:** consommation mémoire élevée sur longues chaînes.
- **Correction proposée:** version à 2 lignes glissantes (rolling arrays), complexité mémoire O(min(n,m)).

### 9) Logs verbeux exposant des données texte
- **Fichier:** `utils/database.ts` (+ plusieurs écrans)
- **Constat:** logs de contenu (`First 500 chars`, références détaillées, etc.).
- **Risque:** bruit en prod, perf, fuite potentielle de données utilisateur dans logs distants.
- **Correction proposée:** encapsuler derrière un flag debug (`__DEV__`) + éviter d'imprimer les contenus complets.

### 10) Chargement d'URL custom sans garde-fous
- **Fichier:** `app/(tabs)/settings.tsx`
- **Constat:** `fetch(customUrl)` sans validation de schéma/hôte/timeout/taille max.
- **Risque sécurité:** téléchargement de contenu inattendu/énorme, UX dégradée.
- **Correction proposée:** exiger `https://`, timeout via `AbortController`, limite de taille et validation de format plus stricte.

## Observations architecture
- La logique métier rewards est bien isolée (`src/rewards/*`) et testable.
- Les contextes mélangent état, persistance et effets IO; un service dédié (SettingsRepository + NotificationService) améliorerait SOLID (SRP).
