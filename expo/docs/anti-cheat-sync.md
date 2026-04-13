# Anti-cheat sync (XP / Streak / XP challenges)

Pour limiter la triche (ex: modification mémoire locale via Cheat Engine), la synchro passe désormais par des garde-fous SQL côté serveur:

- Fonction RPC: `public.sync_profile_progress`
- Script à exécuter dans Supabase SQL Editor: `supabase/secure_profile_sync.sql`
- Scripts à garder alignés: `supabase/base_schema.sql` et `supabase/xp_challenge_requests.sql`

## Pourquoi

Les valeurs locales (XP, streak, compteurs) peuvent être modifiées sur l'appareil. Le serveur doit rester la source de vérité et **borner** les augmentations.

Les défis XP sont aussi sensibles: un client modifié pouvait tenter d'injecter des valeurs de départ ou de changer des statuts arbitraires. Ces métadonnées doivent également être calculées côté serveur.

## Ce que fait la fonction

- Normalise toutes les entrées en entiers >= 0.
- N'autorise que de petites augmentations par sync (`verses_completed`, `quizzes_completed`).
- Limite l'augmentation d'XP en fonction de la progression réelle.
- Empêche les sauts de streak (max +1 par sync).
- Ne permet jamais de diminuer les stats.
- Bloque les mises à jour directes de stats sur `public.profiles` hors RPC sécurisé.
- Force l'acceptation d'un défi XP à récupérer les XP / versets de départ depuis `public.profiles`.
- Interdit les transitions de statut invalides et le détournement des champs serveur dans `public.xp_challenge_requests`.
- Empêche plusieurs défis actifs/pending en parallèle pour la même paire de joueurs.

## Déploiement

1. Ouvrir Supabase SQL Editor.
2. Exécuter `supabase/base_schema.sql` si la base n'est pas déjà alignée.
3. Exécuter `supabase/secure_profile_sync.sql`.
4. Exécuter `supabase/xp_challenge_requests.sql`.
5. Redémarrer l'app.

## Vérification rapide

- Faire une session normale: la progression doit continuer à se synchroniser.
- Forcer localement une grosse valeur d'XP/streak, puis sync: le serveur doit renvoyer une valeur bornée.
- Tenter une mise à jour directe de `profiles.total_xp`: elle doit être refusée.
- Accepter un défi XP avec des `challenger_start_xp` / `opponent_start_xp` forgés: la base doit recalculer les valeurs serveur.
