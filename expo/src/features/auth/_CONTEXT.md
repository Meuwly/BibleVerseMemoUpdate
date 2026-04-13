# Module: auth

## Rôle
Authentification Supabase, profil utilisateur, social (amis, défis), services API.

## Fichiers

### Hooks
| Fichier | Rôle |
|---|---|
| `useAuthSession.ts` | Gestion session auth (login, logout, token refresh) |
| `useProfileState.ts` | State du profil utilisateur courant |
| `useSocialState.ts` | State social (amis, demandes en attente) |

### Services (API Supabase)
| Fichier | Rôle |
|---|---|
| `profileService.ts` | CRUD profil utilisateur |
| `leaderboardService.ts` | Récupération classement |
| `socialService.ts` | Gestion amis/demandes |
| `quizChallengeService.ts` | Opérations quiz challenge |
| `xpChallengeResultService.ts` | Résultats défis XP |

### Autres
| Fichier | Rôle |
|---|---|
| `types.ts` | `UserProfile`, `LeaderboardEntry`, `FriendRequest`, `SyncProgressPayload` |

## Client Supabase
→ `src/lib/supabase.ts` (initialisation, secure storage, retry, fixes réseau)
→ `src/lib/authValidation.ts` (validation côté client)

## Contexte auth global
→ `contexts/AuthContext.tsx` expose le state auth à toute l'app
