import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

export default function NotFoundScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = createStylesNotFound(isDark);
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn&apos;t exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen</Text>
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
