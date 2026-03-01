import type { ScanOutputFormat } from '../documents-scan/documents-scan.types';
import { castError } from '@corentinth/chisels';
import { useState } from 'react';
import { useApiClient } from '@/modules/api/providers/api.provider';
import { queryClient } from '@/modules/api/providers/query.provider';
import {

  processScannedImages,
} from '../documents-scan/documents-scan.processing.services';
import { uploadDocument } from '../documents.services';

export function useScanProcessor() {
  const apiClient = useApiClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const processAndUpload = async ({
    imageUris,
    format,
    baseName,
    organizationId,
  }: {
    imageUris: string[];
    format: ScanOutputFormat;
    baseName: string;
    organizationId: string;
  }): Promise<{
    success: boolean;
    documentCount: number;
    error?: string;
  }> => {
    setIsProcessing(true);

    try {
      const { localDocuments } = await processScannedImages({
        imageUris,
        format,
        baseName,
      });

      for (const localDocument of localDocuments) {
        await uploadDocument({
          file: localDocument,
          apiClient,
          organizationId,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['organizations', organizationId, 'documents'] });

      return {
        success: true,
        documentCount: localDocuments.length,
      };
    } catch (error) {
      return {
        success: false,
        documentCount: 0,
        error: castError(error).message,
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processAndUpload,
    isProcessing,
  };
}
