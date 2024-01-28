/**
 * This file released by Frostoven under the MIT License.
 */

let asciiEnabled = true;

// Allow disabling the pretties from the commandline.
if (process.env.NO_COLOR) {
  asciiEnabled = false;
}

const plain = 0;
const bold = 1;
const dark = 2;
const italic = 3;
const underline = 4;
const highlight = 7;
const invisible = 8;

let styles: number[] = [ plain ];
let lastColor = 37;

/**
 * Offers a way of setting colors and styles without having to worry about
 * order of execution or setting obvious defaults. Remember to call reset()
 * after writing your formatted text.
 *
 * This object additionally offers some convenience drawing functions.
 */
const ascii = {
  black: () => setColor(30),
  red: () => setColor(31),
  green: () => setColor(32),
  yellow: () => setColor(33),
  blue: () => setColor(34),
  purple: () => setColor(35),
  cyan: () => setColor(36),
  white: () => setColor(37),

  bold: () => setStyle(bold),
  dark: () => setStyle(dark),
  italic: () => setStyle(italic),
  underline: () => setStyle(underline),
  highlighted: () => setStyle(highlight),
  invisible: () => setStyle(invisible),
  reset: () => {
    if (asciiEnabled) {
      process.stdout.write('\x1b[0m');
      styles = [ plain ];
      lastColor = 37;
    }
    return ascii;
  },

  drawLine: (charCount = 56) => {
    const char = asciiEnabled ? '─' : '-';
    console.log(Array(charCount).fill(char).join(''));
    return ascii;
  },
  drawPaddedLine: (charCount = 56) => {
    const char = asciiEnabled ? '─' : '-';
    const line = Array(charCount).fill(char);
    if (line.length > 2 && asciiEnabled) {
      line[0] = '╶';
      line[line.length - 1] = '╴';
    }
    console.log(line.join(''));
    return ascii;
  },
  drawTaperedLine: (charCount = 56) => {
    const char = asciiEnabled ? '─' : '-';
    const line = Array(charCount).fill(char);
    if (line.length > 2 && asciiEnabled) {
      line[0] = '╼';
      line[line.length - 1] = '╾';
    }
    console.log(line.join(''));
    return ascii;
  },
  drawDashedLine: (charCount = 56) => {
    const char = asciiEnabled ? '─' : '-';
    console.log(Array(charCount).fill(char).join(''));
    return ascii;
  },
  drawDoubleLine: (charCount = 56) => {
    console.log(Array(charCount).fill('═').join(''));
    return ascii;
  },
  log: function(_: any) {
    console.log(...arguments);
    return ascii;
  },
};

function setColor(color: number) {
  if (asciiEnabled) {
    for (let i = 0; i < styles.length; i++) {
      const style = styles[i];
      process.stdout.write(`\x1b[${style};${color}m`);
    }
    lastColor = color;
  }
  return ascii;
}

function setStyle(style: number) {
  if (asciiEnabled) {
    styles.push(style);
    process.stdout.write(`\x1b[${style};${lastColor}m`);
  }
  return ascii;
}

export {
  ascii,
};
