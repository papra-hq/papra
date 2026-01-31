import { joinUrlPaths } from '@corentinth/chisels';
import * as FileSystem from 'expo-file-system/legacy';

export const SCANS_DIRECTORY_PATH = joinUrlPaths(FileSystem.documentDirectory, 'scans');
