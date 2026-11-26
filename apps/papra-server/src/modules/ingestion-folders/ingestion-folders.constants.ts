export const defaultIgnoredPatterns = [
  // Files
  '**/.DS_Store',
  '**/.env',
  '**/desktop.ini',
  '**/Thumbs.db',

  // Microsoft Office temporary/lock files
  '**/~$*',

  // LibreOffice lock files
  '**/.~lock.*#',

  // Directories
  '**/.git/**',
  '**/.idea/**',
  '**/.vscode/**',
  '**/node_modules/**',

  // Synology specific
  '**/@eaDir/**',
  '**/*@SynoResource',
  '**/*@SynoEAStream',
];
