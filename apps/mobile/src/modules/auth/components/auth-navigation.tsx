import { StyleSheet, View } from 'react-native';
import { AppSettingsButton } from '@/modules/app-settings/components/app-settings-button';
import { BackToServerSelectionButton } from './back-to-server-selection';

export function AuthNavigation({ disabled = false }: { disabled?: boolean }) {
  return (
    <View style={styles.navigation}>
      <BackToServerSelectionButton disabled={disabled} />
      <AppSettingsButton disabled={disabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
  },
});
