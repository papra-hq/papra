import {
  defineConfig,
  presetIcons,
  presetWebFonts,
  presetWind4,
  transformerVariantGroup,
} from 'unocss';

export default defineConfig({
  presets: [
    presetWind4(),
    presetWebFonts({
      provider: 'bunny',
      fonts: {
        sans: 'DM Sans:400,500,700',
      },
    }),
    presetIcons(),
  ],
  transformers: [transformerVariantGroup()],
  theme: {
    colors: {
      'background': '#fbf9f7',
      'foreground': '#1c1917',
      'surface': '#ffffff',
      'primary': '#ff5724',
      'primary-foreground': '#ffffff',
      'secondary': '#eeece8',
      'border': '#e3e1de',
      'muted': '#6b6965',
    },

  },
  shortcuts: {
  },
});
