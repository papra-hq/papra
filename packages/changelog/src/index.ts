import * as p from '@clack/prompts';
import { exitOnCancel } from './prompts';

const packages = [
  {
    name: '@papra/cli',
    versioningType: 'semver',
  },
  {
    name: '@papra/app',
    versioningType: 'calver',
  },
];

async function createChangelogEntry() {
  p.intro('Create a changelog entry');

  const selectedPackages = await exitOnCancel(p.multiselect({
    message: 'Select packages',
    options: packages.map(pkg => ({ value: pkg.name, label: pkg.name })),
  }));

  const changelogLevel = await exitOnCancel(p.select({
    message: 'Select changelog level',
    options: [
      { value: 'patch', label: 'Patch' },
      { value: 'minor', label: 'Minor' },
      { value: 'major', label: 'Major' },
    ],
  }));


  const changelogEntry = await exitOnCancel(p.text({
    message: 'Enter changelog entry',
    placeholder: 'Fixed bugs and improved performance',
  }));

}
