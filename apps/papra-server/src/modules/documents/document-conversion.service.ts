import { exec } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export type ConversionResult = {
    buffer: Buffer;
    mimeType: string;
};

/**
 * Service to convert office documents to PDF using LibreOffice
 * Requires LibreOffice to be installed on the system
 */
export class DocumentConversionService {
    private libreOfficePath: string | null = null;
    private isAvailable: boolean | null = null;

    /**
     * Check if LibreOffice is available on the system
     */
    async checkAvailability(): Promise<boolean> {
        if (this.isAvailable !== null) {
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
                    // For absolute paths (Windows), just check if file exists
                    // For relative paths (Unix), check with --version
                    if (path.includes(':\\') || path.startsWith('/')) {
                        // Absolute path - just check file existence (no window popup on Windows)
                        await access(path);
                    }
                    else {
                        // Relative path - run --version silently
                        await execAsync(`"${path}" --version`, {
                            windowsHide: true,
                            timeout: 5000,
                        });
                    }

                    this.libreOfficePath = path;
                    this.isAvailable = true;
                    return true;
                }
                catch {
                    // Continue to next path
                }
            }

            this.isAvailable = false;
            return false;
        }
        catch {
            this.isAvailable = false;
            return false;
        }
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
     */
    async convertToPdf(buffer: Buffer, originalMimeType: string): Promise<ConversionResult> {
        const available = await this.checkAvailability();
        if (!available) {
            throw new Error('LibreOffice is not available on this system. Please install LibreOffice to enable document preview conversion.');
        }

        if (!this.isSupportedMimeType(originalMimeType)) {
            throw new Error(`Mime type ${originalMimeType} is not supported for conversion`);
        }

        // Create temporary directory
        const tempDir = await mkdtemp(join(tmpdir(), 'papra-conversion-'));

        try {
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

            // Convert using LibreOffice
            // IMPORTANT: Parameter order matters!
            // -env:UserInstallation MUST come first to isolate the profile
            // --headless: run without GUI (REQUIRED)
            // --nolockcheck: don't check for lockfiles (prevents hangs)
            // --nologo: don't show logo
            // --nodefault: don't start with empty document
            // --norestore: don't restore previous session
            // --convert-to pdf: convert to PDF format
            // --outdir: output directory
            const userProfileUrl = `file:///${userProfileDir.replace(/\\/g, '/')}`;
            const command = `"${this.libreOfficePath}" "-env:UserInstallation=${userProfileUrl}" --headless --nolockcheck --nologo --nodefault --norestore --convert-to pdf --outdir "${outputDir}" "${inputFile}"`;

            await execAsync(command, {
                timeout: 120000, // 120 seconds timeout (Windows LibreOffice can be slow)
                windowsHide: true, // Hide the window on Windows
            });

            // Read the converted PDF
            const outputFile = join(outputDir, 'input.pdf');
            const pdfBuffer = await readFile(outputFile);

            return {
                buffer: pdfBuffer,
                mimeType: 'application/pdf',
            };
        }
        catch (error) {
            // Better error message
            if (error && typeof error === 'object' && 'code' in error && error.code === 'ETIMEDOUT') {
                throw new Error('Document conversion timeout. The document might be too large or complex.');
            }
            throw error;
        }
        finally {
            // Clean up temporary directory
            // Retry cleanup if files are locked (EBUSY on Windows)
            try {
                await rm(tempDir, { recursive: true, force: true });
            }
            catch (cleanupError: any) {
                if (cleanupError?.code === 'EBUSY') {
                    // Wait a bit and retry once
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    try {
                        await rm(tempDir, { recursive: true, force: true });
                    }
                    catch {
                        // Ignore cleanup errors - temp files will be cleaned up by OS eventually
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
