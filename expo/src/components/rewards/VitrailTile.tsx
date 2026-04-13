import { StyleSheet, Text, View } from 'react-native';
import type { MasteryStage, VitrailTileState } from '../../rewards/types';
import { getMasteryStage } from '../../rewards/rules';
import { vitrailPalette } from '../../rewards/vitrail';

interface VitrailTileProps {
  tile: VitrailTileState;
  label: string;
}

export function VitrailTile({ tile, label }: VitrailTileProps) {
  const stage: MasteryStage = getMasteryStage(tile.masteryLevel);
  const palette = vitrailPalette[stage];

  return (
    <View style={[styles.tile, { backgroundColor: palette.base, borderColor: tile.special ? '#FACC15' : palette.glow }]}> 
      <Text style={styles.label}>{label}</Text>
      {tile.special ? <Text style={styles.special}>✧</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 72,
    height: 72,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  special: {
    fontSize: 12,
    color: '#FEF08A',
  },
});
