# n8n Integration

A community node package that integrates [Papra](https://papra.app) (the document archiving platform) with [n8n](https://n8n.io), enabling you to automate document management workflows.

## Installation

1. In your n8n instance, go to **Settings** → **Community Nodes**
2. Click **Install** and enter: `n8n-nodes-papra`
3. Install the package and restart your n8n instance

Then restart your n8n instance.

## Setup

### 1. Create API Credentials
Before using this integration, you need to create API credentials in your Papra workspace:

1. Log in to your Papra instance
2. Navigate to **Settings** → **API Keys**
3. Click **Create New API Key**
4. Copy the generated API key and your Organization ID (from the url)

For detailed instructions, visit the [Papra API documentation](https://docs.papra.app/resources/api-endpoints/#authentication).

### 2. Configure n8n Credentials
1. In n8n, create a new workflow
2. Add a Papra node
3. Create new credentials with:
   - **Papra API URL**: `https://api.papra.app` (or your self-hosted instance URL)
   - **Organization ID**: Your organization ID from Papra
   - **API Key**: Your generated API key

## Available Operations

| Resource | Operations |
|----------|------------|
| Document | `create`, `list`, `get`, `update`, `remove`, `get_file`, `get_activity` |
| Tag | Standard CRUD operations |
| Document Tag | Link/unlink tags to/from documents |
| Statistics | Retrieve workspace analytics |
| Trash | List deleted documents |

## Development

### Prerequisites
- Node.js 20.15 or higher
- pnpm package manager
- n8n instance for testing

### Testing the Integration

#### Option 1: Local n8n Instance
1. Build this package:
   ```bash
   pnpm run build
   ```

2. Link the package to your local n8n:
   ```bash
   # Navigate to your n8n nodes directory
   cd ~/.n8n/nodes

   # Install the package locally
   npm install /path/to/papra/packages/n8n-nodes
   ```

3. Start n8n:
   ```bash
   npx n8n
   ```

4. In n8n, create a new workflow and search for "Papra" to find the node

#### Option 2: Docker
Build a custom n8n Docker image with the Papra node included. Follow the [n8n documentation](https://docs.n8n.io/integrations/creating-nodes/deploy/install-private-nodes/#install-your-node-in-a-docker-n8n-instance) for detailed instructions.
