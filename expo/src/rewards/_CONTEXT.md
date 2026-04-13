# Module: rewards (moteur)

## Rôle
Moteur de gamification : calcul des récompenses, règles, XP, streaks, vitrail.

## Fichiers
| Fichier | Rôle |
|---|---|
| `RewardEngine.ts` | Calcul central des récompenses selon actions utilisateur |
| `rules.ts` | Définition des règles de déclenchement (seuils XP, streaks, milestones) |
| `selectors.ts` | Sélecteurs sur l'état rewards |
| `types.ts` | Types partagés : `RewardEvent`, `MilestoneReward`, `SurpriseReward`, etc. |
| `rewardCopy.ts` | Textes/messages associés aux récompenses |
| `vitrail.ts` | Logique spécifique au système de récompense "vitrail" |
| `useRewardsSettings.ts` | Hook préférences rewards utilisateur |

## UI des rewards
→ `src/components/rewards/` (composants visuels)
→ `src/features/learn/LearnRewardOverlays.tsx` (intégration dans la session learn)

## Persistance
→ `src/storage/rewardsRepo.ts` + `src/storage/migrations.ts`
