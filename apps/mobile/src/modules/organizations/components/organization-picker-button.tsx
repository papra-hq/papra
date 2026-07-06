import type { ThemeColors } from '@/modules/ui/theme.constants';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '@/modules/ui/components/icon';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';
import { useOrganizations } from '../organizations.provider';

type OrganizationPickerButtonProps = {
  onPress: () => void;
  variant?: 'boxed' | 'plain';
};

export function OrganizationPickerButton({
  onPress,
  variant = 'boxed',
}: OrganizationPickerButtonProps) {
  const themeColors = useThemeColor();
  const { organizations, currentOrganizationId } = useOrganizations();

  const styles = createStyles({ themeColors });

  const currentOrganization = organizations.find((org) => org.id === currentOrganizationId);
  const organizationName = currentOrganization?.name ?? 'Select Organization';

  if (variant === 'plain') {
    return (
      <TouchableOpacity style={styles.plainButton} onPress={onPress}>
        <Icon name="briefcase" size={18} color={themeColors.foreground} />
        <Text style={styles.orgName} numberOfLines={1}>
          {organizationName}
        </Text>
        <Icon name="chevron-down" style={styles.caret} size={18} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <View style={styles.content}>
        <Text style={styles.orgName} numberOfLines={1}>
          {organizationName}
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
    plainButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexShrink: 1,
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
      flexShrink: 1,
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.foreground,
    },
    caret: {
      color: themeColors.mutedForeground,
    },
  });
}
