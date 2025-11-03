import type { ThemeColors } from '@/modules/ui/theme.constants';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '@/modules/ui/components/icon';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';
import { useOrganizations } from '../organizations.provider';

type OrganizationPickerButtonProps = {
  onPress: () => void;
};

export function OrganizationPickerButton({ onPress }: OrganizationPickerButtonProps) {
  const themeColors = useThemeColor();
  const { organizations, currentOrganizationId } = useOrganizations();

  const styles = createStyles({ themeColors });

  const currentOrganization = organizations.find(org => org.id === currentOrganizationId);

  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <View style={styles.content}>
        <Text style={styles.orgName} numberOfLines={1}>
          {currentOrganization?.name ?? 'Select Organization'}
        </Text>
      </View>
      <Icon name="chevron-down" style={styles.caret} size={20} />
    </TouchableOpacity>
  );
}

function createStyles({ themeColors }: { themeColors: ThemeColors }) {
  return StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: themeColors.secondaryBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    content: {
      flex: 1,
      marginRight: 8,
    },
    label: {
      fontSize: 12,
      color: themeColors.mutedForeground,
      marginBottom: 2,
    },
    orgName: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.foreground,
    },
    caret: {
      color: themeColors.mutedForeground,
    },
  });
}
