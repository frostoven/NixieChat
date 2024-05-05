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
  onClick?: (unicode: number, styleManifest: StyleManifest, path: string) => void,
}

class Emoticon extends React.Component<Props> {
  path: string;

  constructor(props: Props | Readonly<Props>) {
    super(props);

    const { unicode, styleManifest } = props;

    // When concatenating with a few hundred strings, even fast computers start
    // to crawl. This is a *far* faster method of string concatenation.
    const caseFn = styleManifest.lowerCase ? 'toLowerCase' : 'toUpperCase';
    this.path = [
      EMOTION_BASE, styleManifest.dir, '/', styleManifest.filePrefix || '',
      unicode.toString(16)[caseFn](), '.webp',
    ].join('');
  }

  shouldComponentUpdate(): boolean {
    // Always false means never re-render. This is intentional - these
    // components exist in the thousands, if the host component was a new
    // version it should change the key.
    return false;
  }

  handleClick = () => {
    if (!this.props.onClick) {
      return;
    }
    this.props.onClick(
      this.props.unicode,
      this.props.styleManifest,
      this.path,
    );
  };

  render() {
    const { unicode, styleManifest } = this.props;

    return (
      <span onClick={this.handleClick}>
        <img
          alt={String.fromCharCode(unicode)}
          src={this.path}
          style={{
            cursor: 'pointer',
            width: styleManifest.previewSize,
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
