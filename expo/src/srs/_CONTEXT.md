# Module: srs (Spaced Repetition System)

## Rôle
Algorithme de répétition espacée pour planifier les révisions de versets.

## Fichiers
| Fichier | Rôle |
|---|---|
| `spacedRepetition.ts` | Algorithme SRS : calcul d'état (`VerseSrsState`), ratings de révision, scheduling prochain passage |

## Types clés
- `VerseSrsState` — état SRS d'un verset (intervalle, easiness factor, repetitions)
- `VerseProgress` — progression utilisateur sur un verset

## Utilisé par
- `features/learn/` (validation → mise à jour SRS)
- `features/progress/` (stats globales)
