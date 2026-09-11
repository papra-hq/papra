// @pagefind/default-ui does not currently ship TypeScript declarations.
declare module '@pagefind/default-ui' {
  export class PagefindUI {
    constructor(options: {
      element: HTMLElement | string;
      bundlePath: string;
      showSubResults?: boolean;
      showImages?: boolean;
      resetStyles?: boolean;
      translations?: Record<string, string>;
    });
    destroy(): void;
  }
}
