const linesToRemove = [
  /^# (.*)$/gm, // Remove main title
  /^### (.*)$/gm, // Remove section titles
];

export function parseChangelog(changelog: string) {
  const logs: { entries: {
    pr: { number: number; url: string };
    commit: { hash: string; url: string };
    contributor: { username: string; url: string };
    content: string;
  }[]; version: string; }[] = [];

  for (const lineToRemove of linesToRemove) {
    changelog = changelog.replace(lineToRemove, '');
  }

  const sections = changelog.match(/## (.*)\n([\s\S]*?)(?=\n## |$)/g) ?? [];

  for (const section of sections) {
    const version = section.match(/## (.*)\n/)?.[1].trim() ?? 'unknown version';

    const entries = section.split('\n- ').slice(1).map((entry) => {
      // Example entry:
      // [#280](https://github.com/papra-hq/papra/pull/280) [`85fa5c4`](https://github.com/papra-hq/papra/commit/85fa5c43424d139f5c2752a3ad644082e61d3d67) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Maybe multiline content

      // Thanks copilot! :sweat-smile:
      const prMatch = entry.match(/\[#(\d+)\]\((https:\/\/github\.com\/papra-hq\/papra\/pull\/\d+)\)/);
      const commitMatch = entry.match(/\[`([a-f0-9]{7,40})`\]\((https:\/\/github\.com\/papra-hq\/papra\/commit\/[a-f0-9]{7,40})\)/);
      const contributorMatch = entry.match(/Thanks \[@([\w-]+)\]\((https:\/\/github\.com\/[\w-]+)\)/);
      const contentMatch = entry.match(/\)! - (.*)$/s);

      return {
        pr: prMatch ? { number: Number.parseInt(prMatch[1], 10), url: prMatch[2] } : { number: 0, url: '' },
        commit: commitMatch ? { hash: commitMatch[1], url: commitMatch[2] } : { hash: '', url: '' },
        contributor: contributorMatch ? { username: contributorMatch[1], url: contributorMatch[2] } : { username: 'unknown', url: '' },
        content: contentMatch ? contentMatch[1].trim() : entry.trim(),
      };
    });

    logs.push({
      version,
      entries,
    });
  }

  return logs;
}
