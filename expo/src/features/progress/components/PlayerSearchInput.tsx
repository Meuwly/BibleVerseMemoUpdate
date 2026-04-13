import { TextInput } from 'react-native';
import { styles } from '../styles';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  colors: {
    border: string;
    text: string;
    background: string;
    textSecondary: string;
  };
};

export function PlayerSearchInput({ value, onChangeText, placeholder, colors }: Props) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      style={[styles.searchInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
    />
  );
}
