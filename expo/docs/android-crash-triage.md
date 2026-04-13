# Android crash triage (Expo / React Native)

## Cause identifiée pour ce projet

Le crash Android observé au lancement est causé par un **mismatch de versions React**:

- `react`: `19.1.2`
- `react-native-renderer`: `19.1.0`

React impose des versions strictement identiques entre `react` et `react-native-renderer`.

Symptômes typiques dans `adb logcat`:

- `ReactNativeJS: Incompatible React versions`
- `AndroidRuntime: FATAL EXCEPTION`
- `JavascriptException` avec la même erreur de versions

Les autres logs de type `QTI PowerHAL`, `WifiHAL`, `ANDR-PERF-LM` sont généralement du bruit système et ne sont pas la cause du crash applicatif.

---

## Correction recommandée

1. Aligner les versions React/RN via l'outil Expo:

```bash
npx expo install --fix
```

2. Si nécessaire, forcer une version React compatible Expo SDK installée:

```bash
npx expo install react react-dom react-native
```

3. Nettoyer le cache Metro et relancer:

```bash
npx expo start -c
```

4. Rebuild Android (dev build / release) puis retester.

---

## Commandes utiles de diagnostic

Filtrer les logs importants:

```bash
adb logcat -c
adb logcat *:E ReactNativeJS:V AndroidRuntime:E
```

Filtrer uniquement le process de l'app:

```bash
adb shell pidof online.timprojects.bibleversememo
adb logcat --pid $(adb shell pidof online.timprojects.bibleversememo)
```

---

## Checklist rapide

- [ ] `react` est aligné avec l'écosystème Expo SDK
- [ ] `npx expo install --fix` exécuté
- [ ] cache Metro vidé (`expo start -c`)
- [ ] build Android regénéré
- [ ] plus de `Incompatible React versions` dans logcat
