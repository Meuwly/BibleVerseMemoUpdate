import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MilestoneModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  ctaLabel: string;
}

export function MilestoneModal({ visible, title, subtitle, onClose, backgroundColor, textColor, accentColor, ctaLabel }: MilestoneModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor }]}> 
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: textColor }]}>{subtitle}</Text> : null}
          <TouchableOpacity style={[styles.button, { backgroundColor: accentColor }]} onPress={onClose}>
            <Text style={styles.buttonText}>{ctaLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
