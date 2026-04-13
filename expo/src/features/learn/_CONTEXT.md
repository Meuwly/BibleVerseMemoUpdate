# Module: learn

## Rôle
Gère la session d'apprentissage/mémorisation de versets (quiz, validation, TTS, rewards).

## Fichiers

### Composants
| Fichier | Rôle |
|---|---|
| `LearnExerciseCard.tsx` | Composant central : affiche verset masqué/complet, contrôles TTS, hints, progress mastery, panel comparaison. Modes : `guess-verse` et `reference-lookup` |
| `LearnFeedbackPanel.tsx` | Feedback validation (correct/incorrect), erreurs, boutons retry/next |
| `LearnHeaderActions.tsx` | Header : badge XP + label édition de comparaison (`EN • FR`), ouvre ComparisonSheet |
| `LearnComparisonSheet.tsx` | Modal sélection édition principale et de comparaison (multi-langue) |
| `LearnRewardOverlays.tsx` | Overlays de récompenses : toasts, modals milestone, gratitude pause, ShareableVerseCard |

### Hooks
| Fichier | Rôle |
|---|---|
| `useLearnVerse.ts` | Charge le verset + navigation prev/next, gère éditions principale/comparaison, via `utils/database` |
| `useLearnValidation.ts` | Valide la réponse utilisateur (dyslexia-friendly), détecte paste, retourne précision/multiplicateur XP |
| `useLearnTts.ts` | TTS via `utils/tts`, state `isSpeaking`, settings (vitesse, voix) |
| `useLearnRewards.ts` | Orchestration rewards (micro, milestones, surprises), timing animations rocket |

### Autres
| Fichier | Rôle |
|---|---|
| `styles.ts` | 50+ classes StyleSheet centralisées |

## Dépendances externes
- `src/srs/` → scheduling SRS
- `src/rewards/` → types et moteur rewards
- `src/components/rewards/` → UI des overlays
- `src/utils/text-validation` → matching dyslexia-friendly
- `src/utils/tts` → synthèse vocale
- `src/utils/database` → récupération versets

## Types clés
`Verse`, `VerseProgress`, `LearningMode`, `DyslexiaSettings`, `LearningSettings`, `ValidationSettings`, `TTSSettings`, `AppearanceSettings`
