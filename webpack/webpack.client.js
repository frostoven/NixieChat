// ========================================================================= //
//  Client bundle                                                            //
// ========================================================================= //

const webpack = require('webpack');
const { clearInterval } = require('node:timers');
const exec = require('child_process').exec;

let dbDriver;
switch (process.env.PLATFORM) {
  case 'desktop':
    dbDriver = 'sqlite';
    break;
  case 'web':
  default:
    dbDriver = 'indexeddb';
}

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
            '@babel/plugin-transform-parameters', // if 'let' is not supported, add: @babel/plugin-transform-block-scoping
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
    /**
     * This acts like a string find-replace mechanism within the bundle. We use
     * this to allow bundling desktop-only libs (such as SQLite) into the
     * desktop client while using IndexedDB in the browser (we avoid IndexedDB
     * because it has poor support and a spec that's still changing). The
     * reason this plugin is useful is that the web version won't bundle
     * desktop-only code, and vice-versa.
     *
     * @example
     * export default function getDbByPlatform() {
     *   // @ts-ignore - __DB_IMPORT__ is dynamically set by Webpack at build time.
     *   switch (__DB_IMPORT__) {
     *     case 'indexeddb':
     *       return import('./indexeddb_module_name');
     *     case 'sqlite':
     *       return import('./sqlite_module_name');
     *   }
     * }
     *
     * export {
     *   getDbByPlatform,
     * }
     */
    new webpack.DefinePlugin({
      __DB_IMPORT__: `'${dbDriver}'`,
    }),

    // Update the terminal title with build info.
    {
      apply: (compiler) => {
        if (process.env.NODE_ENV === 'production') {
          return;
        }

        let linebreakCount = 0;

        function updateTerminalTitle(string) {
          const command =
            `echo -n '\\033k${string}\\033\\\\' > /dev/null && ` +
            `echo -n '\\033]2;'${string}'\\007'`;
          exec(command, (err, stdout, stderr) => {
            stdout && process.stdout.write(stdout);
            stderr && process.stderr.write(stderr);
          });
        }

        function printf(string) {
          const command = `printf ${string}`;
          exec(command, (err, stdout, stderr) => {
            stdout && process.stdout.write(stdout);
            stderr && process.stderr.write(stderr);
          });
        }

        let buildInProgress = false;
        let lastBuildStart = 0;
        let lastBuildEnd = Infinity;
        let buildCount = 0;

        compiler.hooks.watchRun.tap('NixieRebuildNoticePlugin', (_compilation) => {
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
        compiler.hooks.afterEmit.tap('NixieUpdateTitlePlugin', (_compilation) => {
          buildInProgress = false;
          const date = new Date();
          let hh = date.getHours();
          let mm = date.getMinutes();
          let ss = date.getSeconds();

          hh < 10 && (hh = '0' + hh);
          mm < 10 && (mm = '0' + mm);
          ss < 10 && (ss = '0' + ss);

          // Wait a little so the update doesn't seem glitchy when rapid.
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

          // Echo a different amount of line breaks each build so that it's
          // more obvious that something has changed.
          const linebreaks = Array(linebreakCount++).fill('\n').join('');
          printf(`'${linebreaks}'`);
          linebreakCount >= 2 && (linebreakCount = 0);
        });
      },
    },
  ],

  resolve: {
    extensions: [ '.js', '.json', '.jsx', '.ts', '.tsx' ],
  },
};
