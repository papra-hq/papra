import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { IconSymbol } from '@/modules/ui/components/icon-symbol';
import { ThemedText } from '@/modules/ui/components/themed-text';
import { ThemedView } from '@/modules/ui/components/themed-view';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  content: {
    marginTop: 6,
    marginLeft: 24,
  },
});

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const colors = useThemeColor();

  return (
    <ThemedView>
      <TouchableOpacity
        style={styles.heading}
        onPress={() => setIsOpen(value => !value)}
        activeOpacity={0.8}
      >
        <IconSymbol
          name="chevron.right"
          size={18}
          weight="medium"
          color={colors.foreground}
          style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
        />

        <ThemedText type="defaultSemiBold">{title}</ThemedText>
      </TouchableOpacity>
      {isOpen && <ThemedView style={styles.content}>{children}</ThemedView>}
    </ThemedView>
  );
}
