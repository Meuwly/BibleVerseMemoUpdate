import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface GratitudePauseModalProps {
  visible: boolean;
  title: string;
  body: string;
  prayerLine?: string;
  onClose: () => void;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  ctaLabel: string;
}

export function GratitudePauseModal({ visible, title, body, prayerLine, onClose, backgroundColor, textColor, accentColor, ctaLabel }: GratitudePauseModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor }]}> 
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          <Text style={[styles.body, { color: textColor }]}>{body}</Text>
          {prayerLine ? <Text style={[styles.prayer, { color: textColor }]}>{prayerLine}</Text> : null}
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
    gap: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  prayer: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
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
