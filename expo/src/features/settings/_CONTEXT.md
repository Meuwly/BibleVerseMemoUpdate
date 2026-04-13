# Module: settings

## Rôle
Préférences utilisateur : apparence, audio/TTS, langues, mémorisation, notifications, compte, polls.

## Fichiers

### Sections UI
| Fichier | Rôle |
|---|---|
| `SettingsAccountSection.tsx` | Compte (email, mot de passe, déconnexion) |
| `SettingsAppearanceSections.tsx` | Thème, taille police, mode dyslexie |
| `SettingsAudioSection.tsx` | Paramètres TTS (voix, vitesse) |
| `SettingsLanguageSection.tsx` | Langue de l'app + éditions bibliques |
| `SettingsMemorizationSection.tsx` | Paramètres SRS (mode, difficulté) |
| `SettingsNotificationsSection.tsx` | Rappels quotidiens |
| `SettingsPollSection.tsx` | Participation aux polls communautaires |
| `SettingsSupportSection.tsx` | Aide / support |

### Hooks
| Fichier | Rôle |
|---|---|
| `useSettingsAuth.ts` | Actions auth depuis les settings |
| `useSettingsTts.ts` | Gestion état TTS |
| `useCustomVersionImport.ts` | Import de versions bibliques personnalisées |

### Autres
| Fichier | Rôle |
|---|---|
| `SettingsCollapsibleSection.tsx` | Wrapper section pliable/dépliable |
| `SettingsModals.tsx` | Modals (confirmation suppression compte, etc.) |
| `styles.ts` | Styles du module |
