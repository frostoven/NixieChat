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
  // Preview emoticons are larger. Default is true.
  isPreview?: boolean,
  tone: number,
  styleManifest: StyleManifest,
  onClick?: (unicode: number, styleManifest: StyleManifest, path: string) => void,
}

class Emoticon extends React.Component<Props> {
  path: string;

  constructor(props: Props | Readonly<Props>) {
    super(props);

    const { unicode, styleManifest, tone } = props;

    // Some emoticon pack files are upper case, some lower case. The pack
    // manifest tells us which.
    const caseFn = styleManifest.lowerCase ? 'toLowerCase' : 'toUpperCase';

    // Implement user tone preference if the emoticon supports it.
    let emoticonSuffix: string;
    if (tone && styleManifest.toneSupport.get(unicode)) {
      emoticonSuffix =
        styleManifest.tonePrefix + tone.toString(16)[caseFn]();
    }
    else {
      emoticonSuffix = '';
    }

    // When concatenating with a few hundred strings, even fast computers start
    // to crawl. This is a *far* faster method of string concatenation.
    this.path = [
      EMOTION_BASE, styleManifest.dir, '/', styleManifest.filePrefix || '',
      unicode.toString(16)[caseFn](), emoticonSuffix, '.webp',
    ].join('');
  }

  shouldComponentUpdate(nextProps: Readonly<Props>): boolean {
    // Emoticons should almost never re-render as they exist in the thousands.
    // The only valid reason currently to recreate emoticons are for tone
    // changes.
    return nextProps.tone !== this.props.tone;
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
    const { unicode, styleManifest, isPreview } = this.props;

    let style: React.CSSProperties;
    if (isPreview === false) {
      const {
        width, marginTop, marginRight, marginBottom, marginLeft,
      } = styleManifest.uiFit;
      style = {
        cursor: 'pointer',
        width, marginTop, marginRight, marginBottom, marginLeft,
      };
    }
    else {
      style = {
        cursor: 'pointer',
        width: styleManifest.previewSize,
      };
    }

    return (
      <span onClick={this.handleClick}>
        <img
          alt={String.fromCharCode(unicode)}
          src={this.path}
          style={style}
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
