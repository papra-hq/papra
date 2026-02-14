import type { ScanOutputFormat } from '../documents-scan.types';
import type { ThemeColors } from '@/modules/ui/theme.constants';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';

type DocumentNameInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  format: ScanOutputFormat;
};

function getFileExtension(format: ScanOutputFormat): string {
  return format === 'images' ? '.jpg' : '.pdf';
}

export function DocumentNameInput({ value, onChangeText, format }: DocumentNameInputProps) {
  const themeColors = useThemeColor();
  const styles = createStyles({ themeColors });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Document name</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder="Enter document name"
          placeholderTextColor={themeColors.mutedForeground}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.suffix}>{getFileExtension(format)}</Text>
      </View>

    </View>
  );
}

function createStyles({ themeColors }: { themeColors: ThemeColors }) {
  return StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.foreground,
      marginBottom: 8,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',

      backgroundColor: themeColors.secondaryBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: themeColors.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
      color: themeColors.foreground,
    },
    input: {
      fontSize: 16,
      padding: 0,
      margin: 0,
      color: themeColors.foreground,
    },
    suffix: {
      color: themeColors.mutedForeground,
    },

  });
}
