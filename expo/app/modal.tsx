import { StyleSheet, Text, View, Modal, TouchableOpacity, Linking, Pressable, Platform } from 'react-native';
import { useState } from 'react';
import { Heart, X } from 'lucide-react-native';
import { useSupportModal } from '../contexts/SupportModalContext';
import { useApp } from '../contexts/AppContext';
import { getColors } from '../constants/colors';

interface SupportModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SupportModal({ visible, onClose }: SupportModalProps) {
  const { theme } = useApp();
  const { markAsDonated, dismissModal } = useSupportModal();
  const colors = getColors(theme);
  const [isChecked, setIsChecked] = useState(false);
  const isIos = Platform.OS === 'ios';

  const handleDonate = async () => {
    try {
      await Linking.openURL('https://timprojects.online/donate');
    } catch (error) {
      console.error('[SupportModal] Error opening donation link:', error);
    }
    if (isChecked) {
      await markAsDonated();
    } else {
      await dismissModal();
    }
    onClose();
  };

  const handleLater = async () => {
    if (isChecked) {
      await markAsDonated();
    } else {
      await dismissModal();
    }
    onClose();
  };

  if (isIos) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleLater}
    >
      <Pressable style={styles.backdrop} onPress={handleLater}>
        <Pressable style={[styles.container, { backgroundColor: colors.cardBackground }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Heart color={colors.primary} size={32} fill={colors.primary} />
          </View>

          <Text style={[styles.message, { color: colors.text }]}>
            Bible Verse Memo est 100% gratuit et sans publicités, si vous voulez me soutenir, pensez à faire un petit don!
          </Text>

          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, { backgroundColor: colors.primary, marginBottom: 12 }]}
            onPress={() => handleDonate()}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
              Faire un don
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setIsChecked(!isChecked)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, { borderColor: colors.border, backgroundColor: isChecked ? colors.primary : colors.background }]}>
              {isChecked && <X color="#FFFFFF" size={16} strokeWidth={3} />}
            </View>
            <Text style={[styles.checkboxLabel, { color: colors.textSecondary }]}>
              J&apos;ai déjà fais un don (Merci &lt;3)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary, { borderColor: colors.border, backgroundColor: colors.background }]}
            onPress={handleLater}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              Plus tard
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 28,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.3)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 10,
        }),
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    alignSelf: 'center' as const,
    marginBottom: 20,
  },
  message: {
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center' as const,
    marginBottom: 24,
    fontWeight: '500' as const,
  },
  checkboxContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  checkboxLabel: {
    fontSize: 15,
    flex: 1,
  },
  buttons: {
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  buttonPrimary: {
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 4,
        }),
  },
  buttonSecondary: {
    borderWidth: 1.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
  },
  donationOptions: {
    maxHeight: 200,
    marginBottom: 16,
  },
  donationGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    justifyContent: 'center' as const,
  },
  donationButton: {
    minWidth: 70,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  donationAmount: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});


export default SupportModal;
