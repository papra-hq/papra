<p align="center">
<picture>
    <source srcset="./.github/icon-dark.png" media="(prefers-color-scheme: light)">
    <source srcset="./.github/icon-light.png" media="(prefers-color-scheme: dark)">
    <img src="./.github/icon-dark.png" alt="Header banner">
</picture>
</p>

<h1 align="center">
  Papra - Document management platform
</h1>
<p align="center">
  Minimalistic document management and archiving platform.
</p>

<p align="center">
  <a href="https://demo.papra.app">Demo</a>
  <!-- <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://docs.papra.app">Docs</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://docs.papra.app/self-hosting/docker">Self-hosting</a> -->
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://github.com/orgs/papra-hq/projects/2">Roadmap</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://dashboard.papra.app">Managed instance</a>
</p>

## Introduction

> [!IMPORTANT]  
> **Papra** is currently in active development and is not yet ready for production use or self-hosting.

**Papra** is a minimalistic document management and archiving platform. It is designed to be simple to use and accessible to everyone. Papra is a plateform for long-term document storage and management, like a digital archive for your documents.

Forget about that receipt of that gift you bought for your friend last year, or that warranty for your new phone. With Papra, you can easily store, forget, and retrieve your documents whenever you need them.

A live demo of the platform is available at [demo.papra.cc](https://demo.papra.cc) (no backend, client-side local storage only).

## Features

- **Document management**: Upload, store, and manage your documents in one place.
- **Organizations**: Create organizations to manage documents with family, friends, or colleagues.
- **Search**: Quickly search for documents with full-text search.
- **Authentication**: User accounts and authentication.
- **Dark Mode**: A dark theme for those late-night document management sessions.
- **Responsive Design**: Works on all devices, from desktops to mobile phones.
- **Open Source**: The project is open-source and free to use.
- *Coming soon:* **Self-hosting**: Host your own instance of Papra using Docker or other methods.
- *Coming soon:* **Tags**: Organize your documents with tags.
- *Coming soon:* **Tagging Rules**: Automatically tag documents based on custom rules.
- *Coming soon:* **OCR**: Automatically extract text from images or scanned documents for search.
- *Coming soon:* **i18n**: Support for multiple languages.
- *Coming soon:* **Email ingestion**: Forward emails to automatically import documents.
- *Coming soon:* **SDK and API**: Build your own applications on top of Papra.
- *Coming soon:* **CLI**: Manage your documents from the command line.
- *Coming soon:* **Document sharing**: Share documents with others.
- *Coming soon:* **Folder ingestion**: Automatically import documents from a folder.
- *Coming maybe one day:* **Mobile app**: Access and upload documents on the go.
- *Coming maybe one day:* **Desktop app**: Access and upload documents from your computer.

## Contributing

*Coming soon*
Currently, the project is in heavy development and is not yet ready for contributions as changes are frequent and the architecture is not yet finalized. However, you can star the project to follow its progress.

## License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](./LICENSE) file for details.

## Credits

This project is crafted with ❤️ by [Corentin Thomasset](https://corentin.tech).
If you find this project helpful, please consider [supporting my work](https://buymeacoffee.com/cthmsst).

## Acknowledgements

### Stack

Enclosed would not have been possible without the following open-source projects:

- **Frontend**
  - **[SolidJS](https://www.solidjs.com)**: A declarative JavaScript library for building user interfaces.
  - **[Shadcn Solid](https://shadcn-solid.com/)**: UI components library for SolidJS based on Shadcn designs.
  - **[UnoCSS](https://unocss.dev/)**: An instant on-demand atomic CSS engine.
  - **[Tabler Icons](https://tablericons.com/)**: A set of open-source icons.
  - And other dependencies listed in the **[client package.json](./apps/papra-client/package.json)**
- **Backend**
  - **[HonoJS](https://hono.dev/)**: A small, fast, and lightweight web framework for building APIs.
  - **[Drizzle](https://orm.drizzle.team/)**: A simple and lightweight ORM for Node.js.
  - And other dependencies listed in the **[server package.json](./apps/papra-server/package.json)**

### Inspiration

This project would not have been possible without the inspiration and work of others. Here are some projects that inspired me:

- **[Paperless-ngx](https://paperless-ngx.com/)**: A full-featured document management system.

## Contact Information

Please use the issue tracker on GitHub for any questions or feedback.
