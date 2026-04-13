# Module: progress

## Rôle
Suivi de la progression utilisateur : stats, streaks, XP, défis, leaderboard, social.

## Fichiers

### Composants UI
| Fichier | Rôle |
|---|---|
| `ProgressOverviewSection.tsx` | Vue principale des stats (versets appris, streak, XP) |
| `LeaderboardSection.tsx` | Classement des joueurs |
| `PlayerSearchInput.tsx` | Recherche de joueurs |
| `SocialInteractionsSection.tsx` | Interactions amis (demandes, stats) |
| `XpChallengesSection.tsx` | Affichage et gestion des défis XP |
| `ShareProgressCard.tsx` | Carte de progression partageable |

### Hooks
| Fichier | Rôle |
|---|---|
| `useActiveXpChallenge.ts` | State du défi XP actif |
| `useFriendChallengeStats.ts` | Stats des défis entre amis |

### Autres
| Fichier | Rôle |
|---|---|
| `types.ts` | `LeaderboardPlayer`, `FriendChallengeStats`, `ProgressOverviewStats` |
| `styles.ts` | Styles du module |

## Dépendances
- `features/auth/leaderboardService.ts` — API classement
- `features/auth/socialService.ts` — API amis
- `src/srs/` — données SRS pour les stats
