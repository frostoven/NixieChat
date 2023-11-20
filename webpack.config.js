const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const { clearInterval } = require('node:timers');
const exec = require('child_process').exec;

module.exports = {
  watch: true,
  target: 'web',
  devtool: 'source-map',

  entry: {
    'NixieChat-v0': './client/index.js',
  },

  output: {
    path: __dirname + '/client/.build',
    publicPath: 'client/.build/',
    filename: '[name].js'
  },

  module: {
    rules: [
      {
        test: /\.js?$/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-react'],
          plugins: [
            '@babel/plugin-proposal-optional-chaining',
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-transform-nullish-coalescing-operator',
          ]
        }
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({
          loader: 'css-loader',
          options: {
            modules: true
          }
        })
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        query: {
          name: '[name].[ext]?[hash]'
        }
      }
    ]
  },

  plugins: [
    // Update the terminal title with build info.
    {
      apply: (compiler) => {
        function updateTerminalTitle(string) {
          const command =
            `echo -n '\\033k${string}\\033\\\\' > /dev/null && ` +
            `echo -n '\\033]2;'${string}'\\007'`;
          exec(command, (err, stdout, stderr) => {
            if (stdout) process.stdout.write(stdout);
            if (stderr) process.stderr.write(stderr);
          });
        }

        let buildInProgress = false;
        let lastBuildStart = 0;
        let lastBuildEnd = Infinity;
        let buildCount = 0;

        compiler.hooks.watchRun.tap('NixieRebuildNoticePlugin', (compilation) => {
          buildInProgress = true;
          lastBuildStart = Date.now();
          const timer = setInterval(() => {
            if (!buildInProgress) {
              lastBuildEnd = Date.now();
              return clearInterval(timer);
            }
            const duration = (Date.now() - lastBuildStart) / 1000;
            if (++buildCount < 6) {
              updateTerminalTitle(`Building... ${Math.floor(duration)}s`);
            }
            else {
              updateTerminalTitle(`Rebuilding... ${Math.floor(duration)}s`);
            }
          }, 900);
        });

        // AfterEmitPlugin
        compiler.hooks.afterEmit.tap('NixieUpdateTitlePlugin', (compilation) => {
          buildInProgress = false;
          const date = new Date();
          let hh = date.getHours();
          let mm = date.getMinutes();
          let ss = date.getSeconds();

          hh < 10 && (hh = '0' + hh);
          mm < 10 && (mm = '0' + mm);
          ss < 10 && (ss = '0' + ss);

          // Wait a little so the update doesn't seem glitchy when rapid.1
          setTimeout(() => {
            const timer = setInterval(() => {
              if (Date.now() - lastBuildEnd < 5000) {
                updateTerminalTitle(`Rebuilt \\< 5s ago - NixieChat`);
              }
              else {
                clearInterval(timer);
                updateTerminalTitle(`${hh}:${mm}:${ss} - NixieChat`);
              }
            }, 2000);
          }, 250);
        });
      }
    }
  ],

  resolve: {
    extensions: ['.js', '.json', '.jsx']
  },
};
