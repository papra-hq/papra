import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { useAppTranslations } from '@/modules/i18n/hooks/use-app-translations';
import { ThemedText } from '@/modules/ui/components/themed-text';
import { ThemedView } from '@/modules/ui/components/themed-view';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});

export default function ModalScreen() {
  const t = useAppTranslations();
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{t.navigation.modalMessage}</ThemedText>
      <Link href="/" dismissTo style={styles.link}>
        <ThemedText type="link">{t.navigation.goHome}</ThemedText>
      </Link>
    </ThemedView>
  );
}
