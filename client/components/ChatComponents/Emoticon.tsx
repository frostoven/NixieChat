import React from 'react';
import { StyleManifest } from '../../emoticonConfig/types/StyleManifest';

// Unprintable character. Used to delimit emoticon information.
const CONTROL_CODE_START = 0x001A;

const EMOTION_BASE = 'assets/emo/';

const metadataStyle: React.CSSProperties = {
  display: 'none',
};

interface Props {
  unicode: number,
  styleManifest: StyleManifest,
}

class Emoticon extends React.Component<Props> {
  public shouldComponentUpdate(): boolean {
    return false;
  }

  render() {
    const { unicode, styleManifest } = this.props;

    // When concatenating with a few hundred strings, even fast computers start
    // to crawl. This is a *far* faster method of string concatenation.
    const caseFn = styleManifest.lowerCase ? 'toLowerCase' : 'toUpperCase';
    const path = [
      EMOTION_BASE, styleManifest.dir, '/', styleManifest.filePrefix || '',
      unicode.toString(16)[caseFn](), '.webp',
    ].join('');

    return (
      <span>
        <img
          alt={String.fromCharCode(unicode)}
          src={path}
          style={{
            cursor: 'pointer',
            width: styleManifest.size,
            // marginBottom: styleManifest.margin,
            margin: styleManifest.margin,
          }}
        />

        <span style={metadataStyle}>
          {String.fromCharCode(CONTROL_CODE_START)}
        </span>
      </span>
    );
  }
}

export {
  Emoticon,
};
