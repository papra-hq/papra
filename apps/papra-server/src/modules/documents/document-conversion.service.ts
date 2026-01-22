import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { access, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';

export type ConversionResult = {
  buffer: Buffer;
  mimeType: string;
};

export type DocumentContext = {
  documentId?: string;
  name?: string;
  mimeType?: string;
};

// Cache expiration time for LibreOffice availability check (5 minutes)
const AVAILABILITY_CACHE_TTL_MS = 5 * 60 * 1000;

// Maximum concurrent conversions to prevent resource exhaustion
const MAX_CONCURRENT_CONVERSIONS = 3;

/**
 * Simple semaphore for limiting concurrent operations
 */
class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    // Wait for a permit to become available
    await new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    const next = this.waitQueue.shift();
    if (next) {
      next();
    }
    else {
      this.permits++;
    }
  }

  /**
   * Get current queue length (for monitoring)
   */
  getQueueLength(): number {
    return this.waitQueue.length;
  }
}

/**
 * Service to convert office documents to PDF using LibreOffice
 * Requires LibreOffice to be installed on the system
 */
export class DocumentConversionService {
  private libreOfficePath: string | null = null;
  private isAvailable: boolean | null = null;
  private lastAvailabilityCheck: number = 0;
  private conversionSemaphore = new Semaphore(MAX_CONCURRENT_CONVERSIONS);

  constructor() {
    // Clean up any orphaned temp directories from previous runs on startup
    this.cleanupOrphanedTempDirs().catch(() => {
      // Ignore cleanup errors on startup
    });
  }

  /**
   * Clean up orphaned temporary directories from previous runs
   * This handles the case where the process crashed before cleanup
   */
  private async cleanupOrphanedTempDirs(): Promise<void> {
    try {
      const tempBase = tmpdir();
      const entries = await readdir(tempBase);

      for (const entry of entries) {
        if (entry.startsWith('papra-conv-')) {
          const dirPath = join(tempBase, entry);
          try {
            await rm(dirPath, { recursive: true, force: true });
          }
          catch {
            // Ignore individual cleanup errors
          }
        }
      }
    }
    catch {
      // Ignore errors when listing temp directory
    }
  }

  /**
   * Check if LibreOffice is available on the system
   * Uses time-based cache with automatic expiration
   */
  async checkAvailability(): Promise<boolean> {
    const now = Date.now();

    // Return cached result if still valid
    if (this.isAvailable !== null && (now - this.lastAvailabilityCheck) < AVAILABILITY_CACHE_TTL_MS) {
      return this.isAvailable;
    }

    try {
      // Try different common LibreOffice executable names
      // Windows paths first, then Unix paths
      const possiblePaths = [
        'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
        'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
        'soffice',
        'libreoffice',
        '/usr/bin/soffice',
        '/usr/bin/libreoffice',
      ];

      for (const path of possiblePaths) {
        try {
          // For absolute paths, just check if file exists
          // For relative paths (like 'soffice'), try to spawn with --version
          if (isAbsolute(path)) {
            await access(path);
          }
          else {
            // Check if command exists by running --version
            await this.runCommand(path, ['--version'], 5000);
          }

          this.libreOfficePath = path;
          this.isAvailable = true;
          this.lastAvailabilityCheck = now;
          return true;
        }
        catch {
          // Continue to next path
        }
      }

      this.isAvailable = false;
      this.lastAvailabilityCheck = now;
      return false;
    }
    catch {
      this.isAvailable = false;
      this.lastAvailabilityCheck = now;
      return false;
    }
  }

  /**
   * Reset the availability cache to force a re-check
   */
  resetAvailabilityCache(): void {
    this.isAvailable = null;
    this.libreOfficePath = null;
    this.lastAvailabilityCheck = 0;
  }

  /**
   * Run a command with spawn and return a promise
   */
  private runCommand(command: string, args: string[], timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        windowsHide: true,
      });

      const timeout = setTimeout(() => {
        proc.kill();
        reject(Object.assign(new Error('Process timeout'), { code: 'ETIMEDOUT' }));
      }, timeoutMs);

      proc.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          resolve();
        }
        else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  /**
   * Check if a mime type is supported for conversion
   */
  isSupportedMimeType(mimeType: string): boolean {
    const supportedMimeTypes = [
      // Word documents
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // Excel documents
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // PowerPoint documents
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // OpenDocument formats
      'application/vnd.oasis.opendocument.text',
      'application/vnd.oasis.opendocument.spreadsheet',
      'application/vnd.oasis.opendocument.presentation',
      // RTF
      'application/rtf',
      'text/rtf',
    ];

    return supportedMimeTypes.includes(mimeType);
  }

  /**
   * Convert an office document to PDF
   * Uses a semaphore to limit concurrent conversions and prevent resource exhaustion
   * @param buffer - The document buffer to convert
   * @param originalMimeType - The mime type of the original document
   * @param documentContext - Optional context for better error messages (documentId, name, mimeType)
   */
  async convertToPdf(buffer: Buffer, originalMimeType: string, documentContext?: DocumentContext): Promise<ConversionResult> {
    const available = await this.checkAvailability();
    if (!available) {
      throw new Error('LibreOffice is not available on this system. Please install LibreOffice to enable document preview conversion.');
    }

    if (!this.isSupportedMimeType(originalMimeType)) {
      throw new Error(`Mime type ${originalMimeType} is not supported for conversion`);
    }

    // Acquire semaphore to limit concurrent conversions
    // This prevents resource exhaustion when many documents are uploaded simultaneously
    await this.conversionSemaphore.acquire();

    // Create temporary directory with opaque random name for security
    const tempDir = join(tmpdir(), `papra-conv-${randomUUID()}`);

    try {
      await mkdir(tempDir, { recursive: true });

      // Get file extension based on mime type
      const extension = this.getExtensionFromMimeType(originalMimeType);
      const inputFile = join(tempDir, `input.${extension}`);
      const outputDir = join(tempDir, 'output');

      // Create output directory
      await mkdir(outputDir, { recursive: true });

      // Create a temporary user profile to avoid printer dialogs on Windows
      const userProfileDir = join(tempDir, 'userprofile');
      await mkdir(userProfileDir, { recursive: true });

      // Write input file
      await writeFile(inputFile, buffer);

      // Convert using LibreOffice with spawn (prevents command injection)
      // IMPORTANT: Parameter order matters!
      // -env:UserInstallation MUST come first to isolate the profile
      const userProfileUrl = `file:///${userProfileDir.replace(/\\/g, '/')}`;
      const args = [
        `-env:UserInstallation=${userProfileUrl}`,
        '--headless', // Run without GUI (REQUIRED)
        '--nolockcheck', // Don't check for lockfiles (prevents hangs)
        '--nologo', // Don't show logo
        '--nodefault', // Don't start with empty document
        '--norestore', // Don't restore previous session
        '--convert-to', 'pdf', // Convert to PDF format
        '--outdir', outputDir, // Output directory
        inputFile, // Input file
      ];

      await this.runCommand(this.libreOfficePath!, args, 120000);

      // Read the converted PDF
      const outputFile = join(outputDir, 'input.pdf');

      // Ensure the output file was actually created by LibreOffice
      try {
        await access(outputFile);
      }
      catch {
        throw new Error('Document conversion failed: LibreOffice did not produce an output PDF file.');
      }

      const pdfBuffer = await readFile(outputFile);

      // Validate that the output is actually a PDF (check magic bytes)
      if (pdfBuffer.length < 4 || pdfBuffer.toString('ascii', 0, 4) !== '%PDF') {
        throw new Error('Document conversion failed: Output is not a valid PDF file.');
      }

      return {
        buffer: pdfBuffer,
        mimeType: 'application/pdf',
      };
    }
    catch (error) {
      // Build context string for error messages
      const contextParts: string[] = [];
      if (documentContext?.documentId) {
        contextParts.push(`documentId: ${documentContext.documentId}`);
      }
      if (documentContext?.name) {
        contextParts.push(`name: ${documentContext.name}`);
      }
      if (documentContext?.mimeType) {
        contextParts.push(`mimeType: ${documentContext.mimeType}`);
      }
      const contextStr = contextParts.length > 0 ? ` [${contextParts.join(', ')}]` : '';

      // Better error message with context
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ETIMEDOUT') {
        throw new Error(`Document conversion timeout${contextStr}. The document might be too large or complex.`);
      }

      // Re-throw with context for other errors
      if (error instanceof Error) {
        throw new Error(`Document conversion failed${contextStr}: ${error.message}`);
      }
      throw error;
    }
    finally {
      // Release semaphore to allow next conversion in queue
      this.conversionSemaphore.release();

      // Clean up temporary directory
      // Retry cleanup if files are locked (EBUSY on Windows)
      try {
        await rm(tempDir, { recursive: true, force: true });
      }
      catch (cleanupError: unknown) {
        const errorCode = (cleanupError as { code?: string })?.code;
        if (errorCode === 'EBUSY') {
          // Wait a bit and retry once
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            await rm(tempDir, { recursive: true, force: true });
          }
          catch {
            // Ignore cleanup errors - temp files will be cleaned up by cleanup-on-startup
          }
        }
      }
    }
  }

  /**
   * Get file extension from mime type
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExtension: Record<string, string> = {
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'application/vnd.oasis.opendocument.text': 'odt',
      'application/vnd.oasis.opendocument.spreadsheet': 'ods',
      'application/vnd.oasis.opendocument.presentation': 'odp',
      'application/rtf': 'rtf',
      'text/rtf': 'rtf',
    };

    return mimeToExtension[mimeType] || 'bin';
  }
}

export const documentConversionService = new DocumentConversionService();
