import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

export function DocumentsListScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');

  // const handleDeleteDocument = (documentId: string, filename: string) => {
  //   Alert.alert(
  //     'Delete Document',
  //     `Are you sure you want to delete "${filename}"?`,
  //     [
  //       { text: 'Cancel', style: 'cancel' },
  //       {
  //         text: 'Delete',
  //         style: 'destructive',
  //         onPress: () => {},
  //       },
  //     ],
  //   );
  // };

  // const formatFileSize = (bytes: number): string => {
  //   if (bytes === 0) {
  //     return '0 B';
  //   }
  //   const k = 1024;
  //   const sizes = ['B', 'KB', 'MB', 'GB'];
  //   const i = Math.floor(Math.log(bytes) / Math.log(k));
  //   return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  // };

  // const formatDate = (dateString: string): string => {
  //   const date = new Date(dateString);
  //   return date.toLocaleDateString();
  // };

  const styles = createStyles(isDark);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search documents..."
          placeholderTextColor={isDark ? '#666' : '#999'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={[styles.uploadButton]}
        >
          <ActivityIndicator color="#fff" size="small" />
        </TouchableOpacity>
      </View>

      {/* <FlatList
        data={data?.documents ?? []}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.documentCard}>
            <View style={styles.documentInfo}>
              <Text style={styles.documentTitle} numberOfLines={1}>
                {item.title || item.filename}
              </Text>
              <Text style={styles.documentMeta}>
                {formatFileSize(item.size)}
                {' '}
                •
                {formatDate(item.createdAt)}
              </Text>
              {item.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {item.tags.map(tag => (
                    <View
                      key={tag.id}
                      style={[styles.tag, { backgroundColor: tag.color }]}
                    >
                      <Text style={styles.tagText}>{tag.name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteDocument(item.id, item.filename)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyContainer}>
            {isLoading
              ? (
                  <ActivityIndicator size="large" color="#007AFF" />
                )
              : (
                  <>
                    <Text style={styles.emptyText}>No documents found</Text>
                    <Text style={styles.emptySubtext}>Upload your first document to get started</Text>
                  </>
                )}
          </View>
        )}
        refreshControl={(
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={isDark ? '#fff' : '#000'}
          />
        )}
        contentContainerStyle={styles.listContent}
      /> */}
    </View>
  );
}

function createStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000' : '#fff',
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      gap: 12,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#e0e0e0',
    },
    searchInput: {
      flex: 1,
      height: 40,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#ddd',
      borderRadius: 8,
      paddingHorizontal: 12,
      fontSize: 14,
      color: isDark ? '#fff' : '#000',
      backgroundColor: isDark ? '#111' : '#f9f9f9',
    },
    uploadButton: {
      paddingHorizontal: 16,
      height: 40,
      backgroundColor: '#007AFF',
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    uploadButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    listContent: {
      padding: 16,
    },
    documentCard: {
      flexDirection: 'row',
      padding: 16,
      backgroundColor: isDark ? '#111' : '#f9f9f9',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#e0e0e0',
      marginBottom: 12,
      alignItems: 'center',
    },
    documentInfo: {
      flex: 1,
    },
    documentTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 4,
    },
    documentMeta: {
      fontSize: 12,
      color: isDark ? '#999' : '#666',
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8,
    },
    tag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    tagText: {
      fontSize: 11,
      color: '#fff',
      fontWeight: '500',
    },
    deleteButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: isDark ? '#2a1a1a' : '#ffe0e0',
    },
    deleteButtonText: {
      color: isDark ? '#ff6b6b' : '#d32f2f',
      fontSize: 12,
      fontWeight: '600',
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#666' : '#999',
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: isDark ? '#666' : '#999',
      textAlign: 'center',
    },
  });
}
