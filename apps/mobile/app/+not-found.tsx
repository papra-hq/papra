import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useAppTranslations } from '@/modules/i18n/hooks/use-app-translations';

export default function NotFoundScreen() {
  const t = useAppTranslations();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = createStylesNotFound(isDark);
  return (
    <>
      <Stack.Screen options={{ title: t.navigation.notFoundTitle }} />
      <View style={styles.container}>
        <Text style={styles.title}>{t.navigation.notFoundMessage}</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>{t.navigation.goHome}</Text>
        </Link>
      </View>
    </>
  );
}

export function createStylesNotFound(isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
      color: isDark ? '#fff' : '#000',
    },
    link: {
      marginTop: 15,
      paddingVertical: 15,
    },
    linkText: {
      fontSize: 14,
      color: '#007AFF',
    },
  });
}
