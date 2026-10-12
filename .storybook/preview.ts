import type { Preview } from '@storybook/react';
import '../src/assets/css/tailwind.css';
import '../src/assets/css/globals.css';
import '../src/assets/css/stories.css';
import '../src/assets/css/design-system.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
