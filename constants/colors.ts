import type { Theme } from '../types/database';

export const lightColors = {
  background: "#F9FAFB",
  cardBackground: "#FFFFFF",
  text: "#111827",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  border: "#E5E7EB",
  primary: "#4F46E5",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#06B6D4",
  purple: "#8B5CF6",
};

export const darkColors = {
  background: "#111827",
  cardBackground: "#1F2937",
  text: "#F9FAFB",
  textSecondary: "#D1D5DB",
  textTertiary: "#9CA3AF",
  border: "#374151",
  primary: "#6366F1",
  success: "#34D399",
  warning: "#FBBF24",
  error: "#F87171",
  info: "#22D3EE",
  purple: "#A78BFA",
};

export const neonColors = {
  background: "#090A1A",
  cardBackground: "#12152A",
  text: "#F5F3FF",
  textSecondary: "#C4B5FD",
  textTertiary: "#67E8F9",
  border: "#312E81",
  primary: "#8B5CF6",
  success: "#22D3EE",
  warning: "#F59E0B",
  error: "#FB7185",
  info: "#06B6D4",
  purple: "#A855F7",
};

export const oceanColors = {
  background: "#E6F4F8",
  cardBackground: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#334155",
  textTertiary: "#64748B",
  border: "#CDE7F0",
  primary: "#0EA5E9",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#06B6D4",
  purple: "#8B5CF6",
};

export const forestColors = {
  background: "#F0F7F2",
  cardBackground: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#355E3B",
  textTertiary: "#6B8F71",
  border: "#D8E6DD",
  primary: "#16A34A",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#DC2626",
  info: "#059669",
  purple: "#7C3AED",
};

export const sunsetColors = {
  background: "#FFF4ED",
  cardBackground: "#FFFFFF",
  text: "#1F2937",
  textSecondary: "#6B4B3A",
  textTertiary: "#A16250",
  border: "#FED7C3",
  primary: "#F97316",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#FB7185",
  purple: "#8B5CF6",
};

export const lavenderColors = {
  background: "#F5F3FF",
  cardBackground: "#FFFFFF",
  text: "#1F2937",
  textSecondary: "#6B5B95",
  textTertiary: "#9A8AC3",
  border: "#E9D5FF",
  primary: "#8B5CF6",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#A78BFA",
  purple: "#7C3AED",
};

export const roseColors = {
  background: "#FFF1F2",
  cardBackground: "#FFFFFF",
  text: "#1F2937",
  textSecondary: "#7F1D1D",
  textTertiary: "#C56C6C",
  border: "#FBCFE8",
  primary: "#F43F5E",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#E11D48",
  info: "#FB7185",
  purple: "#9333EA",
};

export const amberColors = {
  background: "#FFFBEB",
  cardBackground: "#FFFFFF",
  text: "#1F2937",
  textSecondary: "#92400E",
  textTertiary: "#B45309",
  border: "#FDE68A",
  primary: "#F59E0B",
  success: "#10B981",
  warning: "#F97316",
  error: "#DC2626",
  info: "#FBBF24",
  purple: "#7C3AED",
};

export const emeraldColors = {
  background: "#ECFDF5",
  cardBackground: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#065F46",
  textTertiary: "#6B7280",
  border: "#A7F3D0",
  primary: "#10B981",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#14B8A6",
  purple: "#8B5CF6",
};

export const slateColors = {
  background: "#F8FAFC",
  cardBackground: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#475569",
  textTertiary: "#94A3B8",
  border: "#E2E8F0",
  primary: "#334155",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#0EA5E9",
  purple: "#7C3AED",
};

export const midnightColors = {
  background: "#0B1120",
  cardBackground: "#111827",
  text: "#E2E8F0",
  textSecondary: "#94A3B8",
  textTertiary: "#64748B",
  border: "#1F2937",
  primary: "#38BDF8",
  success: "#34D399",
  warning: "#FBBF24",
  error: "#F87171",
  info: "#22D3EE",
  purple: "#A78BFA",
};

export const sandColors = {
  background: "#FFFBF5",
  cardBackground: "#FFFFFF",
  text: "#1F2937",
  textSecondary: "#7C6F64",
  textTertiary: "#A8A29E",
  border: "#F3E8D3",
  primary: "#C08454",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#F97316",
  purple: "#8B5CF6",
};

export const themeColors: Record<Theme, typeof lightColors> = {
  light: lightColors,
  dark: darkColors,
  neon: neonColors,
  ocean: oceanColors,
  forest: forestColors,
  sunset: sunsetColors,
  lavender: lavenderColors,
  rose: roseColors,
  amber: amberColors,
  emerald: emeraldColors,
  slate: slateColors,
  midnight: midnightColors,
  sand: sandColors,
};

export type ColorScheme = typeof lightColors;

export function getColors(theme: Theme): ColorScheme {
  return themeColors[theme] || lightColors;
}

export function getThemeBackgroundGradient(theme: Theme): readonly [string, string, string] | null {
  if (theme === 'neon') {
    return ['#0B102B', '#1B1559', '#0E7490'];
  }

  return null;
}

export function getThemeButtonGradient(theme: Theme): readonly [string, string] | null {
  if (theme === 'neon') {
    return ['#A855F7', '#06B6D4'];
  }

  return null;
}
