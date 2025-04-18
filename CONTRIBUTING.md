# Contributing to Papra

First off, thanks for taking the time to contribute to Papra! We welcome contributions of all types and encourage you to help make this project better for everyone.

## Code of Conduct

This project adheres to the [Contributor Covenant](https://www.contributor-covenant.org/). By participating, you are expected to uphold this code. Please report unacceptable behavior to <corentinth@proton.me>

## How Can I Contribute?

### Reporting Issues

If you find a bug, have a feature request, or need help, feel free to open an issue in the [GitHub Issue Tracker](https://github.com/papra-hq/papra/issues). You're also welcome to comment on existing issues.

### Submitting Pull Requests

Please refrain from submitting pull requests that implement new features or fix bugs without first opening an issue. This will help us avoid duplicate work and ensure that your contribution is in line with the project's goals and prevents wasted effort on your part.

We follow a **GitHub Flow** model where all PRs should target the `main` branch, which is continuously deployed to production.

**Guidelines for submitting PRs:**

- Each PR should be small and atomic. Please avoid solving multiple unrelated issues in a single PR.
- Ensure that the **CI is green** before submitting. Some of the following checks are automatically run for each package: linting, type checking, testing, and building.
- If your PR fixes an issue, please reference the issue number in the PR description.
- If your PR adds a new feature, please include tests and update the documentation if necessary.
- Be prepared to address feedback and iterate on your PR.
- Resolving merge conflicts is part of the PR author's responsibility.
- Draft PRs are welcome to get feedback early on your work but only when requested, they'll not be reviewed.

### Branching

- **Main branch**: This is the production branch. All pull requests must target this branch.
- **Feature branches**: Create a new branch for your feature (e.g., `my-new-feature`), make your changes, and then open a PR targeting `main`.

### Commit Guidelines

We use **[Conventional Commits](https://www.conventionalcommits.org/)** to keep commit messages consistent and meaningful. Please follow these guidelines when writing commit messages. While you can structure commits however you like, PRs will be squashed on merge.

## i18n

We welcome contributions to improve and expand the app's internationalization (i18n) support. Below are the guidelines for adding a new language or updating an existing translation.

### Adding a New Language

1. **Create a Language File**: To add a new language, create a YAML file named with the appropriate [ISO language code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) (e.g., `fr.yml` for French) in the [`apps/papra-client/src/locales`](./apps/papra-client/src/locales) directory.

2. **Use the Reference File**: Refer to the [`en.yml`](./apps/papra-client/src/locales/en.yml) file, which contains all keys used in the app. Use it as a base to ensure consistency when creating your new language file. And act as a fallback if a key is missing in the new language file.

3. **Update the Locale List**: After adding the new language file, include the language code in the `locales` array found in the [`apps/papra-client/src/modules/i18n/i18n.constants.ts`](./apps/papra-client/src/modules/i18n/i18n.constants.ts) file.

4. **Submit a Pull Request**: Once you've added the file and updated `i18n.constants.ts`, create a pull request (PR) with your changes. Ensure that your PR is clearly titled with the language being added (e.g., "Add French translations").

### Updating an Existing Language

If you want to update an existing language file, you can do so directly in the corresponding JSON file in the [`apps/papra-client/src/locales`](./apps/papra-client/src/locales) directory. If you're adding or removing keys in the default language file ([`en.yml`](./apps/papra-client/src/locales/en.yml)), please run the following command to update the types (used for type checking the translations keys in the app):

```bash
pnpm script:generate-i18n-types
```

- This command will update the file [`locales.types.ts`](./apps/papra-client/src/modules/i18n/locale.types.ts) with the new/removed keys.
- Will developing you can use `pnpm script:generate-i18n-types:watch` to automatically update the types when you touch the  [`en.yml`](./apps/papra-client/src/locales/en.yml) file.

## Development Setup

### Local Environment Setup

We recommend running the app locally for development. Follow these steps:

1. Clone the repository and navigate inside the project directory.

   ```bash
   git clone https://github.com/papra-hq/papra.git
   cd papra
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Start the development server for the backend:

   ```bash
   cd apps/papra-server
   # Run the migration script to create the database schema
   pnpm migrate:up 
   # Start the server
   pnpm dev
   ```

4. Start the frontend:

   ```bash
   cd apps/papra-client
   # Start the client
   pnpm dev
   ```

5. Open your browser and navigate to `http://localhost:3000`.

### Testing

We use **Vitest** for testing. Each package comes with its own testing commands.

- To run the tests for any package:

   ```bash
   pnpm test
   ```

- To run tests in watch mode:

   ```bash
   pnpm test:watch
   ```

All new features must be covered by unit or integration tests. Be sure to use business-oriented test names (avoid vague descriptions like `it('should return true')`).

## Writing Documentation

If your code changes affect the documentation, you must update the docs. The documentation is powered by [**Astro Starlight**](https://starlight.astro.build/).

To start the documentation server for local development:

1. Navigate to the `packages/docs` directory:

   ```bash
   cd apps/docs
   ```

2. Start the documentation server:

   ```bash
   pnpm dev
   ```

3. Open your browser and navigate to `http://localhost:4321`.

## Coding Style

- Use functional programming where possible.
- Focus on clarity and maintainability over performance.
- Choose meaningful, relevant names for variables, functions, and components.

## Issue Labels

Look out for issues tagged as [**good first issue**](https://github.com/papra-hq/papra/issues?q=sort%3Aupdated-desc%20is%3Aissue%20state%3Aopen%20label%3A%22good%20first%20issue%22) or [**PR welcome**](https://github.com/papra-hq/papra/issues?q=sort%3Aupdated-desc+is%3Aissue+state%3Aopen+label%3A%22PR+welcome%22) for tasks that are well-suited for new contributors. Feel free to comment on existing issues or create new ones.

## License

By contributing, you agree that your contributions will be licensed under the [AGPL3](./LICENSE), the same as the project itself.
