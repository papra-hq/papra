import type { ChangelogEntry, PendingChangelogEntry } from './types';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adjectives, animals, createIdGenerator } from '@corentinth/friendly-ids';
import matter from 'gray-matter';

const generateId = createIdGenerator({
  separator: '-',
  chunks: [
    ({ getRandomItem }) => getRandomItem(adjectives),
    ({ getRandomItem }) => getRandomItem(adjectives),
    ({ getRandomItem }) => getRandomItem(animals),
  ],
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
export const CHANGELOG_DIR = path.join(REPO_ROOT, '.changelog');
export const PENDING_DIR = path.join(CHANGELOG_DIR, 'pending');
export const RELEASES_DIR = path.join(CHANGELOG_DIR, 'releases');
export const VERSION_FILE = path.join(CHANGELOG_DIR, 'version');

/**
 * Ensure the pending directory exists
 */
export function ensureChangelogPendingDirectoryExists(): void {
  if (!fs.existsSync(PENDING_DIR)) {
    fs.mkdirSync(PENDING_DIR, { recursive: true });
  }
}

/**
 * Generate a unique filename for a changelog entry
 */
export function generateFilename(): string {
  const slug = generateId();
  return `${slug}.md`;
}

/**
 * Read a changelog entry from a file
 */
export function readPendingEntry(filePath: string): PendingChangelogEntry {
  const { data, content } = matter(fs.readFileSync(filePath, 'utf-8'));

  return {
    ...data as Omit<PendingChangelogEntry, 'content'>,
    content,
  };
}

/**
 * Write a changelog entry to a file
 */
export function writeEntry({ filePath, entry: { content, ...rest } }: { filePath: string; entry: ChangelogEntry | PendingChangelogEntry }): void {
  ensureChangelogPendingDirectoryExists();
  const frontmatter = matter.stringify(content, rest);
  fs.writeFileSync(filePath, frontmatter, 'utf-8');
}

/**
 * Get all pending changelog entries
 */
export function getPendingEntries(): { path: string; entry: PendingChangelogEntry }[] {
  if (!fs.existsSync(PENDING_DIR)) {
    return [];
  }

  const files = fs.readdirSync(PENDING_DIR)
    .filter(file => file.endsWith('.md'))
    .map(file => path.join(PENDING_DIR, file));

  return files.map(filePath => ({
    path: filePath,
    entry: readPendingEntry(filePath),
  }));
}

/**
 * Get the commit hash that last modified a file
 */
export function getFileCommitHash(filePath: string): string | null {
  try {
    const hash = execSync(`git log -1 --format=%H -- "${filePath}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
    return hash || null;
  }
  catch {
    return null;
  }
}

/**
 * Get PR number and author from a commit hash using gh CLI
 */
export function getPRInfoFromCommit(commitHash: string): { pr: number; author: string } | null {
  try {
    const result = execSync(`gh pr list --search "${commitHash}" --json number,author --state merged --limit 1`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });

    const prs = JSON.parse(result) as Array<{ number: number; author: { login: string } }>;
    if (prs.length === 0) {
      return null;
    }

    const pr = prs[0];
    return {
      pr: pr!.number,
      author: pr!.author.login,
    };
  }
  catch {
    return null;
  }
}

/**
 * Move pending entries to a versioned folder
 */
export function movePendingEntriesToVersion(version: string, date: string): void {
  const pending = getPendingEntries();

  if (pending.length === 0) {
    return;
  }

  const versionDir = path.join(RELEASES_DIR, version);

  if (!fs.existsSync(versionDir)) {
    fs.mkdirSync(versionDir, { recursive: true });
  }

  for (const { path: filePath, entry } of pending) {
    const filename = path.basename(filePath);
    const newPath = path.join(versionDir, filename);

    // Get commit hash and PR info
    const commitHash = getFileCommitHash(filePath);
    const prInfo = commitHash ? getPRInfoFromCommit(commitHash) : null;

    // Update entry with version, date, and PR info
    const updatedEntry: ChangelogEntry = {
      ...entry,
      version,
      createdAt: date,
      ...(prInfo && {
        pr: prInfo.pr,
        author: prInfo.author,
      }),
    };

    writeEntry({ filePath: newPath, entry: updatedEntry });

    // Remove from pending
    fs.unlinkSync(filePath);
  }
}

/**
 * Read the current version from the version file
 */
export function getCurrentVersion(): string | null {
  try {
    if (!fs.existsSync(VERSION_FILE)) {
      return null;
    }
    return fs.readFileSync(VERSION_FILE, 'utf-8').trim();
  } catch {
    return null;
  }
}

/**
 * Write the version to the version file
 */
export function setCurrentVersion(version: string): void {
  if (!fs.existsSync(CHANGELOG_DIR)) {
    fs.mkdirSync(CHANGELOG_DIR, { recursive: true });
  }
  fs.writeFileSync(VERSION_FILE, version, 'utf-8');
}

/**
 * Parse a version string (with or without 'v' prefix) into components
 */
export function parseVersion(version: string): { year: number; month: number; release: number } | null {
  const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]!),
    month: Number(match[2]!),
    release: Number(match[3]!),
  };
}

/**
 * Calculate the next version based on CalVer (YY.M.N) or SemVer
 */
export function getNextVersion({ now = new Date() }: { now?: Date } = {}): string {
  const currentYearMod100 = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  const currentVersion = getCurrentVersion();

  if (!currentVersion) {
    // No version found, start with CalVer format based on current date
    return `${currentYearMod100}.${currentMonth}.0`;
  }

  const parsed = parseVersion(currentVersion);
  if (!parsed) {
    // Invalid version format, start fresh
    return `${currentYearMod100}.${currentMonth}.0`;
  }

  const { year, month, release } = parsed;

  if (year === currentYearMod100 && month === currentMonth) {
    // Same month and year, increment release number
    return `${year}.${month}.${release + 1}`;
  } else {
    // New month or year, reset release number
    return `${currentYearMod100}.${currentMonth}.0`;
  }
}
