import type { ThemeColors } from '@/modules/ui/theme.constants';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';

type TagProps = {
  name: string;
  color?: string;
};

export function Tag({ name, color }: TagProps) {
  const themeColors = useThemeColor();
  const styles = createStyles({ themeColors });

  return (
    <View style={styles.tag}>
      {color !== undefined && <View style={[styles.tagDot, { backgroundColor: color }]} />}
      <Text style={styles.tagText}>{name}</Text>
    </View>
  );
}

function createStyles({ themeColors }: { themeColors: ThemeColors }) {
  return StyleSheet.create({
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: themeColors.muted,
    },
    tagDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    tagText: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 12,
      color: themeColors.mutedForeground,
    },
  });
}
