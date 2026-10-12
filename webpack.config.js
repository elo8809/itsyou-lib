const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const {
  dependencies,
  peerDependencies,
} = require('./package.json');
const externalPackages = new Set([
  ...Object.keys(dependencies),
  ...Object.keys(peerDependencies),
]);

module.exports = {
  mode: 'production',
  target: 'browserslist', // Ensures Webpack does not try to run in Node.js
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: '@itsyou/ui',
    libraryTarget: 'umd',
    clean: true,
    publicPath: '/',
    globalObject:
      "typeof self !== 'undefined' ? self : this", // Fix for `self is not defined`
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.json'],
    fallback: {
      fs: false,
      path: require.resolve('path-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      },
      {
        test: /\.(png|jpe?g|gif|webp)$/i,
        type: 'asset/resource',
      },
    ],
  },
  // Consumers supply React, Next routing and other runtimes; never bundle a second instance.
  externals: [
    ({ request }, callback) => {
      const name = request?.startsWith('@')
        ? request.split('/').slice(0, 2).join('/')
        : request?.split('/')[0];
      if (
        externalPackages.has(name) &&
        !request.endsWith('.css')
      )
        return callback(null, 'commonjs ' + request);
      callback();
    },
  ],
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/assets', to: 'assets' },
        {
          from: 'tailwind.workspace.config.js',
          to: 'tailwind.workspace.config.js',
        },
        {
          from: 'tailwind.workspace.config.d.ts',
          to: 'tailwind.workspace.config.d.ts',
        },
        {
          from: 'tailwind.base.config.ts',
          to: 'tailwind.base.config.ts',
        },
      ],
    }),
  ],
};
