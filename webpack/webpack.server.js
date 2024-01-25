// ========================================================================= //
//  Server bundle                                                            //
// ========================================================================= //

const nodeExternals = require('webpack-node-externals');

module.exports = {
  watch: process.env.NODE_ENV !== 'production',
  target: 'node',
  node: {
    // Webpack has the power to change what __dirname means. We don't want that
    // server-side.
    __dirname: false,
  },

  // This causes the bundler to not bundle node_modules for server-side code.
  // This both drastically increases bundle time and fixes some issues caused
  // by rebundling modules not made for it. The only reason we currently do
  // server bundling at all is for TS transpilation, so this works in favor of
  // the project's design decisions.
  externals: [ nodeExternals() ],

  // This drastically increases bundle size. The reason we do this is so that
  // people can easily inspect our source to look for malicious intent.
  optimization: {
    minimize: false,
  },

  // Note: Leaving devtool undefined causes eval statements to show up in the
  // bundle. As far as I can tell, JS engines cannot optimize for eval
  // statements, so we explicitly set it to false to prevent evals from being
  // generated in prod.
  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',

  entry: {
    'server': './server/index.ts',
  },

  output: {
    path: __dirname + '/../server/.build',
    publicPath: 'server/.build/',
    filename: '[name].js',
  },

  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)?$/,
        loader: 'babel-loader',
        options: {
          compact: false,
          presets: [
            [
              '@babel/preset-typescript',
              {
                'isTSX': true,
                'allExtensions': true,
              },
            ],
            '@babel/preset-react',
          ],
          plugins: [
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-proposal-optional-chaining',
            '@babel/plugin-proposal-numeric-separator',
            '@babel/plugin-transform-nullish-coalescing-operator',
          ],
        },
      },
    ],
  },

  resolve: {
    extensions: [ '.js', '.ts', '.json', '.jsx', '.tsx' ],
  },
};
