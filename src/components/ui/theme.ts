import { createSystem, defaultConfig, defineConfig, defineLayerStyles } from "@chakra-ui/react"

const tokens = {
  colors: {
    anki: {
      DEFAULT: { value: '#25b4fc' },
      50: { value: '#c2eafe' },
      100: { value: '#a7e1fe' },
      200: { value: '#84d5fd' },
      300: { value: '#61c9fd' },
      400: { value: '#3ebdfc' },
      500: { value: '#24b4fc' },
      600: { value: '#03a8fa' },
      700: { value: '#0389cd' },
      800: { value: '#026b9f' },
      900: { value: '#024c72' },
      950: { value: '#012c42' },
    },
  },
};

const semanticTokens = {
  colors: {
    brand: { value: {
      base: '{colors.anki.950}',
      _dark: '{colors.anki.50}',
    }},
    nav: { value: {
      base: '{colors.gray.600}',
      _dark: '{colors.gray.400}',
    }},
    bg: {
      active: {value: {
        base: '{colors.anki.50/25}',
        _dark: '{colors.anki.900/25}',
      }},
    },
  },
  borders: {
    nav: {
      active: { value: '2px solid {colors.anki}' },
    },
  },
};

const layerStyles = defineLayerStyles({
  nav: {
    active: {
      description: 'Active nav item',
      value: {
        bg: 'bg.active',
        borderRight: 'nav.active',
      },
    },
  },
})

const config = defineConfig({
  // strictTokens: true,
  theme: { tokens, semanticTokens, layerStyles },
});

export const system = createSystem(defaultConfig, config);

// To generate system types after modifications, use: `npx @chakra-ui/cli typegen ./src/components/ui/theme.ts`