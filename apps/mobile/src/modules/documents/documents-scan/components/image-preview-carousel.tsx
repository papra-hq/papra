import type { ThemeColors } from '@/modules/ui/theme.constants';
import { useState } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, View } from 'react-native';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';

type ImagePreviewCarouselProps = {
  imageUris: string[];
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH - 48; // 24px padding on each side

export function ImagePreviewCarousel({ imageUris }: ImagePreviewCarouselProps) {
  const themeColors = useThemeColor();
  const styles = createStyles({ themeColors });
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / IMAGE_WIDTH);
    setActiveIndex(index);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={imageUris}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={IMAGE_WIDTH}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.imageContainer}>
            <Image source={{ uri: item }} style={styles.image} resizeMode="contain" />
          </View>
        )}
      />

      {imageUris.length > 1 && (
        <View style={styles.dotsContainer}>
          {imageUris.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function createStyles({ themeColors }: { themeColors: ThemeColors }) {
  return StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    listContent: {
      paddingHorizontal: 0,
    },
    imageContainer: {
      width: IMAGE_WIDTH,
      height: 280,
      backgroundColor: themeColors.secondaryBackground,
      borderRadius: 12,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    dotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 12,
      gap: 8,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: themeColors.border,
    },
    dotActive: {
      backgroundColor: themeColors.primary,
      width: 20,
    },
  });
}
