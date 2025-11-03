import type { ThemeColors } from '@/modules/ui/theme.constants';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from '@/modules/ui/components/icon';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';
import { useOrganizations } from '../organizations.provider';

type OrganizationPickerDrawerProps = {
  visible: boolean;
  onClose: () => void;
};

export function OrganizationPickerDrawer({ visible, onClose }: OrganizationPickerDrawerProps) {
  const themeColors = useThemeColor();
  const router = useRouter();
  const { organizations, currentOrganizationId, setCurrentOrganizationId, isLoading } = useOrganizations();

  const styles = createStyles({ themeColors });

  const handleSelectOrganization = async (organizationId: string) => {
    await setCurrentOrganizationId(organizationId);
    onClose();
  };

  const handleCreateOrganization = () => {
    onClose();
    router.push('/(app)/(with-organizations)/organizations/create');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.drawer}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Organization</Text>
          </View>

          {isLoading
            ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={themeColors.primary} />
                </View>
              )
            : (
                <FlatList
                  data={organizations}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.orgItem,
                        item.id === currentOrganizationId && styles.orgItemSelected,
                      ]}
                      onPress={() => {
                        void handleSelectOrganization(item.id);
                      }}
                    >
                      <Text
                        style={[
                          styles.orgName,
                          item.id === currentOrganizationId && styles.orgNameSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {item.id === currentOrganizationId && (
                        <Icon name="check" style={styles.checkmark} />
                      )}
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={styles.listContent}
                />
              )}

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateOrganization}
          >
            <Text style={styles.createButtonText}>+ Create New Organization</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function createStyles({ themeColors }: { themeColors: ThemeColors }) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    drawer: {
      backgroundColor: themeColors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '70%',
      paddingBottom: 20,
    },
    header: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.foreground,
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
    },
    listContent: {
      paddingVertical: 8,
    },
    orgItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    orgItemSelected: {
      backgroundColor: themeColors.secondaryBackground,
    },
    orgName: {
      fontSize: 16,
      color: themeColors.foreground,
    },
    orgNameSelected: {
      fontWeight: '600',
      color: themeColors.primary,
    },
    checkmark: {
      fontSize: 18,
      color: themeColors.primary,
      fontWeight: 'bold',
    },
    createButton: {
      margin: 20,
      marginTop: 0,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 8,
      alignItems: 'center',
    },
    createButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.primary,
    },
  });
}
