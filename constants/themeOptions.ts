import type { Theme } from "../types/database";

export const THEME_OPTIONS: { value: Theme; labelKey: string; isPremium: boolean }[] = [
  { value: "light", labelKey: "themeLight", isPremium: false },
  { value: "dark", labelKey: "themeDark", isPremium: false },
  { value: "neon", labelKey: "themeNeon", isPremium: false },
  { value: "ocean", labelKey: "themeOcean", isPremium: false },
  { value: "forest", labelKey: "themeForest", isPremium: false },
  { value: "sunset", labelKey: "themeSunset", isPremium: false },
  { value: "lavender", labelKey: "themeLavender", isPremium: false },
  { value: "rose", labelKey: "themeRose", isPremium: false },
  { value: "amber", labelKey: "themeAmber", isPremium: false },
  { value: "emerald", labelKey: "themeEmerald", isPremium: false },
  { value: "slate", labelKey: "themeSlate", isPremium: false },
  { value: "midnight", labelKey: "themeMidnight", isPremium: false },
  { value: "sand", labelKey: "themeSand", isPremium: false },
];
