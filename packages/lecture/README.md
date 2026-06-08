# @papra/lecture

`@papra/lecture` is a robust and lightweight library for extracting text content from various file formats. Whether you're processing Document for indexing or for LLM readability, this library simplifies the task of reading text content programmatically.

This lib is used in the [Papra](https://papra.app) project to extract text from various file formats.

## Features

- **Wide Format Support**: Extract text from PDFs, plain text files, YAML, Markdown, CSV, and all `text/*` MIME types.
- **Promise-based API**: Designed with asynchronous functions to provide a seamless integration experience.
- **Extensible and Modular**: Built with future compatibility in mind. Support for more file formats is on the way.
- **Error Handling**: Provides detailed error information when extraction fails.

## Supported File Formats

Currently, `@papra/lecture` supports the following file formats:

- **PDF**
- **Plain Text** (e.g., `.txt`)
- **YAML** (e.g., `.yaml`, `.yml`)
- **Markdown** (e.g., `.md`)
- **CSV**
- All `text/*` MIME types
- **Images OCR** (e.g., `.jpg`, `.png`, `.gif`)
- Coming soon: **Microsoft Office Documents** (e.g., `.docx`, `.xlsx`, `.pptx`)
- Coming soon: **eBooks** (e.g., `.epub`, `.mobi`)

We are actively working on adding support for more file formats. Stay tuned for updates!

## Installation

To install the package, use npm or yarn:

```bash
pnpm install @papra/lecture

npm install @papra/lecture

yarn add @papra/lecture
```

## Usage

### Importing the Library

You can import the library using ES Modules or CommonJS syntax:

```javascript
// ES Modules
import { extractText } from '@papra/lecture';
// or CommonJS
const { extractText } = require('@papra/lecture');

const { textContent } = await extractText({ arrayBuffer: file, mimeType: 'application/pdf' });

console.log('Extracted Text:', textContent);
```

### Functions

#### `extractText`

Extracts text from an arrayBuffer using its MIME type.

**Example**:

```javascript
const file = await fetch('example.pdf').then((res) => res.arrayBuffer());
const mimeType = 'application/pdf';

const { textContent } = await extractText({ arrayBuffer: file, mimeType });

console.log('Extracted Text:', textContent);
```

#### `extractTextFromBlob`

Extracts text from a `Blob` object (e.g., files or data retrieved from APIs).

```javascript
const blob = new Blob(['Hello, World!'], { type: 'text/plain' });

const { textContent } = await extractTextFromBlob({ blob });

console.log('Extracted Text:', textContent);
```

#### `extractTextFromFile`

Extracts text from a file using its MIME type.

```javascript
const file = document.querySelector('#file-input').files[0]; // HTML File Input

const { textContent } = await extractTextFromFile({ file });

console.log('Extracted Text:', textContent);
```

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests. Let's make `@papra/lecture` better together.

## Testing

You can run the tests with the following command:

```bash
# one shot
pnpm run test

# watch mode
pnpm run test:watch
```

Automated fixtures are run against the [`fixtures`](./fixtures) directory. Add files to this directory in the format `[0-9]{3}.ext` like `001.js` following the incremental pattern. The test runner will automatically pick up the new fixtures and generate a `[0-9]{3}.expected`, adding the expected output.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more information.

## Credits and Acknowledgements

This project is crafted with ❤️ by [Corentin Thomasset](https://corentin.tech).
If you find this project helpful, please consider [supporting my work](https://buymeacoffee.com/cthmsst).
