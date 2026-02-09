export const defaultIgnoredPatterns = [
  // Files
  '**/.DS_Store',
  '**/.env',
  '**/desktop.ini',
  '**/Thumbs.db',

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
