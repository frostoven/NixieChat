// ========================================================================= //
//  Client bundle                                                            //
// ========================================================================= //

const { clearInterval } = require('node:timers');
const exec = require('child_process').exec;

module.exports = {
  watch: process.env.NODE_ENV !== 'production',
  target: 'web',

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
    'NixieChat-v0': './client/index.js',
  },

  output: {
    path: __dirname + '/../client/.build',
    publicPath: 'client/.build/',
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
    extensions: [ '.js', '.json', '.jsx' ],
  },
};
