const { exec } = require('child_process');
const { clearInterval } = require('node:timers');

/**
 * Updates the terminal title (and by extension taskbar text) with build
 * messages such as "last build: less than 5 seconds ago."
 *
 * Additionally, forces webpack to slightly offset build message positions from
 * previous ones in the terminal, making it more obvious a build completed if
 * you only have a partial view of the build terminal.
 *
 * @return {{apply: *}}
 */
function informativeTitleBar() {
  return {
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
  };
}

module.exports = informativeTitleBar;
