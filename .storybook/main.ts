import type { StorybookConfig } from '@storybook/react-webpack5';
import { join, dirname } from 'path';

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(
    require.resolve(join(value, 'package.json')),
  );
}

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    getAbsolutePath(
      '@storybook/addon-webpack5-compiler-swc',
    ),
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath('@storybook/addon-interactions'),
    {
      name: getAbsolutePath(
        '@storybook/addon-styling-webpack',
      ),
      options: {
        rules: [
          // Replaces existing CSS rules to support PostCSS
          {
            test: /\.css$/,
            use: [
              'style-loader',
              {
                loader: 'css-loader',
              },
              {
                loader: 'postcss-loader',
                options: {
                  implementation:
                    require.resolve('postcss'),
                },
              },
            ],
          },
        ],
      },
    },
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-webpack5'),
    options: {},
  },
  webpackFinal: async (config) => {
    if (!config.module) config.module = { rules: [] };
    // Ensure file-loader does not process SVGs
    config.module.rules = config.module.rules.map(
      (rule) => {
        //@ts-expect-error
        if (
          rule &&
          rule.test &&
          rule.test.toString().includes('svg')
        ) {
          return { ...(rule as any), exclude: /\.svg$/ };
        }
        return rule;
      },
    );
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
};
export default config;
