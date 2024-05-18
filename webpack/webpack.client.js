/**
 * This file released by Frostoven under the MIT License.
 */

  // ===================================================================== //
  //  Client bundle                                                        //
  // ===================================================================== //

const webpack = require('webpack');
const dynamicDatabaseImport = require('./nixiePlugins/dynamicDatabaseImport');
const informativeTitleBar = require('./nixiePlugins/informativeTitleBar');

module.exports = {
  target: 'web',

  // This drastically increases bundle size. The reason we do this is so that
  // people can easily inspect our source to look for malicious intent.
  optimization: {
    minimize: false,
  },

  // We control the watch flag from the commandline for a more controlled dev
  // workflow.
  watch: false,

  // Note: Leaving devtool undefined causes eval statements to show up in the
  // bundle. As far as I can tell, JS engines cannot optimize for eval
  // statements, so we explicitly set it to false to prevent evals from being
  // generated in prod.
  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',

  entry: {
    'NixieChat-v0': './client/index.js',
  },

  output: {
    path: __dirname + '/../client/.build',
    publicPath: 'build/',
    filename: '[name].js',
  },

  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)?$/,
        loader: 'babel-loader',
        options: {
          // Reduces output by around 1MB at the time of writing.
          comments: process.env.NODE_ENV !== 'production',
          presets: [
            [
              '@babel/preset-typescript',
              {
                'isTSX': true,
                'allExtensions': true,
              },
            ],
            [ '@babel/preset-react' ],
          ],
          plugins: [
            // New features:
            '@babel/plugin-proposal-optional-chaining',
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-transform-nullish-coalescing-operator',
            // All the below needed for very old phones:
            '@babel/plugin-proposal-object-rest-spread',
            '@babel/plugin-transform-arrow-functions',
            '@babel/plugin-transform-parameters',
            // if 'let' is not supported, add: @babel/plugin-transform-block-scoping
            '@babel/plugin-transform-block-scoping',
            '@babel/plugin-transform-exponentiation-operator',
            '@babel/plugin-transform-destructuring',
            '@babel/plugin-transform-async-to-generator',
            '@babel/plugin-transform-classes',
            '@babel/plugin-transform-runtime',
            'transform-es2017-object-entries',
          ],
        },
      },
    ],
  },

  plugins: [
    // Bundle only DB code related to the platform (web vs desktop).
    dynamicDatabaseImport(),
    // Update the terminal title with build info.
    informativeTitleBar(),
    // Make Buffer globally available for libs that assume they're server-side.
    new webpack.ProvidePlugin({
      Buffer: [ 'buffer', 'Buffer' ],
    }),
    // Needed by some Node polyfills.
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ],

  resolve: {
    extensions: [ '.js', '.json', '.jsx', '.ts', '.tsx' ],
    alias: {
      process: "process/browser"
    },
    fallback: {
      // Polyfills.
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'),
      util: require.resolve('util/'),
      tty: require.resolve('tty-browserify'),
      os: require.resolve('os-browserify/browser'),
      url: require.resolve('url/'),
      vm: require.resolve('vm-browserify'),

      // Unused.
      assert: false,
      child_process: false,
      fs: false,
      http: false,
      https: false,
      net: false,
      path: false,
      tls: false,
      zlib: false,
    },
  },
};
