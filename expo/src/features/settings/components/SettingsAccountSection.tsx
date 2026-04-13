import { Cloud, LogIn, LogOut, User } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

import type { ColorScheme } from '../../../../constants/colors';
import { settingsStyles } from '../styles';

interface SettingsAccountSectionProps {
  colors: ColorScheme;
  accountLabel: string;
  loginToSyncLabel: string;
  loginSignUpLabel: string;
  logoutLabel: string;
  syncLabel: string;
  syncLoadingLabel: string;
  username: string | null;
  email: string | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  onOpenAuth: () => void;
  onSyncNow: () => void;
  onSignOut: () => void;
}

export function SettingsAccountSection({
  colors,
  accountLabel,
  loginToSyncLabel,
  loginSignUpLabel,
  logoutLabel,
  syncLabel,
  syncLoadingLabel,
  username,
  email,
  isAuthenticated,
  authLoading,
  onOpenAuth,
  onSyncNow,
  onSignOut,
}: SettingsAccountSectionProps) {
  return (
    <View style={settingsStyles.section}>
      <View style={settingsStyles.sectionHeader}>
        <View style={settingsStyles.sectionTitleRow}>
          <LogIn color={colors.primary} size={20} />
          <Text style={[settingsStyles.sectionTitle, { color: colors.text }]}>{accountLabel}</Text>
        </View>
      </View>

      {isAuthenticated ? (
        <View>
          <View style={[settingsStyles.accountCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={settingsStyles.accountCardRow}>
              <View style={[settingsStyles.accountAvatar, { backgroundColor: colors.primary + '20' }]}>
                <User color={colors.primary} size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[settingsStyles.accountName, { color: colors.text }]}>{username}</Text>
                <Text style={[settingsStyles.accountEmail, { color: colors.textSecondary }]}>{email}</Text>
              </View>
            </View>
            <View style={settingsStyles.accountActionsRow}>
              <TouchableOpacity
                style={[settingsStyles.accountActionBtn, { backgroundColor: colors.success + '15', borderColor: colors.success }]}
                onPress={onSyncNow}
                disabled={authLoading}
              >
                <Cloud color={colors.success} size={16} />
                <Text style={[settingsStyles.accountActionBtnText, { color: colors.success }]}>
                  {authLoading ? syncLoadingLabel : syncLabel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[settingsStyles.accountActionBtn, { backgroundColor: colors.error + '15', borderColor: colors.error }]}
                onPress={onSignOut}
              >
                <LogOut color={colors.error} size={16} />
                <Text style={[settingsStyles.accountActionBtnText, { color: colors.error }]}>{logoutLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[settingsStyles.accountHint, { color: colors.textSecondary }]}>{loginToSyncLabel}</Text>
        </View>
      ) : (
        <View>
          <TouchableOpacity style={[settingsStyles.authOpenButton, { backgroundColor: colors.primary }]} onPress={onOpenAuth}>
            <LogIn color="#fff" size={20} />
            <Text style={settingsStyles.authOpenButtonText}>{loginSignUpLabel}</Text>
          </TouchableOpacity>
          <Text style={[settingsStyles.accountHint, { color: colors.textSecondary }]}>{loginToSyncLabel}</Text>
        </View>
      )}
    </View>
  );
}
