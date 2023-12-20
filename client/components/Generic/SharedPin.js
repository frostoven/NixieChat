import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { mergeUint8Arrays, sha256, stringToArrayBuffer } from '../../utils';

// We specifically choose 32 characters here to make modulo 256 return a clean
// bias. Vowels were chosen for omission as it's rather easy to end up with
// some fuck-nasty curse words by pure luck.
const pinGroup = [
  '0', // 48
  '1', // 49
  '2', // 50
  '3', // 51
  '4', // 52
  '5', // 53
  '6', // 54
  '7', // 55
  '8', // 56
  '9', // 57
  // 'A', // 65
  'B', // 66
  'C', // 67
  'D', // 68
  // 'E', // 69
  'F', // 70
  'G', // 71
  'H', // 72
  // 'I', // 73
  'J', // 74
  'K', // 75
  'L', // 76
  'M', // 77
  'N', // 78
  // 'O', // 79
  'P', // 80
  'Q', // 81
  'R', // 82
  'S', // 83
  'T', // 84
  // 'U', // 85
  'V', // 86
  'W', // 87
  'X', // 88
  // 'Y', // 89
  'Z', // 90
  'w', // 119
  '$', // 36
];

// Converts a number from 0 to 255 into an alphabet character or number.
function char255toPinGroup(numberArray) {
  const pinCharCount = pinGroup.length;
  if (pinCharCount !== 32) {
    const error = 'Bug detected: The character pin group is not 32 ' +
      'character. Refusing to proceed.';
    console.error(error);
    $modal.alert({
      prioritise: true,
      header: 'Error',
      body: error,
    });
    throw error;
  }

  // Restrict character count to the exact amount we need. Note that slice does
  // bounds-checking for us. We could use _.slice instead of built-in to
  // guarantee this functionality, but it would probably be favourable to see a
  // particular browser mess this up, causing different pins on each side (note
  // that overflows aren't a memory threat like in lower-level languages, so
  // we're not playing with fire).
  const characters = numberArray.slice(0, 12);
  // This is the actual characters people see, excluding the spaces and dashes.
  const pinStart = characters.slice(0, 7);
  // This produces the spaces, dashes, and color, and the trailing character.
  const auxBytes = numberArray.slice(12);

  console.log({ characters, pinStart, auxBytes });

  const chars = [];
  for (let i = 0, len = pinStart.length; i < len; i++) {
    let character = pinStart[i];

    // Clamp the value, just in case.
    character = _.clamp(character, 0, 255);

    // Returns a number between 0 and 31, inclusive.
    const pinIndex = character % pinCharCount;

    chars.push(pinGroup[pinIndex]);
  }

  let spacePosition = 3;
  let dashPosition = 5;
  let trailingChar = 0;
  let color = [ 255, 255, 255 ];
  for (let i = 0, len = auxBytes.length; i < len; i++) {
    let character = auxBytes[i];

    // Clamp the value, just in case.
    character = _.clamp(character, 0, 255);

    switch (i) {
      case 0:
        // Place the space randomly in the string, but not as the first
        // character.
        spacePosition = (character % (chars.length - 1) + 1);
        break;
      case 1:
        // Place the dash randomly in the string, but not as the first
        // character.
        dashPosition = (character % (chars.length - 1) + 1);
        break;
      case 2:
        // Red channel.
        color[0] = character;
        break;
      case 3:
        // Green channel.
        color[1] = character;
        break;
      case 4:
        // Blue channel.
        color[2] = character;
        break;
      default:
        trailingChar += character;
        break;
    }
  }

  // The trailing char is in the thousands at this point; bring it into range.
  trailingChar = pinGroup[trailingChar % pinCharCount];

  // Move the dash onward if next to the space.
  if (Math.abs(spacePosition - dashPosition) <= 1) {
    dashPosition = (dashPosition + (chars.length * 0.5)) % chars.length;
    (dashPosition === 0) && dashPosition++;
  }

  chars.splice(spacePosition, 0, ' ');
  chars.splice(dashPosition, 0, '-');

  if (chars[chars.length - 1] === ' ') {
    chars.push(trailingChar);
  }
  else {
    chars.push(' ', trailingChar);
  }

  console.log('-> main chars:', chars);
  console.log('-> aux chars:', {
    spacePosition: spacePosition, dashPosition, color, trailingChar,
  });
  console.log('-> returning:', { chars: chars.join(''), color });

  return {
    chars: chars.join(''),
    color,
  };
}

/** @type React.CSSProperties */
const pinStyle = {
  width: 162,
  borderRadius: 4,
  fontFamily: 'monospace',
  textAlign: 'center',
  margin: 'auto',
  border: '2px solid grey',
};

/**
 * React component that generates a shared pin following a Diffie-Hellman
 * exchange, SHA-256 hashing, and additional parameters.
 *
 * The pin is represented as a combination of alphanumeric characters, spaces,
 * dashes, and colors, and users are prompted to confirm the generated pin and
 * color on both sides. This component takes in a shared secret, timestamp, and
 * names of the initiator and receiver as props.
 */
class SharedPin extends React.Component {
  static propTypes = {
    // Password generated that was not sent over the network.
    sharedSecret: PropTypes.object.isRequired,
    // Used as a salt.
    time: PropTypes.number.isRequired,
    // Used as a salt.
    initiatorName: PropTypes.string.isRequired,
    // Used as a salt.
    receiverName: PropTypes.string.isRequired,
  };

  pinHash = null;

  componentDidMount() {
    const { sharedSecret, time, initiatorName, receiverName } = this.props;

    // This takes our shared secret, salts it with some public data, and then
    // performs a SHA-256 hash on the result.
    sha256(mergeUint8Arrays([
      sharedSecret,
      stringToArrayBuffer(`${time}`),
      stringToArrayBuffer(initiatorName),
      stringToArrayBuffer(receiverName),
    ]), false).then((result) => {
      this.pinHash = result;
      this.forceUpdate();
    }).catch((error) => {
      console.error(error);
      $modal.alert({
        prioritise: true,
        header: 'Error Generating Pin',
        body: 'Could not generate shared pin. Please restart NixieChat and ' +
          'try again.',
      });
    });
  }

  render() {
    if (!this.pinHash) {
      return (
        <div style={pinStyle}>
          Generating hash...
        </div>
      );
    }

    const { chars, color } = char255toPinGroup(this.pinHash);

    const [ r, g, b ] = color;
    const confirmationColor = `rgb(${r} ${g} ${b})`;
    let inverseColor;
    if ((r + g + b) / 3 > 128) {
      inverseColor = '#000';
    }
    else {
      inverseColor = '#fff';
    }

    return (
      <div style={pinStyle}>
        <div>{chars}</div>
        <div style={{ backgroundColor: confirmationColor }}>
          <b style={{ color: inverseColor }}>
            Color
          </b>
        </div>
      </div>
    );
  }
}

export {
  SharedPin,
};
