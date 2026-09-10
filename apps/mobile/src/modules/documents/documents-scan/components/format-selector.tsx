import type { ScanOutputFormat } from '../documents-scan.types';
import type { IconName } from '@/modules/ui/components/icon';
import type { ThemeColors } from '@/modules/ui/theme.constants';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTranslations } from '@/modules/i18n/hooks/use-app-translations';
import { Icon } from '@/modules/ui/components/icon';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';

type FormatSelectorProps = {
  isSinglePage: boolean;
  selectedFormat: ScanOutputFormat;
  onFormatChange: (format: ScanOutputFormat) => void;
};

export function FormatSelector({
  isSinglePage,
  selectedFormat,
  onFormatChange,
}: FormatSelectorProps) {
  const t = useAppTranslations();
  const formatOptions: {
    key: ScanOutputFormat;
    icon: IconName;
    singleScan: {
      label: string;
      description: string;
    };
    multiScan: {
      label: string;
      description: string;
    };
  }[] = [
    {
      key: 'pdf-merged',
      icon: 'file-text',
      singleScan: {
        label: t.documents.scan.formats.pdf,
        description: t.documents.scan.formats.pdfDescription,
      },
      multiScan: {
        label: t.documents.scan.formats.pdf,
        description: t.documents.scan.formats.mergedDescription,
      },
    },
    {
      key: 'pdf-per-page',
      icon: 'copy',
      singleScan: {
        label: t.documents.scan.formats.pdf,
        description: t.documents.scan.formats.pdfDescription,
      },
      multiScan: {
        label: t.documents.scan.formats.pdfs,
        description: t.documents.scan.formats.pdfsDescription,
      },
    },
    {
      key: 'images',
      icon: 'image',
      singleScan: {
        label: t.documents.scan.formats.image,
        description: t.documents.scan.formats.imageDescription,
      },
      multiScan: {
        label: t.documents.scan.formats.images,
        description: t.documents.scan.formats.imagesDescription,
      },
    },
  ];

  const themeColors = useThemeColor();
  const styles = createStyles({ themeColors });

  const options = formatOptions
    .filter((option) => !isSinglePage || option.key !== 'pdf-per-page')
    .map((option) => ({
      key: option.key,
      icon: option.icon,
      label: isSinglePage ? option.singleScan.label : option.multiScan.label,
      description: isSinglePage ? option.singleScan.description : option.multiScan.description,
    }));

  const selectedOption = options.find((opt) => opt.key === selectedFormat);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t.documents.scan.outputFormat}</Text>

      <View style={styles.segmentedControl}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[styles.segment, selectedFormat === option.key && styles.segmentSelected]}
            onPress={() => onFormatChange(option.key)}
          >
            <Icon
              name={option.icon}
              size={18}
              color={
                selectedFormat === option.key
                  ? themeColors.primaryForeground
                  : themeColors.foreground
              }
            />
            <Text
              style={[
                styles.segmentText,
                selectedFormat === option.key && styles.segmentTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedOption && (
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionText}>{selectedOption.description}</Text>
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
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.foreground,
      marginBottom: 8,
    },
    segmentedControl: {
      flexDirection: 'row',
      backgroundColor: themeColors.secondaryBackground,
      borderRadius: 8,
      padding: 4,
    },
    segment: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 6,
      gap: 6,
    },
    segmentSelected: {
      backgroundColor: themeColors.primary,
    },
    segmentText: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.foreground,
    },
    segmentTextSelected: {
      color: themeColors.primaryForeground,
    },
    descriptionCard: {
      marginTop: 8,
    },
    descriptionText: {
      fontSize: 13,
      color: themeColors.mutedForeground,
    },
  });
}
